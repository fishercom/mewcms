<?php

use App\Models\CmsTag;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Inertia\Testing\AssertableInertia as Assert;

uses(RefreshDatabase::class);

// The admin PaginationNav drops the first and last links (Laravel's previous/next) by
// position, because their labels change with the locale
it('puts the Spanish previous and next links first and last in admin lists', function (): void {
    foreach (range(1, 31) as $i) {
        CmsTag::create(['name' => "Etiqueta {$i}", 'active' => true]);
    }

    $this->actingAs(User::factory()->superAdmin()->create())
        ->get('/admin/tags?page=2')
        ->assertInertia(fn (Assert $page): Assert => $page
            ->where('items.links.0.label', '&laquo; Anterior')
            ->where('items.links.3.label', 'Siguiente &raquo;')
            ->has('items.links', 4)
            ->where('items.links.1.label', '1')
            ->where('items.links.2.active', true));
});
