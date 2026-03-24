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
