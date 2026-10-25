<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Support\Facades\DB;

/**
 * Taxonomies become a single flat list of tags ("Etiquetas"). The terms of every
 * taxonomy are merged into it (same slug = same tag, page and post links follow)
 * and the other taxonomies are removed. The tables stay: tags live in
 * cms_taxonomy_terms under the "etiquetas" taxonomy.
 */
return new class extends Migration
{
    public function up(): void
    {
        $tagTaxonomyId = DB::table('cms_taxonomies')->where('slug', 'etiquetas')->value('id')
            ?? DB::table('cms_taxonomies')->insertGetId([
                'name' => 'Etiquetas',
                'slug' => 'etiquetas',
                'active' => true,
                'created_at' => now(),
                'updated_at' => now(),
            ]);

        // Tags have no levels
        DB::table('cms_taxonomy_terms')->update(['parent_id' => null]);

        $others = DB::table('cms_taxonomy_terms')->where('taxonomy_id', '!=', $tagTaxonomyId)->orderBy('id')->get();
        foreach ($others as $term) {
            $targetId = DB::table('cms_taxonomy_terms')
                ->where('taxonomy_id', $tagTaxonomyId)
                ->where('slug', $term->slug)
                ->value('id');

            if (! $targetId) {
                DB::table('cms_taxonomy_terms')->where('id', $term->id)->update(['taxonomy_id' => $tagTaxonomyId]);

                continue;
            }

            // Same slug as an existing tag: move the links over and drop the duplicate
            foreach (['cms_article_term' => 'article_id', 'cms_post_term' => 'post_id'] as $pivot => $column) {
                $linked = DB::table($pivot)->where('term_id', $term->id)->pluck($column);
                DB::table($pivot)->insertOrIgnore($linked->map(fn ($id): array => [$column => $id, 'term_id' => $targetId])->all());
                DB::table($pivot)->where('term_id', $term->id)->delete();
            }
            DB::table('cms_taxonomy_terms')->where('id', $term->id)->delete();
        }

        DB::table('cms_taxonomies')->where('id', '!=', $tagTaxonomyId)->delete();

        // The admin "Taxonomías" entry becomes "Etiquetas", keeping its permission events
        DB::table('adm_modules')->where('route', 'taxonomies.index')->update([
            'name' => 'Etiquetas',
            'url' => '/admin/tags',
            'route' => 'tags.index',
            'icon' => 'tags',
        ]);
    }

    public function down(): void
    {
        // Merged taxonomies cannot be split again; only the admin entry is restored
        DB::table('adm_modules')->where('route', 'tags.index')->update([
            'name' => 'Taxonomías',
            'url' => '/admin/taxonomies',
            'route' => 'taxonomies.index',
        ]);
    }
};
