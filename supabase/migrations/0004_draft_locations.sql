-- Draft locations: save title + difficulty now, add photo/coords later.
-- Also allow deleting locations used in past games (rounds keep history, location_id → null).

alter table locations
  alter column image_path drop not null,
  alter column lat drop not null,
  alter column lng drop not null;

alter table game_rounds drop constraint if exists game_rounds_location_id_fkey;

alter table game_rounds
  alter column location_id drop not null;

alter table game_rounds
  add constraint game_rounds_location_id_fkey
  foreign key (location_id) references locations(id) on delete set null;

-- Play UI projection: only complete, published locations.
create or replace view locations_public as
  select id, image_path, difficulty, title, hint, is_published
  from locations
  where is_published = true
    and image_path is not null
    and lat is not null
    and lng is not null;
