<?php

namespace App\Support;

use App\Blocks\BlockRegistry;
use App\Models\CmsArticle;
use App\Models\CmsPost;
use DOMDocument;
use DOMXPath;
use Illuminate\Support\Str;

/**
 * Rule-based SEO review of a page or post: no AI and no external calls, so it runs
 * instantly on every edit and gives the same score every time.
 */
class SeoAnalyzer
{
    public const TITLE_MIN = 30;

    public const TITLE_MAX = 60;

    public const DESCRIPTION_MIN = 70;

    public const DESCRIPTION_MAX = 155;

    /** Minimum words: pages and posts */
    public const MIN_WORDS = ['articles' => 300, 'posts' => 600];

    /** Above this share of the words the keyword reads as stuffed */
    public const MAX_DENSITY = 0.03;

    /**
     * @param  array{title?: ?string, content?: ?string, blocks?: mixed, metadata?: mixed, id?: mixed, lang_id?: mixed}  $item
     * @param  'articles'|'posts'  $module
     * @return array{score: int, keyword: ?string, words: int, checks: list<array{key: string, status: string, label: string, message: string}>}
     */
    public static function analyze(array $item, string $module): array
    {
        $metadata = is_array($item['metadata'] ?? null) ? $item['metadata'] : [];
        $title = trim((string) ($metadata['seo_title'] ?? '')) ?: trim((string) ($item['title'] ?? ''));
        $description = trim((string) ($metadata['seo_description'] ?? ''));
        $keyword = self::keyword($metadata['seo_keywords'] ?? null);

        $page = self::parse(self::html($item));
        $words = self::words($page['text']);

        $checks = [
            self::checkTitle($title, $keyword),
            self::checkDescription($description, $keyword),
            self::checkHeadings($page, count($words)),
            self::checkLength(count($words), $module),
            self::checkKeyword($keyword, $words, $page['h2']),
            self::checkImages($page['images']),
            self::checkLinks($page['links']),
            self::checkDuplicates($title, $keyword, $module, $item['id'] ?? null, $item['lang_id'] ?? null),
        ];

        $weights = ['title' => 15, 'description' => 15, 'headings' => 10, 'length' => 15, 'keyword' => 15, 'images' => 10, 'links' => 10, 'duplicates' => 10];
        $total = $earned = 0;
        foreach ($checks as $check) {
            if ($check['status'] === 'skip') {
                continue;
            }
            $total += $weights[$check['key']];
            $earned += $check['status'] === 'pass' ? $weights[$check['key']] : 0;
        }

        return [
            'score' => $total > 0 ? (int) round($earned / $total * 100) : 0,
            'keyword' => $keyword,
            'words' => count($words),
            'checks' => $checks,
        ];
    }

    /**
     * Readable text of the item's blocks (or legacy content), for prompts and summaries.
     *
     * @param  array{content?: ?string, blocks?: mixed}  $item
     */
    public static function plainText(array $item): string
    {
        $text = html_entity_decode(self::parse(self::html($item))['text'], ENT_QUOTES | ENT_HTML5, 'UTF-8');

        return trim(preg_replace('/\s+/u', ' ', $text));
    }

    /**
     * @param  array{content?: ?string, blocks?: mixed}  $item
     */
    protected static function html(array $item): string
    {
        return is_array($item['blocks'] ?? null) && $item['blocks'] !== []
            ? BlockRegistry::toHtml(BlockRegistry::sanitize($item['blocks']))
            : (string) ($item['content'] ?? '');
    }

    /**
     * The focus keyword: the first of the comma-separated SEO keywords.
     */
    public static function keyword(mixed $keywords): ?string
    {
        $first = trim(explode(',', (string) $keywords)[0]);

        return $first !== '' ? $first : null;
    }

    /**
     * @return array{status: string, key: string, label: string, message: string}
     */
    protected static function result(string $key, string $label, bool|string $status, string $message, array $replace = []): array
    {
        return [
            'key' => $key,
            'status' => is_bool($status) ? ($status ? 'pass' : 'fail') : $status,
            'label' => __($label),
            'message' => __($message, $replace),
        ];
    }

    protected static function checkTitle(string $title, ?string $keyword): array
    {
        $length = mb_strlen($title);

        return match (true) {
            $title === '' => self::result('title', 'Título SEO', false, 'Falta el título.'),
            $length < self::TITLE_MIN => self::result('title', 'Título SEO', false, 'El título tiene :count caracteres; apunta a :min a :max.', ['count' => $length, 'min' => self::TITLE_MIN, 'max' => self::TITLE_MAX]),
            $length > self::TITLE_MAX => self::result('title', 'Título SEO', false, 'El título tiene :count caracteres; Google corta a partir de :max.', ['count' => $length, 'max' => self::TITLE_MAX]),
            $keyword !== null && ! self::contains($title, $keyword) => self::result('title', 'Título SEO', false, 'Incluye la palabra clave «:keyword» en el título.', ['keyword' => $keyword]),
            default => self::result('title', 'Título SEO', true, 'Buen largo de título (:count caracteres).', ['count' => $length]),
        };
    }

