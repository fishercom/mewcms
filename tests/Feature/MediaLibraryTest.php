<?php

use App\Models\CmsArticle;
use App\Models\CmsLang;
use App\Models\CmsMedia;
use App\Models\CmsSchema;
use App\Models\CmsSchemaGroup;
use App\Models\User;
use App\Support\MediaLibrary;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Http\UploadedFile;
use Illuminate\Support\Facades\Storage;
use Illuminate\Testing\TestResponse;
use Inertia\Testing\AssertableInertia as Assert;

uses(RefreshDatabase::class);

beforeEach(function (): void {
    Storage::fake('public');
    $this->admin = User::factory()->superAdmin()->create();
});

function uploadMediaFile(UploadedFile $file, ?User $user = null): TestResponse
{
    return test()->actingAs($user ?? test()->admin)->postJson('/admin/media', ['file' => $file]);
}

it('stores an upload with its size and WebP versions at each preset', function (): void {
    $response = uploadMediaFile(UploadedFile::fake()->image('Foto de Equipo.jpg', 2000, 1000));

    $response->assertCreated()->assertJsonPath('type', 'image')->assertJsonPath('width', 2000);

    $media = CmsMedia::sole();
    expect($media->path)->toStartWith('media/')->toEndWith('/foto-de-equipo.jpg')
        ->and($media->title)->toBe('Foto de Equipo')
        ->and($media->uploaded_by)->toBe($this->admin->id)
        ->and(array_keys($media->variants))->toEqual([300, 768, 1536, 2000]);

    Storage::disk('public')->assertExists($media->path);
    foreach ($media->variants as $path) {
        Storage::disk('public')->assertExists($path);
        expect($path)->toEndWith('.webp');
    }
    expect($media->srcset())->toContain('-300.webp 300w')->toContain('-1536.webp 1536w');
});

it('only makes the versions that are smaller than the original', function (): void {
    uploadMediaFile(UploadedFile::fake()->image('small.png', 500, 400))->assertCreated();

    expect(array_keys(CmsMedia::sole()->variants))->toEqual([300, 500]);
});

it('rejects files that are not allowed', function (string $name, string $mime): void {
    uploadMediaFile(UploadedFile::fake()->create($name, 10, $mime))
        ->assertUnprocessable()
        ->assertJsonValidationErrors(['file' => 'no está permitido']);

    expect(CmsMedia::count())->toBe(0);
})->with([
    'svg' => ['logo.svg', 'image/svg+xml'],
    'php' => ['shell.php', 'application/x-php'],
    'html' => ['page.html', 'text/html'],
]);

it('keeps documents without image versions', function (): void {
    uploadMediaFile(UploadedFile::fake()->create('Informe anual.pdf', 120, 'application/pdf'))->assertCreated()->assertJsonPath('type', 'document');

    expect(CmsMedia::sole())->variants->toBeNull()->width->toBeNull();
});

it('edits the alt text, caption and title', function (): void {
    uploadMediaFile(UploadedFile::fake()->image('playa.jpg', 800, 600));
    $media = CmsMedia::sole();

    $this->actingAs($this->admin)
        ->put("/admin/media/{$media->id}", ['alt' => '  Atardecer en la playa ', 'caption' => 'Lima, 2026', 'title' => 'Playa'])
        ->assertRedirect();

    expect($media->fresh())->alt->toBe('Atardecer en la playa')->caption->toBe('Lima, 2026')->title->toBe('Playa');

    $this->actingAs($this->admin)->putJson("/admin/media/{$media->id}", ['alt' => str_repeat('a', 600)])->assertJsonValidationErrors('alt');
});

it('lists, searches and filters the library', function (): void {
    uploadMediaFile(UploadedFile::fake()->image('gato.jpg', 400, 400));
    uploadMediaFile(UploadedFile::fake()->create('contrato.pdf', 20, 'application/pdf'));

    $this->actingAs($this->admin)->get('/admin/media')->assertInertia(fn (Assert $page): Assert => $page
        ->component('admin/media/index')
        ->has('items.data', 2)
        ->where('trashCount', 0));

    $this->actingAs($this->admin)->get('/admin/media?type=document')->assertInertia(fn (Assert $page): Assert => $page
        ->has('items.data', 1)
        ->where('items.data.0.filename', 'contrato.pdf'));

    $this->actingAs($this->admin)->getJson('/admin/media/picker?type=image&s=gat')->assertOk()->assertJsonCount(1, 'data')->assertJsonPath('data.0.type', 'image');
});

it('moves files to the trash, restores them and deletes them for good with their versions', function (): void {
    uploadMediaFile(UploadedFile::fake()->image('borrar.jpg', 1000, 800));
    $media = CmsMedia::sole();
    $files = [$media->path, ...array_values($media->variants)];

    $this->actingAs($this->admin)->delete("/admin/media/{$media->id}")->assertRedirect();
    expect($media->fresh()->trashed())->toBeTrue();
    Storage::disk('public')->assertExists($files);

    $this->actingAs($this->admin)->post('/admin/media/bulk', ['action' => 'restore', 'ids' => [$media->id]]);
    expect($media->fresh()->trashed())->toBeFalse();

    // Only files in the trash can be deleted for good
    $this->actingAs($this->admin)->post('/admin/media/bulk', ['action' => 'force_delete', 'ids' => [$media->id]]);
    expect(CmsMedia::count())->toBe(1);

    $this->actingAs($this->admin)->post('/admin/media/bulk', ['action' => 'trash', 'ids' => [$media->id]]);
    $this->actingAs($this->admin)->post('/admin/media/bulk', ['action' => 'force_delete', 'ids' => [$media->id]]);

    expect(CmsMedia::withTrashed()->count())->toBe(0);
    Storage::disk('public')->assertMissing($files);
});

