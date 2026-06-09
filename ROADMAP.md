# MewCMS Project Roadmap & Status

This document tracks the goals accomplished today, the current system status, and pending items for future implementation.

---

## 🚀 Accomplished Today (Phase 3: Taxonomy System)

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

### Phase 4: Frontend Taxonomy Rendering
- **Goal:** Display categories and tags dynamically on frontend templates.
- **Tasks:**
  - Show categories and tags on individual article pages (`front/templates/page.tsx` and `post.tsx`).
  - Add tag listing/clouds to layout sidebars.
  - Create dedicated public templates and routing for taxonomy listing pages (e.g. `/category/tecnologia` or `/tag/php` listing all tagged articles).

### Phase 5: Front Navigation Menu System
- **Goal:** Allow administrators to dynamically manage public menu links from the dashboard.
- **Tasks:**
  - Create database tables and models for frontend menus (`cms_menus`, `cms_menu_items`).
  - Implement a drag-and-drop navigation editor in the admin panel.
  - Update `HandleInertiaRequests` middleware to share menu items globally with the layout header/footer.

### Phase 6: Media Manager & TipTap Integration
- **Goal:** Streamline media selection and visual insertion.
- **Tasks:**
  - Embed direct file manager lookup in TipTap editor image tools.
  - Implement bulk uploads and directory creation from the article editor.

### Phase 7: Premium Dashboard Home (Stats & Reports)
- **Goal:** Replace the basic dashboard landing page with a premium analytics and reports hub containing charts and quick-actions.
- **Tasks:**
  - Build key metric widgets: total articles, active taxonomy terms, file uploads / disk space usage, and contact message submissions.
  - Integrate visual charts (using Recharts or Chart.js) showcasing recent activity, message counts, and log frequency.
  - Create a "Quick Actions" shortcut console (e.g. Write Article, Manage Categories, View Logs).
  - Embed a "Recent Activity Feed" widget drawing from `AdmLog`.
