<?php

namespace App\Models;

use App\Blocks\BlockRegistry;
use App\Models\Concerns\FlushesFrontCache;
use App\Models\Concerns\LogsAdminActivity;
use Illuminate\Database\Eloquent\Model;

/**
 * A reusable block: a named list of blocks editors insert into pages and posts.
 *
 * Synced patterns are referenced by a "pattern" block, so editing the pattern changes
 * every page using it. Unsynced ones are copied into the content when inserted.
 */
class CmsBlockPattern extends Model
{
    use FlushesFrontCache;
    use LogsAdminActivity;

    protected $table = 'cms_block_patterns';

    protected $fillable = ['name', 'key', 'description', 'category', 'blocks', 'synced', 'active'];

    protected $casts = [
        'blocks' => 'array',
        'synced' => 'boolean',
        'active' => 'boolean',
    ];

    public const CATEGORIES = [
        'general' => 'General',
        'header' => 'Encabezados',
        'content' => 'Contenido',
        'cta' => 'Llamadas a la acción',
        'footer' => 'Pies de página',
    ];

    protected static function booted(): void
    {
        static::saving(function (self $pattern): void {
            // A pattern holds plain blocks: a pattern inside a pattern would recurse
            $pattern->blocks = self::withoutPatterns(BlockRegistry::sanitize($pattern->blocks ?? []));
        });
    }

    /**
     * The blocks of the patterns an editor may insert, with the newest first.
     *
     * @return list<array<string, mixed>>
     */
    public static function forEditor(): array
    {
        return self::where('active', true)->orderBy('name')
            ->get(['id', 'name', 'key', 'description', 'category', 'blocks', 'synced'])
            ->map(fn (self $pattern): array => [
                'id' => $pattern->id,
                'name' => $pattern->name,
                'key' => $pattern->key,
                'description' => (string) $pattern->description,
                'category' => $pattern->category,
                'synced' => $pattern->synced,
                'blocks' => $pattern->blocks ?? [],
            ])->all();
    }

    /**
     * Drop any nested pattern block, at any depth (columns hold blocks of their own).
     *
     * @param  list<array<string, mixed>>  $blocks
     * @return list<array<string, mixed>>
     */
    public static function withoutPatterns(array $blocks): array
    {
        $clean = [];
        foreach ($blocks as $block) {
            if (($block['type'] ?? '') === 'pattern') {
                continue;
            }
            if (isset($block['data']['columns']) && is_array($block['data']['columns'])) {
                $block['data']['columns'] = array_map(
                    fn (array $column): array => ['blocks' => self::withoutPatterns($column['blocks'] ?? [])],
                    $block['data']['columns'],
                );
            }
            $clean[] = $block;
        }

        return $clean;
    }

    public function adminActivityModule(): string
    {
        return 'block-patterns';
    }
}
