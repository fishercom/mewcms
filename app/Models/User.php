<?php

namespace App\Models;

use App\Models\Concerns\LogsAdminActivity;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Foundation\Auth\User as Authenticatable;
use Illuminate\Notifications\Notifiable;

class User extends Authenticatable
{
    use HasFactory;
    use LogsAdminActivity;
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
        return $this->hasOne(Profile::class, 'id', 'profile_id');
    }

    public function setPasswordAttribute($value)
    {
        if (! empty($value)) {
            $info = \Hash::info($value);
            $this->attributes['password'] = ($info['algo'] === null) ? \Hash::make($value) : $value;
        }

        return $this->attributes['password'];
    }

    public function findForPassport($identifier)
    {
        return $this->where('email', $identifier)->first();
    }

    /**
     * Admin permissions granted through the user's profile, keyed by module.
     *
     * @var array<string, list<string>>|null
     */
    protected ?array $adminPermissionCache = null;

    /**
     * Whether the user may enter the admin panel at all.
     */
    public function canAccessAdmin(): bool
    {
        if ($this->active !== null && ! $this->active) {
            return false;
        }

        return (bool) $this->profile?->active;
    }

    public function isSuperAdmin(): bool
    {
        return $this->canAccessAdmin() && (bool) $this->profile->sa;
    }

    /**
     * Check a module permission, e.g. hasAdminPermission('articles', AdmAction::MANAGE).
     * The manage action implies the list action.
     */
    public function hasAdminPermission(string $module, string $action = AdmAction::LIST): bool
    {
        if (! $this->canAccessAdmin()) {
            return false;
        }

        if ($this->isSuperAdmin()) {
            return true;
        }

        $actions = $this->adminPermissions()[$module] ?? [];

        return in_array($action, $actions, true)
            || ($action === AdmAction::LIST && in_array(AdmAction::MANAGE, $actions, true));
    }

    /**
     * @return array<string, list<string>>
     */
    public function adminPermissions(): array
    {
        if ($this->adminPermissionCache !== null) {
            return $this->adminPermissionCache;
        }

        $events = AdmEvent::with(['module', 'action'])
            ->whereIn('id', AdmPermission::where('profile_id', $this->profile_id)->select('event_id'))
            ->get();

        $permissions = [];
        foreach ($events as $event) {
            $key = $event->module?->key();
            if ($key && $event->action) {
                $permissions[$key][] = $event->action->alias;
            }
        }

        return $this->adminPermissionCache = array_map(fn (array $actions): array => array_values(array_unique($actions)), $permissions);
    }

    public function adminActivityModule(): string
    {
        return 'users';
    }
}
