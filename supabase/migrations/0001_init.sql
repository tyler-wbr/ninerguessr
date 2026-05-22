-- Niner Guessr initial schema
-- Run after creating a new Supabase project (or via `supabase db push`).

create extension if not exists "pgcrypto";

create type difficulty as enum ('easy', 'medium', 'hard');
create type game_status as enum ('in_progress', 'completed', 'abandoned');

-- profiles: one row per auth.users row, holds display name + admin flag
create table profiles (
  id uuid primary key references auth.users on delete cascade,
  display_name text not null,
  is_admin boolean not null default false,
  created_at timestamptz not null default now()
);

-- locations: the photo catalog. lat/lng are sensitive and must never reach
-- the client until after the user guesses for that round.
create table locations (
  id uuid primary key default gen_random_uuid(),
  image_path text not null,
  lat double precision not null,
  lng double precision not null,
  difficulty difficulty not null,
  title text,
  hint text,
  is_published boolean not null default false,
  created_by uuid references profiles(id),
  created_at timestamptz not null default now()
);
create index locations_diff_pub_idx on locations(difficulty, is_published);

-- games: one row per session a player starts
create table games (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references profiles(id) on delete cascade,
  difficulty difficulty not null,
  status game_status not null default 'in_progress',
  total_score integer not null default 0,
  current_round smallint not null default 1,
  started_at timestamptz not null default now(),
  completed_at timestamptz
);
create index games_user_diff_idx on games(user_id, difficulty);
create index games_completed_diff_score_idx
  on games(difficulty, total_score desc)
  where status = 'completed';

-- game_rounds: five per game, pre-populated at game start
create table game_rounds (
  id uuid primary key default gen_random_uuid(),
  game_id uuid not null references games(id) on delete cascade,
  location_id uuid not null references locations(id),
  round_number smallint not null check (round_number between 1 and 5),
  guess_lat double precision,
  guess_lng double precision,
  distance_m double precision,
  points integer,
  guessed_at timestamptz,
  unique (game_id, round_number),
  unique (game_id, location_id)
);
create index game_rounds_game_idx on game_rounds(game_id);

-- Auto-create profile row when a new auth user signs up. display_name is
-- pulled from raw_user_meta_data.display_name; falls back to the email's
-- local part.
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.profiles (id, display_name)
  values (
    new.id,
    coalesce(
      nullif(new.raw_user_meta_data->>'display_name', ''),
      split_part(new.email, '@', 1)
    )
  )
  on conflict (id) do nothing;
  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

-- locations_public: safe projection for the play UI. Excludes lat/lng so
-- coordinates never leak to the client even if RLS were misconfigured.
create or replace view locations_public as
  select id, image_path, difficulty, title, hint, is_published
  from locations
  where is_published = true;

-- Leaderboard views
create or replace view leaderboard_single as
  select
    g.difficulty,
    g.user_id,
    p.display_name,
    g.id as game_id,
    g.total_score,
    g.completed_at
  from games g
  join profiles p on p.id = g.user_id
  where g.status = 'completed';

create or replace view leaderboard_avg as
  select
    difficulty,
    user_id,
    display_name,
    count(*)::int as games_played,
    round(avg(total_score))::int as avg_score
  from leaderboard_single
  group by difficulty, user_id, display_name
  having count(*) >= 5;
