# Gestionn Annonce App Documentation

Last updated: 2026-03-25

## 1. Purpose

This document describes the current architecture of the `gestion-annonces` application, based on the codebase as it exists today.

It is intended to answer four questions:

1. What the app does
2. How the app is structured
3. How data and permissions work
4. What is required to run, extend, and deploy it safely

This document follows the philosophy from `Desktop/SYSTEM_DESIGN_GUIDE.md`:

- keep the architecture simple
- minimize moving parts
- rely on strong platform primitives instead of custom infrastructure
- optimize for maintainability and speed of execution

## 2. Product Overview

Gestionn Annonce is a centralized communication platform for ISTA Ait Melloul.

It provides:

- a public website for announcements, urgent information, events, search, and an isolated homepage danger ticker
- an admin dashboard for managing published content
- a delegated account system so the main admin can create up to 4 staff accounts with scoped permissions

The platform is Arabic-first, RTL, and styled with a Material Design 3 inspired UI system implemented through CSS tokens and reusable utility classes.

## 3. Core Functional Areas

### Public portal

- Home page with hero carousel, isolated danger ticker, recent announcements, and events
- Announcements listing and announcement detail pages
- Events listing and event detail pages
- Important information page for breaking news archive
- Search page with filters and full-text lookup

### Admin dashboard

- Dashboard overview with summary metrics and recent content
- Danger ticker management with separate content items and banner design customization
- Breaking news management for the important information archive
- Home carousel management
- Announcement management, including file attachments
- Event management, including people and photo gallery
- Categories management
- Structure management for divisions and groups
- Settings page for the current main admin account
- Delegated account management for scoped staff access

## 4. Technology Stack

### Frontend

- Next.js 16 App Router
- React 19
- TypeScript
- Tailwind CSS v4
- Custom Material Design 3 token system in `app/globals.css`
- `lucide-react` for icons

### Backend and data

- Supabase Postgres
- Supabase Auth
- Supabase Storage
- Supabase SSR client helpers
- Postgres functions and Row Level Security policies for authorization

### Validation and utility layer

- `zod` for request and form validation
- shared normalization helpers in `lib/portal-data.ts`

## 5. Architectural Principles In The Current Codebase

The current implementation is consistent with the system guide in several ways:

- the app uses a small stack: Next.js + Supabase
- most business rules are enforced in the database instead of duplicated across many services
- there is no custom backend server outside Next route handlers
- content reads are mostly direct server-side Supabase queries
- media uploads go directly through a controlled API layer to Supabase Storage

One difference from the guide:

- the codebase does not currently contain Cloudflare-specific configuration or edge caching setup; deployment is currently centered around Next.js and Supabase only

## 6. High-Level Architecture

```text
Browser
  -> Next.js App Router pages
    -> Server Components / Route Handlers
      -> Supabase SSR client
        -> Postgres tables + RPC functions + RLS
        -> Storage buckets

Main admin account
  -> full dashboard access via role = admin

Delegated dashboard account
  -> dashboard_accounts + dashboard_account_permissions
  -> access filtered by has_dashboard_access() and has_admin_permission()
```

## 7. Project Structure

```text
app/
  (public)/           Public-facing pages
  (admin)/            Login and dashboard pages
  api/                Route handlers for admin actions, upload, and search
components/
  admin/              Dashboard shell, tables, forms, managers
  public/             Public page-specific components
  shared/             Header, footer, shared layout pieces
  ui/                 Toasts and smaller UI helpers
lib/
  supabase/           Browser, server, middleware, and service-role clients
  admin-*.ts          Permission and dashboard access logic
  portal-data.ts      Data normalization for public pages
  validations.ts      Zod schemas
supabase/migrations/  Database schema, RLS, RPC, and storage policies
docs/                 Project documentation
```

## 8. Route Map

### Public routes

| Route | Purpose |
| --- | --- |
| `/` | Home page |
| `/announcements` | Published announcements list |
| `/announcements/[slug]` | Announcement detail |
| `/important-info` | Published breaking news archive |
| `/events` | Published events list |
| `/events/[slug]` | Event detail page |
| `/search` | Search UI for public content |
| `/login` | Admin login page |