    protected static function checkDescription(string $description, ?string $keyword): array
    {
        $length = mb_strlen($description);

        return match (true) {
            $description === '' => self::result('description', 'Meta descripción', false, 'Falta la meta descripción: Google mostrará un trozo cualquiera del texto.'),
            $length < self::DESCRIPTION_MIN => self::result('description', 'Meta descripción', false, 'La descripción tiene :count caracteres; apunta a :min a :max.', ['count' => $length, 'min' => self::DESCRIPTION_MIN, 'max' => self::DESCRIPTION_MAX]),
            $length > self::DESCRIPTION_MAX => self::result('description', 'Meta descripción', false, 'La descripción tiene :count caracteres; Google corta a partir de :max.', ['count' => $length, 'max' => self::DESCRIPTION_MAX]),
            $keyword !== null && ! self::contains($description, $keyword) => self::result('description', 'Meta descripción', false, 'Incluye la palabra clave «:keyword» en la descripción.', ['keyword' => $keyword]),
            default => self::result('description', 'Meta descripción', true, 'Buen largo de descripción (:count caracteres).', ['count' => $length]),
        };
    }

    /**
     * @param  array{h1: int, h2: list<string>}  $page
     */
    protected static function checkHeadings(array $page, int $words): array
    {
        return match (true) {
            $page['h1'] > 0 => self::result('headings', 'Encabezados', false, 'El texto tiene :count H1; el título de la página ya es el H1, usa H2 y H3.', ['count' => $page['h1']]),
            $words > 300 && count($page['h2']) < 2 => self::result('headings', 'Encabezados', false, 'Divide el texto con al menos dos subtítulos H2.'),
            default => self::result('headings', 'Encabezados', true, 'Estructura de encabezados correcta.'),
        };
    }

    protected static function checkLength(int $words, string $module): array
    {
        $min = self::MIN_WORDS[$module] ?? 300;

        return $words >= $min
            ? self::result('length', 'Extensión', true, ':count palabras.', ['count' => $words])
            : self::result('length', 'Extensión', false, ':count palabras; los buscadores prefieren :min o más.', ['count' => $words, 'min' => $min]);
    }

    /**
     * @param  list<string>  $words
     * @param  list<string>  $h2
     */
    protected static function checkKeyword(?string $keyword, array $words, array $h2): array
    {
        if ($keyword === null) {
            return self::result('keyword', 'Palabra clave', 'skip', 'Escribe una palabra clave en SEO para revisar su uso (la primera de la lista).');
        }

        $text = implode(' ', $words);
        $occurrences = substr_count(' '.self::normalize($text).' ', ' '.self::normalize($keyword).' ');
        $keywordWords = max(1, count(self::words($keyword)));
        $density = $words !== [] ? $occurrences * $keywordWords / count($words) : 0;

        return match (true) {
            ! self::contains(implode(' ', array_slice($words, 0, 100)), $keyword) => self::result('keyword', 'Palabra clave', false, 'Usa «:keyword» en las primeras 100 palabras.', ['keyword' => $keyword]),
            ! collect($h2)->contains(fn (string $heading): bool => self::contains($heading, $keyword)) => self::result('keyword', 'Palabra clave', false, 'Usa «:keyword» en al menos un subtítulo H2.', ['keyword' => $keyword]),
            $density > self::MAX_DENSITY => self::result('keyword', 'Palabra clave', false, '«:keyword» aparece demasiado (:percent% del texto); suena forzado.', ['keyword' => $keyword, 'percent' => round($density * 100, 1)]),
            default => self::result('keyword', 'Palabra clave', true, '«:keyword» está bien usada.', ['keyword' => $keyword]),
        };
    }

    /**
     * @param  list<array{src: string, alt: string}>  $images
     */
    protected static function checkImages(array $images): array
    {
        if ($images === []) {
            return self::result('images', 'Imágenes', 'skip', 'Sin imágenes en el contenido.');
        }

        // An empty alt falls back to the text saved in the media library
        $library = MediaLibrary::lookup(array_column($images, 'src'));
        $missing = collect($images)->filter(fn (array $image): bool => trim($image['alt']) === '' && blank($library[$image['src']]['alt'] ?? null))->count();

        return $missing === 0
            ? self::result('images', 'Imágenes', true, 'Todas las imágenes tienen texto alternativo.')
            : self::result('images', 'Imágenes', false, ':count de :total imágenes no tienen texto alternativo.', ['count' => $missing, 'total' => count($images)]);
    }

