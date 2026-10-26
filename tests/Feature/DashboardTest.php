<?php

use App\Models\CmsArticle;
use App\Models\CmsForm;
use App\Models\CmsLang;
use App\Models\CmsRegister;
use App\Models\CmsSchema;
use App\Models\CmsSchemaGroup;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Inertia\Testing\AssertableInertia as Assert;

uses(RefreshDatabase::class);

function dashboardPage(array $attributes): CmsArticle
{
    $group = CmsSchemaGroup::firstOrCreate(['name' => 'Default'], ['layout' => 'layout', 'default' => 1, 'active' => 1]);
    $schema = CmsSchema::firstOrCreate(['name' => 'Page'], ['group_id' => $group->id, 'active' => 1, 'fields' => [], 'front_view' => 'front/templates/page']);
    $lang = CmsLang::firstOrCreate(['iso' => 'es'], ['name' => 'Español', 'active' => 1]);

    return CmsArticle::create([
        'schema_id' => $schema->id,
        'lang_id' => $lang->id,
        'slug' => str($attributes['title'])->slug()->toString(),
        'active' => 1,
        'status' => 'published',
        ...$attributes,
    ]);
}

test('guests are redirected to the login page', function (): void {
    $this->get('/admin')->assertRedirect('/login');
});

test('the dashboard shows what needs attention', function (): void {
    $this->actingAs(User::factory()->superAdmin()->create());

    dashboardPage(['title' => 'Inicio', 'metadata' => ['seo_description' => 'Bienvenidos']]);
    dashboardPage(['title' => 'Servicios']);
    dashboardPage(['title' => 'Borrador', 'status' => 'draft']);
    dashboardPage(['title' => 'Lanzamiento', 'published_at' => now()->addDays(3)]);

    $form = CmsForm::create(['name' => 'Contacto', 'alias' => 'contacto', 'active' => true]);
    CmsRegister::create(['form_id' => $form->id, 'name' => 'Ana', 'email' => 'ana@example.com', 'message' => 'Quiero una cotización']);
    CmsRegister::create(['form_id' => $form->id, 'name' => 'Luis', 'review' => true]);

    $this->get('/admin')->assertOk()->assertInertia(fn (Assert $page): Assert => $page
        ->component('admin')
        ->where('kpis.messages.unread', 1)
        ->where('kpis.messages.this_week', 2)
        ->where('kpis.published.total', 2)
        ->where('kpis.pipeline.drafts', 1)
        ->where('kpis.pipeline.scheduled', 1)
        ->where('kpis.pipeline.next.title', 'Lanzamiento')
        ->where('kpis.seo.missing', 1)
        ->where('kpis.seo.items.0.title', 'Servicios')
        ->has('inbox', 1)
        ->where('inbox.0.name', 'Ana')
        ->where('inbox.0.form', 'Contacto')
        ->has('recentContent', 4)
        ->has('trend', 6)
        ->has('storage.size'));
});

test('the dashboard leaves out the sections a profile cannot open', function (): void {
    $user = User::factory()->create();
    grantPermissions($user, ['articles' => 'listar']);

    $this->actingAs($user)->get('/admin')->assertOk()->assertInertia(fn (Assert $page): Assert => $page
        ->where('can.articles', true)
        ->where('can.registers', false)
        ->where('kpis.messages', null)
        ->has('kpis.published')
        ->where('inbox', [])
        ->where('recentLogs', [])
        ->where('storage', null)
        ->where('trend.0.messages', null));
});
