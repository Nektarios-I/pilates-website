-- 08_enable_rls.sql  —  Re-enable RLS on All Tables
alter table public.profiles      enable row level security;
alter table public.user_roles    enable row level security;
alter table public.packages      enable row level security;
alter table public.user_packages enable row level security;
alter table public.sessions      enable row level security;
alter table public.bookings      enable row level security;

select tablename, rowsecurity as rls_enabled
from pg_tables
where schemaname = 'public'
  and tablename in ('profiles','user_roles','packages','user_packages','sessions','bookings')
order by tablename;
