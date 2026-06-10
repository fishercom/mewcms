# MewCMS Project Roadmap & Status

This document tracks the goals accomplished today, the current system status, and pending items for future implementation.

---

## 🚀 Accomplished Today

### Phase 7: Premium Dashboard Home (Stats & Reports)
We replaced the basic admin dashboard placeholder layout with a premium operations control panel:
- **Key Metrics Console:** Integrated a responsive widgets panel tracking total/active articles, taxonomy terms count, unread/read contact message submissions (`CmsRegister`), and active file count & total formatted disk size inside the `public` storage disk.
- **Custom Interactive SVG Charts:** Implemented two responsive SVG chart components: a grouped monthly growth bar chart (Articles vs Messages) and a daily activity trend area chart (log entries frequency over 15 days), featuring gradients and interactive hover-effects.
- **Operations Panel & History:** Created a quick-actions shortcut console (Escribir Artículo, Taxonomías, Mensajes, Menús, Configuración) and a live activity feed showing the 10 most recent system log logs (`AdmLog`) with usernames and relative timestamps.
- **SQLite-Friendly Controller:** Built [DashboardController.php](file:///Users/fischer/Projects/mewcms/app/Http/Controllers/Admin/DashboardController.php) using in-memory collection mapping for monthly/daily group metrics, securing 100% compatibility with SQLite in automated test runs.
- **Verification:** Updated [DashboardTest.php](file:///Users/fischer/Projects/mewcms/tests/Feature/DashboardTest.php) to assert dashboard metrics structure and mapping. Passed all tests, linters, and Vite production builds.

### Phase 6: Media Manager & TipTap Integration
We streamlined media selection, folder navigation, and visual file insertion directly within the article authoring experience:
- **Tiptap Image Integration:** Configured `@tiptap/extension-image` in our WYSIWYG editor to support native rendering of inline images.
- **QuickMediaDrawer Component:** Created [quick-media-drawer.tsx](file:///Users/fischer/Projects/mewcms/resources/js/components/quick-media-drawer.tsx), a slides-out panel supporting directory browsing, subfolder traversal, creation of directories, and asynchronous multi-file uploads with real-time progress bars, communicating directly with Laravel Filemanager (LFM) JSON APIs.
- **Editor & Admin Pane Hookup:** Integrated the drawer inside the TipTap editor toolbar to allow clicking to select and insert images directly. Also added a global "Gestor de Medios" shortcut button in Article Create and Edit admin views for rapid asset uploads without leaving the page.
- **Testing & Diagnostics:** Developed feature tests in [FrontMediaTest.php](file:///Users/fischer/Projects/mewcms/tests/Feature/FrontMediaTest.php) targeting folder creation, uploading files, and listing items via LFM endpoints. Verified 100% test passes, TypeScript compilation, and ESLint rules.

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

## 📊 Current Status & Diagnostics

### 1. Storage & File Manager Assets
- The symbolic link at `public/storage` correctly points to `storage/app/public`.
- **Diagnostic check:** Requesting uploaded assets via URL (e.g. `http://127.0.0.1:8000/storage/photos/1/ChatGPT Image May 13, 2025 at 11_12_00 AM.png`) returns **`HTTP/1.1 200 OK`**.
- *If any uploaded image doesn't display in a browser, it is likely due to client-side caching or local browser extensions.*

### 2. Base Application Routing
- Public routing catches all dynamic slugs, maps templates, and loads schemas successfully.

---

## 📝 Pending Goals / Next Steps

All scheduled phases of the initial CMS roadmap have been successfully implemented, verified, and committed! Additional customization phases can be planned as needed.
