<?php

namespace App\Support;

use App\Models\CmsMedia;
use Illuminate\Http\UploadedFile;
use Illuminate\Support\Facades\Storage;
use Illuminate\Support\Str;
use Intervention\Image\ImageManager;
use Throwable;

/**
 * Stores files in the media library, builds their responsive WebP versions and adds
 * srcset / alt text to public image tags.
 */
class MediaLibrary
{
    public const DISK = 'public';

    /** Responsive widths: thumb, medium, large */
    public const PRESETS = ['thumb' => 300, 'medium' => 768, 'large' => 1536];

    /** Raster formats we resize (GIF is skipped: it may be animated) */
    public const RESIZABLE_MIMES = ['image/jpeg', 'image/png', 'image/webp'];

    public const DOCUMENT_MIMES = [
        'application/pdf',
        'application/msword',
        'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
        'application/vnd.ms-excel',
        'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
        'application/vnd.ms-powerpoint',
        'application/vnd.openxmlformats-officedocument.presentationml.presentation',
        'application/zip',
    ];

    /** Accepted on upload. SVG is left out: it can carry scripts and is served from this origin. */
    public const UPLOAD_MIMES = [
        'image/jpeg', 'image/png', 'image/gif', 'image/webp',
        'video/mp4', 'video/webm', 'audio/mpeg', 'audio/ogg', 'audio/wav',
        'text/plain', 'text/csv',
        ...self::DOCUMENT_MIMES,
    ];

    public const MAX_UPLOAD_KB = 51200;

    /** Sizes hint for content images, which are at most the width of the text column */
    public const SIZES = '(max-width: 768px) 100vw, 768px';

    public static function typeOf(?string $mime): string
    {
        $mime = (string) $mime;

        return match (true) {
            str_starts_with($mime, 'image/') => 'image',
            str_starts_with($mime, 'video/') => 'video',
            str_starts_with($mime, 'audio/') => 'audio',
            in_array($mime, self::DOCUMENT_MIMES, true) || str_starts_with($mime, 'text/') => 'document',
            default => 'other',
        };
    }

    public static function store(UploadedFile $file, ?int $userId = null): CmsMedia
    {
        $extension = strtolower($file->getClientOriginalExtension() ?: (string) $file->extension());
        $base = Str::slug(pathinfo($file->getClientOriginalName(), PATHINFO_FILENAME)) ?: 'archivo';
        $dir = 'media/'.now()->format('Y/m');

        $name = "{$base}.{$extension}";
        for ($i = 2; Storage::disk(self::DISK)->exists("{$dir}/{$name}"); $i++) {
            $name = "{$base}-{$i}.{$extension}";
        }
        $path = $file->storeAs($dir, $name, self::DISK);

        $title = Str::of(pathinfo($file->getClientOriginalName(), PATHINFO_FILENAME))->replace(['-', '_'], ' ')->squish()->limit(250, '')->toString();

        return self::register($path, $file->getMimeType(), $userId, ['filename' => $file->getClientOriginalName(), 'title' => $title]);
    }

    /**
     * Create the row for a file already on the disk and build its WebP versions.
     *
     * @param  array<string, mixed>  $attributes
     */
    public static function register(string $path, ?string $mime, ?int $userId = null, array $attributes = []): CmsMedia
    {
        $disk = Storage::disk(self::DISK);
        $dimensions = str_starts_with((string) $mime, 'image/') ? @getimagesize($disk->path($path)) : false;

        $media = CmsMedia::create([
            'disk' => self::DISK,
            'path' => $path,
            'filename' => basename($path),
            'mime' => $mime,
            'size' => $disk->size($path),
            'width' => $dimensions[0] ?? null,
            'height' => $dimensions[1] ?? null,
            'uploaded_by' => $userId,
            ...$attributes,
        ]);

        self::makeVariants($media);

        return $media;
    }

    /**
     * WebP copies at each preset narrower than the original, plus one at full size.
     * Stored under media/variants/{id}/ and listed in $media->variants as {width: path}.
     */
    public static function makeVariants(CmsMedia $media): void
    {
        if (! in_array($media->mime, self::RESIZABLE_MIMES, true) || ! $media->width) {
            return;
        }

        $disk = Storage::disk($media->disk);
        $base = Str::slug(pathinfo($media->filename, PATHINFO_FILENAME)) ?: 'imagen';
        $widths = array_filter(self::PRESETS, fn (int $width): bool => $width < $media->width);
        $widths[] = $media->width;

        $variants = [];
        try {
            $manager = ImageManager::gd();
            foreach (array_unique($widths) as $width) {
                $image = $manager->read($disk->path($media->path));
                $image->scaleDown(width: $width);
                $path = "media/variants/{$media->id}/{$base}-{$width}.webp";
                $disk->put($path, (string) $image->toWebp(80));
                $variants[$width] = $path;
            }
        } catch (Throwable $e) {
            report($e);
        }

        $media->forceFill(['variants' => $variants ?: null])->saveQuietly();
    }

    /** Remove the file and its versions from the disk */
    public static function deleteFiles(CmsMedia $media): void
    {
        $disk = Storage::disk($media->disk);
        $disk->delete($media->path);
        $disk->deleteDirectory("media/variants/{$media->id}");
    }

