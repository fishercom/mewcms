# Themes

Each folder here is a theme for the public site. A site picks its theme in
**Admin → Sites**, so two sites on the same install can look completely different
while sharing one build and one admin.

```
resources/themes/<slug>/
├── theme.json        name, description, version, author (and styles, scripts)
├── screenshot.png    preview shown in Admin → Sites (16:10, about 960×600)
├── css/theme.css     the theme's stylesheet (its own Vite entry)
├── assets/           images and fonts, imported from the pages or the CSS
├── lang/             the theme's fixed texts per language: en.json, es.json, ...
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

## Texts and translations

A page never writes a fixed text ("Explore", "Send message", "from $48") straight into
its markup. It writes a **key**, and the theme ships the text of that key in each
language in `lang/<locale>.json` (BCP 47 names: `en.json`, `es.json`, `pt-BR.json`):

```tsx
import { useTexts } from '@/lib/theme-texts';

const { t, choice, price, date } = useTexts();

<h2>{t('footer.explore')}</h2>
<p>{choice('search.results', results.length, { query })}</p>
<span>{t('shop.from_price', { price: price(card.price) })}</span>
<time>{date(post.published_at, { dateStyle: 'long' })}</time>
```

```json
{
    "footer.explore": "Explorar",
    "search.results": "1 resultado para «:query»|:count resultados para «:query»",
    "shop.from_price": "desde :price"
}
```

- **Keys** are lowercase words joined by dots, grouped by section: `nav.*`, `footer.*`,
  `shop.*`. The default theme holds the texts every theme shares (forms, search, tags,
  galleries); a theme only lists the keys it words differently.
- **A site changes any text** in **Admin → Translations**, without touching the theme.
  A text resolves to: the site's change, then the theme's text in the site's language
  (`es-PE`, then `es`), then in English, then the same in the default theme.
- **Values are not text.** Prices, dates and counts go in as `:placeholders`, formatted
  for the site's language: a price is a **Precio** custom field (`{ amount, currency }`,
  the site's currency by default) shown with `price()`; dates with `date()`; plurals with
  `choice()` and `one|other` forms ("zero|one|other" to say something else for none).
- **Check a theme** with `php artisan cms:theme-texts [theme]`: it lists every key a page
  uses without a text in one of the theme's languages, and fails when English lacks one.
  `--write` adds the missing keys, empty, to the theme's files. The test suite runs it on
  every built theme.

Content an editor writes (titles, paragraphs, buttons of a section) stays in the page
editor and its custom fields: theme texts are only the words the design itself needs.

## Design and scripts

A site's whole look comes from its theme: colours, fonts, images and its own scripts.
The default theme reads `--site-accent`, `--site-accent-dark` and `--site-font`, so a
theme built on it changes those in its stylesheet:

```css
.front-theme {
    --site-accent: #a5462b;
    --site-font: 'Lora', Georgia, serif;
}
```

Tracking code that differs per site (Google Analytics, Tag Manager, a pixel) does not go
in the theme: each site has **Scripts** fields in Admin → Sites, printed in `<head>` and at
the end of `<body>` of its public pages.

## Uploaded themes

A designer can make a theme without touching the code or running a build: a folder with
stylesheets, scripts, images and fonts, zipped and uploaded in **Admin → Sites → Themes**.
It uses the pages of a built theme and adds its own files on top.

```
aurora.zip
├── theme.json        required
├── screenshot.png    preview in Admin → Sites (16:10)
├── css/main.css
├── js/menu.js
└── assets/           images and fonts, referenced from the CSS with relative paths
```

```json
{
    "name": "Aurora",
    "slug": "aurora",
    "description": "Tema claro con tipografía serif",
    "version": "1.0.0",
    "author": "Estudio X",
    "layout": "default",
    "styles": [
        "css/main.css",
        { "href": "css/print.css", "media": "print" },
        "https://fonts.bunny.net/css?family=lora:400,700"
    ],
    "scripts": [
        { "src": "js/menu.js", "position": "body", "defer": true }
    ]
}
```

- `layout`: the built theme whose pages it uses (`default` when missing or unknown).
- `styles`: loaded in `<head>`, in order, after the layout's compiled stylesheet, so they
  can override it. A path in the theme or an `https://` URL; `media` is optional.
- `scripts`: `position` is `head` or `body` (end of `<body>`); `defer`, `async` and
  `"type": "module"` are optional.
- `slug`: the folder name; without it the name of the zipped folder or of the file is
  used. Uploading a theme with the slug of an installed one updates it.

The files are served from `/storage/themes/<slug>/` with a stamp that changes on every
upload, so browsers never keep an old copy. The upload is refused, and nothing is
written, when theme.json is missing or invalid, a file is not a stylesheet, script, image,
font or text file (`.php`, `.html`, `.htaccess` and the like), a path leaves the folder,
or the theme has more than 500 files or 20 MB once unpacked. A theme a site uses cannot be
deleted. Built themes can list `https://` styles and scripts too; their own files are
bundled by Vite instead.

Uploaded themes live in `storage/app/public/themes`, like the media library: on a host
without a persistent disk they are lost on every deploy, so keep the zip.

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
   enough).
6. Run `npm run build`, then choose the theme for a site in Admin → Sites.

New page templates created in Admin → Templates go to the default theme, so every theme
can use them.
