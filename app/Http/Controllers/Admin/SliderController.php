<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Models\CmsSlide;
use App\Models\CmsSlider;
use App\Rules\SafeUrl;
use App\Support\Sites;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Inertia\Response;

class SliderController extends Controller
{
    /**
     * Display a listing of the sliders.
     */
    public function index(Request $request): Response
    {
        $s = $request->get('s');
        $items = CmsSlider::withCount('slides')
            ->where(function ($query) use ($s): void {
                if (! empty($s)) {
                    $query->where('name', 'LIKE', '%'.str_replace(' ', '%', $s).'%')
                        ->orWhere('key', 'LIKE', '%'.str_replace(' ', '%', $s).'%');
                }
            })
            // By name, as the block editor's slider picker lists them
            ->orderBy('name')
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
            'key' => ['required', 'string', 'max:255', Sites::unique('cms_sliders', 'key')],
            'description' => 'nullable|string',
            'settings' => 'array',
        ]);

        CmsSlider::create($request->only(['name', 'key', 'description', 'settings']));

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
            'key' => ['required', 'string', 'max:255', Sites::unique('cms_sliders', 'key', $id)],
            'description' => 'nullable|string',
            'settings' => 'array',
            'slides' => 'array',
            'slides.*.id' => 'nullable',
            'slides.*.title' => 'nullable|string',
            'slides.*.caption' => 'nullable|string',
            'slides.*.image_url' => 'required_without:slides.*.video_url|nullable|string',
            'slides.*.image_mobile_url' => 'nullable|string|max:255',
            'slides.*.video_url' => 'nullable|string|max:255',
            'slides.*.secondary_image_url' => 'nullable|string|max:255',
            'slides.*.link_url' => ['nullable', 'string', new SafeUrl],
            'slides.*.button_label' => 'nullable|string|max:255',
            'slides.*.dark_text' => 'boolean',
            'slides.*.active' => 'boolean',
        ]);

        $slider = CmsSlider::findOrFail($id);
        $slider->update($request->only(['name', 'key', 'description', 'settings']));

        // Sync slides
        $slidesData = $request->input('slides', []);
        $updatedSlideIds = [];

        foreach ($slidesData as $index => $slideData) {
            if (! empty($slideData['id']) && is_numeric($slideData['id'])) {
                // Update existing
                $slide = $slider->slides()->findOrFail($slideData['id']);
                $slide->update([
                    'title' => $slideData['title'] ?? null,
                    'caption' => $slideData['caption'] ?? null,
                    ...$this->slideMedia($slideData),
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
                    ...$this->slideMedia($slideData),
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
     * The pictures, video, button and text tone of a slide as the form sent them. A video slide
     * needs no image, and the column takes an empty string then.
     *
     * @param  array<string, mixed>  $slideData
     * @return array<string, string|bool|null>
     */
    private function slideMedia(array $slideData): array
    {
        return [
            'image_url' => (string) ($slideData['image_url'] ?? ''),
            'image_mobile_url' => ($slideData['image_mobile_url'] ?? null) ?: null,
            'video_url' => ($slideData['video_url'] ?? null) ?: null,
            'secondary_image_url' => ($slideData['secondary_image_url'] ?? null) ?: null,
            'link_url' => $slideData['link_url'] ?? null,
            'button_label' => ($slideData['button_label'] ?? null) ?: null,
            'dark_text' => (bool) ($slideData['dark_text'] ?? false),
        ];
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
