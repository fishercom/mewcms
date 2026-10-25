<?php

namespace App\Http\Controllers\Admin\Concerns;

use App\Models\AdmAction;
use App\Support\AdminActivity;
use App\Support\FrontCache;
use Illuminate\Database\Eloquent\Builder;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Http\Request;
use Illuminate\Support\Collection;
use Illuminate\Validation\ValidationException;

/**
 * Bulk publish, unpublish, trash, restore and permanent delete for pages and posts.
 */
trait BulkContentActions
{
    /**
     * Verb recorded in the audit log for each action.
     */
    protected const BULK_ACTIONS = [
        'publish' => 'Publicado',
        'draft' => 'Pasado a borrador',
        'trash' => 'Movido a la papelera',
        'restore' => 'Restaurado',
        'force_delete' => 'Eliminado definitivamente',
    ];

    /**
     * Validate the request and apply the action to the selected records.
     *
     * @param  class-string<Model>  $model
     * @return Collection<int, Model> the records the action was applied to
     */
    protected function applyBulkAction(Request $request, string $model, string $module): Collection
    {
        $data = $request->validate([
            'action' => 'required|string|in:'.implode(',', array_keys(self::BULK_ACTIONS)),
            'ids' => 'required|array|min:1|max:500',
            'ids.*' => 'integer',
        ]);

        $action = $data['action'];
        $inTrash = in_array($action, ['restore', 'force_delete'], true);

        /** @var Builder $query */
        $query = $inTrash ? $model::onlyTrashed() : $model::query();
        $items = $query->whereKey($data['ids'])->get();

        if ($items->isEmpty()) {
            throw ValidationException::withMessages(['ids' => 'Ninguno de los registros seleccionados está disponible.']);
        }

        $this->guardBulkAction($action, $items);

        $ids = $items->modelKeys();
        match ($action) {
            'publish' => $model::whereKey($ids)->update(['status' => 'published']),
            'draft' => $model::whereKey($ids)->update(['status' => 'draft']),
            'trash' => $model::whereKey($ids)->delete(),
            'restore' => $model::onlyTrashed()->whereKey($ids)->restore(),
            'force_delete' => $model::onlyTrashed()->whereKey($ids)->forceDelete(),
        };

        // Query-builder writes fire no model events
        FrontCache::flush();

        $subject = $items->map(fn (Model $item): string => '#'.$item->getKey().' '.$item->getAttribute('title'))->implode(', ');
        AdminActivity::record($module, AdmAction::MANAGE, self::BULK_ACTIONS[$action], $subject);

        return $items;
    }

    /**
     * Stop an action that would leave the content in an inconsistent state.
     *
     * @param  Collection<int, Model>  $items
     *
     * @throws ValidationException
     */
    protected function guardBulkAction(string $action, Collection $items): void
    {
        //
    }
}
