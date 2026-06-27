<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class CmsSlider extends Model
{
    protected $table = 'cms_sliders';

    protected $fillable = ['name', 'key', 'description', 'settings'];

    protected $casts = [
        'settings' => 'array',
    ];

    public function slides()
    {
        return $this->hasMany(CmsSlide::class, 'slider_id');
    }

    /**
     * Helper method to retrieve a slider with active slides.
     */
    public static function getSlider($key)
    {
        return self::where('key', $key)
            ->with(['slides' => function ($query) {
                $query->where('active', true)->orderBy('position');
            }])
            ->first();
    }
}
