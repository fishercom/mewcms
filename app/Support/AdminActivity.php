<?php

namespace App\Support;

use App\Models\AdmEvent;
use App\Models\AdmLog;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Str;

/**
 * Writes admin audit log entries (adm_logs) for a module and action.
 */
class AdminActivity
{
    /**
     * Record an entry such as "Actualizado en Páginas: #12 About us". Entries are only
     * written for a signed-in user and an existing module/action event; failures are
     * reported but never interrupt the change being logged.
     */
    public static function record(string $moduleKey, string $actionAlias, string $verb, string $subject = '', ?int $userId = null): void
    {
        $userId ??= Auth::id();
        if (! $userId) {
            return;
        }

        rescue(function () use ($moduleKey, $actionAlias, $verb, $subject, $userId): void {
            $event = AdmEvent::with('module')
                ->whereHas('action', fn ($query) => $query->where('alias', $actionAlias))
                ->whereHas('module', fn ($query) => $query->where(function ($query) use ($moduleKey): void {
                    $query->whereIn('route', [$moduleKey, $moduleKey.'.index'])
                        ->orWhere('url', '/admin/'.$moduleKey);
                }))
                ->first();

            if (! $event) {
                return;
            }

            $comment = $subject === '' ? $verb : $verb.' en '.$event->module->name.': '.$subject;

            AdmLog::create([
                'event_id' => $event->id,
                'user_id' => $userId,
                'comment' => Str::limit($comment, 500),
            ]);
        });
    }
}
