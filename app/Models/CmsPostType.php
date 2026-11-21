<?php

namespace App\Models;

use App\Models\Concerns\FlushesFrontCache;
use App\Models\Concerns\LogsAdminActivity;
use Illuminate\Database\Eloquent\Builder;
use Illuminate\Database\Eloquent\Model;

class CmsPostType extends Model
{
    use FlushesFrontCache;
    use LogsAdminActivity;

    protected $table = 'cms_post_types';

    protected $fillable = [
        'name',
        'singular_name',
        'slug',
        'icon',
        'description',
        'default_schema_id',
        'per_page',
        'order',
        'active',
    ];

    /** Sort orders of the public listing */
    public const ORDERS = ['newest', 'oldest', 'title'];

    /** Most items a listing shows on one page */
    public const MAX_PER_PAGE = 100;

    protected $casts = [
        'active' => 'boolean',
        'per_page' => 'integer',
    ];

    public function default_schema()
    {
        return $this->belongsTo(CmsSchema::class, 'default_schema_id');
    }

    public function posts()
    {
        return $this->hasMany(CmsPost::class, 'post_type', 'slug');
    }

    protected static function booted()
    {
        // Each post type has its own entry in the admin sidebar, next to «Posts»
        static::created(fn (self $cpt) => $cpt->syncAdminModule());
        static::updated(fn (self $cpt) => $cpt->syncAdminModule($cpt->getOriginal('slug')));

        static::deleted(function ($cpt): void {
            $module = AdmModule::where('url', '/admin/posts?post_type='.$cpt->slug)->first();
            if ($module) {
                AdmEvent::where('module_id', $module->id)->delete();
                $module->delete();
            }

            CmsPost::where('post_type', $cpt->slug)->delete();
        });
    }

    /**
     * Create or update this type's entry in the admin sidebar (/admin/posts?post_type=…),
     * in the group of the «Posts» module, right after it.
     */
    public function syncAdminModule(?string $previousSlug = null): void
    {
        $url = fn (string $slug): string => '/admin/posts?post_type='.$slug;
        $module = AdmModule::where('url', $url($previousSlug ?? $this->slug))->first()
            ?? AdmModule::where('url', $url($this->slug))->first();

        if ($module) {
            $module->name = $this->name;
            $module->url = $url($this->slug);
            $module->icon = $this->icon ?: 'book-open';
            $module->save();

            return;
        }

        $posts = AdmModule::where('route', 'posts.index')->orWhere('url', '/admin/posts')->orderBy('id')->first();
        $menuId = $posts->menu_id ?? AdmMenu::whereIn('name', ['Contenido', 'Contenido Web'])->value('id');
        if (! $menuId) {
            return;
        }

        // Right after «Posts» (or the last one of the group), moving the ones below down
        $position = $posts ? (int) $posts->position + 1 : (int) AdmModule::where('menu_id', $menuId)->max('position') + 1;
        AdmModule::where('menu_id', $menuId)->where('position', '>=', $position)->increment('position');

        $module = new AdmModule;
        $module->menu_id = $menuId;
        $module->name = $this->name;
        $module->url = $url($this->slug);
        $module->icon = $this->icon ?: 'book-open';
        $module->position = $position;
        $module->setAttribute('visible', true);
        $module->save();

        // The list and manage actions, as every module of the installer has
        foreach (AdmAction::whereIn('alias', [AdmAction::LIST, AdmAction::MANAGE])->pluck('id') as $actionId) {
            $event = new AdmEvent;
            $event->module_id = $module->id;
            $event->action_id = $actionId;
            $event->save();
        }
    }

    public function adminActivityModule(): string
    {
        return 'post-types';
    }

    /**
     * Sort a query of this type's posts as its listing shows them.
     *
     * @param  Builder<CmsPost>  $query
     * @return Builder<CmsPost>
     */
    public function sort($query)
    {
        return match ($this->order) {
            'oldest' => $query->oldest('published_at')->orderBy('id'),
            'title' => $query->orderBy('title')->orderBy('id'),
            default => $query->latest('published_at')->orderByDesc('id'),
        };
    }
}
