<?php

use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;

uses(RefreshDatabase::class);

test('registration is disabled by default', function (): void {
    $this->get('/register')->assertNotFound();

    $this->post('/register', [
        'name' => 'Test User',
        'email' => 'test@example.com',
        'password' => 'password',
        'password_confirmation' => 'password',
    ])->assertNotFound();

    $this->assertGuest();
    expect(User::count())->toBe(0);
});

test('registration screen can be rendered when enabled', function (): void {
    config(['cms.registration' => true]);

    $this->get('/register')->assertStatus(200);
});

test('registered users get no admin access', function (): void {
    config(['cms.registration' => true]);

    $response = $this->post('/register', [
        'name' => 'Test User',
        'email' => 'test@example.com',
        'password' => 'password',
        'password_confirmation' => 'password',
        'profile_id' => 1,
    ]);

    $this->assertAuthenticated();
    $response->assertRedirect(route('home', absolute: false));

    expect(User::first()->profile_id)->toBeNull();

    $this->get('/admin')->assertForbidden();
    $this->get('/admin/articles')->assertForbidden();
    $this->get('/laravel-filemanager/jsonitems?type=Images&working_dir=/')->assertForbidden();
});
