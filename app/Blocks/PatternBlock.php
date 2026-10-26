<?php

namespace App\Blocks;

use App\Models\CmsBlockPattern;
use Illuminate\Support\Facades\Schema;

/**
 * A synced reusable block: the page keeps only the pattern's key, so editing the pattern
 * in "Bloques reutilizables" updates every page that uses it.
 */
class PatternBlock extends BlockType
{
    public function key(): string
    {
        return 'pattern';
    }

    public function name(): string
    {
        return 'Bloque sincronizado';
    }

    public function icon(): string
    {
        return 'blocks';
    }

    /** A synced block lives at the top level: its own content may hold columns */
    public function nestable(): bool
    {
        return false;
    }

    public function category(): string
    {
        return 'reusable';
    }

    public function description(): string
    {
        return 'Un bloque reutilizable sincronizado: al editarlo cambia en todas las páginas.';
    }

    public function fields(): array
    {
        $patterns = Schema::hasTable('cms_block_patterns')
            ? CmsBlockPattern::where('active', true)->where('synced', true)->orderBy('name')
                ->get(['key', 'name'])
                ->map(fn (CmsBlockPattern $pattern): array => ['value' => $pattern->key, 'label' => $pattern->name])->all()
            : [];

        return [['key' => 'pattern', 'label' => 'Bloque reutilizable', 'type' => 'select', 'options' => $patterns]];
    }

    /**
     * The key is kept whenever it looks like one, not only while it is on the list above:
     * saving a page must not drop the reference to a pattern that is momentarily inactive.
     */
    public function sanitize(array $data): array
    {
        $key = $data['pattern'] ?? null;

        return ['pattern' => is_string($key) && preg_match('/^[a-z0-9-]{1,100}$/', $key) ? $key : ''];
    }

    /** The pattern's own blocks, resolved, for the renderer */
    public function resolve(array $data): array
    {
        $pattern = $this->pattern($data);

        return [
            'name' => (string) ($pattern->name ?? ''),
            'blocks' => BlockRegistry::resolve($pattern?->blocks ?? []),
        ] + $data;
    }

    /** The pattern's text counts as part of the page, so search and feeds find it */
    public function toHtml(array $data): string
    {
        return BlockRegistry::toHtml($this->pattern($data)?->blocks ?? []);
    }

    protected function pattern(array $data): ?CmsBlockPattern
    {
        if (($data['pattern'] ?? '') === '' || ! Schema::hasTable('cms_block_patterns')) {
            return null;
        }

        return CmsBlockPattern::where('key', $data['pattern'])->where('active', true)->first();
    }
}
