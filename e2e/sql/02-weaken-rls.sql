-- RLS experiment: deliberately weaken the DISPOSABLE table only.
-- The mistake simulated: policies that forgot to check who owns the row
-- (`using (true)`), so any signed-in user can read, change and delete anyone's rows.
-- Only public.rls_experiment_saved_species is named here.

alter policy "Users can view their own rows" on public.rls_experiment_saved_species
  using (true);

alter policy "Users can update their own rows" on public.rls_experiment_saved_species
  using (true) with check (true);

alter policy "Users can delete their own rows" on public.rls_experiment_saved_species
  using (true);
