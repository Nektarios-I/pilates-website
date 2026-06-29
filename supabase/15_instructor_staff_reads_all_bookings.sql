-- Allow instructors to read all bookings (studio-wide day rosters).
-- Bookings are not tied to a specific instructor on the session row.

drop policy if exists "bookings: instructor reads assigned sessions" on public.bookings;
drop policy if exists "bookings: staff reads all" on public.bookings;

create policy "bookings: staff reads all"
  on public.bookings for select
  to authenticated
  using ( (select private.is_staff()) );
