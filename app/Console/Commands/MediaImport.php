<?php

namespace App\Console\Commands;

use App\Models\CmsMedia;
use App\Support\MediaLibrary;
use Illuminate\Console\Command;

class MediaImport extends Command
{
    protected $signature = 'media:import';

    protected $description = 'Add the files uploaded with the old file manager to the media library';

    public function handle(): int
    {
        $result = MediaLibrary::import(function (CmsMedia $media): void {
            $this->line("  + {$media->path}".($media->variants ? ' ('.count($media->variants).' versiones WebP)' : ''));
        });

        $this->info("Importados: {$result['imported']} · Ya estaban en la biblioteca: {$result['skipped']}");

        return self::SUCCESS;
    }
}
