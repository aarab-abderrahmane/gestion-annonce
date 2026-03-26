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

create index if not exists idx_breaking_news_editorial_status
  on public.breaking_news(editorial_status);

create index if not exists idx_breaking_news_published_at
  on public.breaking_news(published_at desc);

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
