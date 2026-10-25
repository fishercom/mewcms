<?php

namespace App\Models\Concerns;

use App\Models\CmsRevision;
use App\Support\ContentSanitizer;
use App\Support\FrontCache;
use Illuminate\Database\Eloquent\Relations\MorphMany;
use Illuminate\Support\Arr;

/**
 * Revision history for pages and posts: a snapshot on every admin save, one autosave per
 * user, and restoring an earlier state.
 */
trait HasRevisions
{
    /** Saved revisions kept per item; older ones are pruned. */
    public const REVISIONS_KEPT = 25;

    /** Fields a revision stores and restores. */
    public const REVISION_FIELDS = ['title', 'content', 'excerpt', 'metadata', 'status', 'published_at'];

    public static function bootHasRevisions(): void
    {
        static::forceDeleted(fn (self $model) => $model->revisions()->delete());
    }

    public function revisions(): MorphMany
    {
        return $this->morphMany(CmsRevision::class, 'revisionable')->latest('id');
    }

    /**
     * Record the current state. Skipped when it matches the latest saved revision.
     */
    public function snapshot(?int $userId = null): ?CmsRevision
    {
        $state = $this->revisionState();

        $latest = $this->revisions()->where('is_autosave', false)->first();
        if ($latest && $this->sameState($latest, $state)) {
            return null;
        }

        $revision = $this->revisions()->create([...$state, 'user_id' => $userId, 'is_autosave' => false]);

        $this->revisions()->where('is_autosave', false)->skip(self::REVISIONS_KEPT)->take(PHP_INT_MAX)->get()->each->delete();

        return $revision;
    }

    /**
     * After an admin save: snapshot the new state and drop the user's now obsolete autosave.
     */
    public function recordSave(?int $userId): void
    {
        $this->snapshot($userId);

        if ($userId) {
            $this->revisions()->where('is_autosave', true)->where('user_id', $userId)->delete();
        }
    }

    /**
     * Store a user's unsaved editor state without touching the live record. Each user has
     * at most one autosave per item.
     *
     * @param  array<string, mixed>  $data
     */
    public function autosave(int $userId, array $data): CmsRevision
    {
        $state = [
            ...Arr::only($data, self::REVISION_FIELDS),
            'title' => (string) ($data['title'] ?? $this->title),
            'content' => ContentSanitizer::html($data['content'] ?? null),
            'metadata' => ContentSanitizer::metadata($data['metadata'] ?? null),
            'tag_ids' => array_values(array_map('intval', $data['tag_ids'] ?? [])),
        ];

        $revision = $this->revisions()->firstOrNew(['user_id' => $userId, 'is_autosave' => true]);
        $revision->fill($state)->save();
        // Always move the timestamp, even when nothing changed
        $revision->touch();

        return $revision;
    }

    /**
     * The user's autosave, when it is newer than the last save of the item.
     */
    public function pendingAutosave(int $userId): ?CmsRevision
    {
        return $this->revisions()
            ->where('is_autosave', true)
            ->where('user_id', $userId)
            ->where('updated_at', '>=', $this->updated_at)
            ->first();
    }

    /**
     * Bring back a revision. The current state is snapshotted first, so restoring can be undone.
     */
    public function restoreRevision(CmsRevision $revision, ?int $userId = null): void
    {
        $this->snapshot($userId);

        $this->fill(Arr::only($revision->only(self::REVISION_FIELDS), $this->getFillable()));
        $this->save();

        if ($revision->tag_ids !== null) {
            $this->tags()->sync($revision->tag_ids);
        }

        $this->snapshot($userId);

        // The tag pivot sync fires no model events
        FrontCache::flush();
    }

    /**
     * @return array<string, mixed>
     */
    protected function revisionState(): array
    {
        return [
            ...$this->only(self::REVISION_FIELDS),
            'tag_ids' => $this->tags()->pluck('cms_taxonomy_terms.id')->sort()->values()->all(),
        ];
    }

    /**
     * @param  array<string, mixed>  $state
     */
    protected function sameState(CmsRevision $revision, array $state): bool
    {
        foreach (['title', 'content', 'excerpt', 'status'] as $field) {
            if ((string) $revision->{$field} !== (string) $state[$field]) {
                return false;
            }
        }

        return $revision->metadata == $state['metadata']
            && $revision->published_at?->timestamp === $state['published_at']?->timestamp
            && collect($revision->tag_ids ?? [])->sort()->values()->all() === $state['tag_ids'];
    }
}
