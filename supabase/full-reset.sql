-- ============================================
-- ISTA AIT MELLOUL � FULL DATABASE RESET
-- Fresh setup for this project
-- ============================================

create extension if not exists "pgcrypto";

-- ============================================
-- 1. TABLES
-- ============================================

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
  expires_at timestamptz,
  deleted_at timestamptz,
  deleted_by uuid references auth.users(id) on delete set null
);

create table if not exists public.danger_news (
  id uuid primary key default gen_random_uuid(),
  title text not null,
  status text not null default 'draft' check (status in ('draft', 'published')),
  created_at timestamptz not null default now(),
  expires_at timestamptz not null,
  deleted_at timestamptz,
  deleted_by uuid references auth.users(id) on delete set null
);

create table if not exists public.announcement_categories (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  slug text not null unique,
  created_at timestamptz not null default now()
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
  created_at timestamptz not null default now(),
  deleted_at timestamptz,
  deleted_by uuid references auth.users(id) on delete set null
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
  created_at timestamptz not null default now(),
  primary key (announcement_id, category_id)
);

create table if not exists public.event_categories (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  slug text not null unique,
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
  created_at timestamptz not null default now(),
  deleted_at timestamptz,
  deleted_by uuid references auth.users(id) on delete set null
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

create table if not exists public.event_category_links (
  event_id uuid not null references public.events(id) on delete cascade,
  category_id uuid not null references public.event_categories(id) on delete cascade,
  created_at timestamptz not null default now(),
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
  updated_at timestamptz not null default now(),
  deleted_at timestamptz,
  deleted_by uuid references auth.users(id) on delete set null
);

create table if not exists public.danger_news_settings (
  id uuid primary key default gen_random_uuid(),
  is_enabled boolean not null default true,
  badge_label text not null default 'تنبيه خطير',
  title text not null default 'الشريط الخطير',
  speed_seconds integer not null default 28 check (speed_seconds between 5 and 120),
  max_items integer not null default 5 check (max_items between 1 and 12),
  separator text not null default '•',
  icon_name text not null default 'alert-triangle' check (icon_name in ('alert-triangle', 'shield-alert', 'bell-ring', 'siren', 'megaphone')),
  gradient_from_color text not null default '#FFE4E1' check (gradient_from_color ~ '^#[0-9A-Fa-f]{6}$'),
  gradient_to_color text not null default '#FFF5F2' check (gradient_to_color ~ '^#[0-9A-Fa-f]{6}$'),
  accent_color text not null default '#C62828' check (accent_color ~ '^#[0-9A-Fa-f]{6}$'),
  text_color text not null default '#5F2120' check (text_color ~ '^#[0-9A-Fa-f]{6}$'),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- ============================================
-- 2. INDEXES
-- ============================================

create index if not exists idx_groups_division_id
  on public.groups (division_id);

create index if not exists idx_breaking_news_status_created_at
  on public.breaking_news (status, created_at desc);
create index if not exists idx_breaking_news_deleted_at on public.breaking_news(deleted_at);
create index if not exists idx_breaking_news_search
  on public.breaking_news
  using gin (to_tsvector('simple', coalesce(title, '')));
create index if not exists idx_danger_news_status on public.danger_news(status);
create index if not exists idx_danger_news_deleted_at on public.danger_news(deleted_at);
create index if not exists idx_announcements_division_id
  on public.announcements (division_id);
create index if not exists idx_announcements_group_id
  on public.announcements (group_id);
create index if not exists idx_announcements_status
  on public.announcements (status, published_at desc)
  where status = 'published';
create index if not exists idx_announcements_deleted_at on public.announcements(deleted_at);
create index if not exists idx_announcements_status_deleted_at
  on public.announcements(status, deleted_at);
create index if not exists idx_announcements_search
  on public.announcements
  using gin (to_tsvector('simple', coalesce(title, '') || ' ' || coalesce(description, '')));
create index if not exists idx_events_status
  on public.events (status, starts_at desc)
  where status = 'published';
create index if not exists idx_events_deleted_at on public.events(deleted_at);
create index if not exists idx_events_search
  on public.events
  using gin (to_tsvector('simple', coalesce(title, '') || ' ' || coalesce(description, '')));
create index if not exists idx_home_carousel_slides_status_sort_order
  on public.home_carousel_slides(status, sort_order asc, created_at asc);
create index if not exists idx_home_carousel_slides_deleted_at
  on public.home_carousel_slides(deleted_at);
create unique index if not exists idx_danger_news_settings_singleton
  on public.danger_news_settings((true));

create index if not exists idx_announcement_files_announcement_id
  on public.announcement_files(announcement_id);

create index if not exists idx_announcement_category_links_category_id
  on public.announcement_category_links(category_id);

create index if not exists idx_event_category_links_category_id
  on public.event_category_links(category_id);

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

create or replace function public.set_danger_news_settings_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists trg_danger_news_settings_updated_at on public.danger_news_settings;
create trigger trg_danger_news_settings_updated_at
before update on public.danger_news_settings
for each row
execute function public.set_danger_news_settings_updated_at();

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

create or replace function public.search_public_content(
  search_query text,
  filter_type text default null,
  date_from date default null,
  date_to date default null
)
returns table (
  id uuid,
  slug text,
  type text,
  title text,
  excerpt text,
  happened_at timestamptz,
  badge text
)
language sql
stable
as $$
  with announcement_results as (
    select
      a.id,
      a.slug,
      'announcement'::text as type,
      a.title,
      coalesce(a.description, '') as excerpt,
      coalesce(a.published_at, now()) as happened_at,
      coalesce(ac.name, 'عام') as badge
    from public.announcements a
    left join public.announcement_category_links acl on acl.announcement_id = a.id
    left join public.announcement_categories ac on ac.id = acl.category_id
    where a.status = 'published'
      and a.deleted_at is null
      and to_tsvector('simple', coalesce(a.title, '') || ' ' || coalesce(a.description, '')) @@ plainto_tsquery('simple', search_query)
      and (filter_type is null or filter_type = 'announcement')
      and (date_from is null or coalesce(a.published_at, now())::date >= date_from)
      and (date_to is null or coalesce(a.published_at, now())::date <= date_to)
  ),
  event_results as (
    select
      e.id,
      e.slug,
      'event'::text as type,
      e.title,
      coalesce(e.description, '') as excerpt,
      e.starts_at as happened_at,
      coalesce(ec.name, 'عام') as badge
    from public.events e
    left join public.event_category_links ecl on ecl.event_id = e.id
    left join public.event_categories ec on ec.id = ecl.category_id
    where e.status = 'published'
      and e.deleted_at is null
      and to_tsvector('simple', coalesce(e.title, '') || ' ' || coalesce(e.description, '') || ' ' || coalesce(e.location, '')) @@ plainto_tsquery('simple', search_query)
      and (filter_type is null or filter_type = 'event')
      and (date_from is null or e.starts_at::date >= date_from)
      and (date_to is null or e.starts_at::date <= date_to)
  ),
  news_results as (
    select
      bn.id,
      bn.slug,
      'breaking-news'::text as type,
      bn.title,
      bn.title as excerpt,
      bn.created_at as happened_at,
      case bn.level
        when 'dangerous' then 'خطير'
        when 'urgent' then 'عاجل'
        else 'تحذير'
      end as badge
    from public.breaking_news bn
    where bn.status = 'published'
      and bn.deleted_at is null
      and bn.expires_at > now()
      and to_tsvector('simple', coalesce(bn.title, '')) @@ plainto_tsquery('simple', search_query)
      and (filter_type is null or filter_type = 'breaking-news')
      and (date_from is null or bn.created_at::date >= date_from)
      and (date_to is null or bn.created_at::date <= date_to)
  )
  select * from announcement_results
  union all
  select * from event_results
  union all
  select * from news_results
  order by happened_at desc;
$$;

-- ============================================
-- 5. ENABLE RLS
-- ============================================

alter table public.divisions enable row level security;
alter table public.groups enable row level security;
alter table public.breaking_news enable row level security;
alter table public.danger_news enable row level security;
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
alter table public.danger_news_settings enable row level security;

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
using (status = 'published' and deleted_at is null);

drop policy if exists danger_news_public_select on public.danger_news;
create policy danger_news_public_select
on public.danger_news
for select
to anon, authenticated
using (status = 'published' and deleted_at is null);

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
using (status = 'published' and deleted_at is null);

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
using (status = 'published' and deleted_at is null);

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
using (status = 'published' and deleted_at is null);

drop policy if exists danger_news_settings_public_select on public.danger_news_settings;
create policy danger_news_settings_public_select
on public.danger_news_settings
for select
to anon, authenticated
using (true);

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

drop policy if exists danger_news_admin_all on public.danger_news;
create policy danger_news_admin_all
on public.danger_news
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
  ('Developpement Digital', 'dev-digital'),
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
      'مستقبل التحول الرقمي',
      'نحو آفاق جديدة من الابتكار والتميز المؤسسي',
      'https://images.unsplash.com/photo-1497366216548-37526070297c?auto=format&fit=crop&q=80&w=1600',
      'استكشف الفعاليات',
      'events',
      1,
      'published'
    ),
    (
      'بيئة عمل ذكية',
      'إطلاق الحزمة الجديدة من الخدمات الإلكترونية للموظفين',
      'https://images.unsplash.com/photo-1497215728101-856f4ea42174?auto=format&fit=crop&q=80&w=1600',
      'تصفح الإعلانات',
      'announcements',
      2,
      'published'
    ),
    (
      'ملتقى الإبداع السنوي',
      'شاركنا أفكارك لتطوير مستقبل مؤسستنا نحو الأفضل',
      'https://images.unsplash.com/photo-1542744173-8e7e53415bb0?auto=format&fit=crop&q=80&w=1600',
      'سجل الآن',
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

insert into public.danger_news_settings (
  is_enabled,
  badge_label,
  title,
  speed_seconds,
  max_items,
  separator,
  icon_name,
  gradient_from_color,
  gradient_to_color,
  accent_color,
  text_color
)
select
  true,
  'تنبيه خطير',
  'الشريط الخطير',
  28,
  5,
  '•',
  'alert-triangle',
  '#FFE4E1',
  '#FFF5F2',
  '#C62828',
  '#5F2120'
where not exists (
  select 1 from public.danger_news_settings
);

-- ============================================
-- 11. SET ADMIN USER
-- Make sure this email already exists in Supabase Auth
-- ============================================

update auth.users
set raw_app_meta_data =
  coalesce(raw_app_meta_data, '{}'::jsonb) || '{"role":"admin"}'::jsonb
where email = 'admin@example.com';



-- ============================================
-- 11. USERS
-- users table to manage dashboard access for non-admin users
-- ============================================



create table if not exists public.dashboard_accounts (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null unique references auth.users(id) on delete cascade,
  full_name text not null,
  email text not null,
  status text not null default 'active' check (status in ('active', 'disabled')),
  created_by uuid references auth.users(id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create unique index if not exists dashboard_accounts_email_lower_unique
  on public.dashboard_accounts (lower(email));

create table if not exists public.dashboard_account_permissions (
  account_id uuid not null references public.dashboard_accounts(id) on delete cascade,
  resource text not null check (
    resource in (
      'breaking_news',
      'danger_news',
      'home_carousel',
      'announcements',
      'events',
      'categories',
      'structure'
    )
  ),
  can_view boolean not null default true,
  can_create boolean not null default false,
  can_update boolean not null default false,
  can_delete boolean not null default false,
  can_publish boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  primary key (account_id, resource),
  constraint dashboard_account_permissions_requires_view
    check (can_view or not (can_create or can_update or can_delete or can_publish))
);

create or replace function public.set_dashboard_accounts_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists set_dashboard_accounts_updated_at on public.dashboard_accounts;
create trigger set_dashboard_accounts_updated_at
before update on public.dashboard_accounts
for each row
execute function public.set_dashboard_accounts_updated_at();

create or replace function public.set_dashboard_account_permissions_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists set_dashboard_account_permissions_updated_at on public.dashboard_account_permissions;
create trigger set_dashboard_account_permissions_updated_at
before update on public.dashboard_account_permissions
for each row
execute function public.set_dashboard_account_permissions_updated_at();

create or replace function public.enforce_dashboard_account_limit()
returns trigger
language plpgsql
as $$
begin
  if (
    select count(*)
    from public.dashboard_accounts
  ) >= 4 then
    raise exception 'You can only create up to 4 delegated dashboard accounts.';
  end if;

  return new;
end;
$$;

drop trigger if exists enforce_dashboard_account_limit on public.dashboard_accounts;
create trigger enforce_dashboard_account_limit
before insert on public.dashboard_accounts
for each row
execute function public.enforce_dashboard_account_limit();

create or replace function public.has_dashboard_access()
returns boolean
language sql
stable
security definer
set search_path = public, auth
as $$
  select public.is_admin()
    or exists (
      select 1
      from public.dashboard_accounts da
      join public.dashboard_account_permissions dap on dap.account_id = da.id
      where da.user_id = auth.uid()
        and da.status = 'active'
        and dap.can_view
    );
$$;

create or replace function public.has_admin_permission(
  resource_name text,
  action_name text default 'view'
)
returns boolean
language plpgsql
stable
security definer
set search_path = public, auth
as $$
begin
  if public.is_admin() then
    return true;
  end if;

  return exists (
    select 1
    from public.dashboard_accounts da
    join public.dashboard_account_permissions dap on dap.account_id = da.id
    where da.user_id = auth.uid()
      and da.status = 'active'
      and dap.resource = resource_name
      and case action_name
        when 'view' then dap.can_view
        when 'create' then dap.can_create
        when 'update' then dap.can_update
        when 'delete' then dap.can_delete
        when 'publish' then dap.can_publish
        else false
      end
  );
end;
$$;

alter table public.dashboard_accounts enable row level security;
alter table public.dashboard_account_permissions enable row level security;

drop policy if exists dashboard_accounts_select_self_or_admin on public.dashboard_accounts;
create policy dashboard_accounts_select_self_or_admin
on public.dashboard_accounts
for select
to authenticated
using (
  public.is_admin()
  or user_id = auth.uid()
);

drop policy if exists dashboard_accounts_admin_all on public.dashboard_accounts;
create policy dashboard_accounts_admin_all
on public.dashboard_accounts
for all
to authenticated
using (public.is_admin())
with check (public.is_admin());

drop policy if exists dashboard_account_permissions_select_self_or_admin on public.dashboard_account_permissions;
create policy dashboard_account_permissions_select_self_or_admin
on public.dashboard_account_permissions
for select
to authenticated
using (
  public.is_admin()
  or exists (
    select 1
    from public.dashboard_accounts da
    where da.id = dashboard_account_permissions.account_id
      and da.user_id = auth.uid()
  )
);

drop policy if exists dashboard_account_permissions_admin_all on public.dashboard_account_permissions;
create policy dashboard_account_permissions_admin_all
on public.dashboard_account_permissions
for all
to authenticated
using (public.is_admin())
with check (public.is_admin());

drop policy if exists breaking_news_admin_all on public.breaking_news;
drop policy if exists danger_news_admin_all on public.danger_news;
drop policy if exists announcements_admin_all on public.announcements;
drop policy if exists announcement_files_admin_all on public.announcement_files;
drop policy if exists announcement_category_links_admin_all on public.announcement_category_links;
drop policy if exists events_admin_all on public.events;
drop policy if exists event_people_admin_all on public.event_people;
drop policy if exists event_photos_admin_all on public.event_photos;
drop policy if exists event_category_links_admin_all on public.event_category_links;
drop policy if exists divisions_admin_all on public.divisions;
drop policy if exists groups_admin_all on public.groups;
drop policy if exists announcement_categories_admin_all on public.announcement_categories;
drop policy if exists event_categories_admin_all on public.event_categories;
drop policy if exists home_carousel_slides_admin_all on public.home_carousel_slides;
drop policy if exists danger_news_settings_admin_all on public.danger_news_settings;

drop policy if exists breaking_news_dashboard_select on public.breaking_news;
create policy breaking_news_dashboard_select
on public.breaking_news
for select
to authenticated
using (public.has_admin_permission('breaking_news', 'view'));

drop policy if exists breaking_news_dashboard_insert on public.breaking_news;
create policy breaking_news_dashboard_insert
on public.breaking_news
for insert
to authenticated
with check (
  public.has_admin_permission('breaking_news', 'create')
  and (status <> 'published' or public.has_admin_permission('breaking_news', 'publish'))
);

drop policy if exists breaking_news_dashboard_update on public.breaking_news;
create policy breaking_news_dashboard_update
on public.breaking_news
for update
to authenticated
using (
  public.has_admin_permission('breaking_news', 'update')
  and (status <> 'published' or public.has_admin_permission('breaking_news', 'publish'))
)
with check (
  public.has_admin_permission('breaking_news', 'update')
  and (status <> 'published' or public.has_admin_permission('breaking_news', 'publish'))
);

drop policy if exists breaking_news_dashboard_delete on public.breaking_news;
create policy breaking_news_dashboard_delete
on public.breaking_news
for delete
to authenticated
using (public.has_admin_permission('breaking_news', 'delete'));

drop policy if exists danger_news_dashboard_select on public.danger_news;
create policy danger_news_dashboard_select
on public.danger_news
for select
to authenticated
using (public.has_admin_permission('danger_news', 'view'));

drop policy if exists danger_news_dashboard_insert on public.danger_news;
create policy danger_news_dashboard_insert
on public.danger_news
for insert
to authenticated
with check (
  public.has_admin_permission('danger_news', 'create')
  and (status <> 'published' or public.has_admin_permission('danger_news', 'publish'))
);

drop policy if exists danger_news_dashboard_update on public.danger_news;
create policy danger_news_dashboard_update
on public.danger_news
for update
to authenticated
using (
  public.has_admin_permission('danger_news', 'update')
  and (status <> 'published' or public.has_admin_permission('danger_news', 'publish'))
)
with check (
  public.has_admin_permission('danger_news', 'update')
  and (status <> 'published' or public.has_admin_permission('danger_news', 'publish'))
);

drop policy if exists danger_news_dashboard_delete on public.danger_news;
create policy danger_news_dashboard_delete
on public.danger_news
for delete
to authenticated
using (public.has_admin_permission('danger_news', 'delete'));

drop policy if exists announcements_dashboard_select on public.announcements;
create policy announcements_dashboard_select
on public.announcements
for select
to authenticated
using (public.has_admin_permission('announcements', 'view'));

drop policy if exists announcements_dashboard_insert on public.announcements;
create policy announcements_dashboard_insert
on public.announcements
for insert
to authenticated
with check (
  public.has_admin_permission('announcements', 'create')
  and (status <> 'published' or public.has_admin_permission('announcements', 'publish'))
);

drop policy if exists announcements_dashboard_update on public.announcements;
create policy announcements_dashboard_update
on public.announcements
for update
to authenticated
using (
  public.has_admin_permission('announcements', 'update')
  and (status <> 'published' or public.has_admin_permission('announcements', 'publish'))
)
with check (
  public.has_admin_permission('announcements', 'update')
  and (status <> 'published' or public.has_admin_permission('announcements', 'publish'))
);

drop policy if exists announcements_dashboard_delete on public.announcements;
create policy announcements_dashboard_delete
on public.announcements
for delete
to authenticated
using (public.has_admin_permission('announcements', 'delete'));

drop policy if exists announcement_files_dashboard_select on public.announcement_files;
create policy announcement_files_dashboard_select
on public.announcement_files
for select
to authenticated
using (public.has_admin_permission('announcements', 'view'));

drop policy if exists announcement_files_dashboard_insert on public.announcement_files;
create policy announcement_files_dashboard_insert
on public.announcement_files
for insert
to authenticated
with check (
  exists (
    select 1
    from public.announcements a
    where a.id = announcement_files.announcement_id
      and (
        public.has_admin_permission('announcements', 'create')
        or public.has_admin_permission('announcements', 'update')
      )
      and (a.status <> 'published' or public.has_admin_permission('announcements', 'publish'))
  )
);

drop policy if exists announcement_files_dashboard_update on public.announcement_files;
create policy announcement_files_dashboard_update
on public.announcement_files
for update
to authenticated
using (
  exists (
    select 1
    from public.announcements a
    where a.id = announcement_files.announcement_id
      and public.has_admin_permission('announcements', 'update')
      and (a.status <> 'published' or public.has_admin_permission('announcements', 'publish'))
  )
)
with check (
  exists (
    select 1
    from public.announcements a
    where a.id = announcement_files.announcement_id
      and public.has_admin_permission('announcements', 'update')
      and (a.status <> 'published' or public.has_admin_permission('announcements', 'publish'))
  )
);

drop policy if exists announcement_files_dashboard_delete on public.announcement_files;
create policy announcement_files_dashboard_delete
on public.announcement_files
for delete
to authenticated
using (
  exists (
    select 1
    from public.announcements a
    where a.id = announcement_files.announcement_id
      and (
        public.has_admin_permission('announcements', 'update')
        or public.has_admin_permission('announcements', 'delete')
      )
      and (a.status <> 'published' or public.has_admin_permission('announcements', 'publish'))
  )
);

drop policy if exists announcement_category_links_dashboard_select on public.announcement_category_links;
create policy announcement_category_links_dashboard_select
on public.announcement_category_links
for select
to authenticated
using (public.has_admin_permission('announcements', 'view'));

drop policy if exists announcement_category_links_dashboard_insert on public.announcement_category_links;
create policy announcement_category_links_dashboard_insert
on public.announcement_category_links
for insert
to authenticated
with check (
  exists (
    select 1
    from public.announcements a
    where a.id = announcement_category_links.announcement_id
      and (
        public.has_admin_permission('announcements', 'create')
        or public.has_admin_permission('announcements', 'update')
      )
      and (a.status <> 'published' or public.has_admin_permission('announcements', 'publish'))
  )
);

drop policy if exists announcement_category_links_dashboard_delete on public.announcement_category_links;
create policy announcement_category_links_dashboard_delete
on public.announcement_category_links
for delete
to authenticated
using (
  exists (
    select 1
    from public.announcements a
    where a.id = announcement_category_links.announcement_id
      and (
        public.has_admin_permission('announcements', 'create')
        or public.has_admin_permission('announcements', 'update')
      )
      and (a.status <> 'published' or public.has_admin_permission('announcements', 'publish'))
  )
);

drop policy if exists events_dashboard_select on public.events;
create policy events_dashboard_select
on public.events
for select
to authenticated
using (public.has_admin_permission('events', 'view'));

drop policy if exists events_dashboard_insert on public.events;
create policy events_dashboard_insert
on public.events
for insert
to authenticated
with check (
  public.has_admin_permission('events', 'create')
  and (status <> 'published' or public.has_admin_permission('events', 'publish'))
);

drop policy if exists events_dashboard_update on public.events;
create policy events_dashboard_update
on public.events
for update
to authenticated
using (
  public.has_admin_permission('events', 'update')
  and (status <> 'published' or public.has_admin_permission('events', 'publish'))
)
with check (
  public.has_admin_permission('events', 'update')
  and (status <> 'published' or public.has_admin_permission('events', 'publish'))
);

drop policy if exists events_dashboard_delete on public.events;
create policy events_dashboard_delete
on public.events
for delete
to authenticated
using (public.has_admin_permission('events', 'delete'));

drop policy if exists event_people_dashboard_select on public.event_people;
create policy event_people_dashboard_select
on public.event_people
for select
to authenticated
using (public.has_admin_permission('events', 'view'));

drop policy if exists event_people_dashboard_insert on public.event_people;
create policy event_people_dashboard_insert
on public.event_people
for insert
to authenticated
with check (
  exists (
    select 1
    from public.events e
    where e.id = event_people.event_id
      and (
        public.has_admin_permission('events', 'create')
        or public.has_admin_permission('events', 'update')
      )
      and (e.status <> 'published' or public.has_admin_permission('events', 'publish'))
  )
);

drop policy if exists event_people_dashboard_update on public.event_people;
create policy event_people_dashboard_update
on public.event_people
for update
to authenticated
using (
  exists (
    select 1
    from public.events e
    where e.id = event_people.event_id
      and public.has_admin_permission('events', 'update')
      and (e.status <> 'published' or public.has_admin_permission('events', 'publish'))
  )
)
with check (
  exists (
    select 1
    from public.events e
    where e.id = event_people.event_id
      and public.has_admin_permission('events', 'update')
      and (e.status <> 'published' or public.has_admin_permission('events', 'publish'))
  )
);

drop policy if exists event_people_dashboard_delete on public.event_people;
create policy event_people_dashboard_delete
on public.event_people
for delete
to authenticated
using (
  exists (
    select 1
    from public.events e
    where e.id = event_people.event_id
      and (
        public.has_admin_permission('events', 'create')
        or public.has_admin_permission('events', 'update')
      )
      and (e.status <> 'published' or public.has_admin_permission('events', 'publish'))
  )
);

drop policy if exists event_photos_dashboard_select on public.event_photos;
create policy event_photos_dashboard_select
on public.event_photos
for select
to authenticated
using (public.has_admin_permission('events', 'view'));

drop policy if exists event_photos_dashboard_insert on public.event_photos;
create policy event_photos_dashboard_insert
on public.event_photos
for insert
to authenticated
with check (
  exists (
    select 1
    from public.events e
    where e.id = event_photos.event_id
      and (
        public.has_admin_permission('events', 'create')
        or public.has_admin_permission('events', 'update')
      )
      and (e.status <> 'published' or public.has_admin_permission('events', 'publish'))
  )
);

drop policy if exists event_photos_dashboard_delete on public.event_photos;
create policy event_photos_dashboard_delete
on public.event_photos
for delete
to authenticated
using (
  exists (
    select 1
    from public.events e
    where e.id = event_photos.event_id
      and (
        public.has_admin_permission('events', 'create')
        or public.has_admin_permission('events', 'update')
      )
      and (e.status <> 'published' or public.has_admin_permission('events', 'publish'))
  )
);

drop policy if exists event_category_links_dashboard_select on public.event_category_links;
create policy event_category_links_dashboard_select
on public.event_category_links
for select
to authenticated
using (public.has_admin_permission('events', 'view'));

drop policy if exists event_category_links_dashboard_insert on public.event_category_links;
create policy event_category_links_dashboard_insert
on public.event_category_links
for insert
to authenticated
with check (
  exists (
    select 1
    from public.events e
    where e.id = event_category_links.event_id
      and (
        public.has_admin_permission('events', 'create')
        or public.has_admin_permission('events', 'update')
      )
      and (e.status <> 'published' or public.has_admin_permission('events', 'publish'))
  )
);

drop policy if exists event_category_links_dashboard_delete on public.event_category_links;
create policy event_category_links_dashboard_delete
on public.event_category_links
for delete
to authenticated
using (
  exists (
    select 1
    from public.events e
    where e.id = event_category_links.event_id
      and (
        public.has_admin_permission('events', 'create')
        or public.has_admin_permission('events', 'update')
      )
      and (e.status <> 'published' or public.has_admin_permission('events', 'publish'))
  )
);

drop policy if exists divisions_dashboard_insert on public.divisions;
create policy divisions_dashboard_insert
on public.divisions
for insert
to authenticated
with check (public.has_admin_permission('structure', 'create'));

drop policy if exists divisions_dashboard_update on public.divisions;
create policy divisions_dashboard_update
on public.divisions
for update
to authenticated
using (public.has_admin_permission('structure', 'update'))
with check (public.has_admin_permission('structure', 'update'));

drop policy if exists divisions_dashboard_delete on public.divisions;
create policy divisions_dashboard_delete
on public.divisions
for delete
to authenticated
using (public.has_admin_permission('structure', 'delete'));

drop policy if exists groups_dashboard_insert on public.groups;
create policy groups_dashboard_insert
on public.groups
for insert
to authenticated
with check (public.has_admin_permission('structure', 'create'));

drop policy if exists groups_dashboard_update on public.groups;
create policy groups_dashboard_update
on public.groups
for update
to authenticated
using (public.has_admin_permission('structure', 'update'))
with check (public.has_admin_permission('structure', 'update'));

drop policy if exists groups_dashboard_delete on public.groups;
create policy groups_dashboard_delete
on public.groups
for delete
to authenticated
using (public.has_admin_permission('structure', 'delete'));

drop policy if exists announcement_categories_dashboard_insert on public.announcement_categories;
create policy announcement_categories_dashboard_insert
on public.announcement_categories
for insert
to authenticated
with check (public.has_admin_permission('categories', 'create'));

drop policy if exists announcement_categories_dashboard_update on public.announcement_categories;
create policy announcement_categories_dashboard_update
on public.announcement_categories
for update
to authenticated
using (public.has_admin_permission('categories', 'update'))
with check (public.has_admin_permission('categories', 'update'));

drop policy if exists announcement_categories_dashboard_delete on public.announcement_categories;
create policy announcement_categories_dashboard_delete
on public.announcement_categories
for delete
to authenticated
using (public.has_admin_permission('categories', 'delete'));

drop policy if exists event_categories_dashboard_insert on public.event_categories;
create policy event_categories_dashboard_insert
on public.event_categories
for insert
to authenticated
with check (public.has_admin_permission('categories', 'create'));

drop policy if exists event_categories_dashboard_update on public.event_categories;
create policy event_categories_dashboard_update
on public.event_categories
for update
to authenticated
using (public.has_admin_permission('categories', 'update'))
with check (public.has_admin_permission('categories', 'update'));

drop policy if exists event_categories_dashboard_delete on public.event_categories;
create policy event_categories_dashboard_delete
on public.event_categories
for delete
to authenticated
using (public.has_admin_permission('categories', 'delete'));

drop policy if exists home_carousel_slides_dashboard_select on public.home_carousel_slides;
create policy home_carousel_slides_dashboard_select
on public.home_carousel_slides
for select
to authenticated
using (public.has_admin_permission('home_carousel', 'view'));

drop policy if exists home_carousel_slides_dashboard_insert on public.home_carousel_slides;
create policy home_carousel_slides_dashboard_insert
on public.home_carousel_slides
for insert
to authenticated
with check (
  public.has_admin_permission('home_carousel', 'create')
  and (status <> 'published' or public.has_admin_permission('home_carousel', 'publish'))
);

drop policy if exists home_carousel_slides_dashboard_update on public.home_carousel_slides;
create policy home_carousel_slides_dashboard_update
on public.home_carousel_slides
for update
to authenticated
using (
  public.has_admin_permission('home_carousel', 'update')
  and (status <> 'published' or public.has_admin_permission('home_carousel', 'publish'))
)
with check (
  public.has_admin_permission('home_carousel', 'update')
  and (status <> 'published' or public.has_admin_permission('home_carousel', 'publish'))
);

drop policy if exists home_carousel_slides_dashboard_delete on public.home_carousel_slides;
create policy home_carousel_slides_dashboard_delete
on public.home_carousel_slides
for delete
to authenticated
using (public.has_admin_permission('home_carousel', 'delete'));

drop policy if exists danger_news_settings_dashboard_select on public.danger_news_settings;
create policy danger_news_settings_dashboard_select
on public.danger_news_settings
for select
to authenticated
using (public.has_admin_permission('danger_news', 'view'));

drop policy if exists danger_news_settings_dashboard_insert on public.danger_news_settings;
create policy danger_news_settings_dashboard_insert
on public.danger_news_settings
for insert
to authenticated
with check (public.has_admin_permission('danger_news', 'create'));

drop policy if exists danger_news_settings_dashboard_update on public.danger_news_settings;
create policy danger_news_settings_dashboard_update
on public.danger_news_settings
for update
to authenticated
using (public.has_admin_permission('danger_news', 'update'))
with check (public.has_admin_permission('danger_news', 'update'));

drop policy if exists authenticated_upload_announcements_bucket on storage.objects;
create policy authenticated_upload_announcements_bucket
on storage.objects
for insert
to authenticated
with check (
  bucket_id = 'announcements'
  and (
    public.has_admin_permission('announcements', 'create')
    or public.has_admin_permission('announcements', 'update')
  )
);

drop policy if exists authenticated_delete_announcements_bucket on storage.objects;
create policy authenticated_delete_announcements_bucket
on storage.objects
for delete
to authenticated
using (
  bucket_id = 'announcements'
  and (
    public.has_admin_permission('announcements', 'update')
    or public.has_admin_permission('announcements', 'delete')
  )
);

drop policy if exists authenticated_upload_events_bucket on storage.objects;
create policy authenticated_upload_events_bucket
on storage.objects
for insert
to authenticated
with check (
  bucket_id = 'events'
  and (
    public.has_admin_permission('events', 'create')
    or public.has_admin_permission('events', 'update')
  )
);

drop policy if exists authenticated_delete_events_bucket on storage.objects;
create policy authenticated_delete_events_bucket
on storage.objects
for delete
to authenticated
using (
  bucket_id = 'events'
  and (
    public.has_admin_permission('events', 'update')
    or public.has_admin_permission('events', 'delete')
  )
);

drop policy if exists authenticated_upload_home_carousel_bucket on storage.objects;
create policy authenticated_upload_home_carousel_bucket
on storage.objects
for insert
to authenticated
with check (
  bucket_id = 'home-carousel'
  and (
    public.has_admin_permission('home_carousel', 'create')
    or public.has_admin_permission('home_carousel', 'update')
  )
);

drop policy if exists authenticated_delete_home_carousel_bucket on storage.objects;
create policy authenticated_delete_home_carousel_bucket
on storage.objects
for delete
to authenticated
using (
  bucket_id = 'home-carousel'
  and (
    public.has_admin_permission('home_carousel', 'update')
    or public.has_admin_permission('home_carousel', 'delete')
  )
);

-- ============================================
-- 12. 2026-03-26 WORKFLOW AND AUDIT UPDATES
-- Keep full reset aligned with the latest migrations
-- ============================================

alter table public.breaking_news
add column if not exists published_at timestamptz,
add column if not exists updated_at timestamptz not null default now(),
add column if not exists editorial_status text not null default 'draft'
  check (editorial_status in ('draft', 'in_review', 'changes_requested', 'approved')),
add column if not exists submitted_for_review_at timestamptz,
add column if not exists submitted_for_review_by uuid references auth.users(id) on delete set null,
add column if not exists reviewed_at timestamptz,
add column if not exists reviewed_by uuid references auth.users(id) on delete set null,
add column if not exists review_notes text;

alter table public.announcements
add column if not exists editorial_status text not null default 'draft'
  check (editorial_status in ('draft', 'in_review', 'changes_requested', 'approved')),
add column if not exists submitted_for_review_at timestamptz,
add column if not exists submitted_for_review_by uuid references auth.users(id) on delete set null,
add column if not exists reviewed_at timestamptz,
add column if not exists reviewed_by uuid references auth.users(id) on delete set null,
add column if not exists review_notes text;

alter table public.events
add column if not exists published_at timestamptz,
add column if not exists editorial_status text not null default 'draft'
  check (editorial_status in ('draft', 'in_review', 'changes_requested', 'approved')),
add column if not exists submitted_for_review_at timestamptz,
add column if not exists submitted_for_review_by uuid references auth.users(id) on delete set null,
add column if not exists reviewed_at timestamptz,
add column if not exists reviewed_by uuid references auth.users(id) on delete set null,
add column if not exists review_notes text;

alter table public.danger_news
add column if not exists published_at timestamptz,
add column if not exists editorial_status text not null default 'draft'
  check (editorial_status in ('draft', 'in_review', 'changes_requested', 'approved')),
add column if not exists submitted_for_review_at timestamptz,
add column if not exists submitted_for_review_by uuid references auth.users(id) on delete set null,
add column if not exists reviewed_at timestamptz,
add column if not exists reviewed_by uuid references auth.users(id) on delete set null,
add column if not exists review_notes text;

alter table public.home_carousel_slides
add column if not exists published_at timestamptz,
add column if not exists editorial_status text not null default 'draft'
  check (editorial_status in ('draft', 'in_review', 'changes_requested', 'approved')),
add column if not exists submitted_for_review_at timestamptz,
add column if not exists submitted_for_review_by uuid references auth.users(id) on delete set null,
add column if not exists reviewed_at timestamptz,
add column if not exists reviewed_by uuid references auth.users(id) on delete set null,
add column if not exists review_notes text;

update public.breaking_news
set
  published_at = case
    when status = 'published' then coalesce(published_at, created_at)
    else published_at
  end,
  updated_at = coalesce(updated_at, created_at),
  editorial_status = case
    when status = 'published' then 'approved'
    else coalesce(editorial_status, 'draft')
  end
where true;

update public.announcements
set editorial_status = case
  when status = 'published' then 'approved'
  else 'draft'
end
where true;

update public.events
set
  published_at = case
    when status = 'published' then coalesce(published_at, created_at)
    else published_at
  end,
  editorial_status = case
    when status = 'published' then 'approved'
    else 'draft'
  end
where true;

update public.danger_news
set
  published_at = case
    when status = 'published' then coalesce(published_at, created_at)
    else published_at
  end,
  editorial_status = case
    when status = 'published' then 'approved'
    else 'draft'
  end
where true;

update public.home_carousel_slides
set
  published_at = case
    when status = 'published' then coalesce(published_at, created_at)
    else published_at
  end,
  editorial_status = case
    when status = 'published' then 'approved'
    else 'draft'
  end
where true;

create index if not exists idx_breaking_news_editorial_status
  on public.breaking_news(editorial_status);

create index if not exists idx_breaking_news_published_at
  on public.breaking_news(published_at desc);

create index if not exists idx_announcements_editorial_status
  on public.announcements(editorial_status);

create index if not exists idx_events_editorial_status
  on public.events(editorial_status);

create index if not exists idx_danger_news_editorial_status
  on public.danger_news(editorial_status);

create index if not exists idx_home_carousel_slides_editorial_status
  on public.home_carousel_slides(editorial_status);

create or replace function public.set_breaking_news_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists trg_breaking_news_updated_at on public.breaking_news;
create trigger trg_breaking_news_updated_at
before update on public.breaking_news
for each row
execute function public.set_breaking_news_updated_at();

create table if not exists public.breaking_news_audit_log (
  id uuid primary key default gen_random_uuid(),
  breaking_news_id uuid references public.breaking_news(id) on delete set null,
  breaking_news_title text not null,
  breaking_news_slug text,
  action text not null
    check (
      action in (
        'created',
        'updated',
        'submitted_for_review',
        'changes_requested',
        'approved',
        'published',
        'unpublished',
        'trashed',
        'restored',
        'purged'
      )
    ),
  actor_user_id uuid references auth.users(id) on delete set null,
  actor_email text,
  actor_name text,
  previous_status text,
  next_status text,
  previous_editorial_status text,
  next_editorial_status text,
  notes text,
  payload jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);

create index if not exists idx_breaking_news_audit_log_news_id_created_at
  on public.breaking_news_audit_log(breaking_news_id, created_at desc);

alter table public.breaking_news_audit_log enable row level security;

drop policy if exists breaking_news_audit_log_dashboard_select on public.breaking_news_audit_log;
create policy breaking_news_audit_log_dashboard_select
on public.breaking_news_audit_log
for select
to authenticated
using (public.has_admin_permission('breaking_news', 'view'));

drop policy if exists breaking_news_audit_log_dashboard_insert on public.breaking_news_audit_log;
create policy breaking_news_audit_log_dashboard_insert
on public.breaking_news_audit_log
for insert
to authenticated
with check (
  public.has_admin_permission('breaking_news', 'create')
  or public.has_admin_permission('breaking_news', 'update')
  or public.has_admin_permission('breaking_news', 'delete')
  or public.has_admin_permission('breaking_news', 'publish')
);

create or replace function public.search_public_content(
  search_query text,
  filter_type text default null,
  date_from date default null,
  date_to date default null
)
returns table (
  id uuid,
  slug text,
  type text,
  title text,
  excerpt text,
  happened_at timestamptz,
  badge text
)
language sql
stable
as $$
  with announcement_results as (
    select
      a.id,
      a.slug,
      'announcement'::text as type,
      a.title,
      coalesce(a.description, '') as excerpt,
      coalesce(a.published_at, now()) as happened_at,
      coalesce(ac.name, 'عام') as badge
    from public.announcements a
    left join public.announcement_category_links acl on acl.announcement_id = a.id
    left join public.announcement_categories ac on ac.id = acl.category_id
    where a.status = 'published'
      and a.deleted_at is null
      and to_tsvector('simple', coalesce(a.title, '') || ' ' || coalesce(a.description, '')) @@ plainto_tsquery('simple', search_query)
      and (filter_type is null or filter_type = 'announcement')
      and (date_from is null or coalesce(a.published_at, now())::date >= date_from)
      and (date_to is null or coalesce(a.published_at, now())::date <= date_to)
  ),
  event_results as (
    select
      e.id,
      e.slug,
      'event'::text as type,
      e.title,
      coalesce(e.description, '') as excerpt,
      e.starts_at as happened_at,
      coalesce(ec.name, 'عام') as badge
    from public.events e
    left join public.event_category_links ecl on ecl.event_id = e.id
    left join public.event_categories ec on ec.id = ecl.category_id
    where e.status = 'published'
      and e.deleted_at is null
      and to_tsvector('simple', coalesce(e.title, '') || ' ' || coalesce(e.description, '') || ' ' || coalesce(e.location, '')) @@ plainto_tsquery('simple', search_query)
      and (filter_type is null or filter_type = 'event')
      and (date_from is null or e.starts_at::date >= date_from)
      and (date_to is null or e.starts_at::date <= date_to)
  ),
  news_results as (
    select
      bn.id,
      bn.slug,
      'breaking-news'::text as type,
      bn.title,
      bn.title as excerpt,
      coalesce(bn.published_at, bn.created_at) as happened_at,
      case bn.level
        when 'dangerous' then 'خطير'
        when 'urgent' then 'عاجل'
        else 'تحذير'
      end as badge
    from public.breaking_news bn
    where bn.status = 'published'
      and bn.deleted_at is null
      and bn.expires_at > now()
      and to_tsvector('simple', coalesce(bn.title, '')) @@ plainto_tsquery('simple', search_query)
      and (filter_type is null or filter_type = 'breaking-news')
      and (date_from is null or coalesce(bn.published_at, bn.created_at)::date >= date_from)
      and (date_to is null or coalesce(bn.published_at, bn.created_at)::date <= date_to)
  )
  select * from announcement_results
  union all
  select * from event_results
  union all
  select * from news_results
  order by happened_at desc;
$$;
