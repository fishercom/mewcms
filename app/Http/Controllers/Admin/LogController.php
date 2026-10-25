<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Models\AdmLog;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Inertia\Response;

class LogController extends Controller
{
    /**
     * List audit log entries (read-only).
     */
    public function index(Request $request): Response
    {
        $s = $request->get('s');

        $items = AdmLog::with('user:id,name')
            ->when(! empty($s), function ($query) use ($s): void {
                $query->where('comment', 'LIKE', '%'.str_replace(' ', '%', $s).'%');
            })
            ->latest('id')
            ->paginate(15)
            ->withQueryString();

        return Inertia::render('admin/logs/index', [
            'items' => $items,
        ]);
    }
}