    /**
     * Index the files already stored by the old file manager (photos/, files/) so they
     * appear in the library. Thumbnails and files with a row are skipped.
     *
     * @return array{imported: int, skipped: int}
     */
    public static function import(?callable $progress = null): array
    {
        $disk = Storage::disk(self::DISK);
        $folders = collect(config('lfm.folder_categories', []))->pluck('folder_name')->filter()->unique();
        $known = CmsMedia::withTrashed()->where('disk', self::DISK)->pluck('path')->flip();

        $imported = 0;
        $skipped = 0;
        foreach ($folders as $folder) {
            foreach ($disk->allFiles($folder) as $path) {
                $name = basename($path);
                if (str_starts_with($name, '.') || in_array(config('lfm.thumb_folder_name', 'thumbs'), explode('/', $path), true)) {
                    continue;
                }
                if ($known->has($path)) {
                    $skipped++;

                    continue;
                }

                $media = self::register($path, $disk->mimeType($path) ?: null, null, [
                    'title' => Str::of(pathinfo($name, PATHINFO_FILENAME))->replace(['-', '_'], ' ')->squish()->toString(),
                ]);
                $imported++;
                $progress && $progress($media);
            }
        }

        return ['imported' => $imported, 'skipped' => $skipped];
    }

    /** "…/storage/media/a.jpg" => "media/a.jpg" when the URL points into the library disk */
    public static function pathFromUrl(?string $url): ?string
    {
        if (! is_string($url) || $url === '') {
            return null;
        }
        $prefix = rtrim((string) parse_url(Storage::disk(self::DISK)->url(''), PHP_URL_PATH), '/').'/';
        $path = rawurldecode((string) parse_url($url, PHP_URL_PATH));

        return str_starts_with($path, $prefix) ? substr($path, strlen($prefix)) : null;
    }

    /**
     * Library details for the given image URLs, keyed by URL.
     *
     * @param  iterable<mixed>  $urls
     * @return array<string, array{alt: ?string, caption: ?string, srcset: ?string, width: ?int, height: ?int}>
     */
    public static function lookup(iterable $urls): array
    {
        $paths = [];
        foreach ($urls as $url) {
            if ($path = self::pathFromUrl(is_string($url) ? $url : null)) {
                $paths[$url] = $path;
            }
        }
        if ($paths === []) {
            return [];
        }

        $media = CmsMedia::where('disk', self::DISK)->whereIn('path', array_unique($paths))->get()->keyBy('path');

        $found = [];
        foreach ($paths as $url => $path) {
            if ($item = $media->get($path)) {
                $found[$url] = [
                    'alt' => $item->alt,
                    'caption' => $item->caption,
                    'srcset' => $item->srcset(),
                    'width' => $item->width,
                    'height' => $item->height,
                ];
            }
        }

        return $found;
    }

    /**
     * Image URLs found in HTML (img src) and in any string of the given values.
     *
     * @return list<string>
     */
    public static function collectUrls(mixed ...$values): array
    {
        $urls = [];
        array_walk_recursive($values, function ($value) use (&$urls): void {
            if (! is_string($value) || $value === '') {
                return;
            }
            if (str_contains($value, '<img')) {
                preg_match_all('/<img\b[^>]*\bsrc\s*=\s*"([^"]+)"/i', $value, $matches);
                array_push($urls, ...array_map('html_entity_decode', $matches[1]));
            } elseif (self::pathFromUrl($value) !== null) {
                $urls[] = $value;
            }
        });

        return array_values(array_unique($urls));
    }

    /**
     * Add srcset, sizes, width/height, lazy loading and — when the tag has none — the
     * library's alt text to the library images in a piece of HTML.
     */
    public static function enrichHtml(?string $html): ?string
    {
        if (! $html || ! str_contains($html, '<img')) {
            return $html;
        }
        $media = self::lookup(self::collectUrls($html));
        if ($media === []) {
            return $html;
        }

        return preg_replace_callback('/<img\b([^>]*?)(\s*\/?)>/i', function (array $m) use ($media): string {
            $attrs = $m[1];
            if (! preg_match('/\bsrc\s*=\s*"([^"]+)"/i', $attrs, $src) || ! ($info = $media[html_entity_decode($src[1])] ?? null)) {
                return $m[0];
            }

            $add = [];
            if ($info['srcset'] && ! preg_match('/\bsrcset\s*=/i', $attrs)) {
                $add['srcset'] = $info['srcset'];
                $add['sizes'] = self::SIZES;
            }
            foreach (['width', 'height'] as $dimension) {
                if ($info[$dimension] && ! preg_match('/\b'.$dimension.'\s*=/i', $attrs)) {
                    $add[$dimension] = (string) $info[$dimension];
                }
            }
            if (! preg_match('/\bloading\s*=/i', $attrs)) {
                $add['loading'] = 'lazy';
                $add['decoding'] = 'async';
            }
            if ($info['alt'] !== null && $info['alt'] !== '') {
                // An empty alt may be written as alt="", alt='' or a bare "alt" attribute
                $emptyAlt = '/\balt(?:\s*=\s*(?:""|\'\'))?(?=[\s\/]|$)/i';
                if (preg_match($emptyAlt, $attrs)) {
                    $attrs = preg_replace($emptyAlt, 'alt="'.e($info['alt']).'"', $attrs, 1);
                } elseif (! preg_match('/\balt\s*=/i', $attrs)) {
                    $add['alt'] = $info['alt'];
                }
            }

            foreach ($add as $name => $value) {
                $attrs .= ' '.$name.'="'.e($value).'"';
            }

            return '<img'.$attrs.$m[2].'>';
        }, $html);
    }
}
