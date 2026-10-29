<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Models\CmsSite;
use App\Support\FrontCache;
use App\Support\ThemeInstaller;
use App\Support\Themes;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\File;
use Inertia\Inertia;
use Inertia\Response;
use Symfony\Component\HttpFoundation\BinaryFileResponse;

/**
 * Admin → Sites → Themes: the installed themes, and the ones uploaded as a .zip.
 * Built themes (resources/themes) come with the code and are only listed here.
 */
class ThemeController extends Controller
{
    public function index(): Response
    {
        $sites = CmsSite::query()->get(['id', 'name', 'theme'])->groupBy('theme');

        return Inertia::render('admin/sites/themes', [
            'themes' => array_values(array_map(fn (array $theme): array => [
                ...$theme,
                'sites' => $sites->get($theme['slug'], collect())->pluck('name')->values()->all(),
            ], Themes::all())),
            'limits' => ['max_mb' => ThemeInstaller::MAX_SIZE / 1024 / 1024, 'extensions' => ThemeInstaller::EXTENSIONS],
        ]);
    }

    /**
     * Install a theme from a .zip, or update it when one with the same slug is installed.
     */
    public function store(Request $request, ThemeInstaller $installer): RedirectResponse
    {
        $request->validate([
            'file' => 'required|file|mimes:zip|max:'.(ThemeInstaller::MAX_SIZE / 1024),
        ], [
            'file.mimes' => __('Sube el tema como un archivo .zip.'),
        ]);

        $file = $request->file('file');
        $theme = $installer->install($file->getRealPath(), $file->getClientOriginalName());

        return redirect()->route('themes.index')->with('success', $theme['previous'] !== null
            ? __('Tema :name actualizado.', ['name' => $theme['name']])
            : __('Tema :name instalado.', ['name' => $theme['name']]));
    }

    /**
     * An uploaded theme as a .zip, to keep a copy or move it to another install.
     */
    public function download(string $theme, ThemeInstaller $installer): BinaryFileResponse
    {
        abort_unless(Themes::exists($theme) && Themes::all()[$theme]['uploaded'], 404);

        $zipFile = tempnam(sys_get_temp_dir(), 'theme');
        $installer->export($theme, $zipFile);
        $version = Themes::all()[$theme]['version'];

        return response()->download($zipFile, $theme.($version !== '' ? '-'.$version : '').'.zip', ['Content-Type' => 'application/zip'])
            ->deleteFileAfterSend();
    }

    public function destroy(string $theme): RedirectResponse
    {
        abort_unless(Themes::exists($theme), 404);
        if (! Themes::all()[$theme]['uploaded']) {
            return back()->withErrors(['error' => __('Este tema forma parte del código y no se puede eliminar desde aquí.')]);
        }
        if (CmsSite::where('theme', $theme)->exists()) {
            return back()->withErrors(['error' => __('Hay sitios que usan este tema. Cámbiales el tema antes de eliminarlo.')]);
        }

        File::deleteDirectory(Themes::uploadPath($theme));
        Themes::flush();
        FrontCache::flush();

        return redirect()->route('themes.index');
    }
}
