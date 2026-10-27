-- RLS experiment: restore the original owner checks on the DISPOSABLE table.
-- Identical expressions to 01-create-experiment-table.sql.

alter policy "Users can view their own rows" on public.rls_experiment_saved_species
  using (((select auth.jwt()) ->> 'sub') = user_id);

alter policy "Users can update their own rows" on public.rls_experiment_saved_species
  using (((select auth.jwt()) ->> 'sub') = user_id)
  with check (((select auth.jwt()) ->> 'sub') = user_id);

alter policy "Users can delete their own rows" on public.rls_experiment_saved_species
  using (((select auth.jwt()) ->> 'sub') = user_id);
