-- Follow-up to create_saved_tables: clear the two Supabase Advisor warnings.
-- No change in who can access what.

-- ---------------------------------------------------------------------------
-- 1. Performance lint auth_rls_initplan
-- The policies already run auth.jwt() once per query (EXPLAIN shows an
-- InitPlan), but the linter only recognises the form (select auth.jwt()).
-- Same logic, rewritten as ((select auth.jwt()) ->> 'sub'). ALTER POLICY keeps
-- each policy in place, so there is no moment without a policy.
-- ---------------------------------------------------------------------------

alter policy "Users can view their own saved species" on public.saved_species
  using (((select auth.jwt()) ->> 'sub') = user_id);
alter policy "Users can save species as themselves" on public.saved_species
  with check (((select auth.jwt()) ->> 'sub') = user_id);
alter policy "Users can update their own saved species" on public.saved_species
  using (((select auth.jwt()) ->> 'sub') = user_id)
  with check (((select auth.jwt()) ->> 'sub') = user_id);
alter policy "Users can delete their own saved species" on public.saved_species
  using (((select auth.jwt()) ->> 'sub') = user_id);

alter policy "Users can view their own saved observations" on public.saved_observations
  using (((select auth.jwt()) ->> 'sub') = user_id);
alter policy "Users can save observations as themselves" on public.saved_observations
  with check (((select auth.jwt()) ->> 'sub') = user_id);
alter policy "Users can update their own saved observations" on public.saved_observations
  using (((select auth.jwt()) ->> 'sub') = user_id)
  with check (((select auth.jwt()) ->> 'sub') = user_id);
alter policy "Users can delete their own saved observations" on public.saved_observations
  using (((select auth.jwt()) ->> 'sub') = user_id);

-- ---------------------------------------------------------------------------
-- 2. Security lints 0028/0029 on public.rls_auto_enable()
-- Supabase's auto-RLS event-trigger function. It is only meant to be fired by
-- the ensure_rls event trigger, not called through the API. Functions grant
-- EXECUTE to PUBLIC by default, so revoke it there as well as from the API
-- roles. The owner (postgres) keeps EXECUTE, and the event trigger keeps firing.
-- ---------------------------------------------------------------------------

revoke execute on function public.rls_auto_enable() from public, anon, authenticated;
