<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class CmsPostType extends Model
{
    protected $table = 'cms_post_types';

    protected $fillable = [
        'name',
        'singular_name',
        'slug',
        'icon',
        'description',
        'default_schema_id',
        'active',
    ];

    protected $casts = [
        'active' => 'boolean',
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
        static::created(function ($cpt) {
            $webMenu = AdmMenu::where('name', 'Contenido Web')->first();
            if ($webMenu) {
                $nextPos = AdmModule::where('menu_id', $webMenu->id)->max('position') + 1;

                $module = new AdmModule();
                $module->menu_id = $webMenu->id;
                $module->name = $cpt->name;
                $module->url = '/admin/posts?post_type=' . $cpt->slug;
                $module->icon = $cpt->icon ?: 'book-open';
                $module->position = $nextPos;
                $module->visible = true;
                $module->save();

                foreach ([1, 2] as $actionId) {
                    $event = new AdmEvent();
                    $event->module_id = $module->id;
                    $event->action_id = $actionId;
                    $event->save();
                }
            }
        });

        static::updated(function ($cpt) {
            $module = AdmModule::where('url', '/admin/posts?post_type=' . $cpt->getOriginal('slug'))->first();
            if ($module) {
                $module->name = $cpt->name;
                $module->url = '/admin/posts?post_type=' . $cpt->slug;
                $module->icon = $cpt->icon ?: 'book-open';
                $module->save();
            }
        });

        static::deleted(function ($cpt) {
            $module = AdmModule::where('url', '/admin/posts?post_type=' . $cpt->slug)->first();
            if ($module) {
                AdmEvent::where('module_id', $module->id)->delete();
                $module->delete();
            }

            CmsPost::where('post_type', $cpt->slug)->delete();
        });
    }
}
