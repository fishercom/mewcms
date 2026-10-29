<?php

namespace App\Support;

use Illuminate\Support\Facades\File;
use Illuminate\Support\Str;
use Illuminate\Validation\ValidationException;
use ZipArchive;

/**
 * Installs a theme uploaded as a .zip (Admin → Sites → Themes) into
 * storage/app/public/themes/<slug>.
 *
 * The whole archive is checked before anything is written: a theme.json at its root
 * (or inside its only folder), only files a browser can use (no PHP or HTML), no paths
 * leaving the theme folder, and size limits. It is unpacked into a temporary folder
 * and then moved into place, so a failed upload never leaves half a theme, and an
 * upload with the slug of an installed theme replaces it.
 */
class ThemeInstaller
{
    /** File types a theme may carry */
    public const EXTENSIONS = ['css', 'js', 'mjs', 'map', 'json', 'png', 'jpg', 'jpeg', 'webp', 'avif', 'gif', 'svg', 'ico', 'woff', 'woff2', 'ttf', 'otf', 'eot', 'txt', 'md'];

    public const MAX_FILES = 500;

    /** Bytes, once unpacked */
    public const MAX_SIZE = 20 * 1024 * 1024;

    /** Files and folders that zip tools add and nobody needs */
    protected const JUNK = ['__MACOSX/', '.DS_Store', 'Thumbs.db', 'desktop.ini'];

    /**
     * Install the theme in $zipFile and return its slug and whether it replaced one.
     *
     * @return array{slug: string, name: string, version: string, previous: string|null}
     */
    public function install(string $zipFile, string $fallbackName = ''): array
    {
        if (! class_exists(ZipArchive::class)) {
            $this->fail(__('Este servidor no puede abrir archivos .zip (falta la extensión zip de PHP).'));
        }

        $zip = new ZipArchive;
        if ($zip->open($zipFile) !== true) {
            $this->fail(__('El archivo no es un .zip válido.'));
        }

        try {
            [$files, $root] = $this->entries($zip);
            $manifest = json_decode((string) $zip->getFromName($root.'theme.json'), true);
            if (! is_array($manifest) || ! filled($manifest['name'] ?? null)) {
                $this->fail(__('El theme.json del tema no es válido: debe ser un objeto JSON con "name".'));
            }

            $slug = $this->slug($manifest, $root, $fallbackName);
            $previous = Themes::exists($slug) ? Themes::all()[$slug]['version'] : null;

            $this->unpack($zip, $files, $root, $slug);
        } finally {
            $zip->close();
        }

        Themes::flush();
        FrontCache::flush();

        return ['slug' => $slug, 'name' => (string) $manifest['name'], 'version' => (string) ($manifest['version'] ?? ''), 'previous' => $previous];
    }

    /**
     * The archive's files (index => path) and the folder that holds theme.json ('' or
     * "name/"), once every entry passed the checks.
     *
     * @return array{0: array<int, string>, 1: string}
     */
    protected function entries(ZipArchive $zip): array
    {
        $files = [];
        $size = 0;
        for ($i = 0; $i < $zip->numFiles; $i++) {
            $stat = $zip->statIndex($i);
            $name = (string) ($stat['name'] ?? '');

            if (str_ends_with($name, '/') || $this->isJunk($name)) {
                continue;
            }
            if (! $this->safePath($name)) {
                $this->fail(__('El .zip tiene una ruta no permitida: :path', ['path' => Str::limit($name, 80)]));
            }
            if (! in_array(strtolower(pathinfo($name, PATHINFO_EXTENSION)), self::EXTENSIONS, true)) {
                $this->fail(__('El tema no puede incluir :file. Solo se permiten estilos, scripts, imágenes, fuentes y textos.', ['file' => basename($name)]));
            }

            $files[$i] = $name;
            $size += (int) ($stat['size'] ?? 0);
        }

        if (count($files) > self::MAX_FILES) {
            $this->fail(__('El tema tiene demasiados archivos (máximo :max).', ['max' => self::MAX_FILES]));
        }
        if ($size > self::MAX_SIZE) {
            $this->fail(__('El tema ocupa demasiado una vez descomprimido (máximo :max MB).', ['max' => self::MAX_SIZE / 1024 / 1024]));
        }

        // theme.json at the root, or inside the only folder (how most tools zip a folder)
        if (in_array('theme.json', $files, true)) {
            return [$files, ''];
        }
        $tops = array_unique(array_map(fn (string $name): string => str_contains($name, '/') ? Str::before($name, '/').'/' : '', $files));
        if (count($tops) === 1 && $tops[array_key_first($tops)] !== '' && in_array($tops[array_key_first($tops)].'theme.json', $files, true)) {
            return [$files, $tops[array_key_first($tops)]];
        }

        $this->fail(__('Falta el archivo theme.json en la raíz del tema.'));
    }

