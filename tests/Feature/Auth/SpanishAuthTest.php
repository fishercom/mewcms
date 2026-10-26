<?php

use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;

uses(RefreshDatabase::class);

it('serves the auth pages in Spanish', function (string $path, string $component, string $title): void {
    $this->get($path)->assertOk()->assertSee('lang="es"', false)->assertInertia(fn ($page) => $page->component($component));

    $source = file_get_contents(resource_path("js/pages/{$component}.tsx"));
    expect($source)->toContain($title)
        ->not->toMatch('/>\s*(Log in|Password|Email address|Remember me|Forgot password\?|Sign up|Reset password|Confirm password)\s*</');
})->with([
    'login' => ['/login', 'auth/login', 'Inicia sesión'],
    'forgot password' => ['/forgot-password', 'auth/forgot-password', '¿Olvidaste tu contraseña?'],
    'reset password' => ['/reset-password/token', 'auth/reset-password', 'Restablecer contraseña'],
]);

it('shows Spanish text on the signed-in auth pages', function (string $path, string $component, string $title): void {
    $user = User::factory()->unverified()->create();

    $this->actingAs($user)->get($path)->assertOk()->assertInertia(fn ($page) => $page->component($component));
    expect(file_get_contents(resource_path("js/pages/{$component}.tsx")))->toContain($title);
})->with([
    'verify email' => ['/verify-email', 'auth/verify-email', 'Verifica tu correo'],
    'confirm password' => ['/confirm-password', 'auth/confirm-password', 'Confirma tu contraseña'],
]);

it('returns login and validation errors in Spanish', function (): void {
    $user = User::factory()->create();

    $this->post('/login', ['email' => $user->email, 'password' => 'incorrecta'])
        ->assertSessionHasErrors(['email' => 'El correo o la contraseña no son correctos.']);

    $this->post('/login', ['email' => '', 'password' => ''])
        ->assertSessionHasErrors(['email' => 'El campo correo electrónico es obligatorio.']);

    $this->post('/forgot-password', ['email' => $user->email])
        ->assertSessionHas('status', 'Si la cuenta existe, recibirás un enlace para restablecer la contraseña.');
});

it('serves the registration page in Spanish when sign-ups are open', function (): void {
    config(['cms.registration' => true]);

    $this->get('/register')->assertOk()->assertSee('lang="es"', false)->assertInertia(fn ($page) => $page->component('auth/register'));
    expect(file_get_contents(resource_path('js/pages/auth/register.tsx')))->toContain('Crea una cuenta');

    $this->post('/register', ['name' => '', 'email' => 'no-es-correo', 'password' => 'a', 'password_confirmation' => 'b'])
        ->assertSessionHasErrors(['name' => 'El campo nombre es obligatorio.']);
});
