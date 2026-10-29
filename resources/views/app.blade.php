<!DOCTYPE html>
@php
    // Public pages come from the site's theme, with its own stylesheet; the admin uses app.css
    $siteTheme = \App\Support\Themes::current();
    $isThemePage = \App\Support\Themes::isThemePage($page['component']);
    $site = $isThemePage ? \App\Support\Sites::current() : null;
    // Stylesheets and scripts the theme lists in theme.json (uploaded themes)
    $themeInfo = $isThemePage ? (\App\Support\Themes::all()[$siteTheme] ?? null) : null;
    $lang = $site?->lang?->iso ?? str_replace('_', '-', app()->getLocale());
@endphp
<html lang="{{ $lang }}" data-site-theme="{{ \App\Support\Themes::layout($siteTheme) }}" @if ($site) data-site-title="{{ $site->title ?: $site->name }}" @endif @class(['dark' => ($appearance ?? 'system') == 'dark'])>
    <head>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1">

        {{-- Inline script to detect system dark mode preference and apply it immediately --}}
        <script>
            (function() {
                const appearance = '{{ $appearance ?? "system" }}';

                if (appearance === 'system') {
                    const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;

                    if (prefersDark) {
                        document.documentElement.classList.add('dark');
                    }
                }
            })();
        </script>

        {{-- Inline style to set the HTML background color based on our theme in app.css --}}
        <style>
            html {
                background-color: oklch(0.989 0.004 286.3);
            }

            html.dark {
                background-color: oklch(0.17 0.019 289.3);
            }
        </style>

        @if ($site?->favicon)
            <link rel="icon" href="{{ $site->favicon }}">
            <link rel="apple-touch-icon" href="{{ $site->favicon }}">
        @else
            <link rel="icon" href="/favicon.ico" sizes="48x48">
            <link rel="icon" href="/favicon.svg" type="image/svg+xml">
            <link rel="apple-touch-icon" href="/apple-touch-icon.png">
        @endif

        <link rel="preconnect" href="https://fonts.bunny.net">
        <link href="https://fonts.bunny.net/css?family=instrument-sans:400,500,600" rel="stylesheet" />

        @routes
        @viteReactRefresh
        @vite([
            $isThemePage ? \App\Support\Themes::styleFile($siteTheme) : 'resources/css/app.css',
            'resources/js/app.tsx',
            \App\Support\Themes::pageFile($page['component'], $siteTheme),
        ])
        @foreach ($themeInfo['styles'] ?? [] as $style)
            <link rel="stylesheet" href="{{ $style['href'] }}" @if ($style['media']) media="{{ $style['media'] }}" @endif>
        @endforeach
        @foreach (collect($themeInfo['scripts'] ?? [])->where('position', 'head') as $script)
            <script src="{{ $script['src'] }}" @if ($script['module']) type="module" @endif @if ($script['defer']) defer @endif @if ($script['async']) async @endif></script>
        @endforeach
        @if ($site?->head_scripts)
            {{-- The site's own scripts (Admin → Sites), such as Google Analytics --}}
            {!! $site->head_scripts !!}
        @endif
        @inertiaHead
        @if (empty($__inertiaSsrResponse))
            <title inertia>{{ $site ? ($site->title ?: $site->name) : config('app.name', 'MewCMS') }}</title>
        @endif
    </head>
    <body class="font-sans antialiased">
        @inertia
        @foreach (collect($themeInfo['scripts'] ?? [])->where('position', 'body') as $script)
            <script src="{{ $script['src'] }}" @if ($script['module']) type="module" @endif @if ($script['defer']) defer @endif @if ($script['async']) async @endif></script>
        @endforeach
        @if ($site?->body_scripts)
            {!! $site->body_scripts !!}
        @endif
    </body>
</html>
