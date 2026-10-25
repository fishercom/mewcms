<?php

namespace App\Models;

use App\Models\Concerns\LogsAdminActivity;
use Illuminate\Database\Eloquent\Model;

class CmsSite extends Model
{
    use LogsAdminActivity;

    protected $table = 'cms_sites';

    protected $fillable = ['name', 'segment', 'site_url', 'schema_group_id', 'metadata', 'default', 'active'];

    protected $casts = [
        'metadata' => 'array',
    ];

    public function adminActivityModule(): string
    {
        return 'sites';
    }
}
