<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class CmsFormField extends Model
{
    protected $table = 'cms_form_fields';

    protected $fillable = [
        'form_id',
        'name',
        'alias',
        'type',
        'options',
        'active',
    ];

    protected $casts = [
        'options' => 'array',
        'active' => 'boolean',
    ];

    public function form()
    {
        return $this->belongsTo(CmsForm::class, 'form_id');
    }
}
