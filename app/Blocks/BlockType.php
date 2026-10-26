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

    /** Whether the block may be placed inside another (columns can't nest) */
    public function nestable(): bool
    {
        return true;
    }

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
     * Prepare the block for the public page: add data the renderer needs (a slider's
     * slides) or improve what is stored (srcset in rich text). Not saved.
     *
     * @param  array<string, mixed>  $data
     * @return array<string, mixed>
     */
    public function resolve(array $data): array
    {
        return $data;
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
            'nestable' => $this->nestable(),
            'fields' => $this->fields(),
            'defaults' => $this->sanitize([]),
        ];
    }

    /**
     * @param  array<string, mixed>  $field
     */
    protected function sanitizeValue(array $field, mixed $value): mixed
    {
        $default = $field['default'] ?? match ($field['type']) {
            'number' => null,
            'repeater' => [],
            default => '',
        };
        if ($value === null || $value === '') {
            return $default;
        }

        return match ($field['type']) {
            'repeater' => $this->sanitizeRepeater($field, $value),
            'icon' => is_string($value) && in_array($value, FeaturesBlock::ICONS, true) ? $value : $default,
            'slider' => is_string($value) && preg_match('/^[A-Za-z0-9_-]{1,100}$/', $value) ? $value : $default,
            'html_editor' => (string) ContentSanitizer::html(is_string($value) ? $value : ''),
            'textarea' => is_scalar($value) ? mb_substr(trim(strip_tags((string) $value)), 0, $field['max'] ?? 5000) : $default,
            'url', 'image', 'document' => is_string($value) && ContentSanitizer::isSafeUrl(trim($value)) ? mb_substr(trim($value), 0, 2048) : $default,
            'number' => is_numeric($value) ? max($field['min'] ?? PHP_INT_MIN, min($field['max'] ?? PHP_INT_MAX, (int) $value)) : $default,
            'select' => in_array($value, array_column($field['options'] ?? [], 'value'), true) ? $value : $default,
            default => is_scalar($value) ? mb_substr(trim(strip_tags((string) $value)), 0, $field['max'] ?? 500) : $default,
        };
    }

    /**
     * Each item keeps its sub-fields (cleaned by type) and an "_id" used by the editor.
     *
     * @param  array<string, mixed>  $field
     * @return list<array<string, mixed>>
     */
    protected function sanitizeRepeater(array $field, mixed $value): array
    {
        if (! is_array($value)) {
            return [];
        }

        $items = [];
        foreach (array_slice(array_values($value), 0, $field['max_items'] ?? 50) as $item) {
            if (! is_array($item)) {
                continue;
            }
            $clean = ['_id' => is_string($item['_id'] ?? null) && preg_match('/^[A-Za-z0-9_-]{1,40}$/', $item['_id']) ? $item['_id'] : bin2hex(random_bytes(4))];
            foreach ($field['fields'] ?? [] as $subField) {
                $clean[$subField['key']] = $this->sanitizeValue($subField, $item[$subField['key']] ?? null);
            }
            $items[] = $clean;
        }

        return $items;
    }

    /** @param  array<string, mixed>  $data */
    protected static function link(array $data, string $label, string $url): string
    {
        return ($data[$label] ?? '') !== '' && ($data[$url] ?? '') !== ''
            ? '<p><a href="'.e($data[$url]).'">'.e($data[$label]).'</a></p>'
            : '';
    }
}