### Admin routes

| Route | Access |
| --- | --- |
| `/dashboard` | Full admin only |
| `/dashboard/danger-news` | Permission-based |
| `/dashboard/breaking-news` | Permission-based |
| `/dashboard/home-carousel` | Permission-based |
| `/dashboard/announcements` | Permission-based |
| `/dashboard/events` | Permission-based |
| `/dashboard/categories` | Permission-based |
| `/dashboard/structure` | Permission-based |
| `/dashboard/accounts` | Full admin only |
| `/dashboard/settings` | Full admin only |

Nested create flows currently exist under module routes such as:

- `/dashboard/announcements/create`
- `/dashboard/events/create`
- `/dashboard/danger-news/create`
- `/dashboard/breaking-news/create`

### API routes

| Route | Purpose |
| --- | --- |
| `/api/danger-news` | CRUD support for isolated homepage danger ticker items |
| `/api/breaking-news` | CRUD support for breaking news |
| `/api/announcements` | CRUD support for announcements |
| `/api/events` | CRUD support for events |
| `/api/categories` | Categories management |
| `/api/upload` | Controlled upload entrypoint for Supabase Storage |
| `/api/search` | Public search endpoint |
| `/api/admin-accounts` | Delegated dashboard account creation |
| `/api/admin-accounts/[id]` | Delegated dashboard account update and deletion |

Note: `/api/auth/[...nextauth]` is a placeholder endpoint and currently returns `501 Not Implemented`. Authentication is handled by Supabase Auth, not NextAuth.

## 9. Rendering, Data Fetching, And Caching

The app uses a mixed rendering model.

### Explicit revalidation

- Home page: `revalidate = 30`
- Important info page: `revalidate = 30`
- Announcements list/detail: `revalidate = 60`

### Dynamic routes

- Events list uses `dynamic = 'force-dynamic'`
- Event detail uses `dynamic = 'force-dynamic'`
- Event detail also exposes `generateStaticParams()` and `generateMetadata()`

### API caching

- `app/api/_utils.ts` defines `PUBLIC_CACHE_CONTROL = 'public, s-maxage=300'`
- `cachedJson()` is available for cache-friendly route responses

### Image delivery

`next.config.ts` allows optimized remote images from:

- Supabase Storage public URLs
- Unsplash
- Picsum
- UI Avatars

## 10. UI System

The UI is built on top of a custom Material Design 3 token layer defined in `app/globals.css`.

### Key characteristics

- Arabic-first typography with `IBM Plex Sans Arabic` and `Tajawal`
- Global RTL layout through `dir="rtl"` at the application root
- CSS custom properties for color roles, shape tokens, and elevation
- reusable classes such as `md-card-elevated`
- reusable classes such as `md-card-filled`
- reusable classes such as `md-card-outlined`
- reusable classes such as `md-btn`
- reusable classes such as `md-state`

### Shared shell

- `app/layout.tsx` sets metadata, RTL direction, `ToastProvider`, and service worker registration
- `app/(public)/layout.tsx` wraps the public experience with shared header and footer
- `app/(admin)/layout.tsx` injects `AdminShell` only for authenticated dashboard users

## 11. Authentication And Session Flow

### Authentication provider

Authentication is handled by Supabase Auth.

### Clients

- `lib/supabase/client.ts` creates the browser client
- `lib/supabase/server.ts` creates the server-side SSR client
- `lib/supabase/middleware.ts` refreshes the session for protected dashboard routes
- `lib/supabase/admin.ts` creates a service-role client for delegated account provisioning

### Middleware behavior

Root `middleware.ts` matches only:

```text
/dashboard/:path*
```

This means:

- dashboard routes are session-aware at the middleware layer
- `/login` is not protected by middleware
- public pages remain publicly accessible

### Admin login behavior

