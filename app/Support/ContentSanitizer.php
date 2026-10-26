<?php

namespace App\Support;

use Symfony\Component\HtmlSanitizer\HtmlSanitizer;
use Symfony\Component\HtmlSanitizer\HtmlSanitizerConfig;

/**
 * Cleans editor-provided HTML before it is stored, so content rendered with
 * dangerouslySetInnerHTML on the public site cannot run scripts.
 */
class ContentSanitizer
{
    /**
     * Matches [form alias="..."] shortcodes handled by the front-end ContentRenderer.
     */
    protected const SHORTCODE_PATTERN = '/\[form\s+alias=["\']([A-Za-z0-9_-]+)["\']\s*\/?\]/i';

    protected static ?HtmlSanitizer $sanitizer = null;

    protected static ?HtmlSanitizer $inlineSanitizer = null;

    public static function html(?string $html): ?string
    {
        if ($html === null || $html === '') {
            return $html;
        }

        // The sanitizer encodes quotes in text, which would break shortcodes, so set them aside
        $shortcodes = [];
        $html = preg_replace_callback(self::SHORTCODE_PATTERN, function (array $match) use (&$shortcodes): string {
            $shortcodes[] = $match[1];

            return 'MEWCMSSHORTCODE'.(count($shortcodes) - 1).'X';
        }, $html);

        $clean = self::sanitizer()->sanitize($html);

        return preg_replace_callback('/MEWCMSSHORTCODE(\d+)X/', fn (array $match): string => isset($shortcodes[(int) $match[1]])
            ? '[form alias="'.$shortcodes[(int) $match[1]].'"]'
            : '', $clean);
    }

    /**
     * Sanitize every string in schema metadata that contains markup or a script URL.
     * Other plain strings are left untouched because React escapes them when rendering.
     */
    public static function metadata(mixed $value): mixed
    {
        if (is_array($value)) {
            return array_map(self::metadata(...), $value);
        }

        // Only strings with something a browser would parse as a tag count as markup
        if (is_string($value) && preg_match('/<[a-z!\/?]/i', $value)) {
            return self::html($value);
        }

        // Metadata values are also used as link targets (e.g. call-to-action URLs)
        if (is_string($value) && preg_match('/^[\s\x00-\x1f]*(javascript|vbscript|data\s*:\s*text\/html)/i', $value)) {
            return '';
        }

        return $value;
    }

    /**
     * Custom CSS is printed inside a <style> tag, so it must not be able to close it.
     */
    public static function css(?string $css): string
    {
        return str_replace('<', '', (string) $css);
    }

    /**
     * Whether a URL is safe to use in a link: relative, anchor, http(s), mailto or tel.
     */
    public static function isSafeUrl(?string $url): bool
    {
        if ($url === null || trim($url) === '') {
            return true;
        }

        $url = trim($url);

        if (str_starts_with($url, '/') || str_starts_with($url, '#') || str_starts_with($url, '?')) {
            return true;
        }

        $scheme = parse_url($url, PHP_URL_SCHEME);

        return $scheme === null
            ? ! str_contains(strtok($url, '/?#') ?: '', ':')
            : in_array(strtolower($scheme), ['http', 'https', 'mailto', 'tel'], true);
    }

    /**
     * Short text with simple links, e.g. the footer credit: only links and basic inline
     * formatting are kept, and links always get rel="noopener noreferrer".
     */
    public static function inline(?string $html): ?string
    {
        if ($html === null || $html === '') {
            return $html;
        }

        self::$inlineSanitizer ??= new HtmlSanitizer(
            (new HtmlSanitizerConfig)
                ->allowElement('a', ['href', 'target', 'title'])
                ->allowElement('strong')
                ->allowElement('em')
                ->allowElement('b')
                ->allowElement('i')
                ->allowElement('span')
                ->allowElement('br')
                ->allowRelativeLinks()
                ->allowLinkSchemes(['http', 'https', 'mailto', 'tel'])
                ->forceAttribute('a', 'rel', 'noopener noreferrer')
                ->withMaxInputLength(-1)
        );

        return self::$inlineSanitizer->sanitize($html);
    }

    protected static function sanitizer(): HtmlSanitizer
    {
        return self::$sanitizer ??= new HtmlSanitizer(
            (new HtmlSanitizerConfig)
                ->allowSafeElements()
                ->allowRelativeLinks()
                ->allowRelativeMedias()
                ->allowLinkSchemes(['http', 'https', 'mailto', 'tel'])
                ->allowMediaSchemes(['http', 'https'])
                ->allowAttribute('class', '*')
                ->allowAttribute('target', 'a')
                ->allowElement('iframe', ['src', 'width', 'height', 'title', 'allow', 'allowfullscreen', 'frameborder', 'loading'])
                ->withMaxInputLength(-1)
        );
    }
}
