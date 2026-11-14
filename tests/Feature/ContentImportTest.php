<?php

use App\Models\CmsArticle;
use App\Models\CmsForm;
use App\Models\CmsMedia;
use App\Models\CmsMenu;
use App\Models\CmsMenuItem;
use App\Models\CmsPost;
use App\Models\CmsPostType;
use App\Models\CmsSchema;
use App\Models\CmsSite;
use App\Models\CmsSlider;
use App\Models\User;
use Illuminate\Support\Facades\Http;
use Illuminate\Support\Facades\Storage;
use Inertia\Testing\AssertableInertia as Assert;

beforeEach(function (): void {
    Storage::fake('public');
    Storage::fake('local');
    $this->seed();
    $this->site = CmsSite::where('default', true)->first();

    // A content package outside the themes, with a local image
    $this->dir = sys_get_temp_dir().'/mewcms-content-'.uniqid();
    mkdir($this->dir.'/media', 0777, true);
    $image = imagecreatetruecolor(40, 30);
    imagejpeg($image, $this->dir.'/media/salinas.jpg');
});

afterEach(function (): void {
    @unlink($this->dir.'/media/salinas.jpg');
    @unlink($this->dir.'/content.json');
    @rmdir($this->dir.'/media');
    @rmdir($this->dir);
});

function writeContent(string $dir, array $data): string
{
    file_put_contents($dir.'/content.json', json_encode($data, JSON_UNESCAPED_UNICODE));

    return $dir.'/content.json';
}

it('seeds only what the admin needs, with no site content', function (): void {
    $admin = User::where('username', 'admincms')->first();

    expect($admin)->not->toBeNull()
        ->and($admin->email)->toBe('adminc@mewcms.com')
        ->and(password_verify('pwdMewCMS+77', $admin->password))->toBeTrue()
        ->and($this->site)->not->toBeNull()
        ->and($this->site->theme)->toBe('default')
        ->and(CmsArticle::withoutGlobalScopes()->count())->toBe(0)
        ->and(CmsMenu::withoutGlobalScopes()->count())->toBe(0)
        ->and(CmsSlider::withoutGlobalScopes()->count())->toBe(0)
        ->and(CmsForm::withoutGlobalScopes()->count())->toBe(0)
        // Every page template can be chosen in the page editor
        ->and(CmsSchema::where('front_view', 'front/templates/page')->exists())->toBeTrue();
});

it('loads the starting content of the default theme', function (): void {
    $this->artisan('cms:content-import', ['source' => 'default', '--force' => true])->assertSuccessful();

    expect(CmsArticle::withoutGlobalScopes()->where('site_id', $this->site->id)->where('slug', 'home')->exists())->toBeTrue()
        ->and(CmsSlider::withoutGlobalScopes()->pluck('key')->all())->toEqualCanonicalizing(['default', 'home_slider'])
        ->and(CmsMenu::withoutGlobalScopes()->pluck('slug')->all())->toEqualCanonicalizing(['main', 'footer'])
        ->and(CmsForm::withoutGlobalScopes()->where('alias', 'contacto')->exists())->toBeTrue();

    $this->get('/')->assertOk()->assertInertia(fn (Assert $page) => $page
        ->component('front/templates/home')
        ->where('article.metadata.slider', 'home_slider')
        ->where('slider.key', 'home_slider'));
});