`components/admin/LoginForm.tsx` signs in with email/password through Supabase Auth, then immediately calls `has_dashboard_access()` to verify that the authenticated user is allowed into the dashboard.

If the user has no dashboard access:

- the session is closed
- an error is shown
- the user remains outside the admin area

## 12. Authorization Model

Authorization is split into two levels.

### Level 1: Full admin

A user is considered a full admin when `public.is_admin()` returns `true`.

Current implementation checks the authenticated user's metadata:

- `raw_app_meta_data.role = 'admin'`, or
- `raw_user_meta_data.role = 'admin'`

Full admins have unrestricted access to all dashboard resources.

### Level 2: Delegated dashboard account

Delegated accounts are stored in:

- `public.dashboard_accounts`
- `public.dashboard_account_permissions`

These users are real Supabase Auth users, but their app-level access is controlled by database tables and RPC functions.

### Permission resources

The current permission model supports these resources:

- `danger_news`
- `breaking_news`
- `home_carousel`
- `announcements`
- `events`
- `categories`
- `structure`

### Supported actions

- `view`
- `create`
- `update`
- `delete`
- `publish`

### Important permission rules

- `can_view` is required if any other action is enabled
- delegated accounts are limited to 4 total records across the system
- a disabled delegated account cannot access the dashboard
- full admins always bypass delegated permission checks

## 13. Dashboard Access Logic In Code

The main server-side access logic lives in `lib/admin-access.ts`.

### Key functions

| Function | Purpose |
| --- | --- |
| `getAdminAccess()` | Resolves current user, role, permissions, and allowed navigation |
| `requireDashboardAccess()` | Blocks users without dashboard access |
| `requireFullAdminAccess()` | Blocks delegated users from full-admin pages |
| `requireAdminPageAccess(resource, action)` | Protects permission-scoped pages |

### Navigation model

Navigation items are defined centrally in `lib/admin-permissions.ts`.

The visible admin sidebar is generated from permissions rather than hardcoded per user, which keeps the UI aligned with the underlying authorization rules.

## 14. Database Schema Overview

### 14.1 Core content tables

#### `divisions`

- top-level academic divisions
- fields: `id`, `name`, `slug`, `created_at`

#### `groups`

- groups belonging to a division
- foreign key: `division_id -> divisions.id`

#### `breaking_news`

- urgent notices
- fields: `title`, `slug`, `level`, `status`, `created_at`, `expires_at`
- `level` is one of: `dangerous`, `urgent`, `warning`

#### `danger_news`

- isolated homepage ticker items
- separate from `breaking_news` and not used by `/important-info`
- fields: `title`, `status`, `created_at`, `expires_at`, `deleted_at`, `deleted_by`

#### `danger_news_settings`

- singleton settings row for the homepage ticker
- fields include `is_enabled`, `badge_label`, `title`, `speed_seconds`, `max_items`, `separator`
- design fields include `icon_name`, `gradient_from_color`, `gradient_to_color`, `accent_color`, `text_color`

#### `announcements`

- standard institutional announcements
- linked to `divisions`
- optionally linked to `groups`
- publication control through `status`, `published_at`, `expires_at`

#### `announcement_files`

- file attachments for announcements
- supports `pdf` and `image`
- storage URLs are stored in `file_url`

#### `announcement_categories`

- announcement taxonomy table

#### `announcement_category_links`

- many-to-many table between announcements and categories

#### `events`

- event core record
- fields include `cover_image`, `location`, `starts_at`, `ends_at`, `total_attendees`, `status`

#### `event_people`

- people linked to events
- `type` is `participant` or `organizer`

#### `event_photos`

- gallery images linked to events

#### `event_categories`

- event taxonomy table

#### `event_category_links`

- many-to-many table between events and categories

#### `home_carousel_slides`

- homepage hero carousel content
- supports title, subtitle, image, CTA label, target, sort order, and publication status

### 14.2 Delegated admin tables

#### `dashboard_accounts`

- maps a Supabase Auth user to an internal delegated dashboard record
- fields include `user_id`
- fields include `full_name`
- fields include `email`
- fields include `status`
- fields include `created_by`
- includes `created_at` and `updated_at`

