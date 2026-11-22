# MewCMS Project Roadmap & Status

This document tracks what has been delivered, the current system status, and pending items for future implementation. The newest work is at the top.

---

## 🚀 November 8–22, 2026 (pull requests #49 to #75)

### Themes and site content out of the core
- The database seeder now creates only what the admin needs. Demo content moved into each theme's optional `content/content.json`, loaded with `php artisan cms:content-import <theme>` (with `--fresh` and `--if-changed`). `cms:demo-sites` builds the pet demo from the `velvet` and `journal` themes.
- Themes can live in their own repository and be linked into `resources/themes/<slug>`; git ignores theme folders that do not ship with MewCMS.
- The Editorial demo theme was removed. The bundled themes are `default`, `velvet` and `journal`.
- The default theme was redesigned (light, violet accent, Plus Jakarta Sans, dark mode kept) with new starting content: home, features, about, contact, legal pages and four posts.
- `theme.json` gained `dark_mode` (light-only themes), `ai_blocks` (the blocks the AI may draft with) and `layout_fields` (the theme's own settings in *Personalizar Layout*).

### Blocks, sliders and listings
- Themes can bring their own block types and restyle CMS blocks; block keys must not reuse a core key. A theme can draw a public form with `useFrontForm`.
- Block previews in the editor use the site's theme stylesheet and fonts, show the real slider and posts of a block, and show the theme's texts instead of their keys.
- Slides gained a phone image, a video, a secondary image, a button text and a dark text option. A page can show several sliders. Sliders are listed by name in the admin.
- Pages can have a parent, for breadcrumbs. Posts get related posts that share a tag.
- New custom field types: `posts` (the latest posts of a type) and `video`.
- Post types choose paging and sort order. Their listing page is found from the pages' content (the page showing a *Lista de posts* of that kind), and entries take their banner and back link from it. Post types got their sidebar entry back.

### Admin panel
- Client branding (*Marca del panel*, under the user menu's Settings → Sistema, super admins only): client name, subtitle, logos and icon replace MewCMS's in the sidebar, login and footer. A name alone turns it on. Uploaded SVGs are sanitized.
- MewCMS SVG logos rebuilt in `public/brand` from the Sora font, with the script that generates them. The PRO badge is gone and the login shares the sidebar's logo layout.
- Admin footer with one credit line, the AGPL v3 license, a link to mewcms.com and the CMS version from the new `VERSION` file.
- The *Parámetros* module and the generic *Configuración* editor were removed; *Asistente IA* settings are now for super admins.
- The footer credit accepts `{year}`. Field text selection uses the browser's own colours.
- No client names remain in the CMS (examples and test fixtures use generic names).

### Licensing
- MewCMS is now licensed under the GNU AGPL v3 (AGPL-3.0-only).

### Fixes
- Switching sites from a record's editor no longer gives a 404; it lands on the module's list.
- Content import on a fresh MySQL site: setting names can be up to 100 characters, and imported posts are no longer dated in the future.
- The importer resolves a favicon that points to an imported media file.
- "View site" skips a local site URL when the CMS is reached on a public address.

---

## 🗂️ Earlier Phases

### Phase 7: Premium Dashboard Home (Stats & Reports)
We replaced the basic admin dashboard placeholder layout with a premium operations control panel:
- **Key Metrics Console:** Integrated a responsive widgets panel tracking total/active articles, taxonomy terms count, unread/read contact message submissions (`CmsRegister`), and active file count & total formatted disk size inside the `public` storage disk.
- **Custom Interactive SVG Charts:** Implemented two responsive SVG chart components: a grouped monthly growth bar chart (Articles vs Messages) and a daily activity trend area chart (log entries frequency over 15 days), featuring gradients and interactive hover-effects.
- **Operations Panel & History:** Created a quick-actions shortcut console (Escribir Artículo, Taxonomías, Mensajes, Menús, Configuración) and a live activity feed showing the 10 most recent system log logs (`AdmLog`) with usernames and relative timestamps.
- **SQLite-Friendly Controller:** Built [DashboardController.php](app/Http/Controllers/Admin/DashboardController.php) using in-memory collection mapping for monthly/daily group metrics, securing 100% compatibility with SQLite in automated test runs.
- **Verification:** Updated [DashboardTest.php](tests/Feature/DashboardTest.php) to assert dashboard metrics structure and mapping. Passed all tests, linters, and Vite production builds.

### Phase 6: Media Manager & TipTap Integration
We streamlined media selection, folder navigation, and visual file insertion directly within the article authoring experience:
- **Tiptap Image Integration:** Configured `@tiptap/extension-image` in our WYSIWYG editor to support native rendering of inline images.
- **QuickMediaDrawer Component:** Created [quick-media-drawer.tsx](resources/js/components/quick-media-drawer.tsx), a slides-out panel supporting directory browsing, subfolder traversal, creation of directories, and asynchronous multi-file uploads with real-time progress bars, communicating directly with Laravel Filemanager (LFM) JSON APIs.
- **Editor & Admin Pane Hookup:** Integrated the drawer inside the TipTap editor toolbar to allow clicking to select and insert images directly. Also added a global "Gestor de Medios" shortcut button in Article Create and Edit admin views for rapid asset uploads without leaving the page.
- **Testing & Diagnostics:** Developed feature tests in [FrontMediaTest.php](tests/Feature/FrontMediaTest.php) targeting folder creation, uploading files, and listing items via LFM endpoints. Verified 100% test passes, TypeScript compilation, and ESLint rules.

### Phase 5: Front Navigation Menu System
We implemented a dynamic navigation menu system that allows administrators to manage and sort public header/footer links from the dashboard:
- **Database:** Created migrations for `cms_menus` and `cms_menu_items`, and registered the "Menús" module under the CMS section in the admin sidebar.
- **Backend Models:**
  - `CmsMenu`: Handles sluggable slugs.
  - `CmsMenuItem`: Supports custom URLs or links to CMS Articles with auto-resolving URLs via the `resolved_url` attribute, and parent-child nesting.
- **Admin Builder Dashboard:** Implemented a split-pane menu editor in `edit.tsx` featuring a drag-and-drop structural list using `react-sortablejs` and an add/edit form.
- **Inertia Global Sharing:** Configured `HandleInertiaRequests` to query active menus and share them globally under the `menus` prop.
- **Dynamic Frontend Header:** Updated the frontend layout header to fetch links dynamically from the shared `header` menu, including hover dropdowns for nested items.
- **Verification:** Wrote `FrontMenuTest.php` to verify CRUD and dynamic resolution. All tests, ESLint, TypeScript, and Vite builds passed successfully.

### Phase 4: Frontend Taxonomy Rendering
We completed the frontend rendering and public routing system for categories and tags:
- **Routing:** Registered public listing paths `/category/{slug}` and `/tag/{slug}` mapping to dedicated term-filtering methods in `FrontController`.
- **Controller Eager Loading:** Updated the catch-all dynamic route handler to eager load term relationships on frontend pages, along with fetching recent posts and taxonomy-term post counts.
- **Reusable Sidebar Component:** Added a responsive layout sidebar (`sidebar.tsx`) that embeds recent article links, a category directory, and a tag cloud.
- **Dynamic Post and Page Layouts:** Integrated category links and tag badges in `post.tsx` and `page.tsx` using responsive Tailwind grids.
- **Dedicated Public Template:** Created `term-list.tsx` to list matching articles for a chosen category or tag in a clean grid alongside the global sidebar.
- **Feature Verification:** Created and executed a new test suite (`FrontTaxonomyTest.php`) verifying routes return 200 and filter correctly. Passed all ESLint, TypeScript, and Vite production builds.

### Phase 3: Taxonomy System
We completed the full integration of a WordPress-style Taxonomy system (Categories and Tags) for managing articles:
- **Database:** Added migrations for `cms_taxonomies` (groups), `cms_taxonomy_terms` (nested/hierarchical terms), and `cms_article_term` (pivot table).
- **Backend Models:**
  - `CmsTaxonomy`: Has many terms; manages taxonomy groups.
  - `CmsTaxonomyTerm`: Supports parent-child hierarchies, sorting via `SortableTrait`, auto-generated slugs via `Sluggable`, and connects to articles.
  - `CmsArticle`: Linked to terms via many-to-many relationship.
- **Admin Dashboard CRUD:**
  - Standard resource CRUD routes and controllers for taxonomies and nested terms.
  - Full React UI pages for managing taxonomy groups, hierarchical term listings, and nested parents.
  - Updated article edit/create forms with a term selection checkbox grid organized by taxonomy type.
- **Verification:**
  - Passed TypeScript type-checking (`npx tsc --noEmit`).
  - Passed ESLint rules (`npm run lint`).
  - Passed Vite asset production build (`npm run build`).
  - Passed entire Pest/PHP feature test suite (`php artisan test`).
- **Git:** All changes staged, committed, and pushed successfully to `main`.

---

## 📊 Current Status

- The CMS is at version `1.0.75` (see [`VERSION`](VERSION)).
- One install serves several sites by domain, each with its own theme, content and settings. See the [README](README.md) and the [themes guide](resources/themes/README.md).
- The public demo at https://mewcms.onrender.com reloads the default theme's starting content on deploy (`DEMO_CONTENT=default` in `render.yaml`).

---

## 📝 Pending Goals / Next Steps

No phase is scheduled right now. New phases are added here as they are planned.
