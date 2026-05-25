-- Daily Challenge: mixed-difficulty timed mode (6 rounds: 2 easy, 2 medium, 2 hard)

create type game_mode as enum ('casual', 'daily');

alter table games
  add column game_mode game_mode not null default 'casual',
  add column challenge_date date;

-- Casual games keep difficulty; daily games may leave it null.
alter table games alter column difficulty drop not null;

alter table game_rounds
  drop constraint if exists game_rounds_round_number_check;

alter table game_rounds
  add constraint game_rounds_round_number_check
    check (round_number between 1 and 10);

alter table game_rounds
  add column round_difficulty difficulty,
  add column round_started_at timestamptz,
  add column time_ms integer,
  add column distance_points integer;

-- One daily attempt per user per calendar day (resume in_progress is allowed).
create unique index games_daily_one_per_user_date
  on games (user_id, challenge_date)
  where game_mode = 'daily';

create index games_daily_completed_idx
  on games (challenge_date, total_score desc)
  where game_mode = 'daily' and status = 'completed';

create or replace view leaderboard_daily as
  select
    g.challenge_date,
    g.user_id,
    p.display_name,
    g.id as game_id,
    g.total_score,
    g.completed_at
  from games g
  join profiles p on p.id = g.user_id
  where g.game_mode = 'daily'
    and g.status = 'completed';
