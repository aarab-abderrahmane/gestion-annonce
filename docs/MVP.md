# Gestion Annonce MVP

Last updated: 2026-03-25

## 1. Project

Gestion Annonce is a centralized communication platform for ISTA Ait Melloul.

The MVP is focused on giving the institute:

- a public portal for official communication
- a secure admin dashboard for content management
- delegated staff access with scoped permissions

## 2. MVP Goal

The goal of the MVP is to launch a first usable version that allows the school to:

- publish announcements
- share urgent news
- present events
- manage homepage highlights
- organize academic structure
- control admin access safely

## 3. Target Users

- public visitors: students, trainees, staff, and general visitors
- main admin: full control of the platform
- delegated staff accounts: limited dashboard access based on assigned permissions

## 4. Public MVP Features

- home page with hero carousel and recent content
- announcements page with list and detail view
- events page with list and detail view
- breaking news / important information page
- search page for public content
- responsive layout for mobile and desktop
- Arabic-first RTL interface

## 5. Admin MVP Features

- secure login page
- admin dashboard access protection
- breaking news management
- announcement management
- event management
- category management
- home carousel management
- structure management for divisions and groups
- delegated account management with scoped permissions

## 6. MVP Content Types

- breaking news
- announcements
- events
- home carousel slides
- announcement categories
- event categories
- divisions
- groups

## 7. MVP Security Baseline

- Supabase Auth for login
- Cloudflare Turnstile on login form
- protected dashboard routes
- role-based and permission-based access
- Row Level Security in the database
- restricted storage access for uploads

## 8. Technical MVP Stack

- Next.js
- React
- TypeScript
- Tailwind CSS
- Supabase Auth
- Supabase Postgres
- Supabase Storage

## 9. MVP Success Criteria

- public visitors can access published content without logging in
- admin can create, edit, and publish content from the dashboard
- delegated users can access only their allowed sections
- uploaded files and images work correctly
- search returns relevant public results
- login and dashboard access are protected
- the app works correctly on mobile and desktop

## 10. Out Of Scope For MVP

- advanced analytics
- notifications
- multi-language support beyond the current setup
- audit logs
- advanced rate limiting and WAF hardening
- workflow approvals
- content version history

## 11. MVP Outcome

At MVP stage, the platform should be ready to serve as the school's official public communication portal with a secure admin area for content management and controlled staff access.