#### `dashboard_account_permissions`

- one row per resource per delegated account
- stores `can_view`
- stores `can_create`
- stores `can_update`
- stores `can_delete`
- stores `can_publish`

### 14.3 Important database functions

| Function | Purpose |
| --- | --- |
| `is_admin()` | Determines whether the current auth user is a full admin |
| `has_dashboard_access()` | Checks if the current user can enter the dashboard at all |
| `has_admin_permission(resource_name, action_name)` | Checks a specific delegated permission |
| `search_public_content(...)` | Performs public full-text search |
| `set_home_carousel_slides_updated_at()` | Trigger helper for slide updates |
| `set_dashboard_accounts_updated_at()` | Trigger helper for delegated account updates |
| `set_dashboard_account_permissions_updated_at()` | Trigger helper for delegated permission updates |
| `enforce_dashboard_account_limit()` | Enforces the global max of 4 delegated accounts |

## 15. Row Level Security Strategy

The app relies heavily on RLS.

### Public read access

Anonymous and authenticated public users can read:

- published announcements
- published breaking news
- published events
- divisions and groups
- announcement and event categories
- only files and relational rows that belong to published parent content
- published home carousel slides

### Dashboard write access

Authenticated dashboard users can modify only the resources allowed by:

- `is_admin()`, or
- `has_admin_permission(resource, action)`

This is important because security is not only enforced in the frontend or in API handlers. The database itself rejects unauthorized reads and writes.

### Publish protection

For several resources, insert and update policies include extra checks so that:

- users may create or edit drafts with `create` or `update`
- publishing a record requires `publish`

That rule is applied to:

- breaking news
- announcements
- events
- home carousel slides

## 16. Storage Model

### Buckets

The application currently uses these public buckets:

- `announcements`
- `events`
- `home-carousel`

### Upload flow

1. The browser sends a multipart request to `/api/upload`
2. The route validates the file type and size
3. The route checks bucket-specific permissions
4. The file is uploaded to Supabase Storage
5. A public URL is returned and stored in the relevant table

### File validation

Current validation rules in `lib/validations.ts`:

- maximum file size: 10 MB
- allowed types: PDF and images

### Storage authorization

Storage insert/delete policies are aligned with dashboard permissions:

- announcement uploads require announcement create/update rights
- event uploads require event create/update rights
- carousel uploads require home carousel create/update rights

## 17. Search Architecture

Public search is backed by the database function `search_public_content`.

### Search sources

- announcements
- events
- breaking news

### Search behavior

- full-text matching via `to_tsvector` and `plainto_tsquery`
- optional type filtering
- optional date range filtering
- merged result set ordered by descending date

### App behavior

`lib/search.ts` uses the RPC search function first and falls back to direct Supabase queries plus local filtering if needed.

This gives the app a fast primary path without making search entirely dependent on one function call.

## 18. Admin Account Provisioning

Delegated accounts are managed through:

- UI: `components/admin/AdminAccountsManager.tsx`
- page: `app/(admin)/dashboard/accounts/page.tsx`
- API: `app/api/admin-accounts/route.ts`
- API: `app/api/admin-accounts/[id]/route.ts`

### Creation flow

1. Full admin submits account details and permissions
2. Route validates input with Zod
3. Service-role client creates a Supabase Auth user
4. App inserts the corresponding `dashboard_accounts` row
5. App inserts `dashboard_account_permissions`
6. The new user can sign in only if `has_dashboard_access()` returns `true`

### Required secret

Delegated account provisioning requires:

```env
SUPABASE_SERVICE_ROLE_KEY=
```

This must be the privileged service-role key, not the publishable key.

## 19. Environment Variables

The project currently expects:

```env
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_ANON_KEY=
SUPABASE_SERVICE_ROLE_KEY=
NEXT_PUBLIC_TURNSTILE_SITE_KEY=
NEXT_PUBLIC_SITE_URL=
SITE_URL=
NEXT_PUBLIC_SUPABASE_STORAGE_BUCKET=
```

