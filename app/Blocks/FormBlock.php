<?php

namespace App\Blocks;

use App\Models\CmsForm;
use Illuminate\Support\Facades\Schema;

class FormBlock extends BlockType
{
    public function key(): string
    {
        return 'form';
    }

    public function name(): string
    {
        return 'Formulario';
    }

    public function icon(): string
    {
        return 'clipboard-list';
    }

    public function description(): string
    {
        return 'Un formulario creado en Formularios (contacto, inscripción…).';
    }

    public function fields(): array
    {
        $forms = Schema::hasTable('cms_forms')
            ? CmsForm::where('active', true)->orderBy('name')->get(['alias', 'name'])->map(fn (CmsForm $form): array => ['value' => $form->alias, 'label' => $form->name])->all()
            : [];

        return [
            ['key' => 'alias', 'label' => 'Formulario', 'type' => 'select', 'options' => $forms],
            ['key' => 'title', 'label' => 'Título encima (opcional)', 'type' => 'text', 'max' => 160],
        ];
    }

    public function toHtml(array $data): string
    {
        return ($data['title'] ?? '') !== '' ? '<h2>'.e($data['title']).'</h2>' : '';
    }
}
