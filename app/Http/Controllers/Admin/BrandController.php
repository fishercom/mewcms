<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Models\AdmAction;
use App\Rules\SafeUrl;
use App\Support\AdminActivity;
use App\Support\AdminBrand;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Validation\ValidationException;
use Inertia\Inertia;
use Inertia\Response;

/**
 * Configuración > Marca: the client's name and logos for the admin panel and the login screen.
 * Part of the Configuración module, with its permissions.
 */
class BrandController extends Controller
{
    public function edit(): Response
    {
        return Inertia::render('admin/configs/brand', [
            'settings' => AdminBrand::all(),
            'upload' => ['extensions' => AdminBrand::UPLOAD_EXTENSIONS, 'max_kb' => AdminBrand::MAX_UPLOAD_KB],
        ]);
    }

    public function update(Request $request): RedirectResponse
    {
        $url = ['nullable', 'string', 'max:2048', new SafeUrl];
        $file = ['nullable', 'file', 'max:'.AdminBrand::MAX_UPLOAD_KB, 'extensions:'.implode(',', AdminBrand::UPLOAD_EXTENSIONS)];

        $data = $request->validate([
            'name' => 'nullable|string|max:120',
            'tagline' => 'nullable|string|max:60',
            'logo' => $url,
            'logo_dark' => $url,
            'icon' => $url,
            'logo_file' => $file,
            'logo_dark_file' => $file,
            'icon_file' => $file,
        ], [
            '*.extensions' => __('Sube el logo en SVG, PNG, WebP o JPG.'),
        ]);

        foreach (AdminBrand::IMAGES as $key) {
            if ($request->hasFile("{$key}_file")) {
                $stored = AdminBrand::store($request->file("{$key}_file"));
                if ($stored === null) {
                    throw ValidationException::withMessages(["{$key}_file" => __('No se pudo leer el SVG. Expórtalo de nuevo como SVG simple.')]);
                }
                $data[$key] = $stored;
            }
            unset($data["{$key}_file"]);
        }

        AdminBrand::save($data);
        AdminActivity::record('configs', AdmAction::MANAGE, 'Actualizado', 'marca del panel');

        return redirect()->route('configs.brand')->with('success', __('Marca del panel guardada.'));
    }
}
