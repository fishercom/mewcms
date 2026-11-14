<?php

use App\Models\CmsPostType;
use App\Models\User;

beforeEach(function (): void {
    $this->seed();
    $this->admin = User::where('username', 'admincms')->first();
});

it('saves how the listing of a post type is paged and sorted', function (): void {
    $this->actingAs($this->admin)->post('/admin/post-types', [
        'name' => 'Productos', 'singular_name' => 'Producto', 'slug' => 'productos', 'active' => true,
        'per_page' => 0, 'order' => 'title',
    ])->assertRedirect();

    $type = CmsPostType::where('slug', 'productos')->first();
    expect($type->per_page)->toBe(0)->and($type->order)->toBe('title');

    // Without them, the listing keeps its usual six newest posts per page
    $this->actingAs($this->admin)->put("/admin/post-types/{$type->id}", [
        'name' => 'Productos', 'singular_name' => 'Producto', 'slug' => 'productos', 'active' => true,
    ])->assertRedirect();
    expect($type->fresh()->per_page)->toBe(6)->and($type->fresh()->order)->toBe('newest');

    $this->actingAs($this->admin)->put("/admin/post-types/{$type->id}", [
        'name' => 'Productos', 'singular_name' => 'Producto', 'slug' => 'productos', 'per_page' => 500, 'order' => 'random',
    ])->assertSessionHasErrors(['per_page', 'order']);
});

it('lists the blog and the active post types for the post list field', function (): void {
    CmsPostType::create(['name' => 'Productos', 'singular_name' => 'Producto', 'slug' => 'productos', 'active' => true]);
    CmsPostType::create(['name' => 'Viejo', 'singular_name' => 'Viejo', 'slug' => 'viejo', 'active' => false]);

    $this->actingAs($this->admin)->getJson('/admin/api/post-types')->assertOk()
        ->assertJsonCount(2)
        ->assertJsonPath('0.slug', 'post')
        ->assertJsonPath('1.slug', 'productos');
});
