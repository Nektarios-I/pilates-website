-- =============================================================================
-- 07_disable_rls.sql  —  Disable RLS (debug / dev only)
--
-- Policies are preserved. Run 08_enable_rls.sql when finished.
-- Never leave disabled in production.
-- =============================================================================

do $$
begin
  raise warning
    'SECURITY WARNING: Disabling RLS. Run 08_enable_rls.sql when done.';
end;
$$;

alter table public.profiles            disable row level security;
alter table public.user_roles          disable row level security;
alter table public.packages            disable row level security;
alter table public.session_cards       disable row level security;
alter table public.user_packages       disable row level security;
alter table public.sessions            disable row level security;
alter table public.bookings            disable row level security;
alter table public.booking_credit_charges disable row level security;
alter table public.staff_invites       disable row level security;
alter table public.studio_day_schedule disable row level security;
alter table public.contact_messages    disable row level security;
alter table public.recurring_prebook_rules disable row level security;
alter table public.recurring_prebook_schedule_lines disable row level security;
alter table public.recurring_prebook_skipped_occurrences disable row level security;
alter table public.recurring_prebook_materialization_log disable row level security;

select tablename, rowsecurity as rls_enabled
from pg_tables
where schemaname = 'public'
  and tablename in (
    'profiles', 'user_roles', 'packages', 'session_cards', 'user_packages', 'sessions', 'bookings',
    'booking_credit_charges',
    'staff_invites', 'studio_day_schedule', 'contact_messages',
    'recurring_prebook_rules', 'recurring_prebook_schedule_lines',
    'recurring_prebook_skipped_occurrences', 'recurring_prebook_materialization_log'
  )
order by tablename;