### Notes

- `NEXT_PUBLIC_SUPABASE_URL`: Supabase project URL
- `NEXT_PUBLIC_SUPABASE_ANON_KEY`: browser-safe public key
- `SUPABASE_SERVICE_ROLE_KEY`: server-only secret used for delegated account provisioning
- `NEXT_PUBLIC_TURNSTILE_SITE_KEY`: required by the dashboard login page captcha
- `NEXT_PUBLIC_SITE_URL` or `SITE_URL`: recommended so canonical URLs and metadata point to the real production domain
- `NEXT_PUBLIC_SUPABASE_STORAGE_BUCKET`: optional override for the announcements bucket name; defaults to `announcements`

Never expose `SUPABASE_SERVICE_ROLE_KEY` in client code or any `NEXT_PUBLIC_*` variable.

## 20. Local Development

### Minimum setup

1. Install dependencies
2. Create `.env.local`
3. Add the required environment variables
4. Apply all Supabase migrations in `supabase/migrations/`, or bootstrap a fresh project with `supabase/full-reset.sql`
5. Run the development server

### Commands

```bash
npm install
npm run dev
```

### Linting

```bash
npm run lint
```

Note: at the time of writing, there are unrelated legacy lint issues in some untouched files, so lint status should be interpreted carefully when validating new work.

## 21. Deployment Notes

The current codebase is well-suited for deployment on Vercel with Supabase as the backend.

### Recommended deployment shape

- Next.js application deployed on Vercel
- Supabase for database, auth, RPC, and storage
- environment variables configured in the deployment platform

### Required production checks

- verify all Supabase migrations have run
- for a fresh database, `supabase/full-reset.sql` is the fastest bootstrap path
- verify the admin user's metadata includes `role = admin`
- verify `SUPABASE_SERVICE_ROLE_KEY` is present server-side
- verify `NEXT_PUBLIC_TURNSTILE_SITE_KEY` is configured in the app and Turnstile is configured in Supabase Auth
- verify `NEXT_PUBLIC_SITE_URL` or `SITE_URL` matches the deployed domain
- verify storage buckets and policies exist
  - `announcements`
  - `events`
  - `home-carousel`
- verify remote image hosts match actual storage URLs
- verify `/dashboard/danger-news` and `/important-info` work independently, since the danger ticker is now isolated from breaking news

## 22. Current Strengths

- small and understandable stack
- authorization enforced in the database
- delegated access model implemented end to end
- Arabic RTL experience is a first-class concern
- public and admin surfaces are clearly separated
- storage access is permission-aware

## 23. Current Limitations And Technical Debt

- `README.md` and `docs/APP_DOCUMENTATION.md` now overlap heavily and can drift if one is updated without the other
- some public routes still use `components/legacy/*`
- rendering strategy is mixed, with some pages explicitly dynamic and others using ISR
- there is no Cloudflare layer or edge-specific setup in the current repo
- Next.js 16 warns that `middleware.ts` should migrate to the newer `proxy` convention
- `/api/auth/[...nextauth]` is only a placeholder and may confuse future maintainers if left undocumented

## 24. Recommended Next Documentation Files

If the project grows, the next useful documents would be:

1. `docs/DB_SCHEMA.md` for table-by-table and policy-by-policy database reference
2. `docs/DEPLOYMENT.md` for production rollout and migration procedures
3. `docs/ADMIN_PERMISSIONS.md` for permission matrix and onboarding rules
4. `docs/CONTENT_WORKFLOW.md` for admin operational usage

## 25. Summary

Gestionn Annonce is a focused institutional content platform built with a deliberately small architecture:

- Next.js for application delivery
- Supabase for auth, database, RPC, and storage
- Postgres RLS for real authorization
- a separate danger ticker system for homepage alerts
- a scoped delegated-admin model for safe team workflows

The codebase already supports the core workflows of a school communication platform, and its strongest architectural choice is that the permission model is enforced close to the data, not only in the UI.
