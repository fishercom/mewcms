<?php

use App\Models\CmsSite;
use App\Models\Profile;
use App\Models\User;
use App\Support\Themes;
use Illuminate\Http\UploadedFile;
use Illuminate\Support\Facades\File;
use Inertia\Testing\AssertableInertia as Assert;

beforeEach(function (): void {
    // Never touch the themes a developer uploaded
    Themes::$uploadRoot = sys_get_temp_dir().'/mewcms-themes-'.uniqid();
    Themes::flush();

    $profile = Profile::create(['name' => 'Super Admin', 'sa' => 1, 'active' => 1]);
    $this->user = User::create([
        'username' => 'testadmin',
        'name' => 'Test Admin',
        'email' => 'admin@test.com',
        'password' => bcrypt('password'),
        'profile_id' => $profile->id,
        'active' => 1,
    ]);

    // A .zip with these files ("path" => contents)
    $this->zip = function (array $files, string $name = 'aurora.zip'): UploadedFile {
        $path = tempnam(sys_get_temp_dir(), 'zip');
        $zip = new ZipArchive;
        $zip->open($path, ZipArchive::CREATE | ZipArchive::OVERWRITE);
        foreach ($files as $file => $contents) {
            $zip->addFromString($file, $contents);
        }
        $zip->close();

        return new UploadedFile($path, $name, 'application/zip', null, true);
    };

    $this->manifest = fn (array $extra = []): string => json_encode(['name' => 'Aurora', 'version' => '1.0.0', 'styles' => ['css/main.css'], ...$extra]);
});

afterEach(function (): void {
    File::deleteDirectory(Themes::uploadPath());
    Themes::$uploadRoot = null;
    Themes::flush();
});

it('installs a theme from a zip, with its folder inside or not', function (string $prefix): void {
    $this->actingAs($this->user)->post('/admin/sites/themes', ['file' => ($this->zip)([
        $prefix.'theme.json' => ($this->manifest)(),
        $prefix.'css/main.css' => 'body { color: red }',
        $prefix.'assets/fonts/aurora.woff2' => 'font',
        '__MACOSX/._theme.json' => 'junk',
    ])])->assertRedirect('/admin/sites/themes')->assertSessionHasNoErrors();

    expect(Themes::uploadPath('aurora', 'css/main.css'))->toBeFile()
        ->and(Themes::uploadPath('aurora', 'assets/fonts/aurora.woff2'))->toBeFile()
        ->and(Themes::uploadPath('aurora', '__MACOSX'))->not->toBeDirectory()
        ->and(Themes::all()['aurora']['styles'])->toHaveCount(1);
})->with(['at the root' => '', 'inside a folder' => 'aurora/']);

it('updates an installed theme and drops the files the new version no longer has', function (): void {
    $this->actingAs($this->user)->post('/admin/sites/themes', ['file' => ($this->zip)([
        'theme.json' => ($this->manifest)(), 'css/main.css' => 'a', 'css/old.css' => 'b',
    ])]);
    $this->actingAs($this->user)->post('/admin/sites/themes', ['file' => ($this->zip)([
        'theme.json' => ($this->manifest)(['version' => '2.0.0']), 'css/main.css' => 'c',
    ])])->assertSessionHasNoErrors();

    expect(Themes::all()['aurora']['version'])->toBe('2.0.0')
        ->and(Themes::uploadPath('aurora', 'css/old.css'))->not->toBeFile()
        ->and(file_get_contents(Themes::uploadPath('aurora', 'css/main.css')))->toBe('c');
});

it('refuses a zip it cannot trust, and writes nothing', function (array $files): void {
    $this->actingAs($this->user)->post('/admin/sites/themes', ['file' => ($this->zip)($files)])
        ->assertSessionHasErrors('file');

    expect(Themes::uploadPath('aurora'))->not->toBeDirectory();
})->with([
    'no theme.json' => [['css/main.css' => 'a']],
    'theme.json without a name' => [['theme.json' => '{"version": "1"}']],
    'a PHP file' => [['theme.json' => '{"name": "Aurora"}', 'shell.php' => '<?php echo 1;']],
    'an HTML file' => [['theme.json' => '{"name": "Aurora"}', 'index.html' => '<script></script>']],
    'a path out of the folder' => [['theme.json' => '{"name": "Aurora"}', '../evil.css' => 'a']],
    'a hidden file' => [['theme.json' => '{"name": "Aurora"}', '.htaccess.css' => 'a']],
]);

