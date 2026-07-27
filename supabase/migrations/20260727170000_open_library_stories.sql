alter table public.stories
  add column if not exists open_library_id text,
  add column if not exists cover_url text;

create unique index if not exists stories_open_library_id_idx
  on public.stories(open_library_id)
  where open_library_id is not null;
