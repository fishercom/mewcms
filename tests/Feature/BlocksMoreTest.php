<?php

use App\Blocks\BlockRegistry;
use App\Blocks\FeaturesBlock;
use App\Blocks\VideoBlock;
use App\Models\CmsArticle;
use App\Models\CmsForm;
use App\Models\CmsLang;
use App\Models\CmsMedia;
use App\Models\CmsSchema;
use App\Models\CmsSchemaGroup;
use App\Models\CmsSlide;
use App\Models\CmsSlider;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Http\UploadedFile;
use Illuminate\Support\Facades\Storage;
use Inertia\Testing\AssertableInertia as Assert;

uses(RefreshDatabase::class);

beforeEach(function (): void {
    $group = CmsSchemaGroup::create(['name' => 'Default', 'layout' => 'layout', 'default' => 1, 'active' => 1]);
    $this->lang = CmsLang::create(['name' => 'Español', 'iso' => 'es', 'active' => 1]);
    $this->schema = CmsSchema::create(['group_id' => $group->id, 'name' => 'Page', 'type' => 'PAGE', 'active' => 1, 'fields' => [], 'front_view' => 'front/templates/page']);
    $this->admin = User::factory()->superAdmin()->create();
});

function blocksPage(array $blocks, string $slug = 'bloques'): CmsArticle
{
    return CmsArticle::create(['schema_id' => test()->schema->id, 'lang_id' => test()->lang->id, 'title' => 'Bloques', 'slug' => $slug, 'active' => 1, 'blocks' => $blocks]);
}

it('offers the same icons in PHP and React', function (): void {
    $icons = file_get_contents(resource_path('js/blocks/icons.ts'));

    foreach (FeaturesBlock::ICONS as $icon) {
        expect($icons)->toMatch('/^\s+\'?'.preg_quote($icon, '/').'\'?: /m');
    }
});

it('only embeds YouTube and Vimeo links, privacy-friendly', function (?string $url, ?string $embed): void {
    expect(VideoBlock::embed($url))->toBe($embed);
})->with([
    'youtube watch' => ['https://www.youtube.com/watch?v=dQw4w9WgXcQ&t=10', 'https://www.youtube-nocookie.com/embed/dQw4w9WgXcQ'],
    'youtu.be' => ['https://youtu.be/dQw4w9WgXcQ', 'https://www.youtube-nocookie.com/embed/dQw4w9WgXcQ'],
    'shorts' => ['https://youtube.com/shorts/dQw4w9WgXcQ', 'https://www.youtube-nocookie.com/embed/dQw4w9WgXcQ'],
    'vimeo' => ['https://vimeo.com/76979871', 'https://player.vimeo.com/video/76979871?dnt=1'],
    'http' => ['http://www.youtube.com/watch?v=dQw4w9WgXcQ', null],
    'other host' => ['https://www.youtube.com.evil.test/watch?v=dQw4w9WgXcQ', null],
    'bad id' => ['https://www.youtube.com/watch?v=<script>', null],
    'javascript' => ['javascript:alert(1)', null],
]);

it('keeps only allowed video links and library video files', function (): void {
    $page = blocksPage([
        ['type' => 'video', 'data' => ['url' => 'https://evil.test/video', 'file' => 'https://cdn.evil.test/v.mp4']],
        ['type' => 'video', 'data' => ['url' => 'https://youtu.be/dQw4w9WgXcQ', 'file' => '/storage/media/2026/10/clip.mp4']],
        ['type' => 'video', 'data' => ['file' => '/storage/media/2026/10/notes.pdf']],
    ]);

    $blocks = $page->fresh()->blocks;
    expect($blocks[0]['data'])->toMatchArray(['url' => '', 'file' => ''])
        ->and($blocks[1]['data'])->toMatchArray(['url' => 'https://youtu.be/dQw4w9WgXcQ', 'file' => '/storage/media/2026/10/clip.mp4'])
        ->and($blocks[2]['data']['file'])->toBe('');
});

it('nests blocks one level deep in columns that follow the layout', function (): void {
    $page = blocksPage([[
        'type' => 'columns',
        'data' => [
            'layout' => '33-33-33',
            'columns' => [
                ['blocks' => [
                    ['type' => 'rich_text', 'data' => ['html' => '<p>Uno</p><script>x</script>']],
                    ['type' => 'columns', 'data' => ['layout' => '50-50', 'columns' => []]],
                ]],
                ['blocks' => [['type' => 'quote', 'data' => ['text' => 'Dos', 'author' => 'Ana']]]],
                ['blocks' => 'basura'],
                ['blocks' => [['type' => 'cta', 'data' => ['title' => 'Sobra']]]],
            ],
        ],
    ]]);

    $columns = $page->fresh()->blocks[0]['data']['columns'];
    expect($columns)->toHaveCount(3)
        ->and(array_column($columns[0]['blocks'], 'type'))->toBe(['rich_text'])
        ->and($columns[0]['blocks'][0]['data']['html'])->toBe('<p>Uno</p>')
        ->and($columns[1]['blocks'][0]['data'])->toMatchArray(['text' => 'Dos', 'author' => 'Ana'])
        ->and($columns[2]['blocks'])->toBe([]);

    expect($page->fresh()->content)->toContain('<p>Uno</p>')->toContain('Dos')->not->toContain('Sobra');
});

