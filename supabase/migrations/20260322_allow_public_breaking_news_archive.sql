drop policy if exists breaking_news_public_select on public.breaking_news;

create policy breaking_news_public_select
on public.breaking_news
for select
to anon, authenticated
using (status = 'published');
