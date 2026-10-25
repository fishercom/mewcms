<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class AdmAction extends Model
{
    /**
     * The attributes that are mass assignable.
     *
     * @var array
     */
    public const LIST = 'listar';

    public const MANAGE = 'administrar';

    public const LOGIN = 'login';

    public const LOGOUT = 'logout';

    protected $table = 'adm_actions';

    protected $fillable = ['name', 'write_log'];
}
