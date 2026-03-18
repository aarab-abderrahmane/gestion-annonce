insert into storage.buckets (id, name, public)
values
  ('announcements', 'announcements', true),
  ('events', 'events', true)
on conflict (id) do update
set public = excluded.public;

drop policy if exists public_read_announcements_bucket on storage.objects;
create policy public_read_announcements_bucket
on storage.objects
for select
using (bucket_id = 'announcements');

drop policy if exists authenticated_upload_announcements_bucket on storage.objects;
create policy authenticated_upload_announcements_bucket
on storage.objects
for insert
to authenticated
with check (bucket_id = 'announcements');

drop policy if exists authenticated_delete_announcements_bucket on storage.objects;
create policy authenticated_delete_announcements_bucket
on storage.objects
for delete
to authenticated
using (bucket_id = 'announcements');

drop policy if exists public_read_events_bucket on storage.objects;
create policy public_read_events_bucket
on storage.objects
for select
using (bucket_id = 'events');

drop policy if exists authenticated_upload_events_bucket on storage.objects;
create policy authenticated_upload_events_bucket
on storage.objects
for insert
to authenticated
with check (bucket_id = 'events');

drop policy if exists authenticated_delete_events_bucket on storage.objects;
create policy authenticated_delete_events_bucket
on storage.objects
for delete
to authenticated
using (bucket_id = 'events');
