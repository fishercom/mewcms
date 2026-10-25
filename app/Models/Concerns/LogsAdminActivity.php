<?php

namespace App\Models\Concerns;

use App\Models\AdmAction;
use App\Support\AdminActivity;
use Illuminate\Support\Str;

/**
 * Adds create, update and delete entries to the admin audit log.
 */
trait LogsAdminActivity
{
    /**
     * Permission key of the admin module that manages this model, e.g. "articles".
     */
    abstract public function adminActivityModule(): string;

    public static function bootLogsAdminActivity(): void
    {
        static::created(fn (self $model) => $model->logAdminActivity('Creado'));
        static::updated(function (self $model): void {
            // Session bookkeeping such as remember tokens is not an admin change
            if (array_diff(array_keys($model->getChanges()), ['updated_at', 'remember_token']) !== []) {
                $model->logAdminActivity('Actualizado');
            }
        });
        static::deleted(fn (self $model) => $model->logAdminActivity('Eliminado'));
    }

    protected function logAdminActivity(string $verb): void
    {
        $label = $this->getAttribute('title') ?? $this->getAttribute('name') ?? $this->getAttribute('alias');
        $subject = '#'.$this->getKey().($label ? ' '.Str::limit((string) $label, 120) : '');

        AdminActivity::record($this->adminActivityModule(), AdmAction::MANAGE, $verb, $subject);
    }
}
