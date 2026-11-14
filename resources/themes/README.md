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
├── content/          optional starting content: content.json and its media files
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

### Sites in several languages

A site has a main language and may add others in **Admin → Sites**. The main language
has no prefix (`/nosotros`); each extra language answers under its code (`/en/about`),
with its own pages and posts (each page is translated from its editor, which links the
versions). For a theme this means:

- **Build addresses with `localePath()`** (`@/lib/locale-path`): `localePath('/blog')` is
  `/en/blog` on an English page. Addresses that come from the server (`article.url`,
  `post.url`, menu links, search results) already carry the prefix; `tagUrl()` adds it.
- **Show `<LanguageSwitcher />`** (`@/components/front-language-switcher`) in the header:
  it links to the page in the site's other languages and shows nothing on a single-language
  site. The `alternates` prop holds the same links, and `site.locale` the page's language.
- The `<html lang>`, the `hreflang` links and the sitemap are written by the CMS.

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

## Page data from the CMS

Besides `article` (the page, with its `metadata` custom fields), a page template gets:

- `slider`: the slider whose key one of the page's fields holds (a **Slider** field).
- `postLists`: for each **Lista de posts** field (`type: "posts"`), the posts it asks for.
  The editor picks a post type (or the blog), an optional tag and how many; the page gets
  `{ id, title, slug, url, excerpt, featured_image, published_at, metadata, tags }` for
  each, sorted as the post type's listing is. Type it with `PostLists` from
  `@/types/models/cms-post`:

    ```tsx
    import type { PostLists } from '@/types/models/cms-post';

    export default function Home({ article, postLists }: { article: CmsArticle; postLists: PostLists }) {
        return postLists.products?.map((product) => <a href={product.url}>{product.title}</a>);
    }
    ```

- A **Video** field (`type: "video"`) picks a video from the media library and saves its URL.

The listing of a post type (`/productos`) is drawn by `front/blog/index` with a `cpt` prop
(branch on `cpt.slug` to draw a catalog differently from a blog). How many posts each page
shows (0 for all) and their order (newest, oldest or by title) are set per post type in
**Admin → Post types**.

## Starting content

A theme may ship the content a new site starts with, in `content/content.json`. It is
optional: nothing loads it unless asked, and the site's real content is then written in the
admin. Load it into the default site (or `--site=<id>`), which also switches the site to the
theme:

```bash
php artisan cms:content-import emsal              # resources/themes/emsal/content/content.json
php artisan cms:content-import ../emsal/content.json --theme=emsal
php artisan cms:content-import emsal --fresh      # delete the site's pages, posts, menus, forms and sliders first
```

```json
{
    "site": { "name": "EMSAL", "title": "EMSAL", "description": "...", "lang": "es", "currency": "PEN" },
    "media": {
        "hero": { "file": "media/hero.jpg", "alt": "Las salinas al atardecer" },
        "logo": { "url": "https://example.com/logo.svg", "alt": "EMSAL" }
    },
    "settings": { "layout_header_logo": "@logo", "layout_phone": "(01) 6142000" },
    "schemas": {
        "home": {
            "name": "Inicio",
            "type": "HOME",
            "template": "front/templates/home",
            "fields": [
                { "key": "hero_title", "label": "Banner: título", "type": "text" },
                { "key": "hero_image", "label": "Banner: imagen", "type": "image" },
                { "key": "products", "label": "Productos destacados", "type": "posts" }
            ]
        },
        "product": { "name": "Producto", "fields": [{ "key": "weight", "label": "Peso", "type": "text" }] }
    },
    "post_types": [{ "slug": "productos", "name": "Productos", "singular_name": "Producto", "schema": "product", "per_page": 0, "order": "title" }],
    "tags": { "cocina": "Cocina", "parrilla": "Parrilla" },
    "forms": [{ "alias": "contacto", "name": "Contacto", "fields": [{ "name": "Nombre", "alias": "nombre", "type": "text" }] }],
    "sliders": [{ "key": "proceso", "name": "Todo comienza en el mar", "slides": [{ "title": "El mar", "image": "@hero" }] }],
    "pages": [
        {
            "slug": "home",
            "title": "Inicio",
            "schema": "home",
            "metadata": { "hero_title": "Naturalmente peruana", "hero_image": "@hero", "products": { "post_type": "productos", "limit": 4 } }
        },
        { "slug": "quienes-somos", "title": "Quiénes somos", "body": "<p>...</p>" },
        { "slug": "historia", "title": "Historia", "parent": "quienes-somos" }
    ],
    "posts": [
        {
            "type": "productos",
            "slug": "sal-de-mesa",
            "title": "Sal de mesa",
            "schema": "product",
            "featured_image": "@hero",
            "tags": ["cocina"],
            "metadata": { "weight": "1 kg" }
        }
    ],
    "menus": {
        "main": [{ "title": "Quiénes somos", "page": "quienes-somos", "children": [{ "title": "Historia", "page": "historia" }] }],
        "footer": [{ "title": "Contacto", "url": "/contacto" }]
    }
}
```

- Every key is optional. **site** updates the site's name, title, description, currency,
  favicon and language (`lang`, an installed language code).
- **media** goes into the media library (with its WebP versions): a `file` in the content
  folder, or a `url` downloaded once and kept in `storage/app/private/content-cache`.
  Anywhere in the file, a value `"@key"` becomes that file's address.
- **schemas** are field groups: `type` is `HOME`, `PAGE` or none (posts), `template` the
  page component. A group with the same name is updated, so loading twice does not repeat it.
  Pages and posts name their group by key, or by the name of one the CMS already has.
- **pages** and **posts** take `body` (HTML, saved as a text block) or `blocks` (the block
  editor's JSON), `excerpt`, `featured_image`, `metadata`, `tags` and `days_ago` (publish date).
  A post's `type` is its post type (`post` for the blog).
- **menus** link to a page of the file (`page`) or an address (`url`), with `children`.
- `{site}` is replaced with the site's address; more `{name}` values come from
  `--var name=value`. A theme's content is loaded all or nothing: a mistake leaves the site as it was.

The `default`, `velvet` and `journal` themes ship examples (`php artisan cms:demo-sites`
loads the last two into two sites).

## Themes in their own repository

A site's theme does not have to live in this repository. Keep it in its own (with its
`content/` folder) and link or copy it into `resources/themes/<slug>` before building:

```bash
git clone git@github.com:acme/emsal.git ../emsal
ln -s ../../../emsal/theme resources/themes/emsal    # or: cp -r ../emsal/theme resources/themes/emsal
npm run build
```

- Git ignores every folder in `resources/themes` except the themes that ship with MewCMS
  (listed in `.gitignore`), so a linked or copied theme is never committed here.
- Vite keeps the linked path (`preserveSymlinks`), so the theme's imports resolve as if it
  were here: `@/` for the CMS's components, `../../default/front/layout` for the default
  theme, and packages from MewCMS's `node_modules`. A theme can't bring packages of its own.
- In a deploy, check out MewCMS at a fixed version, copy the theme in, then build as usual.

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
    "styles": ["css/main.css", { "href": "css/print.css", "media": "print" }, "https://fonts.bunny.net/css?family=lora:400,700"],
    "scripts": [{ "src": "js/menu.js", "position": "body", "defer": true }]
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
