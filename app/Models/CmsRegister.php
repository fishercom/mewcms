<?php

namespace App\Models;

use App\Support\Sites;
use Illuminate\Database\Eloquent\Builder;
use Illuminate\Database\Eloquent\Model;

class CmsRegister extends Model
{
    /**
     * The attributes that are mass assignable.
     *
     * @var array
     */
    protected $table = 'cms_registers';

    protected $fillable = ['form_id', 'contact_id', 'name', 'email', 'phone', 'message', 'acceptance', 'review', 'review_date'];

    protected static function booted(): void
    {
        // Submissions belong to the site of their form
        static::addGlobalScope('site', function (Builder $query): void {
            if (Sites::currentId() !== null) {
                $query->whereHas('form');
            }
        });
    }

    public function form()
    {
        return $this->hasOne(CmsForm::class, 'id', 'form_id');
    }

    public function contact()
    {
        return $this->hasOne(CmsParameter::class, 'id', 'contact_id');
    }

    public function fields()
    {
        return $this->hasMany(CmsRegisterField::class, 'register_id');
    }
}
