<?php

namespace App\Models;

use App\Models\Concerns\LogsAdminActivity;
use Illuminate\Database\Eloquent\Model;

class CmsNotify extends Model
{
    use LogsAdminActivity;

    /**
     * The attributes that are mass assignable.
     *
     * @var array
     */
    protected $table = 'cms_notifies';

    protected $fillable = ['form_id', 'user_id', 'recipients', 'active'];

    public function user()
    {
        return $this->hasOne(User::class, 'id', 'user_id');
    }

    public function adminActivityModule(): string
    {
        return 'notifies';
    }
}
