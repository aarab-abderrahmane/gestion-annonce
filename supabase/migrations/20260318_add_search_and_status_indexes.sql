create index if not exists idx_breaking_news_search
  on public.breaking_news
  using gin (to_tsvector('simple', coalesce(title, '')));

create index if not exists idx_announcements_status
  on public.announcements (status, published_at desc)
  where status = 'published';

create index if not exists idx_announcements_search
  on public.announcements
  using gin (to_tsvector('simple', coalesce(title, '') || ' ' || coalesce(description, '')));

create index if not exists idx_events_status
  on public.events (status, starts_at desc)
  where status = 'published';

create index if not exists idx_events_search
  on public.events
  using gin (to_tsvector('simple', coalesce(title, '') || ' ' || coalesce(description, '')));
