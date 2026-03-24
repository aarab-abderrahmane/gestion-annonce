-- ============================================
-- ISTA AIT MELLOUL — FULL DATABASE RESET
-- Fresh setup for this project
-- ============================================

create extension if not exists "pgcrypto";

-- ============================================
-- 1. TABLES
-- ============================================

create table if not exists public.divisions (
  id uuid primary key default gen_random_uuid(),
  name varchar(50) not null,
  slug varchar(50) not null unique,
  created_at timestamptz not null default now()
);

create table if not exists public.groups (
  id uuid primary key default gen_random_uuid(),
  division_id uuid not null references public.divisions(id) on delete cascade,
  name varchar(50) not null,
  slug varchar(50) not null unique,
  created_at timestamptz not null default now()
);

create table if not exists public.breaking_news (
  id uuid primary key default gen_random_uuid(),
  title varchar(150) not null,
  slug varchar(200) not null unique,
  level text not null check (level in ('dangerous', 'urgent', 'warning')),
  status text not null default 'published' check (status in ('draft', 'published')),
  created_at timestamptz not null default now(),
  expires_at timestamptz not null
);

create table if not exists public.announcement_categories (
  id uuid primary key default gen_random_uuid(),
  name varchar(100) not null,
  slug varchar(100) not null unique,
  created_at timestamptz not null default now()
);

create table if not exists public.announcements (
  id uuid primary key default gen_random_uuid(),
  title varchar(150) not null,
  slug varchar(200) not null unique,
  description text,
  division_id uuid not null references public.divisions(id),
  group_id uuid references public.groups(id),
  status text not null default 'draft' check (status in ('draft', 'published')),
  published_at timestamptz not null default now(),
  expires_at timestamptz
);

create table if not exists public.announcement_files (
  id uuid primary key default gen_random_uuid(),
  announcement_id uuid not null references public.announcements(id) on delete cascade,
  file_url text not null,
  file_name text,
  file_type text not null check (file_type in ('pdf', 'image')),
  created_at timestamptz not null default now()
);

create table if not exists public.announcement_category_links (
  announcement_id uuid not null references public.announcements(id) on delete cascade,
  category_id uuid not null references public.announcement_categories(id) on delete cascade,
  primary key (announcement_id, category_id)
);

create table if not exists public.event_categories (
  id uuid primary key default gen_random_uuid(),
  name varchar(100) not null,
  slug varchar(100) not null unique,
  created_at timestamptz not null default now()
);

create table if not exists public.events (
  id uuid primary key default gen_random_uuid(),
  title varchar(150) not null,
  slug varchar(200) not null unique,
  description text,
  cover_image text,
  location varchar(200),
  starts_at timestamptz not null,
  ends_at timestamptz not null,
  total_attendees integer not null default 0,
  status text not null default 'draft' check (status in ('draft', 'published')),
  created_at timestamptz not null default now()
);

create table if not exists public.event_people (
  id uuid primary key default gen_random_uuid(),
  event_id uuid not null references public.events(id) on delete cascade,
  name varchar(100),
  role varchar(100),
  type text check (type in ('participant', 'organizer'))
);

create table if not exists public.event_photos (
  id uuid primary key default gen_random_uuid(),
  event_id uuid not null references public.events(id) on delete cascade,
  photo_url text,
  created_at timestamptz not null default now()
);

create table if not exists public.event_category_links (
  event_id uuid not null references public.events(id) on delete cascade,
  category_id uuid not null references public.event_categories(id) on delete cascade,
  primary key (event_id, category_id)
);

