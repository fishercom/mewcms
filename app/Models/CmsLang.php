<?php

namespace App\Models;

use App\Models\Concerns\LogsAdminActivity;
use Illuminate\Database\Eloquent\Model;

class CmsLang extends Model
{
    use LogsAdminActivity;

    /**
     * The attributes that are mass assignable.
     *
     * @var array
     */
    protected $table = 'cms_langs';

    protected $fillable = ['name', 'iso', 'active'];

    public function adminActivityModule(): string
    {
        return 'langs';
    }
}
