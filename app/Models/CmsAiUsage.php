<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

/**
 * One AI call: who asked, what for, which model answered and what it cost.
 */
class CmsAiUsage extends Model
{
    protected $table = 'cms_ai_usage';

    protected $fillable = ['user_id', 'provider', 'model', 'action', 'module', 'item_id', 'input_tokens', 'output_tokens', 'cost'];

    protected $casts = [
        'input_tokens' => 'integer',
        'output_tokens' => 'integer',
        'cost' => 'float',
    ];

    public function user()
    {
        return $this->belongsTo(User::class, 'user_id');
    }
}