it('needs the media permissions', function (): void {
    uploadMediaFile(UploadedFile::fake()->image('a.jpg', 100, 100));
    $media = CmsMedia::sole();

    $stranger = User::factory()->create();
    grantPermissions($stranger, ['articles' => 'listar']);
    $this->actingAs($stranger)->get('/admin/media')->assertForbidden();
    $this->actingAs($stranger)->getJson('/admin/media/picker')->assertForbidden();

    $reader = User::factory()->create();
    grantPermissions($reader, ['media' => 'listar']);
    $this->actingAs($reader)->get('/admin/media')->assertOk();
    $this->actingAs($reader)->getJson('/admin/media/picker')->assertOk();
    uploadMediaFile(UploadedFile::fake()->image('b.jpg', 100, 100), $reader)->assertForbidden();
    $this->actingAs($reader)->put("/admin/media/{$media->id}", ['alt' => 'x'])->assertForbidden();
    $this->actingAs($reader)->post('/admin/media/bulk', ['action' => 'trash', 'ids' => [$media->id]])->assertForbidden();

    expect(CmsMedia::count())->toBe(1)->and($media->fresh()->alt)->toBeNull();
});

it('imports the files of the old file manager once, skipping thumbnails', function (): void {
    $disk = Storage::disk('public');
    $disk->put('photos/1/vieja.jpg', UploadedFile::fake()->image('vieja.jpg', 900, 600)->getContent());
    $disk->put('photos/1/thumbs/vieja.jpg', UploadedFile::fake()->image('vieja.jpg', 80, 80)->getContent());
    $disk->put('files/1/manual.pdf', '%PDF-1.4 test');
    $disk->put('photos/.gitignore', '*');

    $this->artisan('media:import')->expectsOutputToContain('Importados: 2')->assertSuccessful();

    expect(CmsMedia::orderBy('path')->pluck('path')->all())->toBe(['files/1/manual.pdf', 'photos/1/vieja.jpg']);
    $photo = CmsMedia::where('path', 'photos/1/vieja.jpg')->sole();
    expect($photo)->width->toBe(900)->title->toBe('vieja')
        ->and(array_keys($photo->variants))->toEqual([300, 768, 900]);

    // Running it again adds nothing
    $this->artisan('media:import')->expectsOutputToContain('Importados: 0 · Ya estaban en la biblioteca: 2')->assertSuccessful();
    expect(CmsMedia::count())->toBe(2);
});

it('adds srcset and the library alt text to public images', function (): void {
    uploadMediaFile(UploadedFile::fake()->image('portada.jpg', 1600, 900));
    $media = CmsMedia::sole();
    $media->update(['alt' => 'Equipo en la oficina']);

    $group = CmsSchemaGroup::create(['name' => 'Default', 'layout' => 'layout', 'default' => 1, 'active' => 1]);
    $lang = CmsLang::create(['name' => 'Español', 'iso' => 'es', 'active' => 1]);
    $schema = CmsSchema::create(['group_id' => $group->id, 'name' => 'Page', 'type' => 'PAGE', 'active' => 1, 'fields' => [], 'front_view' => 'front/templates/page']);
    CmsArticle::create([
        'schema_id' => $schema->id,
        'lang_id' => $lang->id,
        'title' => 'Nosotros',
        'slug' => 'nosotros',
        'active' => 1,
        'featured_image' => $media->url,
        'content' => '<p>Hola</p><img src="'.$media->url.'" alt=""><img src="https://example.com/x.jpg" alt="Externa">',
        'metadata' => ['hero' => $media->url],
    ]);

    $this->get('/nosotros')->assertOk()->assertInertia(fn (Assert $page): Assert => $page
        // URLs contain dots, so the map is checked as a whole
        ->where('media', function ($map) use ($media): bool {
            expect($map[$media->url] ?? null)->toMatchArray(['alt' => 'Equipo en la oficina', 'width' => 1600, 'height' => 900, 'srcset' => $media->srcset()]);

            return true;
        })
        ->where('article.content', function (string $html) use ($media): bool {
            expect($html)
                ->toContain('alt="Equipo en la oficina"')
                ->toContain('srcset="'.e($media->srcset()).'"')
                ->toContain('sizes="'.MediaLibrary::SIZES.'"')
                ->toContain('width="1600" height="900"')
                ->toContain('loading="lazy"')
                // Images outside the library are left alone
                ->toContain('<img src="https://example.com/x.jpg" alt="Externa" />')
                ->and(substr_count($html, 'alt='))->toBe(2);

            return true;
        }));
});

it('keeps an alt text written in the content over the library one', function (): void {
    uploadMediaFile(UploadedFile::fake()->image('a.jpg', 400, 300));
    $media = CmsMedia::sole();
    $media->update(['alt' => 'De la biblioteca']);

    $html = MediaLibrary::enrichHtml('<img src="'.$media->url.'" alt="Propio">');

    expect($html)->toContain('alt="Propio"')->not->toContain('De la biblioteca')->toContain('srcset=');
});
