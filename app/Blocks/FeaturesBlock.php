<?php

namespace App\Blocks;

class FeaturesBlock extends BlockType
{
    /** Icons the picker offers; keep in sync with resources/js/blocks/icons.ts */
    public const ICONS = [
        'sparkles', 'zap', 'rocket', 'shield-check', 'lock', 'globe', 'layers', 'layout-grid', 'palette', 'pen-tool',
        'code', 'terminal', 'database', 'server', 'cloud', 'cpu', 'smartphone', 'monitor', 'search', 'chart-bar',
        'trending-up', 'target', 'users', 'user-check', 'heart', 'star', 'award', 'thumbs-up', 'message-circle', 'mail',
        'phone', 'map-pin', 'clock', 'calendar', 'check-circle', 'settings', 'wrench', 'lightbulb', 'book-open', 'graduation-cap',
        'shopping-cart', 'credit-card', 'truck', 'package', 'leaf', 'camera', 'image', 'video', 'music', 'gift',
    ];

    public function key(): string
    {
        return 'features';
    }

    public function name(): string
    {
        return 'Características';
    }

    public function icon(): string
    {
        return 'layout-grid';
    }

    public function category(): string
    {
        return 'layout';
    }

    public function description(): string
    {
        return 'Una cuadrícula de ventajas o servicios con ícono, título y texto.';
    }

    public function fields(): array
    {
        return [
            ['key' => 'title', 'label' => 'Título de la sección', 'type' => 'text', 'max' => 160],
            ['key' => 'intro', 'label' => 'Introducción', 'type' => 'textarea', 'max' => 500],
            ['key' => 'items', 'label' => 'Elementos', 'type' => 'repeater', 'max_items' => 24, 'fields' => [
                ['key' => 'icon', 'label' => 'Ícono', 'type' => 'icon', 'default' => 'sparkles'],
                ['key' => 'title', 'label' => 'Título', 'type' => 'text', 'max' => 120],
                ['key' => 'text', 'label' => 'Texto', 'type' => 'textarea', 'max' => 500],
            ]],
            ['key' => 'columns', 'label' => 'Columnas', 'type' => 'select', 'default' => '3', 'options' => [
                ['value' => '2', 'label' => '2'], ['value' => '3', 'label' => '3'], ['value' => '4', 'label' => '4'],
            ]],
        ];
    }

    public function toHtml(array $data): string
    {
        $html = ($data['title'] ?? '') !== '' ? '<h2>'.e($data['title']).'</h2>' : '';
        $html .= ($data['intro'] ?? '') !== '' ? '<p>'.e($data['intro']).'</p>' : '';
        foreach ($data['items'] ?? [] as $item) {
            $html .= '<h3>'.e($item['title']).'</h3><p>'.e($item['text']).'</p>';
        }

        return $html;
    }
}
