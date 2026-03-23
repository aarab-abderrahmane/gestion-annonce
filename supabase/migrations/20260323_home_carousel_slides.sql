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

create index if not exists idx_home_carousel_slides_status_sort_order
  on public.home_carousel_slides (status, sort_order asc, created_at asc);

create or replace function public.set_home_carousel_slides_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists set_home_carousel_slides_updated_at on public.home_carousel_slides;
create trigger set_home_carousel_slides_updated_at
before update on public.home_carousel_slides
for each row
execute function public.set_home_carousel_slides_updated_at();

alter table public.home_carousel_slides enable row level security;

drop policy if exists home_carousel_slides_public_select on public.home_carousel_slides;
create policy home_carousel_slides_public_select
on public.home_carousel_slides
for select
to anon, authenticated
using (status = 'published');

drop policy if exists home_carousel_slides_admin_all on public.home_carousel_slides;
create policy home_carousel_slides_admin_all
on public.home_carousel_slides
for all
to authenticated
using (public.is_admin())
with check (public.is_admin());

insert into storage.buckets (id, name, public)
values ('home-carousel', 'home-carousel', true)
on conflict (id) do update
set public = excluded.public;

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
