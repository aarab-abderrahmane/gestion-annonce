alter table public.danger_news_settings
  drop constraint if exists danger_news_settings_speed_seconds_check;

alter table public.danger_news_settings
  add constraint danger_news_settings_speed_seconds_check
  check (speed_seconds between 5 and 120);
