<?php

namespace App\Blocks;

class RichTextBlock extends BlockType
{
    public function key(): string
    {
        return 'rich_text';
    }

    public function name(): string
    {
        return 'Texto';
    }

    public function icon(): string
    {
        return 'pilcrow';
    }

    public function description(): string
    {
        return 'Párrafos, títulos, listas, enlaces e imágenes con el editor de texto.';
    }

    public function fields(): array
    {
        return [['key' => 'html', 'label' => 'Contenido', 'type' => 'html_editor']];
    }

    public function toHtml(array $data): string
    {
        return (string) ($data['html'] ?? '');
    }
}
