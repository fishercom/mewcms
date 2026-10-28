# Themes

Each folder here is a theme for the public site. A site picks its theme in
**Admin → Sites**, so two sites on the same install can look completely different
while sharing one build and one admin.

```
resources/themes/<slug>/
├── theme.json        name, description, version, author
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
5. Run `npm run build`, then choose the theme for a site in Admin → Sites.

New page templates created in Admin → Templates go to the default theme, so every theme
can use them.
