<?php

namespace App\Models\Concerns;

use App\Blocks\BlockRegistry;

/**
 * Pages and posts are built from blocks. The blocks are cleaned on save and the
 * "content" column is rebuilt from them, so search, excerpts and feeds keep working.
 * A null "blocks" means the item still uses its plain content.
 */
trait HasBlocks
{
    public static function bootHasBlocks(): void
    {
        static::saving(function (self $model): void {
            if ($model->blocks === null || ! $model->isDirty(['blocks', 'content'])) {
                return;
            }
            $model->blocks = BlockRegistry::sanitize($model->blocks);
            $model->content = BlockRegistry::toContent($model->blocks);
        });
    }

    public function initializeHasBlocks(): void
    {
        $this->mergeCasts(['blocks' => 'array']);
        $this->mergeFillable(['blocks']);
    }
}
