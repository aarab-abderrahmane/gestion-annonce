create extension if not exists pgcrypto;

create table if not exists public.divisions (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  slug text not null unique,
  created_at timestamptz not null default now()
);

create table if not exists public.groups (
  id uuid primary key default gen_random_uuid(),
  division_id uuid not null references public.divisions(id) on delete cascade,
  name text not null,
  slug text not null unique,
  created_at timestamptz not null default now()
);

create table if not exists public.breaking_news (
  id uuid primary key default gen_random_uuid(),
  title text not null,
  slug text not null unique,
  level text not null check (level in ('dangerous', 'urgent', 'warning')),
  status text not null default 'draft' check (status in ('draft', 'published')),
  created_at timestamptz not null default now(),
  expires_at timestamptz
);

create table if not exists public.announcements (
  id uuid primary key default gen_random_uuid(),
  title text not null,
  slug text not null unique,
  description text,
  division_id uuid not null references public.divisions(id) on delete restrict,
  group_id uuid references public.groups(id) on delete set null,
  status text not null default 'draft' check (status in ('draft', 'published')),
  published_at timestamptz,
  expires_at timestamptz,
  created_at timestamptz not null default now()
);

create table if not exists public.events (
  id uuid primary key default gen_random_uuid(),
  title text not null,
  slug text not null unique,
  description text,
  cover_image text,
  location text,
  starts_at timestamptz not null,
  ends_at timestamptz not null,
  total_attendees integer not null default 0 check (total_attendees >= 0),
  status text not null default 'draft' check (status in ('draft', 'published')),
  created_at timestamptz not null default now()
);

create table if not exists public.event_people (
  id uuid primary key default gen_random_uuid(),
  event_id uuid not null references public.events(id) on delete cascade,
  name text not null,
  role text not null,
  type text not null check (type in ('participant', 'organizer')),
  created_at timestamptz not null default now()
);

create table if not exists public.event_photos (
  id uuid primary key default gen_random_uuid(),
  event_id uuid not null references public.events(id) on delete cascade,
  photo_url text not null,
  created_at timestamptz not null default now()
);

create index if not exists idx_groups_division_id
  on public.groups (division_id);

create index if not exists idx_breaking_news_status_created_at
  on public.breaking_news (status, created_at desc);

create index if not exists idx_announcements_division_id
  on public.announcements (division_id);

create index if not exists idx_announcements_group_id
  on public.announcements (group_id);

create index if not exists idx_announcements_status_published_at
  on public.announcements (status, published_at desc);

create index if not exists idx_events_status_starts_at
  on public.events (status, starts_at desc);

create index if not exists idx_event_people_event_id
  on public.event_people (event_id);

create index if not exists idx_event_photos_event_id
  on public.event_photos (event_id);
