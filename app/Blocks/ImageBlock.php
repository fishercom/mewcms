<?php

namespace App\Blocks;

class ImageBlock extends BlockType
{
    public function key(): string
    {
        return 'image';
    }

    public function name(): string
    {
        return 'Imagen';
    }

    public function icon(): string
    {
        return 'image';
    }

    public function category(): string
    {
        return 'media';
    }

    public function description(): string
    {
        return 'Una imagen de la biblioteca con leyenda y enlace opcional.';
    }

    public function fields(): array
    {
        return [
            ['key' => 'src', 'label' => 'Imagen', 'type' => 'image'],
            ['key' => 'alt', 'label' => 'Texto alternativo', 'type' => 'text', 'placeholder' => 'Vacío: se usa el de la biblioteca'],
            ['key' => 'caption', 'label' => 'Leyenda', 'type' => 'textarea', 'max' => 500],
            ['key' => 'size', 'label' => 'Ancho', 'type' => 'select', 'default' => 'content', 'options' => [
                ['value' => 'content', 'label' => 'Como el texto'],
                ['value' => 'wide', 'label' => 'Ancho'],
                ['value' => 'full', 'label' => 'Toda la página'],
            ]],
            ['key' => 'link', 'label' => 'Enlace (opcional)', 'type' => 'url'],
        ];
    }

    public function toHtml(array $data): string
    {
        if (($data['src'] ?? '') === '') {
            return '';
        }

        return '<figure><img src="'.e($data['src']).'" alt="'.e($data['alt'] ?? '').'">'
            .(($data['caption'] ?? '') !== '' ? '<figcaption>'.e($data['caption']).'</figcaption>' : '')
            .'</figure>';
    }
}
