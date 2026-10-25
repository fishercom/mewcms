<?php

namespace App\Models;

use App\Models\Concerns\LogsAdminActivity;
use Illuminate\Database\Eloquent\Model;

class CmsTranslate extends Model
{
    use LogsAdminActivity;

    protected $table = 'cms_translates';

    protected $fillable = ['alias', 'input_type', 'metadata'];

    protected $casts = [
        'metadata' => 'array',
    ];

    public function adminActivityModule(): string
    {
        return 'translates';
    }
}
