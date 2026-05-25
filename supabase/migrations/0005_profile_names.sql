-- Store legal first/last name on profiles; display_name remains the public leaderboard label.

alter table profiles
  add column if not exists first_name text,
  add column if not exists last_name text;

create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.profiles (id, display_name, first_name, last_name)
  values (
    new.id,
    coalesce(
      nullif(trim(new.raw_user_meta_data->>'display_name'), ''),
      split_part(new.email, '@', 1)
    ),
    nullif(trim(new.raw_user_meta_data->>'first_name'), ''),
    nullif(trim(new.raw_user_meta_data->>'last_name'), '')
  )
  on conflict (id) do nothing;
  return new;
end;
$$;
