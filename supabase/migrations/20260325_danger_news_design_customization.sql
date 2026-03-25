alter table public.danger_news_settings
  add column if not exists icon_name text not null default 'alert-triangle'
  check (icon_name in ('alert-triangle', 'shield-alert', 'bell-ring', 'siren', 'megaphone'));

alter table public.danger_news_settings
  add column if not exists gradient_from_color text not null default '#FFE4E1'
  check (gradient_from_color ~ '^#[0-9A-Fa-f]{6}$');

alter table public.danger_news_settings
  add column if not exists gradient_to_color text not null default '#FFF5F2'
  check (gradient_to_color ~ '^#[0-9A-Fa-f]{6}$');

alter table public.danger_news_settings
  add column if not exists accent_color text not null default '#C62828'
  check (accent_color ~ '^#[0-9A-Fa-f]{6}$');

alter table public.danger_news_settings
  add column if not exists text_color text not null default '#5F2120'
  check (text_color ~ '^#[0-9A-Fa-f]{6}$');
