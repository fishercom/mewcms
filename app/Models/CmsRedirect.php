<?php

namespace App\Models;

use App\Models\Concerns\BelongsToSite;
use App\Models\Concerns\LogsAdminActivity;
use Illuminate\Database\Eloquent\Model;

/**
 * A public path that answers with a redirect, created by hand or when a page moves.
 * Paths are stored with a leading slash and no trailing one ("/nosotros/historia").
 */
class CmsRedirect extends Model
{
    use BelongsToSite;
    use LogsAdminActivity;

    protected $table = 'cms_redirects';

    protected $fillable = ['from_path', 'to_path', 'status_code'];

    protected $casts = [
        'status_code' => 'integer',
        'hits' => 'integer',
        'last_hit_at' => 'datetime',
    ];

    public static function normalizePath(string $path): string
    {
        $path = trim($path);

        // Full URLs stay as they are (redirects to other sites)
        if (preg_match('#^https?://#i', $path)) {
            return $path;
        }

        return '/'.trim((string) parse_url($path, PHP_URL_PATH), '/');
    }

    /**
     * Point an old path to a new one, keeping the redirect table tidy: earlier redirects
     * to the old path now go straight to the new one (no chains), and a redirect from the
     * new path is dropped because a live page answers there.
     */
    public static function record(string $from, string $to): void
    {
        $from = self::normalizePath($from);
        $to = self::normalizePath($to);
        if ($from === $to) {
            return;
        }

        self::where('from_path', $to)->delete();
        self::where('to_path', $from)->update(['to_path' => $to, 'updated_at' => now()]);
        self::updateOrCreate(['from_path' => $from], ['to_path' => $to, 'status_code' => 301]);

        // Moving a page back and forth must never leave a loop
        self::whereColumn('from_path', 'to_path')->delete();
    }

    /**
     * The redirect for a request path, counting the hit.
     */
    public static function match(string $path): ?self
    {
        $redirect = self::where('from_path', self::normalizePath($path))->first();
        if ($redirect) {
            // A plain query: counting a hit is not an admin change to log
            self::whereKey($redirect->id)->toBase()->increment('hits', 1, ['last_hit_at' => now()]);
        }

        return $redirect;
    }

    public function adminActivityModule(): string
    {
        return 'redirects';
    }
}
