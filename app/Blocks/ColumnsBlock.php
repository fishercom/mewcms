<?php

namespace App\Blocks;

/**
 * Two to four columns, each holding its own list of blocks (one level deep: no columns
 * inside columns). Stored as data.columns = [{blocks: [...]}, ...].
 */
class ColumnsBlock extends BlockType
{
    /** Column widths per layout, as fractions of 12 */
    public const LAYOUTS = [
        '50-50' => [6, 6],
        '33-67' => [4, 8],
        '67-33' => [8, 4],
        '33-33-33' => [4, 4, 4],
        '25-50-25' => [3, 6, 3],
        '25-25-25-25' => [3, 3, 3, 3],
    ];

    public function key(): string
    {
        return 'columns';
    }

    public function name(): string
    {
        return 'Columnas';
    }

    public function icon(): string
    {
        return 'columns-3';
    }

    public function category(): string
    {
        return 'layout';
    }

    public function description(): string
    {
        return 'Dos a cuatro columnas, cada una con sus propios bloques.';
    }

    public function nestable(): bool
    {
        return false;
    }

    public function fields(): array
    {
        return [
            ['key' => 'layout', 'label' => 'Distribución', 'type' => 'select', 'default' => '50-50', 'options' => [
                ['value' => '50-50', 'label' => 'Dos iguales'],
                ['value' => '33-67', 'label' => 'Estrecha + ancha'],
                ['value' => '67-33', 'label' => 'Ancha + estrecha'],
                ['value' => '33-33-33', 'label' => 'Tres iguales'],
                ['value' => '25-50-25', 'label' => 'Tres, la central ancha'],
                ['value' => '25-25-25-25', 'label' => 'Cuatro iguales'],
            ]],
            ['key' => 'gap', 'label' => 'Separación', 'type' => 'select', 'default' => 'md', 'options' => [
                ['value' => 'sm', 'label' => 'Pequeña'], ['value' => 'md', 'label' => 'Media'], ['value' => 'lg', 'label' => 'Grande'],
            ]],
            ['key' => 'align', 'label' => 'Alineación vertical', 'type' => 'select', 'default' => 'start', 'options' => [
                ['value' => 'start', 'label' => 'Arriba'], ['value' => 'center', 'label' => 'Centro'],
            ]],
        ];
    }

    public function sanitize(array $data): array
    {
        $clean = parent::sanitize($data);
        $count = count(self::LAYOUTS[$clean['layout']]);
        $columns = is_array($data['columns'] ?? null) ? array_values($data['columns']) : [];

        $clean['columns'] = [];
        for ($i = 0; $i < $count; $i++) {
            $clean['columns'][] = ['blocks' => BlockRegistry::sanitize($columns[$i]['blocks'] ?? [], 1)];
        }

        return $clean;
    }

    public function resolve(array $data): array
    {
        $data['columns'] = array_map(fn (array $column): array => ['blocks' => BlockRegistry::resolve($column['blocks'] ?? [])], $data['columns'] ?? []);

        return $data;
    }

    public function toHtml(array $data): string
    {
        $html = '';
        foreach ($data['columns'] ?? [] as $column) {
            $html .= BlockRegistry::toHtml($column['blocks'] ?? []);
        }

        return $html;
    }
}
