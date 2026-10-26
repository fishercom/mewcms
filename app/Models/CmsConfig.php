<?php

namespace App\Models;

use App\Models\Concerns\FlushesFrontCache;
use App\Models\Concerns\LogsAdminActivity;
use App\Support\ContentSanitizer;
use App\Support\SocialLinks;
use Illuminate\Database\Eloquent\Model;

class CmsConfig extends Model
{
    use FlushesFrontCache;
    use LogsAdminActivity;

    /**
     * The attributes that are mass assignable.
     *
     * @var array
     */
    protected $table = 'cms_configs';

    protected $fillable = ['type', 'name', 'alias', 'value'];

    /**
     * Layout settings printed as link targets on the public site.
     */
    public const URL_ALIASES = [
        'layout_header_logo',
        'layout_footer_logo',
        'layout_facebook',
        'layout_instagram',
        'layout_twitter',
        'layout_linkedin',
        'layout_youtube',
    ];

    protected static function booted(): void
    {
        static::saving(function (self $config): void {
            if ($config->alias === 'layout_custom_css') {
                $config->value = ContentSanitizer::css($config->value);
            } elseif ($config->alias === SocialLinks::ALIAS) {
                $config->value = json_encode(SocialLinks::decode($config->value), JSON_UNESCAPED_SLASHES | JSON_UNESCAPED_UNICODE);
            } elseif (in_array($config->alias, self::URL_ALIASES, true) && ! ContentSanitizer::isSafeUrl($config->value)) {
                $config->value = '';
            }
        });
    }

    public function adminActivityModule(): string
    {
        return 'configs';
    }
}