it('loads a content file into a site: media, field groups, post types, posts and menus', function (): void {
    $file = writeContent($this->dir, [
        'site' => ['name' => 'EMSAL', 'title' => 'EMSAL', 'currency' => 'PEN', 'lang' => 'es'],
        'media' => ['salinas' => ['file' => 'media/salinas.jpg', 'alt' => 'Las salinas']],
        'settings' => ['layout_phone' => '(01) 6142000'],
        'schemas' => [
            'home' => ['name' => 'Inicio EMSAL', 'type' => 'HOME', 'template' => 'front/templates/home', 'fields' => [
                ['key' => 'hero_title', 'label' => 'Título', 'type' => 'text'],
                ['key' => 'hero_image', 'label' => 'Imagen', 'type' => 'image'],
                ['key' => 'productos', 'label' => 'Productos', 'type' => 'posts'],
            ]],
            'producto' => ['name' => 'Producto', 'fields' => [['key' => 'peso', 'label' => 'Peso', 'type' => 'text']]],
        ],
        'post_types' => [['slug' => 'productos', 'name' => 'Productos', 'singular_name' => 'Producto', 'schema' => 'producto', 'per_page' => 0, 'order' => 'title']],
        'tags' => ['cocina' => 'Cocina', 'parrilla' => 'Parrilla'],
        'forms' => [['alias' => 'contacto', 'name' => 'Contacto', 'fields' => [['name' => 'Nombre', 'alias' => 'nombre'], ['name' => 'Correo', 'type' => 'email']]]],
        'sliders' => [['key' => 'proceso', 'slides' => [['title' => 'El mar', 'image' => '@salinas'], ['title' => 'El sol']]]],
        'pages' => [
            ['slug' => 'home', 'title' => 'Inicio', 'schema' => 'home', 'metadata' => ['hero_title' => 'Naturalmente peruana', 'hero_image' => '@salinas', 'productos' => ['post_type' => 'productos', 'limit' => 2]]],
            ['slug' => 'quienes-somos', 'title' => 'Quiénes somos', 'body' => '<p>Más de 70 años en {site}</p>'],
            ['slug' => 'historia', 'title' => 'Historia', 'parent' => 'quienes-somos'],
        ],
        'posts' => [
            ['type' => 'productos', 'slug' => 'sal-de-mesa', 'title' => 'Sal de mesa', 'schema' => 'producto', 'tags' => ['cocina'], 'metadata' => ['peso' => '1 kg']],
            ['type' => 'productos', 'slug' => 'sal-parrillera', 'title' => 'Sal parrillera', 'tags' => ['parrilla']],
            ['type' => 'productos', 'slug' => 'sal-de-cocina', 'title' => 'Sal de cocina', 'tags' => ['cocina']],
        ],
        'menus' => ['main' => [
            ['title' => 'Quiénes somos', 'page' => 'quienes-somos', 'children' => [['title' => 'Historia', 'page' => 'historia']]],
            ['title' => 'Productos', 'url' => '/productos'],
        ]],
    ]);

    $this->artisan('cms:content-import', ['source' => $file, '--force' => true])->assertSuccessful();

    $site = $this->site->fresh();
    expect($site->name)->toBe('EMSAL')->and($site->currency)->toBe('PEN')->and($site->theme)->toBe('default');

    $media = CmsMedia::where('alt', 'Las salinas')->first();
    expect($media)->not->toBeNull();
    Storage::disk('public')->assertExists($media->path);

    $type = CmsPostType::where('slug', 'productos')->first();
    expect($type->per_page)->toBe(0)->and($type->order)->toBe('title')
        ->and($type->default_schema_id)->toBe(CmsSchema::where('name', 'Producto')->value('id'));

    $about = CmsArticle::withoutGlobalScopes()->where('slug', 'quienes-somos')->first();
    expect($about->content)->toContain('Más de 70 años en http://')
        ->and(CmsArticle::withoutGlobalScopes()->where('slug', 'historia')->value('parent_id'))->toBe($about->id)
        ->and(CmsMenuItem::whereNotNull('parent_id')->value('title'))->toBe('Historia')
        ->and(CmsPost::withoutGlobalScopes()->where('post_type', 'productos')->count())->toBe(3)
        ->and(CmsSlider::withoutGlobalScopes()->where('key', 'proceso')->first()->slides()->first()->image_url)->toBe('/storage/'.$media->path);

    // The home page gets the posts of its "Lista de posts" field, sorted as the post type says
    $this->get('/')->assertOk()->assertInertia(fn (Assert $page) => $page
        ->where('article.metadata.hero_image', '/storage/'.$media->path)
        ->has('postLists.productos', 2)
        ->where('postLists.productos.0.title', 'Sal de cocina')
        ->where('postLists.productos.1.title', 'Sal de mesa'));

    // The listing of the post type shows them all, by title
    $this->get('/productos')->assertOk()->assertInertia(fn (Assert $page) => $page
        ->component('front/blog/index')
        ->has('posts.data', 3)
        ->where('posts.data.0.title', 'Sal de cocina')
        ->where('posts.data.2.title', 'Sal parrillera'));

    // Loading it again with --fresh replaces the site's content and reuses the media
    $this->artisan('cms:content-import', ['source' => $file, '--force' => true, '--fresh' => true])->assertSuccessful();
    expect(CmsArticle::withoutGlobalScopes()->count())->toBe(3)
        ->and(CmsMenu::withoutGlobalScopes()->count())->toBe(1)
        ->and(CmsForm::withoutGlobalScopes()->count())->toBe(1)
        ->and(CmsMedia::where('alt', 'Las salinas')->count())->toBe(1)
        ->and(CmsSchema::where('name', 'Inicio EMSAL')->count())->toBe(1);
});

