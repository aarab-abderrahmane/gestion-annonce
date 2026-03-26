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

create index if not exists idx_announcements_editorial_status
  on public.announcements(editorial_status);

create index if not exists idx_events_editorial_status
  on public.events(editorial_status);

create index if not exists idx_danger_news_editorial_status
  on public.danger_news(editorial_status);

create index if not exists idx_home_carousel_slides_editorial_status
  on public.home_carousel_slides(editorial_status);