    protected function isJunk(string $name): bool
    {
        foreach (self::JUNK as $junk) {
            if (str_starts_with($name, $junk) || basename($name) === $junk) {
                return true;
            }
        }

        return false;
    }

    /**
     * A relative path that stays inside the theme: no "..", no absolute or Windows
     * paths, no hidden files or folders.
     */
    protected function safePath(string $name): bool
    {
        if ($name === '' || str_contains($name, '\\') || str_contains($name, "\0") || str_starts_with($name, '/') || preg_match('/^[A-Za-z]:/', $name)) {
            return false;
        }

        foreach (explode('/', $name) as $segment) {
            if ($segment === '' || $segment === '.' || $segment === '..' || str_starts_with($segment, '.')) {
                return false;
            }
        }

        return true;
    }

    /**
     * The theme's slug: "slug" in theme.json, or else the name of its folder or of the
     * uploaded file. Built themes keep their names.
     *
     * @param  array<string, mixed>  $manifest
     */
    protected function slug(array $manifest, string $root, string $fallbackName): string
    {
        $candidate = $manifest['slug'] ?? null;
        if (! is_string($candidate) || $candidate === '') {
            $candidate = $root !== '' ? rtrim($root, '/') : pathinfo($fallbackName, PATHINFO_FILENAME);
        }
        $slug = Str::limit(Str::slug($candidate), 50, '');
        if ($slug === '') {
            $slug = Str::limit(Str::slug((string) $manifest['name']), 50, '');
        }

        if (! Themes::validSlug($slug)) {
            $this->fail(__('No se pudo deducir un nombre para el tema. Añade "slug" a su theme.json.'));
        }
        if (Themes::exists($slug) && ! Themes::all()[$slug]['uploaded']) {
            $this->fail(__('Ya hay un tema :slug que forma parte del código. Usa otro "slug" en theme.json.', ['slug' => $slug]));
        }

        return $slug;
    }

    /**
     * Unpack $files into a temporary folder, counting the bytes actually written (an
     * archive can lie about its sizes), then swap it in for the installed copy.
     *
     * @param  array<int, string>  $files
     */
    protected function unpack(ZipArchive $zip, array $files, string $root, string $slug): void
    {
        $base = Themes::uploadPath();
        File::ensureDirectoryExists($base);
        $temp = $base.'/.upload-'.Str::random(12);
        $old = $base.'/.old-'.Str::random(12);
        $target = Themes::uploadPath($slug);

        try {
            $written = 0;
            foreach ($files as $index => $name) {
                $relative = substr($name, strlen($root));
                $destination = $temp.'/'.$relative;
                File::ensureDirectoryExists(dirname($destination));

                $in = $zip->getStream($name);
                $out = fopen($destination, 'wb');
                if ($in === false || $out === false) {
                    $this->fail(__('No se pudo descomprimir :file.', ['file' => $relative]));
                }
                while (! feof($in)) {
                    $chunk = (string) fread($in, 65536);
                    $written += strlen($chunk);
                    if ($written > self::MAX_SIZE) {
                        fclose($in);
                        fclose($out);
                        $this->fail(__('El tema ocupa demasiado una vez descomprimido (máximo :max MB).', ['max' => self::MAX_SIZE / 1024 / 1024]));
                    }
                    fwrite($out, $chunk);
                }
                fclose($in);
                fclose($out);
            }

            if (is_dir($target)) {
                rename($target, $old);
            }
            rename($temp, $target);
        } finally {
            File::deleteDirectory($temp);
            File::deleteDirectory($old);
        }
    }

    /**
     * Pack an uploaded theme into a .zip at $zipFile, the same shape it was uploaded in.
     */
    public function export(string $slug, string $zipFile): void
    {
        $folder = Themes::uploadPath($slug);
        $zip = new ZipArchive;
        $zip->open($zipFile, ZipArchive::CREATE | ZipArchive::OVERWRITE);
        foreach (File::allFiles($folder) as $file) {
            $zip->addFile($file->getPathname(), $slug.'/'.str_replace('\\', '/', $file->getRelativePathname()));
        }
        $zip->close();
    }

    /**
     * @throws ValidationException
     */
    protected function fail(string $message): never
    {
        throw ValidationException::withMessages(['file' => $message]);
    }
}
