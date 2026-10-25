<?php

use App\Models\CmsArticle;
use App\Models\CmsConfig;
use App\Models\CmsForm;
use App\Models\CmsFormField;
use App\Models\CmsLang;
use App\Models\CmsMenu;
use App\Models\CmsRegister;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;

uses(RefreshDatabase::class);

beforeEach(function (): void {
    $this->admin = User::factory()->superAdmin()->create();
    $this->lang = CmsLang::create(['name' => 'Español', 'iso' => 'es', 'active' => true]);
});

test('article HTML is sanitized on save while keeping shortcodes and formatting', function (): void {
    $this->actingAs($this->admin)->post('/admin/articles', [
        'lang_id' => $this->lang->id,
        'title' => 'Contact',
        'content' => '<h2 class="lead">Hi</h2><p onclick="steal()">Text [form alias="contacto"]</p><script>alert(1)</script>'
            .'<img src="/storage/a.png" onerror="alert(1)"><a href="javascript:alert(1)">bad</a><a href="/about">ok</a>',
        'metadata' => [
            'intro' => '<p>Intro<script>alert(1)</script></p>',
            'cta_button_url' => 'javascript:alert(1)',
            'stat' => '< 100ms',
            'items' => [['body' => '<img src=x onerror=alert(1)>']],
        ],
        'active' => true,
    ])->assertRedirect();

    $article = CmsArticle::where('title', 'Contact')->firstOrFail();

    expect($article->content)
        ->toContain('<h2 class="lead">Hi</h2>')
        ->toContain('[form alias="contacto"]')
        ->toContain('<a href="/about">ok</a>')
        ->not->toContain('<script')
        ->not->toContain('onclick')
        ->not->toContain('onerror')
        ->not->toContain('javascript:');

    expect($article->metadata['intro'])->toBe('<p>Intro</p>')
        ->and($article->metadata['cta_button_url'])->toBe('')
        ->and($article->metadata['stat'])->toBe('< 100ms')
        ->and($article->metadata['items'][0]['body'])->not->toContain('onerror');
});

test('menu items reject script URLs', function (): void {
    $menu = CmsMenu::create(['name' => 'Header', 'active' => true]);

    $this->actingAs($this->admin)->post("/admin/menus/{$menu->id}/items", [
        'title' => 'Evil',
        'url' => 'javascript:alert(document.cookie)',
        'target' => '_self',
        'active' => true,
    ])->assertSessionHasErrors('url');

    $this->actingAs($this->admin)->post("/admin/menus/{$menu->id}/items", [
        'title' => 'About',
        'url' => '/about',
        'target' => '_self',
        'active' => true,
    ])->assertSessionHasNoErrors();
});

test('layout settings reject script URLs and cannot close the custom CSS style tag', function (): void {
    CmsConfig::create(['type' => 'text', 'name' => 'Custom CSS', 'alias' => 'layout_custom_css', 'value' => '']);
    CmsConfig::create(['type' => 'string', 'name' => 'Facebook', 'alias' => 'layout_facebook', 'value' => '']);

    $this->actingAs($this->admin)->post('/admin/layout', [
        'layout_facebook' => 'javascript:alert(1)',
    ])->assertSessionHasErrors('layout_facebook');

    $this->actingAs($this->admin)->post('/admin/layout', [
        'layout_custom_css' => 'body{color:red}</style><script>alert(1)</script>',
        'layout_facebook' => 'https://facebook.com/mewcms',
    ])->assertSessionHasNoErrors();

    expect(CmsConfig::where('alias', 'layout_custom_css')->value('value'))->not->toContain('<')
        ->and(CmsConfig::where('alias', 'layout_facebook')->value('value'))->toBe('https://facebook.com/mewcms');
});

describe('public form submissions', function (): void {
    beforeEach(function (): void {
        $this->form = CmsForm::create(['name' => 'Contacto', 'alias' => 'contacto', 'active' => true]);
        CmsFormField::create(['form_id' => $this->form->id, 'name' => 'Nombre', 'alias' => 'nombre', 'type' => 'text', 'active' => true]);
        CmsFormField::create(['form_id' => $this->form->id, 'name' => 'Correo', 'alias' => 'correo', 'type' => 'email', 'active' => true]);
    });

    test('valid submissions are stored', function (): void {
        $this->postJson('/api/forms/submit', [
            'form_alias' => 'contacto',
            'nombre' => 'Ana',
            'correo' => 'ana@example.com',
        ])->assertOk()->assertJson(['success' => true]);

        expect(CmsRegister::where('email', 'ana@example.com')->exists())->toBeTrue();
    });

    test('a filled honeypot is accepted silently but not stored', function (): void {
        $this->postJson('/api/forms/submit', [
            'form_alias' => 'contacto',
            'nombre' => 'Bot',
            'correo' => 'bot@example.com',
            '_hp' => 'https://spam.example',
        ])->assertOk()->assertJson(['success' => true]);

        expect(CmsRegister::count())->toBe(0);
    });

    test('oversized values are rejected', function (): void {
        $this->postJson('/api/forms/submit', [
            'form_alias' => 'contacto',
            'nombre' => str_repeat('a', 5001),
            'correo' => 'ana@example.com',
        ])->assertStatus(422)->assertJsonValidationErrors('nombre');
    });

    test('submissions are rate limited per visitor', function (): void {
        $payload = ['form_alias' => 'contacto', 'nombre' => 'Ana', 'correo' => 'ana@example.com'];

        foreach (range(1, 5) as $attempt) {
            $this->postJson('/api/forms/submit', $payload)->assertOk();
        }

        $this->postJson('/api/forms/submit', $payload)->assertStatus(429);
        expect(CmsRegister::count())->toBe(5);
    });
});
