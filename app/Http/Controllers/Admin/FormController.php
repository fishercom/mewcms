<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Models\CmsForm;
use App\Models\CmsFormField;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Inertia\Response;

class FormController extends Controller
{
    public function index(Request $request): Response
    {
        $s = $request->get('s');

        $items = CmsForm::withCount('fields')
            ->where(function ($query) use ($s) {
                if (! empty($s)) {
                    $query->where('name', 'LIKE', '%'.str_replace(' ', '%', $s).'%')
                        ->orWhere('alias', 'LIKE', '%'.str_replace(' ', '%', $s).'%');
                }
            })
            ->paginate(15);

        return Inertia::render('admin/forms/index', [
            'items' => $items,
        ]);
    }

    public function create(): Response
    {
        return Inertia::render('admin/forms/create');
    }

    public function store(Request $request): RedirectResponse
    {
        $data = $request->validate([
            'name' => 'required|string|max:255',
            'alias' => 'required|string|max:255|unique:cms_forms,alias',
            'info' => 'nullable|string',
            'color' => 'nullable|string|max:7',
            'active' => 'boolean',
            'fields' => 'nullable|array',
            'fields.*.name' => 'required|string|max:255',
            'fields.*.alias' => 'required|string|max:255',
            'fields.*.type' => 'required|string|max:15',
            'fields.*.options' => 'nullable',
            'fields.*.active' => 'boolean',
        ]);

        $form = CmsForm::create([
            'name' => $data['name'],
            'alias' => $data['alias'],
            'info' => $data['info'] ?? null,
            'color' => $data['color'] ?? null,
            'active' => $data['active'] ?? true,
        ]);

        if (! empty($data['fields'])) {
            foreach ($data['fields'] as $fieldData) {
                $form->fields()->create($fieldData);
            }
        }

        return redirect()->route('forms.index')->with('success', 'Formulario creado con éxito.');
    }

    public function edit(int $id): Response
    {
        $item = CmsForm::with('fields')->findOrFail($id);

        return Inertia::render('admin/forms/edit', [
            'item' => $item,
        ]);
    }

    public function update(int $id, Request $request): RedirectResponse
    {
        $form = CmsForm::findOrFail($id);

        $data = $request->validate([
            'name' => 'required|string|max:255',
            'alias' => 'required|string|max:255|unique:cms_forms,alias,'.$id,
            'info' => 'nullable|string',
            'color' => 'nullable|string|max:7',
            'active' => 'boolean',
            'fields' => 'nullable|array',
            'fields.*.id' => 'nullable|integer',
            'fields.*.name' => 'required|string|max:255',
            'fields.*.alias' => 'required|string|max:255',
            'fields.*.type' => 'required|string|max:15',
            'fields.*.options' => 'nullable',
            'fields.*.active' => 'boolean',
        ]);

        $form->update([
            'name' => $data['name'],
            'alias' => $data['alias'],
            'info' => $data['info'] ?? null,
            'color' => $data['color'] ?? null,
            'active' => $data['active'] ?? true,
        ]);

        // Sync fields
        $keepIds = [];
        if (! empty($data['fields'])) {
            foreach ($data['fields'] as $fieldData) {
                if (! empty($fieldData['id'])) {
                    $field = CmsFormField::findOrFail($fieldData['id']);
                    $field->update($fieldData);
                    $keepIds[] = $field->id;
                } else {
                    $field = $form->fields()->create($fieldData);
                    $keepIds[] = $field->id;
                }
            }
        }

        // Delete removed fields
        $form->fields()->whereNotIn('id', $keepIds)->delete();

        return redirect()->route('forms.index')->with('success', 'Formulario actualizado.');
    }

    public function destroy(int $id): RedirectResponse
    {
        $form = CmsForm::findOrFail($id);
        $form->delete();

        return redirect()->route('forms.index')->with('success', 'Formulario eliminado.');
    }
}
