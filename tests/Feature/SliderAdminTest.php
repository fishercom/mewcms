<?php

use App\Models\CmsSlider;
use App\Models\User;
use Inertia\Testing\AssertableInertia as Assert;

it('saves whether a slide asks for dark text', function (): void {
    $slider = CmsSlider::create(['name' => 'Banners', 'key' => 'banners']);

    $this->actingAs(User::factory()->superAdmin()->create())
        ->put(route('sliders.update', $slider->id), [
            'name' => 'Banners',
            'key' => 'banners',
            'slides' => [
                ['id' => null, 'title' => 'Sal', 'image_url' => '/storage/media/sal.jpg', 'dark_text' => true, 'active' => true],
                ['id' => null, 'title' => 'Mar', 'image_url' => '/storage/media/mar.jpg', 'active' => true],
            ],
        ])
        ->assertSessionHasNoErrors();

    expect($slider->slides()->orderBy('position')->pluck('dark_text')->all())->toBe([true, false]);
});

it('lists the sliders by name', function (): void {
    CmsSlider::create(['name' => 'Sostenibilidad: nuestro aporte', 'key' => 'aporte']);
    CmsSlider::create(['name' => 'Banners del inicio', 'key' => 'zz-banners']);

    $this->actingAs(User::factory()->superAdmin()->create())
        ->get(route('sliders.index'))
        ->assertOk()
        ->assertInertia(fn (Assert $page) => $page->where('items.data.0.name', 'Banners del inicio')->where('items.data.1.name', 'Sostenibilidad: nuestro aporte'));
});
