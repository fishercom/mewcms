<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Support\Facades\DB;

/**
 * Admin routes now enforce profile permissions. If an install has no super admin
 * profile (the "sa" flag was not mass assignable outside the seeder), its
 * administrator would be locked out. In that case flag the profile the legacy
 * code treated as super admin (id 1) and the profiles of default users.
 */
return new class extends Migration
{
    public function up(): void
    {
        if (DB::table('profiles')->where('sa', true)->exists()) {
            return;
        }

        $profileIds = DB::table('users')
            ->where('default', true)
            ->whereNotNull('profile_id')
            ->pluck('profile_id')
            ->push(1);

        DB::table('profiles')->whereIn('id', $profileIds)->update(['sa' => true]);
    }

    public function down(): void
    {
        //
    }
};
