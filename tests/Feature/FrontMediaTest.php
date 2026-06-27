<?php

use App\Models\Profile;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Http\UploadedFile;
use Illuminate\Support\Facades\Storage;

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

    // Fake the public disk used by LFM configuration
    Storage::fake('public');
});

it('allows authenticated admin to create folders via LFM', function () {
    $response = $this->actingAs($this->user)->get('/laravel-filemanager/newfolder?name=test_quick_folder&type=Images');

    $response->assertStatus(200);
    $this->assertEquals('OK', $response->getContent());
});

it('allows authenticated admin to upload files via LFM', function () {
    $file = UploadedFile::fake()->image('test_image.jpg');

    $response = $this->actingAs($this->user)->post('/laravel-filemanager/upload', [
        'upload' => $file,
        'type' => 'Images',
        'working_dir' => '/',
    ], [
        'Accept' => 'application/json',
    ]);

    $response->assertStatus(200);
    $response->assertJsonStructure(['url', 'uploaded']);
});

it('allows listing files and directories via LFM jsonitems', function () {
    $response = $this->actingAs($this->user)->get('/laravel-filemanager/jsonitems?type=Images&working_dir=/');

    $response->assertStatus(200);
    $response->assertJsonStructure(['items', 'paginator', 'working_dir']);
});

it('allows authenticated admin to delete files via LFM', function () {
    $file = UploadedFile::fake()->image('test_delete_image.jpg');

    $this->actingAs($this->user)->post('/laravel-filemanager/upload', [
        'upload' => $file,
        'type' => 'Files',
        'working_dir' => '/',
    ], [
        'Accept' => 'application/json',
    ]);

    $response = $this->actingAs($this->user)->get('/laravel-filemanager/delete?items[]=test_delete_image.jpg&type=Files&working_dir=/');

    $response->assertStatus(200);
    $this->assertEquals('OK', $response->getContent());
});
