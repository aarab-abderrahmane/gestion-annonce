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
      bn.created_at as happened_at,
      case bn.level
        when 'dangerous' then 'خطير'
        when 'urgent' then 'عاجل'
        else 'تحذير'
      end as badge
    from public.breaking_news bn
    where bn.status = 'published'
      and bn.expires_at > now()
      and to_tsvector('simple', coalesce(bn.title, '')) @@ plainto_tsquery('simple', search_query)
      and (filter_type is null or filter_type = 'breaking-news')
      and (date_from is null or bn.created_at::date >= date_from)
      and (date_to is null or bn.created_at::date <= date_to)
  )
  select * from announcement_results
  union all
  select * from event_results
  union all
  select * from news_results
  order by happened_at desc;
$$;
