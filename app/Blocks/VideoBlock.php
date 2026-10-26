<?php

namespace App\Blocks;

use App\Support\MediaLibrary;

class VideoBlock extends BlockType
{
    public function key(): string
    {
        return 'video';
    }

    public function name(): string
    {
        return 'Video';
    }

    public function icon(): string
    {
        return 'circle-play';
    }

    public function category(): string
    {
        return 'media';
    }

    public function description(): string
    {
        return 'Un video de YouTube o Vimeo, o un archivo de la biblioteca.';
    }

    public function fields(): array
    {
        return [
            ['key' => 'url', 'label' => 'Enlace de YouTube o Vimeo', 'type' => 'url', 'placeholder' => 'https://www.youtube.com/watch?v=…'],
            ['key' => 'file', 'label' => 'O un archivo de video de la biblioteca', 'type' => 'document', 'media' => 'video'],
            ['key' => 'title', 'label' => 'Título (para lectores de pantalla)', 'type' => 'text', 'max' => 160],
            ['key' => 'caption', 'label' => 'Leyenda', 'type' => 'text', 'max' => 300],
            ['key' => 'ratio', 'label' => 'Proporción', 'type' => 'select', 'default' => '16:9', 'options' => [
                ['value' => '16:9', 'label' => '16:9'], ['value' => '4:3', 'label' => '4:3'], ['value' => '1:1', 'label' => 'Cuadrado'], ['value' => '9:16', 'label' => 'Vertical'],
            ]],
        ];
    }

    public function sanitize(array $data): array
    {
        $clean = parent::sanitize($data);
        $clean['url'] = self::embed($clean['url']) ? $clean['url'] : '';
        // Only video files stored in the media library
        $path = MediaLibrary::pathFromUrl($clean['file']);
        $clean['file'] = $path !== null && preg_match('/\.(mp4|webm|ogv|mov)$/i', $path) ? $clean['file'] : '';

        return $clean;
    }

    /**
     * The privacy-friendly embed URL of an allow-listed YouTube or Vimeo link.
     */
    public static function embed(?string $url): ?string
    {
        if (! is_string($url) || $url === '') {
            return null;
        }
        $host = strtolower((string) parse_url($url, PHP_URL_HOST));
        $path = (string) parse_url($url, PHP_URL_PATH);
        parse_str((string) parse_url($url, PHP_URL_QUERY), $query);
        if (parse_url($url, PHP_URL_SCHEME) !== 'https') {
            return null;
        }

        $youtube = match (true) {
            in_array($host, ['www.youtube.com', 'youtube.com', 'm.youtube.com'], true) && $path === '/watch' => $query['v'] ?? null,
            in_array($host, ['www.youtube.com', 'youtube.com'], true) && preg_match('~^/(?:shorts|embed|live)/([^/]+)~', $path, $m) === 1 => $m[1],
            $host === 'youtu.be' => ltrim($path, '/'),
            default => null,
        };
        if (is_string($youtube) && preg_match('/^[A-Za-z0-9_-]{11}$/', $youtube)) {
            return 'https://www.youtube-nocookie.com/embed/'.$youtube;
        }

        if (in_array($host, ['vimeo.com', 'www.vimeo.com', 'player.vimeo.com'], true) && preg_match('~/(?:video/)?(\d{6,12})(?:/|$)~', $path, $m) === 1) {
            return 'https://player.vimeo.com/video/'.$m[1].'?dnt=1';
        }

        return null;
    }

    public function resolve(array $data): array
    {
        return ['embed' => self::embed($data['url'] ?? null)] + $data;
    }

    public function toHtml(array $data): string
    {
        $link = $data['url'] ?: $data['file'];

        return $link !== '' ? '<p><a href="'.e($link).'">'.e($data['title'] ?: 'Video').'</a></p>' : '';
    }
}
