-- Row Level Security policies.
-- All gameplay mutations go through the service-role server routes, so the
-- anon/authenticated roles only need read access to a narrow set of rows.

alter table profiles enable row level security;
alter table locations enable row level security;
alter table games enable row level security;
alter table game_rounds enable row level security;

-- profiles: a user can read and update their own row. is_admin is intentionally
-- NOT in the update policy column list; admin promotion must be done by a
-- service-role caller (e.g. via SQL editor or seed script).
create policy "profiles_select_own"
  on profiles for select
  using (auth.uid() = id);

create policy "profiles_update_own"
  on profiles for update
  using (auth.uid() = id)
  with check (auth.uid() = id);

-- locations: no direct read. Clients must use the locations_public view (which
-- excludes coordinates) or go through server routes. Service-role bypasses RLS.
-- (No select / insert / update / delete policies => fully denied for anon/auth.)

-- games: a user can read their own games (used by /results/:gameId and /profile).
create policy "games_select_own"
  on games for select
  using (auth.uid() = user_id);

-- game_rounds: a user can read rounds for games they own. Note this does NOT
-- include coordinate columns until the server sets them on guess, but the
-- location_id could theoretically be joined client-side to locations_public
-- (which has no lat/lng). The actual lat/lng are only ever served by the
-- /api/games/:id/guess response *after* a guess is recorded.
create policy "game_rounds_select_own"
  on game_rounds for select
  using (
    exists (
      select 1 from games g
      where g.id = game_rounds.game_id
        and g.user_id = auth.uid()
    )
  );

-- Views inherit the RLS of their base tables. locations_public reads from
-- locations, which has no select policy for anon/authenticated, so direct
-- view access from the client is also denied. The play UI gets photo URLs
-- via server-signed Storage URLs, not by reading this view directly.
-- (Server-role queries bypass RLS and use the view freely.)

-- Storage policies: the location-photos bucket is private. Reads happen via
-- short-lived signed URLs minted by the server. Authenticated users may
-- upload to a temporary prefix; the admin route promotes the object on save.
-- Configure in Supabase Storage UI or via the snippet in README.
