<?php

namespace App\Support;

use App\Models\CmsConfig;
use Illuminate\Http\UploadedFile;
use Illuminate\Support\Facades\Cache;
use Illuminate\Support\Facades\Storage;
use Illuminate\Support\Str;

/**
 * The brand of the admin panel (Configuración > Marca): the client's name and logos, shown in
 * the panel's sidebar and on the login screen instead of MewCMS's. Shared by every site, stored
 * in cms_configs under "admin_brand_*" aliases. With no logo, the panel shows MewCMS's own.
 */
class AdminBrand
{
    /** Setting => [cms_configs alias, label] */
    public const FIELDS = [
        'name' => ['admin_brand_name', 'Marca del panel: nombre'],
        'tagline' => ['admin_brand_tagline', 'Marca del panel: subtítulo'],
        'logo' => ['admin_brand_logo', 'Marca del panel: logo'],
        'logo_dark' => ['admin_brand_logo_dark', 'Marca del panel: logo para modo oscuro'],
        'icon' => ['admin_brand_icon', 'Marca del panel: ícono'],
    ];

    public const IMAGES = ['logo', 'logo_dark', 'icon'];

    /** Uploaded logos: SVG (cleaned, see SvgSanitizer) or a bitmap */
    public const UPLOAD_EXTENSIONS = ['svg', 'png', 'webp', 'jpg', 'jpeg'];

    public const MAX_UPLOAD_KB = 1024;

    protected const DIR = 'brand';

    protected const CACHE_KEY = 'admin_brand';

    /**
     * @return array{name: string, tagline: string, logo: string, logo_dark: string, icon: string}
     */
    public static function all(): array
    {
        $stored = Cache::rememberForever(self::CACHE_KEY, fn (): array => CmsConfig::whereNull('site_id')
            ->whereIn('alias', array_column(self::FIELDS, 0))
            ->pluck('value', 'alias')
            ->all());

        $brand = [];
        foreach (self::FIELDS as $key => [$alias]) {
            $brand[$key] = (string) ($stored[$alias] ?? '');
        }

        return $brand;
    }

    /**
     * What the panel and the login screen need, or null when the client has set no name,
     * logo or icon. A wide logo is shown alone; a square or tall one goes in as the icon and
     * is shown next to the name, set as text. A name alone gets its initial as the icon.
     *
     * @return array{name: string, tagline: ?string, logo: ?string, logo_dark: ?string, icon: ?string}|null
     */
    public static function shared(): ?array
    {
        $brand = self::all();
        if ($brand['name'] === '' && $brand['logo'] === '' && $brand['icon'] === '') {
            return null;
        }

        return [
            'name' => $brand['name'] !== '' ? $brand['name'] : (string) config('app.name'),
            'tagline' => $brand['tagline'] ?: null,
            'logo' => $brand['logo'] ?: null,
            'logo_dark' => $brand['logo_dark'] ?: null,
            'icon' => $brand['icon'] ?: null,
        ];
    }

    /**
     * @param  array<string, mixed>  $settings
     */
    public static function save(array $settings): void
    {
        $before = self::all();
        foreach (self::FIELDS as $key => [$alias, $label]) {
            if (array_key_exists($key, $settings)) {
                $row = CmsConfig::firstOrNew(['alias' => $alias, 'site_id' => null], ['type' => 'string', 'name' => $label]);
                $row->value = (string) ($settings[$key] ?? '');
                // Written without model events: the controller logs the whole save once
                $row->saveQuietly();
            }
        }
        Cache::forget(self::CACHE_KEY);

        // Uploaded files no longer used are removed
        $now = self::all();
        foreach (self::IMAGES as $key) {
            if ($before[$key] !== '' && ! in_array($before[$key], $now, true)) {
                self::deleteUpload($before[$key]);
            }
        }
    }

    /**
     * Store an uploaded logo and return its public URL. An SVG is cleaned first, since it is
     * served from this origin and could otherwise carry scripts.
     */
    public static function store(UploadedFile $file): ?string
    {
        $extension = strtolower($file->getClientOriginalExtension());
        $name = self::DIR.'/'.Str::lower(Str::random(16)).'.'.($extension === 'jpeg' ? 'jpg' : $extension);

        if ($extension === 'svg') {
            $svg = SvgSanitizer::clean((string) file_get_contents($file->getRealPath()));
            if ($svg === null) {
                return null;
            }
            Storage::disk('public')->put($name, $svg);
        } else {
            Storage::disk('public')->putFileAs(self::DIR, $file, basename($name));
        }

        return Storage::disk('public')->url($name);
    }

    protected static function deleteUpload(string $url): void
    {
        $prefix = rtrim((string) parse_url(Storage::disk('public')->url(''), PHP_URL_PATH), '/').'/';
        $path = (string) parse_url($url, PHP_URL_PATH);
        if (str_starts_with($path, $prefix.self::DIR.'/')) {
            Storage::disk('public')->delete(Str::after($path, $prefix));
        }
    }
}
