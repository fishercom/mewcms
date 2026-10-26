<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

/**
 * A saved (or autosaved) state of a page or post.
 */
class CmsRevision extends Model
{
    protected $table = 'cms_revisions';

    protected $fillable = ['user_id', 'title', 'content', 'blocks', 'excerpt', 'metadata', 'status', 'published_at', 'tag_ids', 'is_autosave'];

    protected $casts = [
        'metadata' => 'array',
        'blocks' => 'array',
        'tag_ids' => 'array',
        'published_at' => 'datetime',
        'is_autosave' => 'boolean',
    ];

    public function revisionable()
    {
        return $this->morphTo();
    }

    public function user()
    {
        return $this->belongsTo(User::class, 'user_id');
    }
}
