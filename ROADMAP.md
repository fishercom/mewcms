# MewCMS Project Roadmap & Status

This document tracks the goals accomplished today, the current system status, and pending items for future implementation.

---

## 🚀 Accomplished Today

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

The following phases are planned for the upcoming sessions:

### Phase 7: Premium Dashboard Home (Stats & Reports)
- **Goal:** Replace the basic dashboard landing page with a premium analytics and reports hub containing charts and quick-actions.
- **Tasks:**
  - Build key metric widgets: total articles, active taxonomy terms, file uploads / disk space usage, and contact message submissions.
  - Integrate visual charts (using Recharts or Chart.js) showcasing recent activity, message counts, and log frequency.
  - Create a "Quick Actions" shortcut console (e.g. Write Article, Manage Categories, View Logs).
  - Embed a "Recent Activity Feed" widget drawing from `AdmLog`.
