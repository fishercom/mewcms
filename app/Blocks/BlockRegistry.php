<?php

namespace App\Blocks;

use App\Support\ContentSanitizer;
use App\Support\Themes;
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
        GalleryBlock::class,
        VideoBlock::class,
        CtaBlock::class,
        FeaturesBlock::class,
        StatsBlock::class,
        QuoteBlock::class,
        ColumnsBlock::class,
        FormBlock::class,
        SliderBlock::class,
        PatternBlock::class,
    ];

    public const MAX_BLOCKS = 200;

    /** @var array<string, array<string, BlockType>> block types by theme */
    protected static array $types = [];

    /**
     * The CMS's block types, then those of the current site's theme (a theme block
     * cannot take the key of one of the CMS's).
     *
     * @return array<string, BlockType>
     */
    public static function types(): array
    {
        $theme = Themes::layout();
        if (! isset(self::$types[$theme])) {
            $types = [];
            foreach (self::TYPES as $class) {
                $type = new $class;
                $types[$type->key()] = $type;
            }
            foreach (self::themeBlocks($theme) as $key => $type) {
                $types[$key] ??= $type;
            }
            self::$types[$theme] = $types;
        }

        return self::$types[$theme];
    }

    /**
     * The block types a theme declares in its blocks folder, one JSON file each, named
     * after the block's key (letters, digits and underscores).
     *
     * @return array<string, ThemeBlock>
     */
    public static function themeBlocks(string $theme): array
    {
        $types = [];
        foreach (glob(Themes::path($theme, 'blocks').'/*.json') ?: [] as $file) {
            $key = basename($file, '.json');
            $definition = json_decode((string) file_get_contents($file), true);
            if (preg_match('/^[a-z][a-z0-9_]{0,63}$/', $key) && is_array($definition)) {
                $types[$key] = new ThemeBlock($key, $definition);
            }
        }
        ksort($types);

        return $types;
    }

    /** Forget the loaded block types (after a theme changes) */
    public static function flush(): void
    {
        self::$types = [];
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
     * keeps an id and only the fields its type declares. Inside another block ($depth > 0)
     * only nestable types are kept.
     *
     * @return list<array{id: string, type: string, version: int, data: array<string, mixed>}>
     */
    public static function sanitize(mixed $blocks, int $depth = 0): array
    {
        if (! is_array($blocks)) {
            return [];
        }

        $clean = [];
        foreach (array_slice(array_values($blocks), 0, self::MAX_BLOCKS) as $block) {
            $type = is_array($block) && is_string($block['type'] ?? null) ? self::get($block['type']) : null;
            if (! $type || ($depth > 0 && ! $type->nestable())) {
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
        return (string) ContentSanitizer::html(self::toHtml($blocks));
    }

    /**
     * @param  list<array<string, mixed>>  $blocks
     */
    public static function toHtml(array $blocks): string
    {
        $html = '';
        foreach ($blocks as $block) {
            $html .= self::get($block['type'] ?? '')?->toHtml($block['data'] ?? []) ?? '';
        }

        return $html;
    }

    /**
     * Blocks as the public page needs them (see BlockType::resolve).
     *
     * @param  list<array<string, mixed>>  $blocks
     * @return list<array<string, mixed>>
     */
    public static function resolve(array $blocks): array
    {
        return array_map(function (array $block): array {
            $type = self::get($block['type'] ?? '');
            if ($type) {
                $block['data'] = $type->resolve($block['data'] ?? []);
            }

            return $block;
        }, $blocks);
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
