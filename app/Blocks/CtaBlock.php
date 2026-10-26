<?php

namespace App\Blocks;

class CtaBlock extends BlockType
{
    public function key(): string
    {
        return 'cta';
    }

    public function name(): string
    {
        return 'Llamada a la acción';
    }

    public function icon(): string
    {
        return 'megaphone';
    }

    public function category(): string
    {
        return 'layout';
    }

    public function description(): string
    {
        return 'Un recuadro destacado con título, texto y un botón.';
    }

    public function fields(): array
    {
        return [
            ['key' => 'title', 'label' => 'Título', 'type' => 'text', 'max' => 160],
            ['key' => 'text', 'label' => 'Texto', 'type' => 'textarea', 'max' => 600],
            ['key' => 'button_label', 'label' => 'Botón: texto', 'type' => 'text', 'max' => 60],
            ['key' => 'button_url', 'label' => 'Botón: enlace', 'type' => 'url'],
            ['key' => 'style', 'label' => 'Estilo', 'type' => 'select', 'default' => 'accent', 'options' => [
                ['value' => 'accent', 'label' => 'Color de la marca'],
                ['value' => 'soft', 'label' => 'Suave'],
                ['value' => 'dark', 'label' => 'Oscuro'],
            ]],
        ];
    }

    public function toHtml(array $data): string
    {
        return (($data['title'] ?? '') !== '' ? '<h2>'.e($data['title']).'</h2>' : '')
            .(($data['text'] ?? '') !== '' ? '<p>'.e($data['text']).'</p>' : '')
            .self::link($data, 'button_label', 'button_url');
    }
}
