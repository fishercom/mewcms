<?php

namespace App\Models;

use App\Models\Concerns\BelongsToSite;
use App\Models\Concerns\LogsAdminActivity;
use Illuminate\Database\Eloquent\Model;

class CmsForm extends Model
{
    use BelongsToSite;
    use LogsAdminActivity;

    /**
     * The attributes that are mass assignable.
     *
     * @var array
     */
    protected $table = 'cms_forms';

    protected $fillable = ['name', 'alias', 'info', 'color', 'active'];

    public function fields()
    {
        return $this->hasMany(CmsFormField::class, 'form_id')->orderBy('id');
    }

    public function adminActivityModule(): string
    {
        return 'forms';
    }
}
