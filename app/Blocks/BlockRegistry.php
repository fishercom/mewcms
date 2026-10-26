<?php

namespace App\Blocks;

use App\Support\ContentSanitizer;
use Illuminate\Support\Str;

/**
 * The block types available in the page and post editors.
 */
class BlockRegistry
{
    /** @var list<class-string<BlockType>> */
    public const TYPES = [
        RichTextBlock::class,
        HeroBlock::class,
        ImageBlock::class,
        CtaBlock::class,
    ];

    public const MAX_BLOCKS = 200;

    /** @var array<string, BlockType>|null */
    protected static ?array $types = null;

    /**
     * @return array<string, BlockType>
     */
    public static function types(): array
    {
        if (self::$types === null) {
            self::$types = [];
            foreach (self::TYPES as $class) {
                $type = new $class;
                self::$types[$type->key()] = $type;
            }
        }

        return self::$types;
    }

    public static function get(string $key): ?BlockType
    {
        return self::types()[$key] ?? null;
    }

    /**
     * Definitions for the editor: name, icon, fields and defaults of each type.
     *
     * @return list<array<string, mixed>>
     */
    public static function definitions(): array
    {
        return array_values(array_map(fn (BlockType $type): array => $type->definition(), self::types()));
    }

    /**
     * Clean a list of blocks: unknown types and malformed entries are dropped, each block
     * keeps an id and only the fields its type declares.
     *
     * @return list<array{id: string, type: string, version: int, data: array<string, mixed>}>
     */
    public static function sanitize(mixed $blocks): array
    {
        if (! is_array($blocks)) {
            return [];
        }

        $clean = [];
        foreach (array_slice(array_values($blocks), 0, self::MAX_BLOCKS) as $block) {
            $type = is_array($block) && is_string($block['type'] ?? null) ? self::get($block['type']) : null;
            if (! $type) {
                continue;
            }

            $id = is_string($block['id'] ?? null) && preg_match('/^[A-Za-z0-9_-]{1,64}$/', $block['id']) ? $block['id'] : (string) Str::uuid();
            $clean[] = [
                'id' => $id,
                'type' => $type->key(),
                'version' => $type::VERSION,
                'data' => $type->sanitize(is_array($block['data'] ?? null) ? $block['data'] : []),
            ];
        }

        return $clean;
    }

    /**
     * The searchable HTML of a list of blocks, stored in the "content" column.
     *
     * @param  list<array<string, mixed>>  $blocks
     */
    public static function toContent(array $blocks): string
    {
        $html = '';
        foreach ($blocks as $block) {
            $html .= self::get($block['type'] ?? '')?->toHtml($block['data'] ?? []) ?? '';
        }

        return (string) ContentSanitizer::html($html);
    }

    /**
     * Existing content as a block list: one rich text block.
     *
     * @return list<array<string, mixed>>
     */
    public static function fromContent(?string $html): array
    {
        return trim((string) $html) === ''
            ? []
            : [['id' => (string) Str::uuid(), 'type' => 'rich_text', 'version' => RichTextBlock::VERSION, 'data' => ['html' => $html]]];
    }
}
