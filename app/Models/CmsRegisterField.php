<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class CmsRegisterField extends Model
{
    protected $table = 'cms_register_fields';

    protected $fillable = [
        'register_id',
        'field_id',
        'value',
        'txt_value',
    ];

    public function register()
    {
        return $this->belongsTo(CmsRegister::class, 'register_id');
    }

    public function field()
    {
        return $this->belongsTo(CmsFormField::class, 'field_id');
    }
}
