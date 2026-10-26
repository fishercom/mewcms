<?php

namespace App\Support;

use App\Models\CmsConfig;

/**
 * The site's social / contact links, edited as a list in Personalizar Layout and shown
 * in the public footer. Stored as JSON in the "layout_social_links" setting.
 */
class SocialLinks
{
    public const ALIAS = 'layout_social_links';

    /** Networks with a pre-designed icon (see resources/js/components/social-icon.tsx). */
    public const NETWORKS = [
        'facebook', 'instagram', 'x', 'tiktok', 'youtube', 'linkedin', 'whatsapp', 'telegram', 'threads',
        'pinterest', 'github', 'discord', 'spotify', 'behance', 'dribbble', 'email', 'phone', 'website', 'custom',
    ];

    /** The fixed settings used before the list, in their old footer order. */
    public const LEGACY_ALIASES = [
        'layout_facebook' => 'facebook',
        'layout_instagram' => 'instagram',
        'layout_twitter' => 'x',
        'layout_linkedin' => 'linkedin',
        'layout_youtube' => 'youtube',
    ];

    public const MAX_LINKS = 30;

    /**
     * @return list<array{network: string, url: string, label: string}>
     */
    public static function all(): array
    {
        return self::decode(CmsConfig::where('alias', self::ALIAS)->value('value'));
    }

    /**
     * @return list<array{network: string, url: string, label: string}>
     */
    public static function decode(?string $json): array
    {
        $links = json_decode((string) $json, true);

        return is_array($links) ? self::clean($links) : [];
    }

    /**
     * Keep only well-formed links with a known network and a safe address. E-mail and
     * phone entries accept a bare address or number and get their mailto:/tel: prefix;
     * a bare domain gets https://.
     *
     * @param  array<int, mixed>  $links
     * @return list<array{network: string, url: string, label: string}>
     */
    public static function clean(array $links): array
    {
        $clean = [];
        foreach (array_slice(array_values($links), 0, self::MAX_LINKS) as $link) {
            if (! is_array($link) || ! in_array($link['network'] ?? null, self::NETWORKS, true)) {
                continue;
            }

            $url = self::normalizeUrl($link['network'], trim((string) ($link['url'] ?? '')));
            if ($url === '' || ! ContentSanitizer::isSafeUrl($url)) {
                continue;
            }

            $clean[] = [
                'network' => $link['network'],
                'url' => $url,
                'label' => mb_substr(trim((string) ($link['label'] ?? '')), 0, 60),
            ];
        }

        return $clean;
    }

    public static function normalizeUrl(string $network, string $url): string
    {
        if ($url === '') {
            return '';
        }
        if ($network === 'email' && ! str_starts_with($url, 'mailto:')) {
            return 'mailto:'.$url;
        }
        if ($network === 'phone' && ! str_starts_with($url, 'tel:')) {
            return 'tel:'.preg_replace('/[^\d+]/', '', $url);
        }
        // "facebook.com/usuario" means an external address, not a path on this site
        if (parse_url($url, PHP_URL_SCHEME) === null && preg_match('~^[\w-]+(\.[\w-]+)+(/|$)~u', $url)) {
            return 'https://'.$url;
        }

        return $url;
    }

    /**
     * @param  array<int, mixed>  $links
     */
    public static function save(array $links): void
    {
        $now = now();
        // Written without model events: the layout controller logs the whole save once
        CmsConfig::query()->updateOrInsert(['alias' => self::ALIAS], [
            'type' => 'json',
            'name' => 'Redes sociales',
            'value' => json_encode(self::clean($links), JSON_UNESCAPED_SLASHES | JSON_UNESCAPED_UNICODE),
            'updated_at' => $now,
        ]);
        FrontCache::flush();
    }
}
