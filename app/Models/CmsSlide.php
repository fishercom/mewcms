<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Rutorika\Sortable\SortableTrait;

class CmsSlide extends Model
{
    use SortableTrait;

    protected $table = 'cms_slides';

    protected $fillable = [
        'slider_id',
        'title',
        'caption',
        'image_url',
        'link_url',
        'position',
        'active',
    ];

    protected static $sortableField = 'position';

    protected static $sortableGroupField = 'slider_id';

    protected $casts = [
        'active' => 'boolean',
        'position' => 'integer',
    ];

    public function slider()
    {
        return $this->belongsTo(CmsSlider::class, 'slider_id');
    }
}
