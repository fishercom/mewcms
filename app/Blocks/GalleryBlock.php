<?php

namespace App\Blocks;

class GalleryBlock extends BlockType
{
    public function key(): string
    {
        return 'gallery';
    }

    public function name(): string
    {
        return 'Galería';
    }

    public function icon(): string
    {
        return 'images';
    }

    public function category(): string
    {
        return 'media';
    }

    public function description(): string
    {
        return 'Varias imágenes en cuadrícula; al pulsarlas se abren en grande.';
    }

    public function fields(): array
    {
        return [
            ['key' => 'images', 'label' => 'Imágenes', 'type' => 'repeater', 'max_items' => 60, 'fields' => [
                ['key' => 'src', 'label' => 'Imagen', 'type' => 'image'],
                ['key' => 'alt', 'label' => 'Texto alternativo', 'type' => 'text', 'placeholder' => 'Vacío: se usa el de la biblioteca'],
                ['key' => 'caption', 'label' => 'Leyenda', 'type' => 'text', 'max' => 200],
            ]],
            ['key' => 'columns', 'label' => 'Columnas', 'type' => 'select', 'default' => '3', 'options' => [
                ['value' => '2', 'label' => '2'], ['value' => '3', 'label' => '3'], ['value' => '4', 'label' => '4'],
                ['value' => '5', 'label' => '5'], ['value' => '6', 'label' => '6'],
            ]],
            ['key' => 'gap', 'label' => 'Separación', 'type' => 'select', 'default' => 'md', 'options' => [
                ['value' => 'none', 'label' => 'Sin separación'], ['value' => 'sm', 'label' => 'Pequeña'],
                ['value' => 'md', 'label' => 'Media'], ['value' => 'lg', 'label' => 'Grande'],
            ]],
            ['key' => 'crop', 'label' => 'Recorte', 'type' => 'select', 'default' => 'square', 'options' => [
                ['value' => 'square', 'label' => 'Cuadrado'], ['value' => 'landscape', 'label' => 'Horizontal (4:3)'], ['value' => 'none', 'label' => 'Sin recortar'],
            ]],
        ];
    }

    public function sanitize(array $data): array
    {
        $clean = parent::sanitize($data);
        $clean['images'] = array_values(array_filter($clean['images'], fn (array $image): bool => $image['src'] !== ''));

        return $clean;
    }

    public function toHtml(array $data): string
    {
        $html = '';
        foreach ($data['images'] ?? [] as $image) {
            $html .= '<img src="'.e($image['src']).'" alt="'.e($image['alt'] ?: $image['caption']).'">';
        }

        return $html;
    }
}
