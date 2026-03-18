create or replace function public.is_admin()
returns boolean
language sql
stable
as $$
  select auth.role() = 'authenticated'
    and coalesce(
      auth.jwt() -> 'app_metadata' ->> 'role',
      auth.jwt() -> 'user_metadata' ->> 'role',
      ''
    ) = 'admin';
$$;

alter table public.breaking_news enable row level security;
alter table public.announcements enable row level security;
alter table public.announcement_files enable row level security;
alter table public.announcement_category_links enable row level security;
alter table public.events enable row level security;
alter table public.event_people enable row level security;
alter table public.event_photos enable row level security;
alter table public.event_category_links enable row level security;
alter table public.divisions enable row level security;
alter table public.groups enable row level security;
alter table public.announcement_categories enable row level security;
alter table public.event_categories enable row level security;

drop policy if exists breaking_news_public_select on public.breaking_news;
create policy breaking_news_public_select
on public.breaking_news
for select
to anon, authenticated
using (status = 'published');

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
    where a.id = announcement_files.announcement_id
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
    where a.id = announcement_category_links.announcement_id
      and a.status = 'published'
  )
);

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
    where e.id = event_people.event_id
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
    where e.id = event_photos.event_id
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
    where e.id = event_category_links.event_id
      and e.status = 'published'
  )
);

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

drop policy if exists announcement_categories_public_select on public.announcement_categories;
create policy announcement_categories_public_select
on public.announcement_categories
for select
to anon, authenticated
using (true);

drop policy if exists event_categories_public_select on public.event_categories;
create policy event_categories_public_select
on public.event_categories
for select
to anon, authenticated
using (true);

drop policy if exists breaking_news_admin_all on public.breaking_news;
create policy breaking_news_admin_all
on public.breaking_news
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

drop policy if exists announcement_categories_admin_all on public.announcement_categories;
create policy announcement_categories_admin_all
on public.announcement_categories
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
