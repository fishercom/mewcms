<?php

use App\Models\CmsArticle;
use App\Models\CmsMenu;
use App\Models\CmsMenuItem;
use Illuminate\Database\Migrations\Migration;

return new class extends Migration
{
    /**
     * Run the migrations.
     */
    public function up(): void
    {
        // 1. Create Main menu
        $mainMenu = CmsMenu::firstOrCreate([
            'slug' => 'main',
        ], [
            'name' => 'Main',
            'description' => 'Main navigation menu displayed in the header.',
            'active' => true,
        ]);

        // Add "Inicio" (Custom URL: /)
        CmsMenuItem::firstOrCreate([
            'menu_id' => $mainMenu->id,
            'title' => 'Inicio',
        ], [
            'url' => '/',
            'position' => 1,
            'active' => true,
        ]);

        // Find existing articles (except home)
        $articles = CmsArticle::whereNotIn('slug', ['home', 'home-page'])->get();
        $pos = 2;
        foreach ($articles as $art) {
            CmsMenuItem::firstOrCreate([
                'menu_id' => $mainMenu->id,
                'article_id' => $art->id,
            ], [
                'title' => $art->title,
                'position' => $pos++,
                'active' => true,
            ]);
        }

        // 2. Create Footer menu
        $footerMenu = CmsMenu::firstOrCreate([
            'slug' => 'footer',
        ], [
            'name' => 'Footer',
            'description' => 'Footer navigation menu with policy and contact links.',
            'active' => true,
        ]);

        // Add dummy pages as custom links
        CmsMenuItem::firstOrCreate([
            'menu_id' => $footerMenu->id,
            'title' => 'Políticas de Privacidad',
        ], [
            'url' => '/politicas-de-privacidad',
            'position' => 1,
            'active' => true,
        ]);

        CmsMenuItem::firstOrCreate([
            'menu_id' => $footerMenu->id,
            'title' => 'Términos y Condiciones',
        ], [
            'url' => '/terminos-y-condiciones',
            'position' => 2,
            'active' => true,
        ]);

        CmsMenuItem::firstOrCreate([
            'menu_id' => $footerMenu->id,
            'title' => 'Contáctenos',
        ], [
            'url' => '/contactenos',
            'position' => 3,
            'active' => true,
        ]);
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        $mainMenu = CmsMenu::where('slug', 'main')->first();
        if ($mainMenu) {
            CmsMenuItem::where('menu_id', $mainMenu->id)->delete();
            $mainMenu->delete();
        }

        $footerMenu = CmsMenu::where('slug', 'footer')->first();
        if ($footerMenu) {
            CmsMenuItem::where('menu_id', $footerMenu->id)->delete();
            $footerMenu->delete();
        }
    }
};
