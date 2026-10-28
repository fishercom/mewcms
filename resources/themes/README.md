# Themes

Each folder here is a theme for the public site. A site picks its theme in
**Admin → Sites**, so two sites on the same install can look completely different
while sharing one build and one admin.

```
resources/themes/<slug>/
├── theme.json        name, description, version, author, settings
├── screenshot.png    preview shown in Admin → Sites (16:10, about 960×600)
├── css/theme.css     the theme's stylesheet (its own Vite entry)
├── assets/           images and fonts, imported from the pages or the CSS
└── front/            the theme's pages, named like the Inertia components
    ├── layout.tsx
    ├── search.tsx
    ├── tag.tsx
    ├── blog/index.tsx, blog/show.tsx
    ├── components/sidebar.tsx
    └── templates/home.tsx, page.tsx, post.tsx, ...
```

## How a page is chosen

The server renders a component name such as `front/templates/page` (the schema's
template). The page comes from `resources/themes/<site theme>/front/templates/page.tsx`
when the theme has that file, and from the **default** theme otherwise. So a theme only
needs the pages it changes; the `editorial` theme has no pages at all and only restyles
the default ones.

Every theme is built in the same `npm run build`. Their pages are split into their own
chunks, and only the active theme's stylesheet is loaded on a page.

## Settings each site can change

A theme lists in `theme.json` what a site may adjust without touching code. Admin → Sites
shows a colour picker or a list for each one, and the public pages get the chosen values
as CSS variables on `:root`:

```json
"settings": [
    { "key": "accent", "label": "Color de acento", "type": "color", "default": "#f53003", "css": "--site-accent" },
    {
        "key": "font", "label": "Tipografía", "type": "select", "default": "instrument", "css": "--site-font",
        "options": [
            { "value": "instrument", "label": "Instrument Sans", "css": "'Instrument Sans', ui-sans-serif, sans-serif" },
            { "value": "serif", "label": "Serif", "css": "ui-serif, Georgia, serif" }
        ]
    }
]
```

- `type` is `color` (a `#rrggbb` value) or `select` (one of `options`; the variable gets
  the option's `css`).
- `css` is the variable name, lowercase, starting with `--`.
- Use the variable in the theme's CSS with a fallback, such as
  `color: var(--site-accent, #f53003)`. The default theme maps them to `--theme-accent`
  (switching to `--site-accent-dark` in dark mode) and the page font.

Values a site saved for a setting the new theme does not have are dropped when the site
changes theme.

## Making a theme

1. Create `resources/themes/<slug>/theme.json` (the slug is lowercase letters, numbers,
   `-` or `_`).
2. Add `css/theme.css`. Start from the default theme:

    ```css
    @import '../../default/css/theme.css';
    @source '../front';

    .front-theme {
        --primary: oklch(0.5 0.2 250);
    }
    ```

    Or write it from scratch (`@import 'tailwindcss' source(none);` plus
    `@import '../../../css/tokens.css';` and `@source` lines for the folders it uses).

3. Copy the pages you want to change from `default/front/` into `<slug>/front/`, with the
   same file names. Imports with `@/` (shared components, types) work the same. A page
   that imports the layout with `../layout` uses the theme's own `front/layout.tsx`, so
   copy the layout too, or import the default one from `../../../default/front/layout`.
4. Put images and fonts in `assets/` and import them (`import logo from '../assets/logo.svg'`)
   so Vite fingerprints and bundles them.
5. Add a `screenshot.png` (a capture of the home page at 1280×800, scaled to 960×600, is
   enough) and, if the theme should be adjustable, `settings` in `theme.json`.
6. Run `npm run build`, then choose the theme for a site in Admin → Sites.

New page templates created in Admin → Templates go to the default theme, so every theme
can use them.
