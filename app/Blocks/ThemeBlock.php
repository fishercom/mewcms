<?php

namespace App\Blocks;

use App\Models\CmsSlider;
use App\Support\PostLists;

/**
 * A block type a theme brings: its name, icon and fields come from
 * resources/themes/{theme}/blocks/{key}.json and its public rendering from
 * resources/themes/{theme}/front/blocks/{key}.tsx. The editor shows the blocks of the
 * site's theme beside the CMS's own.
 *
 * Besides the usual field types, a "slider" field gives the renderer that slider (with
 * its active slides) under data._sliders[key], and a "posts" field the posts it asks for
 * under data._posts[key], so the editor manages the cards of a block in Sliders, or
 * lists products and blog posts, instead of typing them into the block.
 */
class ThemeBlock extends BlockType
{
    /**
     * @param  array<string, mixed>  $definition  the decoded JSON file
     */
    public function __construct(private string $key, private array $definition) {}

    public function key(): string
    {
        return $this->key;
    }

    public function name(): string
    {
        return (string) ($this->definition['name'] ?? $this->key);
    }

    public function icon(): string
    {
        return (string) ($this->definition['icon'] ?? 'blocks');
    }

    public function category(): string
    {
        return (string) ($this->definition['category'] ?? 'theme');
    }

    public function description(): string
    {
        return (string) ($this->definition['description'] ?? '');
    }

    public function nestable(): bool
    {
        return (bool) ($this->definition['nestable'] ?? true);
    }

    public function fields(): array
    {
        return array_values(array_filter(
            (array) ($this->definition['fields'] ?? []),
            fn ($field): bool => is_array($field) && is_string($field['key'] ?? null) && is_string($field['type'] ?? null),
        ));
    }

    /** The text of the block for search and excerpts: its texts, in field order */
    public function toHtml(array $data): string
    {
        return $this->fieldsHtml($this->fields(), $data);
    }

    public function resolve(array $data): array
    {
        $sliders = [];
        $posts = [];
        foreach ($this->fields() as $field) {
            $value = $data[$field['key']] ?? null;
            if ($field['type'] === 'slider' && is_string($value) && $value !== '') {
                $sliders[$field['key']] = CmsSlider::getSlider($value)?->toArray();
            } elseif ($field['type'] === PostLists::TYPE) {
                $posts[$field['key']] = PostLists::posts(is_array($value) ? $value : [], $field);
            }
        }

        return $data + array_filter(['_sliders' => $sliders, '_posts' => $posts]);
    }

    protected function sanitizeValue(array $field, mixed $value): mixed
    {
        return match ($field['type']) {
            'video' => parent::sanitizeValue(['type' => 'url'] + $field, $value),
            PostLists::TYPE => is_array($value) ? array_filter([
                'post_type' => is_string($value['post_type'] ?? null) ? mb_substr(trim($value['post_type']), 0, 100) : null,
                'tag' => is_string($value['tag'] ?? null) ? mb_substr(trim($value['tag']), 0, 100) : null,
                'limit' => is_numeric($value['limit'] ?? null) ? max(1, min(PostLists::MAX, (int) $value['limit'])) : null,
            ], fn ($item) => $item !== null && $item !== '') : [],
            default => parent::sanitizeValue($field, $value),
        };
    }

    /**
     * @param  list<array<string, mixed>>  $fields
     * @param  array<string, mixed>  $data
     */
    private function fieldsHtml(array $fields, array $data): string
    {
        $html = '';
        foreach ($fields as $field) {
            $value = $data[$field['key']] ?? null;
            $html .= match ($field['type']) {
                'text' => is_string($value) && $value !== '' ? '<p>'.e(str_replace('*', '', $value)).'</p>' : '',
                'textarea' => is_string($value) && $value !== '' ? '<p>'.nl2br(e($value)).'</p>' : '',
                'html_editor' => is_string($value) ? $value : '',
                'repeater' => is_array($value)
                    ? implode('', array_map(fn ($item) => is_array($item) ? $this->fieldsHtml($field['fields'] ?? [], $item) : '', $value))
                    : '',
                default => '',
            };
        }

        return $html;
    }
}
