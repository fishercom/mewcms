<?php

namespace App\Blocks;

use App\Support\ContentSanitizer;

/**
 * A kind of content block. Its fields use the schema field types (text, textarea,
 * html_editor, url, image, number, select), which drive both the editor form and the
 * server-side sanitizing. The public rendering lives in resources/js/blocks/{key}/render.tsx.
 */
abstract class BlockType
{
    /** Stored on each block, so later versions can upgrade older data */
    public const VERSION = 1;

    abstract public function key(): string;

    abstract public function name(): string;

    /** lucide icon name (kebab-case) */
    abstract public function icon(): string;

    public function category(): string
    {
        return 'basic';
    }

    public function description(): string
    {
        return '';
    }

    /**
     * @return list<array<string, mixed>>
     */
    abstract public function fields(): array;

    /**
     * Searchable HTML for the item's "content" column (search, excerpts, sitemap, feeds).
     *
     * @param  array<string, mixed>  $data
     */
    public function toHtml(array $data): string
    {
        return '';
    }

    /**
     * Keep only the declared fields, cleaned according to their type.
     *
     * @param  array<string, mixed>  $data
     * @return array<string, mixed>
     */
    public function sanitize(array $data): array
    {
        $clean = [];
        foreach ($this->fields() as $field) {
            $clean[$field['key']] = $this->sanitizeValue($field, $data[$field['key']] ?? null);
        }

        return $clean;
    }

    /**
     * @return array<string, mixed>
     */
    public function definition(): array
    {
        return [
            'key' => $this->key(),
            'name' => $this->name(),
            'icon' => $this->icon(),
            'category' => $this->category(),
            'description' => $this->description(),
            'version' => static::VERSION,
            'fields' => $this->fields(),
            'defaults' => $this->sanitize([]),
        ];
    }

    /**
     * @param  array<string, mixed>  $field
     */
    protected function sanitizeValue(array $field, mixed $value): mixed
    {
        $default = $field['default'] ?? ($field['type'] === 'number' ? null : '');
        if ($value === null || $value === '') {
            return $default;
        }

        return match ($field['type']) {
            'html_editor' => (string) ContentSanitizer::html(is_string($value) ? $value : ''),
            'textarea' => is_scalar($value) ? mb_substr(trim(strip_tags((string) $value)), 0, $field['max'] ?? 5000) : $default,
            'url', 'image' => is_string($value) && ContentSanitizer::isSafeUrl(trim($value)) ? mb_substr(trim($value), 0, 2048) : $default,
            'number' => is_numeric($value) ? max($field['min'] ?? PHP_INT_MIN, min($field['max'] ?? PHP_INT_MAX, (int) $value)) : $default,
            'select' => in_array($value, array_column($field['options'] ?? [], 'value'), true) ? $value : $default,
            default => is_scalar($value) ? mb_substr(trim(strip_tags((string) $value)), 0, $field['max'] ?? 500) : $default,
        };
    }

    /** @param  array<string, mixed>  $data */
    protected static function link(array $data, string $label, string $url): string
    {
        return ($data[$label] ?? '') !== '' && ($data[$url] ?? '') !== ''
            ? '<p><a href="'.e($data[$url]).'">'.e($data[$label]).'</a></p>'
            : '';
    }
}
