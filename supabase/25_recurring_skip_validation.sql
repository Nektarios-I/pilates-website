-- =============================================================================
-- 25_recurring_skip_validation.sql — Reject orphan recurring skips
-- Pilates Studio · Supabase / PostgreSQL 15+
--
-- Validates skip matches an active schedule line for the rule before insert.
-- SAFE TO RE-RUN: Yes (CREATE OR REPLACE).
-- =============================================================================

create or replace function public.add_recurring_prebook_skip(
  p_rule_id         uuid,
  p_occurrence_date date,
  p_start_time      time,
  p_reason          text default null
)
returns public.recurring_prebook_skipped_occurrences
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_skip public.recurring_prebook_skipped_occurrences;
begin
  perform private.assert_recurring_staff();

  if not exists (
    select 1 from public.recurring_prebook_rules where id = p_rule_id
  ) then
    raise exception 'Recurring rule not found' using errcode = 'P0019';
  end if;

  if not exists (
    select 1
      from public.recurring_prebook_schedule_lines sl
     where sl.rule_id = p_rule_id
       and sl.is_active = true
       and sl.day_of_week = extract(isodow from p_occurrence_date)::integer
       and sl.start_time = p_start_time
  ) then
    raise exception
      'Skip does not match an active schedule line for this recurring rule'
      using errcode = 'P0031';
  end if;

  insert into public.recurring_prebook_skipped_occurrences (
    rule_id, occurrence_date, start_time, skipped_by, reason
  )
  values (
    p_rule_id, p_occurrence_date, p_start_time, auth.uid(), p_reason
  )
  returning * into v_skip;

  return v_skip;
exception
  when unique_violation then
    raise exception 'This occurrence is already skipped' using errcode = 'P0025';
end;
$$;

comment on function public.add_recurring_prebook_skip is
  'Records a skipped recurring occurrence. Must match an active schedule line (weekday + start time).';
