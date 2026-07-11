-- =============================================================================
-- 26_delete_recurring_rule.sql — Hard-delete recurring prebook rules (staff)
-- Pilates Studio · Supabase / PostgreSQL 15+
--
-- CASCADE removes schedule lines, skips, and materialization log rows.
-- Existing bookings are kept; recurring_materialization_log_id is set null.
-- SAFE TO RE-RUN: Yes (CREATE OR REPLACE).
-- =============================================================================

create or replace function public.delete_recurring_prebook_rule(p_rule_id uuid)
returns void
language plpgsql
security definer
set search_path = ''
as $$
begin
  perform private.assert_recurring_staff();

  if not exists (
    select 1 from public.recurring_prebook_rules where id = p_rule_id
  ) then
    raise exception 'Recurring rule not found' using errcode = 'P0019';
  end if;

  delete from public.recurring_prebook_rules where id = p_rule_id;
end;
$$;

comment on function public.delete_recurring_prebook_rule is
  'Permanently removes a recurring prebook rule and its schedule lines, skips, and materialization log.';

grant execute on function public.delete_recurring_prebook_rule(uuid) to authenticated;