it('cleans repeaters, icons and select options', function (): void {
    CmsForm::create(['name' => 'Contacto', 'alias' => 'contacto', 'active' => true]);

    $page = blocksPage([
        ['type' => 'gallery', 'data' => ['columns' => '9', 'images' => [
            ['src' => '/storage/media/a.jpg', 'caption' => '<b>Uno</b>', '_id' => 'a1'],
            ['src' => 'javascript:alert(1)'],
            'basura',
        ]]],
        ['type' => 'features', 'data' => ['items' => [['icon' => 'skull', 'title' => 'Rápido', 'text' => 'Mucho', 'extra' => 'x']]]],
        ['type' => 'stats', 'data' => ['items' => array_fill(0, 12, ['value' => '99', 'label' => 'x'])]],
        ['type' => 'form', 'data' => ['alias' => 'contacto']],
        ['type' => 'form', 'data' => ['alias' => 'inexistente']],
    ]);

    [$gallery, $features, $stats, $form, $missing] = $page->fresh()->blocks;
    expect($gallery['data']['columns'])->toBe('3')
        ->and($gallery['data']['images'])->toHaveCount(1)
        ->and($gallery['data']['images'][0])->toMatchArray(['_id' => 'a1', 'src' => '/storage/media/a.jpg', 'caption' => 'Uno'])
        ->and($features['data']['items'][0])->toMatchArray(['icon' => 'sparkles', 'title' => 'Rápido'])->not->toHaveKey('extra')
        ->and($stats['data']['items'])->toHaveCount(8)
        ->and($form['data']['alias'])->toBe('contacto')
        ->and($missing['data']['alias'])->toBe('');

    $definition = collect(BlockRegistry::definitions())->firstWhere('key', 'form');
    expect($definition['fields'][0]['options'])->toBe([['value' => 'contacto', 'label' => 'Contacto']]);
});

it('renders sliders, forms and library images inside nested blocks', function (): void {
    Storage::fake('public');
    $this->actingAs($this->admin)->postJson('/admin/media', ['file' => UploadedFile::fake()->image('foto.jpg', 900, 600)]);
    $media = CmsMedia::sole();
    $media->update(['alt' => 'Foto del equipo']);

    $slider = CmsSlider::create(['name' => 'Portada', 'key' => 'portada']);
    CmsSlide::create(['slider_id' => $slider->id, 'title' => 'Activa', 'image_url' => $media->url, 'active' => true, 'position' => 1]);
    CmsSlide::create(['slider_id' => $slider->id, 'title' => 'Oculta', 'image_url' => $media->url, 'active' => false, 'position' => 2]);

    blocksPage([
        ['type' => 'slider', 'data' => ['key' => 'portada']],
        ['type' => 'columns', 'data' => ['layout' => '50-50', 'columns' => [
            ['blocks' => [['type' => 'rich_text', 'data' => ['html' => '<img src="'.$media->url.'" alt="">']]]],
            ['blocks' => [['type' => 'gallery', 'data' => ['images' => [['src' => $media->url]]]]]],
        ]]],
        ['type' => 'video', 'data' => ['url' => 'https://youtu.be/dQw4w9WgXcQ']],
    ]);

    $this->get('/bloques')->assertOk()->assertInertia(fn (Assert $page): Assert => $page
        ->where('article.blocks.0.data.slider.key', 'portada')
        ->has('article.blocks.0.data.slider.slides', 1)
        ->where('article.blocks.0.data.slider.slides.0.title', 'Activa')
        ->where('article.blocks.1.data.columns.0.blocks.0.data.html', fn (string $html): bool => str_contains($html, 'alt="Foto del equipo"') && str_contains($html, 'srcset='))
        ->where('article.blocks.2.data.embed', 'https://www.youtube-nocookie.com/embed/dQw4w9WgXcQ')
        ->where('media', fn ($map): bool => ($map[$media->url]['alt'] ?? null) === 'Foto del equipo'));
});

it('keeps the [form] shortcode working inside text blocks', function (): void {
    $page = blocksPage([['type' => 'rich_text', 'data' => ['html' => '<p>Escríbenos:</p>[form alias="contacto"]']]]);

    expect($page->fresh()->blocks[0]['data']['html'])->toContain('[form alias="contacto"]')
        ->and($page->fresh()->content)->toContain('[form alias="contacto"]');
});
