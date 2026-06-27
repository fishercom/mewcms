<?php

use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Inertia\Testing\AssertableInertia as Assert;

uses(RefreshDatabase::class);

test('guests are redirected to the login page', function () {
    $this->get('/admin')->assertRedirect('/login');
});

test('authenticated users can visit the dashboard and receive dashboard metrics', function () {
    $this->actingAs($user = User::factory()->create());

    $response = $this->get('/admin');

    $response->assertOk();
    $response->assertInertia(fn (Assert $page) => $page
        ->component('admin')
        ->has('stats')
        ->has('stats.total_articles')
        ->has('stats.active_articles')
        ->has('stats.total_terms')
        ->has('stats.total_messages')
        ->has('stats.unreviewed_messages')
        ->has('stats.file_count')
        ->has('stats.disk_usage')
        ->has('recentLogs')
        ->has('articlesChart')
        ->has('messagesChart')
        ->has('activityChart')
    );
});
