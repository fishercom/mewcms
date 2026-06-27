<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Models\CmsSlider;
use App\Models\CmsSlide;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Inertia\Response;
use Illuminate\Http\JsonResponse;

class SliderController extends Controller
{
    /**
     * Display a listing of the sliders.
     */
    public function index(Request $request): Response
    {
        $s = $request->get('s');
        $items = CmsSlider::withCount('slides')
            ->where(function ($query) use ($s) {
                if (!empty($s)) {
                    $query->where('name', 'LIKE', '%' . str_replace(' ', '%', $s) . '%')
                        ->orWhere('key', 'LIKE', '%' . str_replace(' ', '%', $s) . '%');
                }
            })
            ->paginate(15);

        return Inertia::render('admin/sliders/index', [
            'items' => $items,
        ]);
    }

    /**
     * Show the form for creating a new slider.
     */
    public function create(): Response
    {
        return Inertia::render('admin/sliders/create');
    }

    /**
     * Store a newly created slider in storage.
     */
    public function store(Request $request): RedirectResponse
    {
        $request->validate([
            'name' => 'required|string|max:255',
            'key' => 'required|string|max:255|unique:cms_sliders,key',
            'description' => 'nullable|string',
            'settings' => 'array',
        ]);

        CmsSlider::create($request->all());

        return redirect()->route('sliders.index');
    }

    /**
     * Show the form for editing the specified slider.
     */
    public function edit(string $id): Response
    {
        $slider = CmsSlider::findOrFail($id);
        $slides = $slider->slides()->orderBy('position')->get();

        return Inertia::render('admin/sliders/edit', [
            'slider' => $slider,
            'slides' => $slides,
        ]);
    }

    /**
     * Update the specified slider in storage.
     */
    public function update(string $id, Request $request): RedirectResponse
    {
        $request->validate([
            'name' => 'required|string|max:255',
            'key' => 'required|string|max:255|unique:cms_sliders,key,' . $id,
            'description' => 'nullable|string',
            'settings' => 'array',
            'slides' => 'array',
            'slides.*.id' => 'nullable',
            'slides.*.title' => 'nullable|string',
            'slides.*.caption' => 'nullable|string',
            'slides.*.image_url' => 'required|string',
            'slides.*.link_url' => 'nullable|string',
            'slides.*.active' => 'boolean',
        ]);

        $slider = CmsSlider::findOrFail($id);
        $slider->update($request->only(['name', 'key', 'description', 'settings']));

        // Sync slides
        $slidesData = $request->input('slides', []);
        $updatedSlideIds = [];

        foreach ($slidesData as $index => $slideData) {
            if (!empty($slideData['id']) && is_numeric($slideData['id'])) {
                // Update existing
                $slide = CmsSlide::findOrFail($slideData['id']);
                $slide->update([
                    'title' => $slideData['title'] ?? null,
                    'caption' => $slideData['caption'] ?? null,
                    'image_url' => $slideData['image_url'],
                    'link_url' => $slideData['link_url'] ?? null,
                    'active' => (bool) ($slideData['active'] ?? true),
                    'position' => $index,
                ]);
                $updatedSlideIds[] = $slide->id;
            } else {
                // Create new
                $slide = new CmsSlide([
                    'slider_id' => $slider->id,
                    'title' => $slideData['title'] ?? null,
                    'caption' => $slideData['caption'] ?? null,
                    'image_url' => $slideData['image_url'],
                    'link_url' => $slideData['link_url'] ?? null,
                    'active' => (bool) ($slideData['active'] ?? true),
                    'position' => $index,
                ]);
                $slide->save();
                $updatedSlideIds[] = $slide->id;
            }
        }

        // Delete slides that were not included in the updated list
        $slider->slides()->whereNotIn('id', $updatedSlideIds)->delete();

        return redirect()->route('sliders.index');
    }

    /**
     * Remove the specified slider from storage.
     */
    public function destroy(string $id): RedirectResponse
    {
        $slider = CmsSlider::findOrFail($id);
        $slider->delete();

        return redirect()->route('sliders.index');
    }

    /**
     * Return a JSON list of sliders for custom fields dropdown.
     */
    public function apiList(): JsonResponse
    {
        $sliders = CmsSlider::select('id', 'name', 'key')->orderBy('name')->get();
        return response()->json($sliders);
    }
}
