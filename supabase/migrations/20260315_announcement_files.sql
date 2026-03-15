create extension if not exists pgcrypto;

create table if not exists public.announcement_files (
  id uuid primary key default gen_random_uuid(),
  announcement_id uuid not null references public.announcements(id) on delete cascade,
  file_url text not null,
  file_name text,
  file_type text not null check (file_type in ('pdf', 'image')),
  created_at timestamptz default now()
);

alter table public.announcement_files
  alter column file_url type text,
  alter column file_name type text;

create index if not exists idx_announcement_files_announcement_id
  on public.announcement_files (announcement_id);

insert into storage.buckets (id, name, public)
values ('announcements', 'announcements', true)
on conflict (id) do update
set public = excluded.public;
