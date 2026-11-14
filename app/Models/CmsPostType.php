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
        static::created(function ($cpt): void {
            $webMenu = AdmMenu::where('name', 'Contenido Web')->first();
            if ($webMenu) {
                $nextPos = AdmModule::where('menu_id', $webMenu->id)->max('position') + 1;

                $module = new AdmModule;
                $module->menu_id = $webMenu->id;
                $module->name = $cpt->name;
                $module->url = '/admin/posts?post_type='.$cpt->slug;
                $module->icon = $cpt->icon ?: 'book-open';
                $module->position = $nextPos;
                $module->setAttribute('visible', true);
                $module->save();

                foreach ([1, 2] as $actionId) {
                    $event = new AdmEvent;
                    $event->module_id = $module->id;
                    $event->action_id = $actionId;
                    $event->save();
                }
            }
        });

        static::updated(function ($cpt): void {
            $module = AdmModule::where('url', '/admin/posts?post_type='.$cpt->getOriginal('slug'))->first();
            if ($module) {
                $module->name = $cpt->name;
                $module->url = '/admin/posts?post_type='.$cpt->slug;
                $module->icon = $cpt->icon ?: 'book-open';
                $module->save();
            }
        });

        static::deleted(function ($cpt): void {
            $module = AdmModule::where('url', '/admin/posts?post_type='.$cpt->slug)->first();
            if ($module) {
                AdmEvent::where('module_id', $module->id)->delete();
                $module->delete();
            }

            CmsPost::where('post_type', $cpt->slug)->delete();
        });
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
