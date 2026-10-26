<?php

namespace App\Blocks;

class HeroBlock extends BlockType
{
    public function key(): string
    {
        return 'hero';
    }

    public function name(): string
    {
        return 'Portada';
    }

    public function icon(): string
    {
        return 'panel-top';
    }

    public function category(): string
    {
        return 'layout';
    }

    public function description(): string
    {
        return 'Título grande con subtítulo, imagen de fondo y botones.';
    }

    public function fields(): array
    {
        return [
            ['key' => 'eyebrow', 'label' => 'Antetítulo', 'type' => 'text', 'max' => 80],
            ['key' => 'title', 'label' => 'Título', 'type' => 'text', 'max' => 160],
            ['key' => 'subtitle', 'label' => 'Subtítulo', 'type' => 'textarea', 'max' => 500],
            ['key' => 'image', 'label' => 'Imagen de fondo', 'type' => 'image'],
            ['key' => 'overlay', 'label' => 'Oscurecer la imagen (%)', 'type' => 'number', 'min' => 0, 'max' => 90, 'default' => 45],
            ['key' => 'align', 'label' => 'Alineación', 'type' => 'select', 'default' => 'left', 'options' => [
                ['value' => 'left', 'label' => 'Izquierda'],
                ['value' => 'center', 'label' => 'Centro'],
            ]],
            ['key' => 'height', 'label' => 'Alto', 'type' => 'select', 'default' => 'md', 'options' => [
                ['value' => 'sm', 'label' => 'Bajo'],
                ['value' => 'md', 'label' => 'Medio'],
                ['value' => 'lg', 'label' => 'Alto'],
            ]],
            ['key' => 'button_label', 'label' => 'Botón principal: texto', 'type' => 'text', 'max' => 60],
            ['key' => 'button_url', 'label' => 'Botón principal: enlace', 'type' => 'url'],
            ['key' => 'secondary_label', 'label' => 'Botón secundario: texto', 'type' => 'text', 'max' => 60],
            ['key' => 'secondary_url', 'label' => 'Botón secundario: enlace', 'type' => 'url'],
        ];
    }

    public function toHtml(array $data): string
    {
        return (($data['title'] ?? '') !== '' ? '<h2>'.e($data['title']).'</h2>' : '')
            .(($data['subtitle'] ?? '') !== '' ? '<p>'.e($data['subtitle']).'</p>' : '')
            .self::link($data, 'button_label', 'button_url')
            .self::link($data, 'secondary_label', 'secondary_url');
    }
}
