<?php

use App\Models\Profile;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;

uses(RefreshDatabase::class);

beforeEach(function () {
    $this->profile = Profile::create([
        'name' => 'Super Admin',
        'sa' => 1,
        'active' => 1,
    ]);

    $this->user = User::create([
        'username' => 'testadmin',
        'name' => 'Test Admin',
        'email' => 'admin@test.com',
        'password' => bcrypt('password'),
        'profile_id' => $this->profile->id,
        'active' => 1,
    ]);
});

afterEach(function () {
    $filePath = resource_path('js/pages/front/templates/test-page-template.tsx');
    if (file_exists($filePath)) {
        unlink($filePath);
    }
});

it('prevents guests from accessing templates management', function () {
    $response = $this->get('/admin/templates');
    $response->assertRedirect('/login');
});

it('allows authenticated admin users to list templates', function () {
    $response = $this->actingAs($this->user)->get('/admin/templates');
    $response->assertStatus(200);
    $response->assertInertia(fn ($page) => $page
        ->component('admin/templates/index')
        ->has('items')
    );
});

it('allows authenticated admin users to create, update, and delete a custom template', function () {
    $filePath = resource_path('js/pages/front/templates/test-page-template.tsx');
    if (file_exists($filePath)) {
        unlink($filePath);
    }

    // 1. Create template
    $response = $this->actingAs($this->user)->post('/admin/templates', [
        'name' => 'Test Page Template',
        'filename' => 'test-page-template',
        'content' => 'import React from "react";',
    ]);

    $response->assertRedirect('/admin/templates');
    $this->assertTrue(file_exists($filePath));

    // Verify it contains the Template Name directive comment
    $content = file_get_contents($filePath);
    $this->assertStringContainsString('Template Name: Test Page Template', $content);

    // 2. Update template name and content
    $responseUpdate = $this->actingAs($this->user)->put('/admin/templates/test-page-template', [
        'name' => 'Updated Test Page Template',
        'content' => 'import React from "react"; // updated comment',
    ]);

    $responseUpdate->assertRedirect('/admin/templates');
    $updatedContent = file_get_contents($filePath);
    $this->assertStringContainsString('Template Name: Updated Test Page Template', $updatedContent);
    $this->assertStringContainsString('updated comment', $updatedContent);

    // 3. Delete custom template
    $responseDelete = $this->actingAs($this->user)->delete('/admin/templates/test-page-template');
    $responseDelete->assertRedirect('/admin/templates');
    $this->assertFalse(file_exists($filePath));
});

it('prevents deletion of core system templates', function () {
    $response = $this->actingAs($this->user)->delete('/admin/templates/home');
    $response->assertSessionHasErrors(['error']);
});
