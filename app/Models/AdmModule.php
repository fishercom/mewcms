<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class AdmModule extends Model
{
    /**
     * The attributes that are mass assignable.
     *
     * @var array
     */
    protected $table = 'adm_modules';

    protected $fillable = ['name', 'title', 'description', 'url', 'route', 'icon', 'visible'];

    public function events()
    {
        return $this->hasMany(AdmEvent::class, 'module_id', 'id');
    }

    /**
     * Permission key of this module, e.g. "articles" for the "articles.index" route.
     * Modules without a route (custom post types) fall back to their admin URL.
     */
    public function key(): ?string
    {
        if (! empty($this->route)) {
            return self::keyFromRouteName($this->route);
        }

        $path = trim((string) parse_url((string) $this->url, PHP_URL_PATH), '/');
        $segments = explode('/', $path);

        return ($segments[0] ?? null) === 'admin' ? ($segments[1] ?? 'admin') : null;
    }

    /**
     * Resolve the permission key for a route name, e.g. "tags.update" => "tags".
     */
    public static function keyFromRouteName(?string $routeName): ?string
    {
        if (empty($routeName)) {
            return null;
        }

        return explode('.', $routeName)[0];
    }
}