    /**
     * @param  list<string>  $links
     */
    protected static function checkLinks(array $links): array
    {
        $host = parse_url((string) config('app.url'), PHP_URL_HOST);
        $internal = collect($links)->filter(function (string $href) use ($host): bool {
            if (Str::startsWith($href, ['#', 'mailto:', 'tel:', 'javascript:'])) {
                return false;
            }
            $linkHost = parse_url($href, PHP_URL_HOST);

            return $linkHost === null || $linkHost === $host;
        })->count();

        return $internal >= 2
            ? self::result('links', 'Enlaces internos', true, ':count enlaces a otras páginas del sitio.', ['count' => $internal])
            : self::result('links', 'Enlaces internos', false, 'Enlaza al menos 2 páginas o entradas del sitio (ahora :count).', ['count' => $internal]);
    }

    protected static function checkDuplicates(string $title, ?string $keyword, string $module, mixed $id, mixed $langId): array
    {
        $others = function (string $model, string $itemModule) use ($id, $module, $langId) {
            return $model::query()
                ->when($langId, fn ($query) => $query->where('lang_id', $langId))
                ->when($itemModule === $module && $id, fn ($query) => $query->whereKeyNot($id));
        };

        $sameTitle = $title !== '' && collect([CmsArticle::class => 'articles', CmsPost::class => 'posts'])->contains(
            fn (string $itemModule, string $model): bool => $others($model, $itemModule)
                ->where(fn ($query) => $query->where('metadata->seo_title', $title)->orWhere(fn ($query) => $query->where('title', $title)->where(fn ($query) => $query->whereNull('metadata->seo_title')->orWhere('metadata->seo_title', ''))))
                ->exists()
        );
        if ($sameTitle) {
            return self::result('duplicates', 'Contenido único', false, 'Otra página o entrada ya usa este título.');
        }

        $sameKeyword = $keyword !== null && collect([CmsArticle::class => 'articles', CmsPost::class => 'posts'])->contains(
            fn (string $itemModule, string $model): bool => $others($model, $itemModule)
                ->where(fn ($query) => $query->where('metadata->seo_keywords', $keyword)->orWhere('metadata->seo_keywords', 'like', $keyword.',%'))
                ->exists()
        );

        return $sameKeyword
            ? self::result('duplicates', 'Contenido único', false, 'Otra página o entrada ya apunta a «:keyword»; compiten entre sí en Google.', ['keyword' => $keyword])
            : self::result('duplicates', 'Contenido único', true, 'Ningún otro contenido usa el mismo título ni la misma palabra clave.');
    }

    /**
     * Headings, images, links and plain text of an HTML fragment.
     *
     * @return array{text: string, h1: int, h2: list<string>, images: list<array{src: string, alt: string}>, links: list<string>}
     */
    protected static function parse(string $html): array
    {
        $result = ['text' => '', 'h1' => 0, 'h2' => [], 'images' => [], 'links' => []];
        if (trim($html) === '') {
            return $result;
        }

        $dom = new DOMDocument;
        libxml_use_internal_errors(true);
        $dom->loadHTML('<?xml encoding="UTF-8"><div>'.$html.'</div>', LIBXML_HTML_NOIMPLIED | LIBXML_HTML_NODEFDTD);
        libxml_clear_errors();
        $xpath = new DOMXPath($dom);

        $result['h1'] = $xpath->query('//h1')->length;
        foreach ($xpath->query('//h2') as $heading) {
            $result['h2'][] = trim($heading->textContent);
        }
        foreach ($xpath->query('//img') as $image) {
            $result['images'][] = ['src' => (string) $image->getAttribute('src'), 'alt' => (string) $image->getAttribute('alt')];
        }
        foreach ($xpath->query('//a[@href]') as $link) {
            $result['links'][] = trim((string) $link->getAttribute('href'));
        }
        // Block elements end with a space so words of adjacent paragraphs don't merge
        $result['text'] = trim(strip_tags(preg_replace('/<\/(p|h[1-6]|li|div|figcaption|blockquote|td|th)>|<br\s*\/?>/i', ' $0', $html)));

        return $result;
    }

    /**
     * @return list<string>
     */
    protected static function words(string $text): array
    {
        $text = html_entity_decode($text, ENT_QUOTES | ENT_HTML5, 'UTF-8');

        return array_values(array_filter(preg_split('/[^\p{L}\p{N}\'’-]+/u', $text) ?: [], fn (string $word): bool => $word !== '' && preg_match('/[\p{L}\p{N}]/u', $word)));
    }

    protected static function normalize(string $text): string
    {
        return Str::lower(Str::ascii(implode(' ', self::words($text))));
    }

    protected static function contains(string $haystack, string $needle): bool
    {
        return str_contains(' '.self::normalize($haystack).' ', ' '.self::normalize($needle).' ');
    }
}
