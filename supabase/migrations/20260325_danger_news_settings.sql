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

create unique index if not exists idx_danger_news_settings_singleton
  on public.danger_news_settings ((true));

create or replace function public.set_danger_news_settings_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists set_danger_news_settings_updated_at on public.danger_news_settings;
create trigger set_danger_news_settings_updated_at
before update on public.danger_news_settings
for each row
execute function public.set_danger_news_settings_updated_at();

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
  select 1
  from public.danger_news_settings
);

alter table public.danger_news_settings enable row level security;

drop policy if exists danger_news_settings_public_select on public.danger_news_settings;
create policy danger_news_settings_public_select
on public.danger_news_settings
for select
to anon, authenticated
using (true);

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

alter table public.dashboard_account_permissions
  drop constraint if exists dashboard_account_permissions_resource_check;

alter table public.dashboard_account_permissions
  add constraint dashboard_account_permissions_resource_check
  check (
    resource in (
      'breaking_news',
      'danger_news',
      'home_carousel',
      'announcements',
      'events',
      'categories',
      'structure'
    )
  );
