<?php

namespace App\Blocks;

use App\Models\CmsSlider;

class SliderBlock extends BlockType
{
    public function key(): string
    {
        return 'slider';
    }

    public function name(): string
    {
        return 'Slider';
    }

    public function icon(): string
    {
        return 'gallery-horizontal';
    }

    public function category(): string
    {
        return 'media';
    }

    public function description(): string
    {
        return 'Uno de los sliders creados en el módulo Sliders.';
    }

    public function fields(): array
    {
        return [['key' => 'key', 'label' => 'Slider', 'type' => 'slider']];
    }

    /** The slider and its active slides, loaded on the server for the renderer */
    public function resolve(array $data): array
    {
        $slider = ($data['key'] ?? '') !== '' ? CmsSlider::getSlider($data['key']) : null;

        return ['slider' => $slider?->toArray()] + $data;
    }
}
