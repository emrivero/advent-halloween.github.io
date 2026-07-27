create extension if not exists "pgcrypto";

create table if not exists public.stories (
  id uuid primary key default gen_random_uuid(),
  title_es text not null,
  title_en text not null,
  author text not null,
  genre_es text not null,
  genre_en text not null,
  reading_min integer not null check (reading_min > 0),
  source_url text not null,
  open_library_id text unique,
  cover_url text,
  created_at timestamptz not null default now()
);

create table if not exists public.reading_plans (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  name text not null,
  start_date date not null,
  end_date date not null,
  created_at timestamptz not null default now()
);

create table if not exists public.reading_plan_days (
  id uuid primary key default gen_random_uuid(),
  plan_id uuid not null references public.reading_plans(id) on delete cascade,
  story_id uuid not null references public.stories(id),
  day_date date not null,
  status text not null default 'locked'
    check (status in ('locked', 'unlocked', 'read', 'skipped')),
  read_at timestamptz,
  unique(plan_id, day_date)
);

create index if not exists reading_plans_user_id_idx on public.reading_plans(user_id);
create index if not exists reading_plan_days_plan_id_idx on public.reading_plan_days(plan_id);

alter table public.stories enable row level security;
alter table public.reading_plans enable row level security;
alter table public.reading_plan_days enable row level security;

drop policy if exists "stories are public" on public.stories;
create policy "stories are public" on public.stories for select using (true);

drop policy if exists "users manage their reading plans" on public.reading_plans;
create policy "users manage their reading plans" on public.reading_plans
  for all using (auth.uid() = user_id) with check (auth.uid() = user_id);

drop policy if exists "users manage their reading days" on public.reading_plan_days;
create policy "users manage their reading days" on public.reading_plan_days
  for all using (
    exists (
      select 1 from public.reading_plans
      where reading_plans.id = reading_plan_days.plan_id
        and reading_plans.user_id = auth.uid()
    )
  ) with check (
    exists (
      select 1 from public.reading_plans
      where reading_plans.id = reading_plan_days.plan_id
        and reading_plans.user_id = auth.uid()
    )
  );

insert into public.stories
  (title_es, title_en, author, genre_es, genre_en, reading_min, source_url)
values
  ('El corazón delator','The Tell-Tale Heart','Edgar Allan Poe','Terror psicológico','Psychological horror',18,'https://www.gutenberg.org/ebooks/2147'),
  ('La caída de la Casa Usher','The Fall of the House of Usher','Edgar Allan Poe','Gótico','Gothic',35,'https://www.gutenberg.org/ebooks/932'),
  ('El gato negro','The Black Cat','Edgar Allan Poe','Terror psicológico','Psychological horror',22,'https://www.gutenberg.org/ebooks/2147'),
  ('La máscara de la Muerte Roja','The Masque of the Red Death','Edgar Allan Poe','Gótico','Gothic',16,'https://www.gutenberg.org/ebooks/1064'),
  ('El barril de amontillado','The Cask of Amontillado','Edgar Allan Poe','Terror','Horror',18,'https://www.gutenberg.org/ebooks/2147'),
  ('El retrato oval','The Oval Portrait','Edgar Allan Poe','Gótico','Gothic',10,'https://www.gutenberg.org/ebooks/2147'),
  ('El pozo y el péndulo','The Pit and the Pendulum','Edgar Allan Poe','Terror','Horror',30,'https://www.gutenberg.org/ebooks/2147'),
  ('Ligeia','Ligeia','Edgar Allan Poe','Gótico','Gothic',32,'https://www.gutenberg.org/ebooks/2147'),
  ('La pata de mono','The Monkey''s Paw','W. W. Jacobs','Sobrenatural','Supernatural',25,'https://www.gutenberg.org/ebooks/12122'),
  ('La habitación de la torre','The Room in the Tower','E. F. Benson','Fantasmas','Ghost story',25,'https://www.gutenberg.org/ebooks/72421'),
  ('La litera superior','The Upper Berth','F. Marion Crawford','Fantasmas','Ghost story',38,'https://www.gutenberg.org/ebooks/22246'),
  ('La casa del juez','The Judge''s House','Bram Stoker','Gótico','Gothic',35,'https://www.gutenberg.org/ebooks/10150'),
  ('El huésped de Drácula','Dracula''s Guest','Bram Stoker','Vampiros','Vampires',28,'https://www.gutenberg.org/ebooks/10150'),
  ('La squaw','The Squaw','Bram Stoker','Terror','Horror',24,'https://www.gutenberg.org/ebooks/10150'),
  ('El entierro de las ratas','The Burial of the Rats','Bram Stoker','Terror','Horror',32,'https://www.gutenberg.org/ebooks/10150'),
  ('El mortal inmortal','The Mortal Immortal','Mary Shelley','Gótico','Gothic',30,'https://www.gutenberg.org/ebooks/64339'),
  ('La transformación','Transformation','Mary Shelley','Gótico','Gothic',42,'https://www.gutenberg.org/ebooks/64339'),
  ('La lotería','The Lottery','Shirley Jackson','Terror social','Social horror',22,'https://www.newyorker.com/magazine/1948/06/26/the-lottery'),
  ('La señal','The Signal-Man','Charles Dickens','Fantasmas','Ghost story',30,'https://www.gutenberg.org/ebooks/1289'),
  ('El guardavías','The Signal-Man','Charles Dickens','Sobrenatural','Supernatural',30,'https://www.gutenberg.org/ebooks/1289'),
  ('La mujer del sueño','The Dream Woman','Wilkie Collins','Misterio gótico','Gothic mystery',40,'https://www.gutenberg.org/ebooks/1626'),
  ('La puerta abierta','The Open Door','Margaret Oliphant','Fantasmas','Ghost story',45,'https://www.gutenberg.org/ebooks/10052'),
  ('¿Quién sabe?','Who Knows?','Guy de Maupassant','Sobrenatural','Supernatural',20,'https://www.gutenberg.org/ebooks/3090'),
  ('El Horla','The Horla','Guy de Maupassant','Terror psicológico','Psychological horror',42,'https://www.gutenberg.org/ebooks/10775'),
  ('La mano','The Hand','Guy de Maupassant','Terror','Horror',18,'https://www.gutenberg.org/ebooks/3090'),
  ('La muerta enamorada','Clarimonde','Théophile Gautier','Vampiros','Vampires',45,'https://www.gutenberg.org/ebooks/22661'),
  ('El monte de las ánimas','The Mount of Souls','Gustavo Adolfo Bécquer','Leyenda gótica','Gothic legend',25,'https://www.gutenberg.org/ebooks/10814'),
  ('El miserere','The Miserere','Gustavo Adolfo Bécquer','Leyenda gótica','Gothic legend',28,'https://www.gutenberg.org/ebooks/10814'),
  ('Los ojos verdes','The Green Eyes','Gustavo Adolfo Bécquer','Leyenda fantástica','Dark fantasy',22,'https://www.gutenberg.org/ebooks/10814'),
  ('El almohadón de plumas','The Feather Pillow','Horacio Quiroga','Terror','Horror',15,'https://www.gutenberg.org/ebooks/13507'),
  ('La gallina degollada','The Decapitated Chicken','Horacio Quiroga','Terror','Horror',20,'https://www.gutenberg.org/ebooks/13507')
on conflict do nothing;
