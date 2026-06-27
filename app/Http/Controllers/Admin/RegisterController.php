<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Models\CmsForm;
use App\Models\CmsRegister;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Inertia\Response;

class RegisterController extends Controller
{
    /**
     * List all received form submissions.
     */
    public function index(Request $request): Response
    {
        $s = $request->get('s');
        $formId = $request->get('form_id');
        $reviewed = $request->get('reviewed');

        $items = CmsRegister::with(['form', 'fields.field'])
            ->where(function ($query) use ($s) {
                if (! empty($s)) {
                    $query->where('name', 'LIKE', '%'.str_replace(' ', '%', $s).'%')
                        ->orWhere('email', 'LIKE', '%'.str_replace(' ', '%', $s).'%');
                }
            })
            ->when($formId, fn ($q) => $q->where('form_id', $formId))
            ->when($reviewed !== null && $reviewed !== '', fn ($q) => $q->where('review', (bool) $reviewed))
            ->orderByDesc('id')
            ->paginate(20);

        $forms = CmsForm::orderBy('name')->get(['id', 'name']);

        return Inertia::render('admin/registers/index', [
            'items' => $items,
            'forms' => $forms,
        ]);
    }

    /**
     * Show a single register in detail (read-only view).
     */
    public function show($id): Response
    {
        $item = CmsRegister::with(['form', 'fields.field'])->findOrFail($id);

        // Mark as reviewed automatically when opened
        if (! $item->review) {
            $item->review = true;
            $item->review_date = now();
            $item->save();
        }

        return Inertia::render('admin/registers/show', [
            'item' => $item,
        ]);
    }

    /**
     * Toggle the reviewed status of a register.
     */
    public function update($id, Request $request): RedirectResponse
    {
        $item = CmsRegister::findOrFail($id);
        $item->review = ! $item->review;
        $item->review_date = $item->review ? now() : null;
        $item->save();

        return back();
    }

    /**
     * Delete a register submission.
     */
    public function destroy($id, Request $request): RedirectResponse
    {
        $item = CmsRegister::findOrFail($id);
        $item->delete();

        return redirect()->route('registers.index');
    }

    // -----------------------------------------------------------------------
    // Stub out unused resource methods (no create/edit UI needed for registers)
    // -----------------------------------------------------------------------

    public function create(): Response
    {
        return Inertia::render('admin/registers/index');
    }

    public function store(Request $request): RedirectResponse
    {
        return redirect()->route('registers.index');
    }

    public function edit($id): Response
    {
        return $this->show($id);
    }
}
