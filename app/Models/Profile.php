<?php

namespace App\Models;

use App\Models\Concerns\LogsAdminActivity;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class Profile extends Model
{
    use HasFactory;
    use LogsAdminActivity;

    protected $table = 'profiles';

    protected $fillable = ['name', 'active', 'sa'];

    protected $casts = [
        'active' => 'boolean',
        'sa' => 'boolean',
    ];

    public function permissions()
    {
        return $this->hasMany(AdmPermission::class, 'profile_id');
    }

    public function adminActivityModule(): string
    {
        return 'profiles';
    }
}
