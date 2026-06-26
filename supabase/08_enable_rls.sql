-- =============================================================================
-- 08_enable_rls.sql  —  Re-enable RLS on all application tables
-- =============================================================================

alter table public.profiles            enable row level security;
alter table public.user_roles          enable row level security;
alter table public.packages            enable row level security;
alter table public.session_cards       enable row level security;
alter table public.user_packages       enable row level security;
alter table public.sessions            enable row level security;
alter table public.bookings            enable row level security;
alter table public.booking_credit_charges enable row level security;
alter table public.staff_invites       enable row level security;
alter table public.studio_day_schedule enable row level security;
alter table public.contact_messages    enable row level security;

select tablename, rowsecurity as rls_enabled
from pg_tables
where schemaname = 'public'
  and tablename in (
    'profiles', 'user_roles', 'packages', 'session_cards', 'user_packages', 'sessions', 'bookings',
    'booking_credit_charges',
    'staff_invites', 'studio_day_schedule', 'contact_messages'
  )
order by tablename;
