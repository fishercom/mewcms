<?php

namespace App\Blocks;

class StatsBlock extends BlockType
{
    public function key(): string
    {
        return 'stats';
    }

    public function name(): string
    {
        return 'Estadísticas';
    }

    public function icon(): string
    {
        return 'chart-bar';
    }

    public function category(): string
    {
        return 'layout';
    }

    public function description(): string
    {
        return 'Cifras destacadas, por ejemplo "+120 clientes".';
    }

    public function fields(): array
    {
        return [
            ['key' => 'items', 'label' => 'Cifras', 'type' => 'repeater', 'max_items' => 8, 'fields' => [
                ['key' => 'prefix', 'label' => 'Antes (p. ej. +, $)', 'type' => 'text', 'max' => 8],
                ['key' => 'value', 'label' => 'Número', 'type' => 'text', 'max' => 20],
                ['key' => 'suffix', 'label' => 'Después (p. ej. %, k)', 'type' => 'text', 'max' => 8],
                ['key' => 'label', 'label' => 'Descripción', 'type' => 'text', 'max' => 80],
            ]],
            ['key' => 'style', 'label' => 'Estilo', 'type' => 'select', 'default' => 'plain', 'options' => [
                ['value' => 'plain', 'label' => 'Sencillo'], ['value' => 'cards', 'label' => 'Tarjetas'],
            ]],
        ];
    }

    public function toHtml(array $data): string
    {
        $html = '';
        foreach ($data['items'] ?? [] as $item) {
            $html .= '<p><strong>'.e($item['prefix'].$item['value'].$item['suffix']).'</strong> '.e($item['label']).'</p>';
        }

        return $html;
    }
}
