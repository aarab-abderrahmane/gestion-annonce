create extension if not exists pgcrypto;

create table if not exists public.announcement_categories (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  slug text not null unique,
  created_at timestamptz not null default now()
);

create table if not exists public.announcement_category_links (
  announcement_id uuid not null references public.announcements(id) on delete cascade,
  category_id uuid not null references public.announcement_categories(id) on delete cascade,
  created_at timestamptz not null default now(),
  primary key (announcement_id, category_id)
);

create table if not exists public.event_categories (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  slug text not null unique,
  created_at timestamptz not null default now()
);

create table if not exists public.event_category_links (
  event_id uuid not null references public.events(id) on delete cascade,
  category_id uuid not null references public.event_categories(id) on delete cascade,
  created_at timestamptz not null default now(),
  primary key (event_id, category_id)
);

create index if not exists idx_announcement_category_links_category_id
  on public.announcement_category_links (category_id);

create index if not exists idx_event_category_links_category_id
  on public.event_category_links (category_id);
