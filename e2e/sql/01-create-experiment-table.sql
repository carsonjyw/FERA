-- RLS experiment: a DISPOSABLE copy of saved_species. It is NOT part of FERA's
-- schema and is NOT a migration. It exists only while the experiment runs and is
-- dropped by 05-drop-experiment-table.sql. FERA's real tables are never touched.
--
-- `including all` copies the columns, defaults (user_id defaults to the Clerk
-- user ID from the token), the note-length check, the primary key and the
-- UNIQUE (user_id, taxon_id) constraint, so the copy matches saved_species.

create table public.rls_experiment_saved_species
  (like public.saved_species including all);

-- Same privileges as the real table: signed-out users get nothing; signed-in
-- users can select, insert, delete, and update only the note column. No TRUNCATE.
revoke all on table public.rls_experiment_saved_species from anon, authenticated;
grant select, insert, delete on table public.rls_experiment_saved_species to authenticated;
grant update (note) on table public.rls_experiment_saved_species to authenticated;

alter table public.rls_experiment_saved_species enable row level security;

-- Same four policies as saved_species (see the Step 5 migrations).
create policy "Users can view their own rows"
  on public.rls_experiment_saved_species for select to authenticated
  using (((select auth.jwt()) ->> 'sub') = user_id);

create policy "Users can insert rows as themselves"
  on public.rls_experiment_saved_species for insert to authenticated
  with check (((select auth.jwt()) ->> 'sub') = user_id);

create policy "Users can update their own rows"
  on public.rls_experiment_saved_species for update to authenticated
  using (((select auth.jwt()) ->> 'sub') = user_id)
  with check (((select auth.jwt()) ->> 'sub') = user_id);

create policy "Users can delete their own rows"
  on public.rls_experiment_saved_species for delete to authenticated
  using (((select auth.jwt()) ->> 'sub') = user_id);
