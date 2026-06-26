-- =============================================================================
-- 05_reset_data.sql  —  Clear all application + auth data (preserve schema)
-- Pilates Studio · Supabase / PostgreSQL 15+
--
-- WARNING: DESTRUCTIVE. Never run on production.
--
-- HOW TO RUN (same SQL Editor session):
--   set app.allow_data_reset = 'true';
--   -- then run this entire file
-- =============================================================================

do $$
begin
  if current_setting('app.allow_data_reset', true) is distinct from 'true' then
    raise exception
      E'SAFETY GUARD: 05_reset_data.sql is blocked.\n'
      'Run this first in the same session:\n'
      '  set app.allow_data_reset = ''true'';\n'
      'Never run this script against production data.';
  end if;

  raise notice '05_reset_data.sql: clearing application data and auth users...';
end;
$$;

truncate table
  public.booking_credit_charges,
  public.bookings,
  public.user_packages,
  public.sessions,
  public.staff_invites,
  public.studio_day_schedule,
  public.session_cards,
  public.contact_messages,
  public.user_roles,
  public.profiles,
  public.packages
restart identity
cascade;

delete from auth.identities;
delete from auth.users;

do $$
begin
  raise notice '05_reset_data.sql: done. Next run 04_seed.sql, then 10_add_admin.sql or create accounts via Add Account.';
end;
$$;
