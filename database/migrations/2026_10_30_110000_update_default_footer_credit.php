<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Support\Facades\DB;

/**
 * The footer credit becomes "Desarrollado por DeepSoft" (linked). Only the old default
 * sentence is replaced, so a custom copyright text is kept as it is.
 */
return new class extends Migration
{
    private const OLD = 'Powered by Laravel, Inertia, and React.';

    private const NEW = 'Desarrollado por <a href="https://deepsoft.lat" target="_blank" rel="noopener noreferrer">DeepSoft</a>.';

    public function up(): void
    {
        $this->swap(self::OLD, self::NEW);
    }

    public function down(): void
    {
        $this->swap(self::NEW, self::OLD);
    }

    private function swap(string $from, string $to): void
    {
        $value = DB::table('cms_configs')->where('alias', 'layout_copyright')->value('value');

        if (is_string($value) && str_contains($value, $from)) {
            DB::table('cms_configs')->where('alias', 'layout_copyright')->update(['value' => str_replace($from, $to, $value), 'updated_at' => now()]);
        }
    }
};
