-- FERA: per-user saved species and saved observations (sightings).
-- Data model: see AGENTS.md. Owner of every row = Clerk user ID from the
-- session token's `sub` claim (Supabase Third-Party Auth with Clerk).

-- ---------------------------------------------------------------------------
-- Tables
-- ---------------------------------------------------------------------------

create table public.saved_species (
  id                uuid primary key default gen_random_uuid(),
  user_id           text not null default (auth.jwt() ->> 'sub'),
  taxon_id          integer not null,
  common_name       text,
  scientific_name   text not null,
  iconic_group      text,
  photo_url         text,
  photo_attribution text,
  note              text check (char_length(note) <= 2000),
  created_at        timestamptz not null default now(),
  unique (user_id, taxon_id)
);

create table public.saved_observations (
  id                uuid primary key default gen_random_uuid(),
  user_id           text not null default (auth.jwt() ->> 'sub'),
  observation_id    bigint not null,
  taxon_id          integer,
  common_name       text,
  photo_url         text,
  photo_attribution text,
  observed_on       date,
  place_guess       text,
  observer_login    text,
  note              text check (char_length(note) <= 2000),
  created_at        timestamptz not null default now(),
  unique (user_id, observation_id)
);

-- The unique constraints above also index (user_id, ...), which covers the
-- "list my saved items" queries filtered by user_id.

-- ---------------------------------------------------------------------------
-- Privileges
-- New tables are not auto-exposed in this project, so grant explicitly.
-- anon (signed-out) gets nothing. authenticated gets only what the app needs;
-- RLS below still limits every operation to the user's own rows.
-- ---------------------------------------------------------------------------

revoke all on table public.saved_species, public.saved_observations from anon, authenticated;

grant select, insert, delete on table public.saved_species, public.saved_observations to authenticated;

-- Only the private note is editable after saving.
grant update (note) on table public.saved_species, public.saved_observations to authenticated;

-- ---------------------------------------------------------------------------
-- Row Level Security
-- ---------------------------------------------------------------------------

alter table public.saved_species enable row level security;
alter table public.saved_observations enable row level security;

-- saved_species

create policy "Users can view their own saved species"
  on public.saved_species for select to authenticated
  using ((select auth.jwt() ->> 'sub') = user_id);

create policy "Users can save species as themselves"
  on public.saved_species for insert to authenticated
  with check ((select auth.jwt() ->> 'sub') = user_id);

create policy "Users can update their own saved species"
  on public.saved_species for update to authenticated
  using ((select auth.jwt() ->> 'sub') = user_id)
  with check ((select auth.jwt() ->> 'sub') = user_id);

create policy "Users can delete their own saved species"
  on public.saved_species for delete to authenticated
  using ((select auth.jwt() ->> 'sub') = user_id);

-- saved_observations

create policy "Users can view their own saved observations"
  on public.saved_observations for select to authenticated
  using ((select auth.jwt() ->> 'sub') = user_id);

create policy "Users can save observations as themselves"
  on public.saved_observations for insert to authenticated
  with check ((select auth.jwt() ->> 'sub') = user_id);

create policy "Users can update their own saved observations"
  on public.saved_observations for update to authenticated
  using ((select auth.jwt() ->> 'sub') = user_id)
  with check ((select auth.jwt() ->> 'sub') = user_id);

create policy "Users can delete their own saved observations"
  on public.saved_observations for delete to authenticated
  using ((select auth.jwt() ->> 'sub') = user_id);
