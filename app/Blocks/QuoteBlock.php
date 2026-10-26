<?php

namespace App\Blocks;

class QuoteBlock extends BlockType
{
    public function key(): string
    {
        return 'quote';
    }

    public function name(): string
    {
        return 'Cita';
    }

    public function icon(): string
    {
        return 'quote';
    }

    public function description(): string
    {
        return 'Un testimonio o frase destacada con su autor.';
    }

    public function fields(): array
    {
        return [
            ['key' => 'text', 'label' => 'Cita', 'type' => 'textarea', 'max' => 1500],
            ['key' => 'author', 'label' => 'Autor', 'type' => 'text', 'max' => 120],
            ['key' => 'role', 'label' => 'Cargo o empresa', 'type' => 'text', 'max' => 120],
            ['key' => 'photo', 'label' => 'Foto', 'type' => 'image'],
            ['key' => 'style', 'label' => 'Estilo', 'type' => 'select', 'default' => 'simple', 'options' => [
                ['value' => 'simple', 'label' => 'Sencillo'], ['value' => 'card', 'label' => 'Tarjeta'], ['value' => 'large', 'label' => 'Grande y centrado'],
            ]],
        ];
    }

    public function toHtml(array $data): string
    {
        if (($data['text'] ?? '') === '') {
            return '';
        }
        $cite = trim(($data['author'] ?? '').(($data['role'] ?? '') !== '' ? ', '.$data['role'] : ''), ', ');

        return '<blockquote><p>'.e($data['text']).'</p>'.($cite !== '' ? '<p>'.e($cite).'</p>' : '').'</blockquote>';
    }
}
