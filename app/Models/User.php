<?php

namespace App\Models;

use Illuminate\Foundation\Auth\User as Authenticatable;
use Illuminate\Notifications\Notifiable;
use Illuminate\Database\Eloquent\Factories\HasFactory;

class User extends Authenticatable
{
    use HasFactory;
    use Notifiable;

    /**
     * The attributes that are mass assignable.
     *
     * @var array
     */
    protected $fillable = [
        'username', 'email', 'password', 'name', 'lastname', 'profile_id', 'metadata', 'active',
    ];

    /**
     * The attributes that should be cast to native types.
     *
     * @var array
     */
    protected $casts = [
        'metadata' => 'array',
        'password' => 'hashed',
        'email_verified_at' => 'datetime',
    ];

    /**
     * The attributes that should be hidden for arrays.
     *
     * @var array
     */
    protected $hidden = [
        'password', 'remember_token',
    ];

    public function profile()
    {
        return $this->hasOne('App\Models\Profile', 'id', 'profile_id');
    }

    public function setPasswordAttribute($value)
    {
        if (!empty($value)) {
            $info = \Hash::info($value);
            $this->attributes['password'] = ($info['algo'] === null) ? \Hash::make($value) : $value;
        }

        return $this->attributes['password'];
    }

    public function findForPassport($identifier) {
        return $this->where('email', $identifier)->first();
    }

}