it('does not replace a theme that comes with the code', function (): void {
    $this->actingAs($this->user)->post('/admin/sites/themes', ['file' => ($this->zip)([
        'theme.json' => '{"name": "Mine", "slug": "default"}',
    ])])->assertSessionHasErrors('file');

    expect(Themes::all()['default']['uploaded'])->toBeFalse();
});

it('lists the themes with the sites that use them, and lets sites pick an uploaded one', function (): void {
    $this->actingAs($this->user)->post('/admin/sites/themes', ['file' => ($this->zip)(['theme.json' => ($this->manifest)(), 'css/main.css' => 'a'])]);
    $site = CmsSite::create(['name' => 'Blog', 'domains' => ['blog.test'], 'theme' => 'aurora', 'active' => true]);

    // Uploaded themes are listed after every built one
    $uploaded = count(glob(resource_path('themes/*/theme.json')));

    expect($site->theme)->toBe('aurora');
    $this->actingAs($this->user)->get('/admin/sites/themes')->assertOk()
        ->assertInertia(fn (Assert $page) => $page->component('admin/sites/themes')
            ->where('themes.0.slug', 'default')
            ->where("themes.{$uploaded}.slug", 'aurora')
            ->where("themes.{$uploaded}.uploaded", true)
            ->where("themes.{$uploaded}.sites", ['Blog']));
});

it('downloads an uploaded theme as a zip', function (): void {
    $this->actingAs($this->user)->post('/admin/sites/themes', ['file' => ($this->zip)(['theme.json' => ($this->manifest)(), 'css/main.css' => 'a'])]);

    $response = $this->actingAs($this->user)->get('/admin/sites/themes/aurora/download')->assertOk()->assertDownload('aurora-1.0.0.zip');
    $zip = new ZipArchive;
    $zip->open($response->baseResponse->getFile()->getPathname());
    expect($zip->locateName('aurora/css/main.css'))->not->toBeFalse();
    $zip->close();

    $this->actingAs($this->user)->get('/admin/sites/themes/default/download')->assertNotFound();
});

it('deletes an uploaded theme only when no site uses it', function (): void {
    $this->actingAs($this->user)->post('/admin/sites/themes', ['file' => ($this->zip)(['theme.json' => ($this->manifest)(), 'css/main.css' => 'a'])]);
    $site = CmsSite::create(['name' => 'Blog', 'domains' => ['blog.test'], 'theme' => 'aurora', 'active' => true]);

    $this->actingAs($this->user)->delete('/admin/sites/themes/aurora')->assertSessionHasErrors('error');
    expect(Themes::uploadPath('aurora'))->toBeDirectory();

    $site->update(['theme' => 'default']);
    $this->actingAs($this->user)->delete('/admin/sites/themes/aurora')->assertRedirect('/admin/sites/themes');
    expect(Themes::uploadPath('aurora'))->not->toBeDirectory();

    $this->actingAs($this->user)->delete('/admin/sites/themes/default')->assertSessionHasErrors('error');
});

it('keeps themes away from users without access to sites', function (): void {
    $profile = Profile::create(['name' => 'Editor', 'sa' => 0, 'active' => 1]);
    $editor = User::create(['username' => 'editor', 'name' => 'Editor', 'email' => 'editor@test.com', 'password' => bcrypt('password'), 'profile_id' => $profile->id, 'active' => 1]);

    $this->actingAs($editor)->post('/admin/sites/themes', ['file' => ($this->zip)(['theme.json' => ($this->manifest)()])])->assertForbidden();
    expect(Themes::uploadPath('aurora'))->not->toBeDirectory();
});