it('filters a post list by tag', function (): void {
    $file = writeContent($this->dir, [
        'schemas' => ['home' => ['name' => 'Inicio', 'type' => 'HOME', 'template' => 'front/templates/home', 'fields' => [['key' => 'recetas', 'label' => 'Recetas', 'type' => 'posts']]]],
        'pages' => [['slug' => 'home', 'title' => 'Inicio', 'schema' => 'home', 'metadata' => ['recetas' => ['post_type' => 'post', 'tag' => 'recetas']]]],
        'posts' => [
            ['slug' => 'ceviche', 'title' => 'Ceviche', 'tags' => ['recetas'], 'days_ago' => 1],
            ['slug' => 'mitos', 'title' => 'Mitos de la sal', 'tags' => ['mitos']],
        ],
    ]);

    $this->artisan('cms:content-import', ['source' => $file, '--force' => true])->assertSuccessful();

    $this->get('/')->assertOk()->assertInertia(fn (Assert $page) => $page
        ->has('postLists.recetas', 1)
        ->where('postLists.recetas.0.title', 'Ceviche')
        ->where('postLists.recetas.0.tags.0.slug', 'recetas'));
});

it('downloads linked media once', function (): void {
    $image = imagecreatetruecolor(20, 20);
    ob_start();
    imagepng($image);
    $png = ob_get_clean();
    Http::fake(['example.com/*' => Http::response($png, 200, ['Content-Type' => 'image/png'])]);

    $file = writeContent($this->dir, ['media' => ['logo' => ['url' => 'https://example.com/logo.png']], 'settings' => ['layout_header_logo' => '@logo']]);
    $this->artisan('cms:content-import', ['source' => $file, '--force' => true])->assertSuccessful();

    Http::fake(fn () => throw new RuntimeException('No download expected'));
    $this->artisan('cms:content-import', ['source' => $file, '--force' => true, '--fresh' => true])->assertSuccessful();

    expect(CmsMedia::count())->toBe(1);
});

it('refuses a theme without content, a menu link to a missing page and media outside its folder', function (): void {
    $this->artisan('cms:content-import', ['source' => 'editorial', '--force' => true])->assertFailed();

    $file = writeContent($this->dir, ['menus' => ['main' => [['title' => 'Nada', 'page' => 'nada']]]]);
    $this->artisan('cms:content-import', ['source' => $file, '--force' => true])->assertFailed();

    $file = writeContent($this->dir, ['media' => ['secret' => ['file' => '../../etc/passwd']]]);
    $this->artisan('cms:content-import', ['source' => $file, '--force' => true])->assertFailed();
    expect(CmsMedia::count())->toBe(0);
});
