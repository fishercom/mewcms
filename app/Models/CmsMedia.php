<?php

namespace App\Models;

use App\Models\Concerns\LogsAdminActivity;
use App\Support\MediaLibrary;
use Illuminate\Database\Eloquent\Builder;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\SoftDeletes;
use Illuminate\Support\Facades\Storage;

/**
 * A file in the media library. Images carry WebP versions at the sizes in
 * MediaLibrary::PRESETS, listed in "variants" as {width: path}.
 *
 * @property array<string, string>|null $variants
 */
class CmsMedia extends Model
{
    use LogsAdminActivity;
    use SoftDeletes;

    protected $table = 'cms_media';

    protected $fillable = ['disk', 'path', 'filename', 'mime', 'size', 'width', 'height', 'alt', 'caption', 'title', 'variants', 'uploaded_by'];

    protected $appends = ['url', 'thumb_url', 'type'];

    protected function casts(): array
    {
        return [
            'variants' => 'array',
            'size' => 'integer',
            'width' => 'integer',
            'height' => 'integer',
        ];
    }

    public function adminActivityModule(): string
    {
        return 'media';
    }

    public function uploader(): BelongsTo
    {
        return $this->belongsTo(User::class, 'uploaded_by');
    }

    public function getUrlAttribute(): string
    {
        return Storage::disk($this->disk)->url($this->path);
    }

    /** The smallest version, for grids and pickers */
    public function getThumbUrlAttribute(): ?string
    {
        if (! $this->isImage()) {
            return null;
        }
        $variants = $this->variants ?? [];
        ksort($variants);
        $smallest = reset($variants);

        return $smallest ? Storage::disk($this->disk)->url($smallest) : $this->url;
    }

    public function getTypeAttribute(): string
    {
        return MediaLibrary::typeOf($this->mime);
    }

    public function isImage(): bool
    {
        return $this->type === 'image';
    }

    /** "url 300w, url 768w, …" over the WebP versions plus the original */
    public function srcset(): ?string
    {
        if (! $this->isImage() || empty($this->variants)) {
            return null;
        }
        $variants = $this->variants;
        ksort($variants);
        $parts = [];
        foreach ($variants as $width => $path) {
            $parts[] = Storage::disk($this->disk)->url($path).' '.$width.'w';
        }
        if ($this->width && ! isset($variants[$this->width])) {
            $parts[] = $this->url.' '.$this->width.'w';
        }

        return implode(', ', $parts);
    }

    /**
     * @param  Builder<CmsMedia>  $query
     */
    public function scopeOfType(Builder $query, string $type): void
    {
        match ($type) {
            'image' => $query->where('mime', 'like', 'image/%'),
            'video' => $query->where('mime', 'like', 'video/%'),
            'audio' => $query->where('mime', 'like', 'audio/%'),
            'document' => $query->where(fn ($q) => $q->whereIn('mime', MediaLibrary::DOCUMENT_MIMES)->orWhere('mime', 'like', 'text/%')),
            default => null,
        };
    }
}
