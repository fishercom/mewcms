<?php

use App\Models\CmsSlider;
use App\Models\User;

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