create table if not exists public.home_carousel_slides (
  id uuid primary key default gen_random_uuid(),
  title text not null,
  subtitle text not null,
  image_url text not null,
  cta_label text not null,
  target text not null check (target in ('home', 'announcements', 'important-info', 'events')),
  sort_order integer not null default 1 check (sort_order >= 1),
  status text not null default 'draft' check (status in ('draft', 'published')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- ============================================
-- 2. INDEXES
-- ============================================

create index if not exists idx_breaking_news_status on public.breaking_news(status);
create index if not exists idx_announcements_status on public.announcements(status);
create index if not exists idx_events_status on public.events(status);
create index if not exists idx_home_carousel_slides_status_sort_order
  on public.home_carousel_slides(status, sort_order asc, created_at asc);

create index if not exists idx_announcement_files_announcement_id
  on public.announcement_files(announcement_id);

create index if not exists idx_event_people_event_id
  on public.event_people(event_id);

create index if not exists idx_event_photos_event_id
  on public.event_photos(event_id);

-- ============================================
-- 3. TRIGGER
-- ============================================

create or replace function public.set_home_carousel_slides_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists trg_home_carousel_slides_updated_at on public.home_carousel_slides;
create trigger trg_home_carousel_slides_updated_at
before update on public.home_carousel_slides
for each row
execute function public.set_home_carousel_slides_updated_at();

-- ============================================
-- 4. ADMIN FUNCTION
-- ============================================

create or replace function public.is_admin()
returns boolean
language sql
stable
security definer
set search_path = public, auth
as $$
  select exists (
    select 1
    from auth.users
    where id = auth.uid()
      and coalesce(
        raw_app_meta_data ->> 'role',
        raw_user_meta_data ->> 'role',
        ''
      ) = 'admin'
  );
$$;

-- ============================================
-- 5. ENABLE RLS
-- ============================================

alter table public.divisions enable row level security;
alter table public.groups enable row level security;
alter table public.breaking_news enable row level security;
alter table public.announcement_categories enable row level security;
alter table public.announcements enable row level security;
alter table public.announcement_files enable row level security;
alter table public.announcement_category_links enable row level security;
alter table public.event_categories enable row level security;
alter table public.events enable row level security;
alter table public.event_people enable row level security;
alter table public.event_photos enable row level security;
alter table public.event_category_links enable row level security;
alter table public.home_carousel_slides enable row level security;

-- ============================================
-- 6. PUBLIC SELECT POLICIES
-- ============================================

drop policy if exists divisions_public_select on public.divisions;
create policy divisions_public_select
on public.divisions
for select
to anon, authenticated
using (true);

drop policy if exists groups_public_select on public.groups;
create policy groups_public_select
on public.groups
for select
to anon, authenticated
using (true);

drop policy if exists breaking_news_public_select on public.breaking_news;
create policy breaking_news_public_select
on public.breaking_news
for select
to anon, authenticated
using (status = 'published');

drop policy if exists announcement_categories_public_select on public.announcement_categories;
create policy announcement_categories_public_select
on public.announcement_categories
for select
to anon, authenticated
using (true);

drop policy if exists announcements_public_select on public.announcements;
create policy announcements_public_select
on public.announcements
for select
to anon, authenticated
using (status = 'published');

drop policy if exists announcement_files_public_select on public.announcement_files;
create policy announcement_files_public_select
on public.announcement_files
for select
to anon, authenticated
using (
  exists (
    select 1
    from public.announcements a
    where a.id = announcement_id
      and a.status = 'published'
  )
);

drop policy if exists announcement_category_links_public_select on public.announcement_category_links;
create policy announcement_category_links_public_select
on public.announcement_category_links
for select
to anon, authenticated
using (
  exists (
    select 1
    from public.announcements a
    where a.id = announcement_id
      and a.status = 'published'
  )
);

drop policy if exists event_categories_public_select on public.event_categories;
create policy event_categories_public_select
on public.event_categories
for select
to anon, authenticated
using (true);

drop policy if exists events_public_select on public.events;
create policy events_public_select
on public.events
for select
to anon, authenticated
using (status = 'published');

drop policy if exists event_people_public_select on public.event_people;
create policy event_people_public_select
on public.event_people
for select
to anon, authenticated
using (
  exists (
    select 1
    from public.events e
    where e.id = event_id
      and e.status = 'published'
  )
);

drop policy if exists event_photos_public_select on public.event_photos;
create policy event_photos_public_select
on public.event_photos
for select
to anon, authenticated
using (
  exists (
    select 1
    from public.events e
    where e.id = event_id
      and e.status = 'published'
  )
);

drop policy if exists event_category_links_public_select on public.event_category_links;
create policy event_category_links_public_select
on public.event_category_links
for select
to anon, authenticated
using (
  exists (
    select 1
    from public.events e
    where e.id = event_id
      and e.status = 'published'
  )
);

drop policy if exists home_carousel_slides_public_select on public.home_carousel_slides;
create policy home_carousel_slides_public_select
on public.home_carousel_slides
for select
to anon, authenticated
using (status = 'published');

-- ============================================
-- 7. ADMIN POLICIES
-- ============================================

drop policy if exists divisions_admin_all on public.divisions;
create policy divisions_admin_all
on public.divisions
for all
to authenticated
using (public.is_admin())
with check (public.is_admin());

drop policy if exists groups_admin_all on public.groups;
create policy groups_admin_all
on public.groups
for all
to authenticated
using (public.is_admin())
with check (public.is_admin());

drop policy if exists breaking_news_admin_all on public.breaking_news;
create policy breaking_news_admin_all
on public.breaking_news
for all
to authenticated
using (public.is_admin())
with check (public.is_admin());

drop policy if exists announcement_categories_admin_all on public.announcement_categories;
create policy announcement_categories_admin_all
on public.announcement_categories
for all
to authenticated
using (public.is_admin())
with check (public.is_admin());

drop policy if exists announcements_admin_all on public.announcements;
create policy announcements_admin_all
on public.announcements
for all
to authenticated
using (public.is_admin())
with check (public.is_admin());

drop policy if exists announcement_files_admin_all on public.announcement_files;
create policy announcement_files_admin_all
on public.announcement_files
for all
to authenticated
using (public.is_admin())
with check (public.is_admin());

drop policy if exists announcement_category_links_admin_all on public.announcement_category_links;
create policy announcement_category_links_admin_all
on public.announcement_category_links
for all
to authenticated
using (public.is_admin())
with check (public.is_admin());

drop policy if exists event_categories_admin_all on public.event_categories;
create policy event_categories_admin_all
on public.event_categories
for all
to authenticated
using (public.is_admin())
with check (public.is_admin());

drop policy if exists events_admin_all on public.events;
create policy events_admin_all
on public.events
for all
to authenticated
using (public.is_admin())
with check (public.is_admin());

drop policy if exists event_people_admin_all on public.event_people;
create policy event_people_admin_all
on public.event_people
for all
to authenticated
using (public.is_admin())
with check (public.is_admin());

drop policy if exists event_photos_admin_all on public.event_photos;
create policy event_photos_admin_all
on public.event_photos
for all
to authenticated
using (public.is_admin())
with check (public.is_admin());

drop policy if exists event_category_links_admin_all on public.event_category_links;
create policy event_category_links_admin_all
on public.event_category_links
for all
to authenticated
using (public.is_admin())
with check (public.is_admin());

drop policy if exists home_carousel_slides_admin_all on public.home_carousel_slides;
create policy home_carousel_slides_admin_all
on public.home_carousel_slides
for all
to authenticated
using (public.is_admin())
with check (public.is_admin());

-- ============================================
-- 8. STORAGE BUCKETS
-- ============================================

insert into storage.buckets (id, name, public)
values
  ('announcements', 'announcements', true),
  ('events', 'events', true),
  ('home-carousel', 'home-carousel', true)
on conflict (id) do update
set public = excluded.public;

-- ============================================
-- 9. STORAGE POLICIES
-- ============================================

drop policy if exists public_read_announcements_bucket on storage.objects;
create policy public_read_announcements_bucket
on storage.objects
for select
using (bucket_id = 'announcements');

drop policy if exists authenticated_upload_announcements_bucket on storage.objects;
create policy authenticated_upload_announcements_bucket
on storage.objects
for insert
to authenticated
with check (bucket_id = 'announcements' and public.is_admin());

drop policy if exists authenticated_delete_announcements_bucket on storage.objects;
create policy authenticated_delete_announcements_bucket
on storage.objects
for delete
to authenticated
using (bucket_id = 'announcements' and public.is_admin());

drop policy if exists public_read_events_bucket on storage.objects;
create policy public_read_events_bucket
on storage.objects
for select
using (bucket_id = 'events');

drop policy if exists authenticated_upload_events_bucket on storage.objects;
create policy authenticated_upload_events_bucket
on storage.objects
for insert
to authenticated
with check (bucket_id = 'events' and public.is_admin());

drop policy if exists authenticated_delete_events_bucket on storage.objects;
create policy authenticated_delete_events_bucket
on storage.objects
for delete
to authenticated
using (bucket_id = 'events' and public.is_admin());

drop policy if exists public_read_home_carousel_bucket on storage.objects;
create policy public_read_home_carousel_bucket
on storage.objects
for select
using (bucket_id = 'home-carousel');

drop policy if exists authenticated_upload_home_carousel_bucket on storage.objects;
create policy authenticated_upload_home_carousel_bucket
on storage.objects
for insert
to authenticated
with check (bucket_id = 'home-carousel' and public.is_admin());

drop policy if exists authenticated_delete_home_carousel_bucket on storage.objects;
create policy authenticated_delete_home_carousel_bucket
on storage.objects
for delete
to authenticated
using (bucket_id = 'home-carousel' and public.is_admin());

-- ============================================
-- 10. SAMPLE DATA
-- ============================================

insert into public.divisions (name, slug)
values
  ('Développement Digital', 'dev-digital'),
  ('Infrastructure Digitale', 'infra-digitale'),
  ('Gestion', 'gestion')
on conflict (slug) do nothing;

insert into public.groups (division_id, name, slug)
select id, 'DD101', 'dd101'
from public.divisions
where slug = 'dev-digital'
on conflict (slug) do nothing;

insert into public.home_carousel_slides (
  title,
  subtitle,
  image_url,
  cta_label,
  target,
  sort_order,
  status
)
select *
from (
  values
    (
      '?????? ?????? ??????',
      '??? ???? ????? ?? ???????? ??????? ???????',
      'https://images.unsplash.com/photo-1497366216548-37526070297c?auto=format&fit=crop&q=80&w=1600',
      '?????? ?????????',
      'events',
      1,
      'published'
    ),
    (
      '???? ??? ????',
      '????? ?????? ??????? ?? ??????? ??????????? ????????',
      'https://images.unsplash.com/photo-1497215728101-856f4ea42174?auto=format&fit=crop&q=80&w=1600',
      '???? ?????????',
      'announcements',
      2,
      'published'
    ),
    (
      '????? ??????? ??????',
      '?????? ?????? ?????? ?????? ??????? ??? ??????',
      'https://images.unsplash.com/photo-1542744173-8e7e53415bb0?auto=format&fit=crop&q=80&w=1600',
      '??? ????',
      'events',
      3,
      'published'
    )
) as default_slides (
  title,
  subtitle,
  image_url,
  cta_label,
  target,
  sort_order,
  status
)
where not exists (
  select 1 from public.home_carousel_slides
);

-- ============================================
-- 11. SET ADMIN USER
-- Make sure this email already exists in Supabase Auth
-- ============================================

update auth.users
set raw_app_meta_data =
  coalesce(raw_app_meta_data, '{}'::jsonb) || '{"role":"admin"}'::jsonb
where email = 'admin@example.com';
