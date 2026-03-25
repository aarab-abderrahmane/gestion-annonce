create table if not exists public.danger_news (
  id uuid primary key default gen_random_uuid(),
  title text not null,
  status text not null default 'draft' check (status in ('draft', 'published')),
  created_at timestamptz not null default now(),
  expires_at timestamptz not null,
  deleted_at timestamptz,
  deleted_by uuid references auth.users(id) on delete set null
);

create index if not exists idx_danger_news_status on public.danger_news(status);
create index if not exists idx_danger_news_deleted_at on public.danger_news(deleted_at);

alter table public.danger_news enable row level security;

drop policy if exists danger_news_public_select on public.danger_news;
create policy danger_news_public_select
on public.danger_news
for select
to anon, authenticated
using (status = 'published' and deleted_at is null);

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

alter table public.danger_news_settings
  alter column title set default 'الشريط الخطير';

update public.danger_news_settings
set title = 'الشريط الخطير'
where title = 'شريط الأخبار العاجلة';
