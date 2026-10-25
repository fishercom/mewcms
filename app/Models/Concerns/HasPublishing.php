<?php

namespace App\Models\Concerns;

use Illuminate\Database\Eloquent\Builder;

/**
 * Publishing state shared by pages and posts: a published item is visible once its
 * publication date (if any) has passed, so a future date schedules it.
 */
trait HasPublishing
{
    public const STATUS_DRAFT = 'draft';

    public const STATUS_PUBLISHED = 'published';

    public function initializeHasPublishing(): void
    {
        $this->mergeCasts(['published_at' => 'datetime']);
        $this->append('is_scheduled');
    }

    /**
     * Content the public site may show.
     */
    public function scopePublished(Builder $query): Builder
    {
        $table = $this->getTable();

        return $query->where($table.'.status', self::STATUS_PUBLISHED)
            ->where($table.'.active', true)
            ->where(fn (Builder $query) => $query->whereNull($table.'.published_at')->orWhere($table.'.published_at', '<=', now()));
    }

    public function getIsScheduledAttribute(): bool
    {
        return $this->status === self::STATUS_PUBLISHED && $this->published_at !== null && $this->published_at->isFuture();
    }
}
