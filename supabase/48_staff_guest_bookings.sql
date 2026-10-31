-- =============================================================================
-- 48_staff_guest_bookings.sql
-- Staff-managed guest bookings on public.bookings (Option A).
--
-- • Guest rows: no profile, no package, credits_used = 0, booking_source staff_guest
-- • Shape check keeps registered-client invariants
-- • Canonical scheduled-session uniqueness + ensure_session_slot race fix
-- • staff_book_guests / staff_update_guest_booking RPCs
-- • cancel_booking skips guest refunds; mark_booking_not_attended rejects guests
-- • Feature gate staff_guest_bookings defaults OFF (does not reset existing gates)
--
-- RUN ORDER: After 47_materialize_selection_credit_aware.sql.
-- SAFE TO RE-RUN: Yes (IF NOT EXISTS / CREATE OR REPLACE / DROP IF EXISTS patterns).
-- =============================================================================

begin;

-- ---------------------------------------------------------------------------
-- 1. Guest columns on bookings
-- ---------------------------------------------------------------------------
alter table public.bookings
  add column if not exists attendee_kind text not null default 'client',
  add column if not exists guest_label text,
  add column if not exists guest_note text,
  add column if not exists guest_request_id uuid,
  add column if not exists guest_ordinal smallint;

alter table public.bookings
  drop constraint if exists bookings_attendee_kind_known;
alter table public.bookings
  add constraint bookings_attendee_kind_known
  check (attendee_kind in ('client', 'guest'));

alter table public.bookings
  drop constraint if exists bookings_booking_source_check;
alter table public.bookings
  add constraint bookings_booking_source_check
  check (booking_source in ('client', 'staff_manual', 'recurring', 'staff_guest'));

-- Allow null user/package only for guests (shape check below).
alter table public.bookings
  alter column user_id drop not null;
alter table public.bookings
  alter column user_package_id drop not null;

alter table public.bookings
  drop constraint if exists bookings_attendee_shape;
alter table public.bookings
  add constraint bookings_attendee_shape
  check (
    (
      attendee_kind = 'client'
      and user_id is not null
      and user_package_id is not null
      and guest_label is null
      and guest_note is null
      and guest_request_id is null
      and guest_ordinal is null
      and credits_used >= 1
      and booking_source in ('client', 'staff_manual', 'recurring')
    )
    or (
      attendee_kind = 'guest'
      and user_id is null
      and user_package_id is null
      and guest_label is not null
      and char_length(guest_label) between 1 and 80
      and guest_label !~ E'[\\x00-\\x1F\\x7F]'
      and (
        guest_note is null
        or (
          char_length(guest_note) between 1 and 500
          and guest_note !~ E'[\\x00-\\x1F\\x7F]'
        )
      )
      and credits_used = 0
      and booking_source = 'staff_guest'
      and created_by_user_id is not null
      and recurring_materialization_log_id is null
      and guest_request_id is not null
      and guest_ordinal is not null
      and guest_ordinal >= 1
    )
  );

comment on column public.bookings.attendee_kind is
  'client = registered booking; guest = staff-managed walk-in without account/package.';
comment on column public.bookings.guest_label is
  'Per-booking identifying label for guest attendees. Not a reusable person id.';
comment on column public.bookings.guest_note is
  'Optional plain-text note stored on this guest booking only.';
comment on column public.bookings.guest_request_id is
  'Idempotency key for a staff guest batch submission.';
comment on column public.bookings.guest_ordinal is
  '1-based order of the guest within guest_request_id.';

create unique index if not exists bookings_guest_request_ordinal
  on public.bookings (guest_request_id, guest_ordinal)
  where attendee_kind = 'guest';

create index if not exists idx_bookings_attendee_kind
  on public.bookings (attendee_kind)
  where attendee_kind = 'guest';

-- ---------------------------------------------------------------------------
-- 2. Request + edit audit tables
-- ---------------------------------------------------------------------------
create table if not exists public.guest_booking_requests (
  id uuid primary key,
  actor_user_id uuid not null references public.profiles(id) on delete restrict,
  session_id uuid not null references public.sessions(id) on delete restrict,
  payload_hash text not null,
  created_at timestamptz not null default now()
);

comment on table public.guest_booking_requests is
  'Staff guest batch idempotency reservations. id is client-generated request UUID.';

create index if not exists idx_guest_booking_requests_session
  on public.guest_booking_requests (session_id);

alter table public.guest_booking_requests enable row level security;

revoke all on public.guest_booking_requests from public, anon;
grant select on public.guest_booking_requests to authenticated;

drop policy if exists guest_booking_requests_staff_read on public.guest_booking_requests;
create policy guest_booking_requests_staff_read
  on public.guest_booking_requests
  for select to authenticated
  using ((select private.is_staff()));

alter table public.bookings
  drop constraint if exists bookings_guest_request_id_fkey;
alter table public.bookings
  add constraint bookings_guest_request_id_fkey
  foreign key (guest_request_id) references public.guest_booking_requests(id) on delete restrict;

create table if not exists public.booking_guest_detail_events (
  id uuid primary key default gen_random_uuid(),
  booking_id uuid not null references public.bookings(id) on delete restrict,
  actor_user_id uuid not null references public.profiles(id) on delete restrict,
  prior_label text not null,
  new_label text not null,
  prior_note text,
  new_note text,
  occurred_at timestamptz not null default clock_timestamp()
);

comment on table public.booking_guest_detail_events is
  'Audit trail for staff edits to guest label/note.';

create index if not exists idx_booking_guest_detail_events_booking
  on public.booking_guest_detail_events (booking_id, occurred_at desc);

alter table public.booking_guest_detail_events enable row level security;

revoke all on public.booking_guest_detail_events from public, anon;
grant select on public.booking_guest_detail_events to authenticated;

drop policy if exists booking_guest_detail_events_staff_read on public.booking_guest_detail_events;
create policy booking_guest_detail_events_staff_read
  on public.booking_guest_detail_events
  for select to authenticated
  using ((select private.is_staff()));

-- ---------------------------------------------------------------------------
-- 3. Feature gate (default OFF; do not flip existing keys)
-- ---------------------------------------------------------------------------
insert into private.feature_gates (feature_key, enabled)
values ('staff_guest_bookings', false)
on conflict (feature_key) do nothing;

-- ---------------------------------------------------------------------------
-- 4. Canonical scheduled session slot uniqueness + ensure_session_slot fix
-- ---------------------------------------------------------------------------
do $$
declare
  v_dup integer;
begin
  select count(*)::int into v_dup
    from (
      select 1
        from public.sessions
       where status = 'scheduled'
       group by starts_at, ends_at, session_type
      having count(*) > 1
    ) d;
  if v_dup > 0 then
    raise exception
      'Cannot add sessions_one_scheduled_slot: % duplicate scheduled slot group(s) exist',
      v_dup;
  end if;
end $$;

create unique index if not exists sessions_one_scheduled_slot
  on public.sessions (starts_at, ends_at, session_type)
  where status = 'scheduled';

create or replace function public.ensure_session_slot(
  p_starts_at     timestamptz,
  p_ends_at       timestamptz,
  p_session_type  text default 'reformer',
  p_capacity      integer default 6,
  p_credits_required integer default 1,
  p_reformer_credits_required integer default 1,
  p_mat_credits_required integer default 0
)
returns uuid
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_session_id uuid;
  v_title      text;
begin
  if p_ends_at <= p_starts_at then
    raise exception 'Session end must be after start' using errcode = 'P0020';
  end if;

  if p_session_type not in ('reformer', 'mat', 'private', 'intro') then
    raise exception 'Invalid session type: %', p_session_type using errcode = 'P0021';
  end if;

  if p_capacity <= 0 then
    raise exception 'Capacity must be positive' using errcode = 'P0022';
  end if;

  if p_reformer_credits_required < 0 or p_mat_credits_required < 0 then
    raise exception 'Credit requirements cannot be negative' using errcode = 'P0023';
  end if;

  if p_reformer_credits_required = 0 and p_mat_credits_required = 0 then
    raise exception 'At least one class credit is required' using errcode = 'P0024';
  end if;

  -- Serialize first-create races for the same logical slot.
  perform pg_advisory_xact_lock(
    hashtextextended(
      p_starts_at::text || '|' || p_ends_at::text || '|' || p_session_type,
      0
    )
  );

  select id into v_session_id
    from public.sessions
   where starts_at = p_starts_at
     and ends_at = p_ends_at
     and session_type = p_session_type
     and status = 'scheduled'
   limit 1;

  if v_session_id is not null then
    update public.sessions
       set capacity = p_capacity,
           credits_required = p_credits_required,
           reformer_credits_required = p_reformer_credits_required,
           mat_credits_required = p_mat_credits_required
     where id = v_session_id
       and status = 'scheduled';
    return v_session_id;
  end if;

  v_title := initcap(p_session_type) || ' · ' ||
             to_char(p_starts_at at time zone 'Europe/Nicosia', 'DD Mon HH24:MI');

  begin
    insert into public.sessions (
      title, session_type, starts_at, ends_at, capacity, credits_required,
      reformer_credits_required, mat_credits_required, status
    )
    values (
      v_title, p_session_type, p_starts_at, p_ends_at, p_capacity, p_credits_required,
      p_reformer_credits_required, p_mat_credits_required, 'scheduled'
    )
    returning id into v_session_id;
  exception
    when unique_violation then
      select id into v_session_id
        from public.sessions
       where starts_at = p_starts_at
         and ends_at = p_ends_at
         and session_type = p_session_type
         and status = 'scheduled'
       limit 1;
      if v_session_id is null then
        raise;
      end if;
      update public.sessions
         set capacity = p_capacity,
             credits_required = p_credits_required,
             reformer_credits_required = p_reformer_credits_required,
             mat_credits_required = p_mat_credits_required
       where id = v_session_id
         and status = 'scheduled';
  end;

  return v_session_id;
end;
$$;

comment on function public.ensure_session_slot(timestamptz, timestamptz, text, integer, integer, integer, integer) is
  'Idempotently creates/finds a scheduled session for a slot. Advisory lock + unique index prevent duplicate scheduled rows.';

-- ---------------------------------------------------------------------------
-- 5. Helpers: normalize guests + payload hash (matches app guest-booking.ts)
-- ---------------------------------------------------------------------------
create or replace function private.normalize_guest_label(p_label text)
returns text
language plpgsql
immutable
set search_path = ''
as $$
declare
  v text;
begin
  -- Reject controls on the raw value before whitespace collapse would turn newlines into spaces.
  if coalesce(p_label, '') ~ E'[\\x00-\\x1F\\x7F]' then
    raise exception 'Guest label contains invalid characters' using errcode = 'P0044';
  end if;
  v := trim(both from regexp_replace(coalesce(p_label, ''), '\s+', ' ', 'g'));
  if v = '' then
    raise exception 'Guest label is required' using errcode = 'P0044';
  end if;
  if char_length(v) > 80 then
    raise exception 'Guest label is too long' using errcode = 'P0044';
  end if;
  return v;
end;
$$;

create or replace function private.normalize_guest_note(p_note text)
returns text
language plpgsql
immutable
set search_path = ''
as $$
declare
  v text;
begin
  if p_note is null then
    return null;
  end if;
  if p_note ~ E'[\\x00-\\x1F\\x7F]' then
    raise exception 'Guest note contains invalid characters' using errcode = 'P0044';
  end if;
  v := trim(both from regexp_replace(p_note, '\s+', ' ', 'g'));
  if v = '' then
    return null;
  end if;
  if char_length(v) > 500 then
    raise exception 'Guest note is too long' using errcode = 'P0044';
  end if;
  return v;
end;
$$;

create or replace function private.guest_booking_payload_hash(
  p_session_card_id uuid,
  p_schedule_date date,
  p_start_time text,
  p_end_time text,
  p_guests jsonb
)
returns text
language plpgsql
immutable
set search_path = ''
as $$
declare
  v_guests jsonb := '[]'::jsonb;
  v_item jsonb;
  v_label text;
  v_note text;
  v_start text;
  v_end text;
  v_canonical text;
begin
  if p_guests is null or jsonb_typeof(p_guests) <> 'array' or jsonb_array_length(p_guests) < 1 then
    raise exception 'At least one guest is required' using errcode = 'P0044';
  end if;

  v_start := left(p_start_time, 5);
  v_end := left(p_end_time, 5);

  for v_item in select value from jsonb_array_elements(p_guests)
  loop
    v_label := private.normalize_guest_label(v_item->>'label');
    v_note := private.normalize_guest_note(v_item->>'note');
    -- Keep explicit JSON null for note so the hash matches the app canonical payload.
    v_guests := v_guests || jsonb_build_array(
      jsonb_build_object('label', v_label, 'note', v_note)
    );
  end loop;

  v_canonical := jsonb_build_object(
    'session_card_id', p_session_card_id::text,
    'schedule_date', p_schedule_date::text,
    'start_time', v_start,
    'end_time', v_end,
    'guests', v_guests
  )::text;

  return encode(extensions.digest(v_canonical, 'sha256'), 'hex');
end;
$$;

-- ---------------------------------------------------------------------------
-- 6. staff_book_guests
-- ---------------------------------------------------------------------------
create or replace function public.staff_book_guests(
  p_request_id uuid,
  p_schedule_date date,
  p_start_time text,
  p_end_time text,
  p_session_card_id uuid,
  p_guests jsonb
)
returns jsonb
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_actor uuid;
  v_card public.session_cards%rowtype;
  v_session_id uuid;
  v_session public.sessions%rowtype;
  v_hash text;
  v_existing public.guest_booking_requests%rowtype;
  v_item jsonb;
  v_label text;
  v_note text;
  v_guest_count integer;
  v_confirmed integer;
  v_ordinal integer := 0;
  v_booking_ids uuid[] := '{}';
  v_id uuid;
  v_start text;
  v_end text;
  v_schedule_date date;
  v_start_time time;
begin
  v_actor := auth.uid();
  if v_actor is null then
    raise exception 'Not authenticated' using errcode = 'P0001';
  end if;
  if not (select private.is_staff()) then
    raise exception 'Not authorised to create guest bookings' using errcode = 'P0011';
  end if;

  if not coalesce((
    select enabled from private.feature_gates where feature_key = 'staff_guest_bookings'
  ), false) then
    raise exception 'Guest booking is disabled' using errcode = 'P0042';
  end if;

  if p_request_id is null then
    raise exception 'Request id is required' using errcode = 'P0044';
  end if;

  if p_schedule_date < private.studio_today() then
    raise exception 'Cannot book a session in the past' using errcode = 'P0004';
  end if;

  select * into v_card
    from public.session_cards
   where id = p_session_card_id
     and is_active = true;
  if not found then
    raise exception 'The selected session card is not available' using errcode = 'P0018';
  end if;

  v_start := left(p_start_time, 5);
  v_end := left(p_end_time, 5);
  if v_start is null or v_end is null or v_start = '' or v_end = '' then
    raise exception 'Start and end times are required' using errcode = 'P0044';
  end if;
  if (v_start::time + (v_card.duration_minutes || ' minutes')::interval) <> v_end::time then
    raise exception 'Session end does not match card duration' using errcode = 'P0044';
  end if;

  v_hash := private.guest_booking_payload_hash(
    p_session_card_id, p_schedule_date, v_start, v_end, p_guests
  );
  v_guest_count := jsonb_array_length(p_guests);

  -- Reserve/lock request id before any booking writes.
  perform pg_advisory_xact_lock(hashtextextended(p_request_id::text, 1));

  select * into v_existing
    from public.guest_booking_requests
   where id = p_request_id
   for update;

  if found then
    if v_existing.payload_hash is distinct from v_hash then
      raise exception 'This request id was already used with different guest details'
        using errcode = 'P0041';
    end if;
    if v_existing.actor_user_id is distinct from v_actor
       and not (select private.is_admin()) then
      raise exception 'Not authorised to replay this guest booking request'
        using errcode = 'P0011';
    end if;

    select coalesce(array_agg(b.id order by b.guest_ordinal), '{}')
      into v_booking_ids
      from public.bookings b
     where b.guest_request_id = p_request_id
       and b.attendee_kind = 'guest';

    select count(*) into v_confirmed
      from public.bookings
     where session_id = v_existing.session_id
       and status = 'booked';

    select capacity into v_session.capacity
      from public.sessions where id = v_existing.session_id;

    return jsonb_build_object(
      'session_id', v_existing.session_id,
      'booking_ids', to_jsonb(v_booking_ids),
      'already_booked', true,
      'places_remaining', greatest(v_session.capacity - v_confirmed, 0)
    );
  end if;

  v_session_id := public.ensure_session_slot_at(
    p_schedule_date,
    v_start,
    v_end,
    v_card.session_type,
    v_card.capacity,
    v_card.credits_required,
    v_card.reformer_credits_required,
    v_card.mat_credits_required
  );

  select * into v_session
    from public.sessions
   where id = v_session_id
   for update;

  if not found then
    raise exception 'Session not found' using errcode = 'P0002';
  end if;
  if v_session.status <> 'scheduled' then
    raise exception 'Session is not available for booking (status: %)', v_session.status
      using errcode = 'P0003';
  end if;
  if v_session.starts_at <= now() then
    raise exception 'Cannot book a session that has already started'
      using errcode = 'P0004';
  end if;
  if v_session.session_type is distinct from v_card.session_type then
    raise exception 'Session type does not match the selected card' using errcode = 'P0044';
  end if;

  v_schedule_date := (v_session.starts_at at time zone 'Europe/Nicosia')::date;
  v_start_time := (v_session.starts_at at time zone 'Europe/Nicosia')::time;
  if v_schedule_date is distinct from p_schedule_date then
    raise exception 'Resolved session date does not match the request' using errcode = 'P0044';
  end if;

  if private.recurring_blocks_public_booking(
    v_schedule_date,
    v_start_time,
    v_session.session_type
  ) then
    raise exception
      'This time slot is reserved until recurring prebookings are processed for this date'
      using errcode = 'P0032';
  end if;

  select count(*) into v_confirmed
    from public.bookings
   where session_id = v_session_id
     and status = 'booked';

  if v_confirmed + v_guest_count > v_session.capacity then
    raise exception 'Session is at capacity' using errcode = 'P0015';
  end if;

  insert into public.guest_booking_requests (id, actor_user_id, session_id, payload_hash)
  values (p_request_id, v_actor, v_session_id, v_hash);

  for v_item in select value from jsonb_array_elements(p_guests)
  loop
    v_ordinal := v_ordinal + 1;
    v_label := private.normalize_guest_label(v_item->>'label');
    v_note := private.normalize_guest_note(v_item->>'note');

    insert into public.bookings (
      user_id,
      session_id,
      user_package_id,
      status,
      credits_used,
      booked_at,
      booking_source,
      created_by_user_id,
      recurring_materialization_log_id,
      attendee_kind,
      guest_label,
      guest_note,
      guest_request_id,
      guest_ordinal
    ) values (
      null,
      v_session_id,
      null,
      'booked',
      0,
      now(),
      'staff_guest',
      v_actor,
      null,
      'guest',
      v_label,
      v_note,
      p_request_id,
      v_ordinal
    )
    returning id into v_id;

    v_booking_ids := array_append(v_booking_ids, v_id);
  end loop;

  select count(*) into v_confirmed
    from public.bookings
   where session_id = v_session_id
     and status = 'booked';

  return jsonb_build_object(
    'session_id', v_session_id,
    'booking_ids', to_jsonb(v_booking_ids),
    'already_booked', false,
    'places_remaining', greatest(v_session.capacity - v_confirmed, 0)
  );
end;
$$;

comment on function public.staff_book_guests(uuid, date, text, text, uuid, jsonb) is
  'Staff-only atomic guest batch booking. No packages/credits. Idempotent on request id + payload hash.';

revoke all on function public.staff_book_guests(uuid, date, text, text, uuid, jsonb) from public, anon;
grant execute on function public.staff_book_guests(uuid, date, text, text, uuid, jsonb) to authenticated;

-- ---------------------------------------------------------------------------
-- 7. staff_update_guest_booking
-- ---------------------------------------------------------------------------
create or replace function public.staff_update_guest_booking(
  p_booking_id uuid,
  p_label text,
  p_note text default null
)
returns public.bookings
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_actor uuid;
  v_booking public.bookings%rowtype;
  v_label text;
  v_note text;
  v_updated public.bookings%rowtype;
begin
  v_actor := auth.uid();
  if v_actor is null or not (select private.is_staff()) then
    raise exception 'Not authorised to edit guest bookings' using errcode = 'P0011';
  end if;

  select * into v_booking
    from public.bookings
   where id = p_booking_id
   for update;

  if not found then
    raise exception 'Booking not found' using errcode = 'P0010';
  end if;
  if v_booking.attendee_kind <> 'guest' then
    raise exception 'Only guest bookings can be edited with this action' using errcode = 'P0044';
  end if;
  if v_booking.status not in ('booked', 'finished', 'attended', 'cancelled') then
    raise exception 'This guest booking cannot be edited (status: %)', v_booking.status
      using errcode = 'P0012';
  end if;

  v_label := private.normalize_guest_label(p_label);
  v_note := private.normalize_guest_note(p_note);

  if v_label is not distinct from v_booking.guest_label
     and v_note is not distinct from v_booking.guest_note then
    return v_booking;
  end if;

  insert into public.booking_guest_detail_events (
    booking_id, actor_user_id, prior_label, new_label, prior_note, new_note
  ) values (
    v_booking.id, v_actor, v_booking.guest_label, v_label, v_booking.guest_note, v_note
  );

  update public.bookings
     set guest_label = v_label,
         guest_note = v_note
   where id = v_booking.id
  returning * into v_updated;

  return v_updated;
end;
$$;

comment on function public.staff_update_guest_booking(uuid, text, text) is
  'Staff edits guest label/note only. Audits prior values. No session/status/identity conversion.';

revoke all on function public.staff_update_guest_booking(uuid, text, text) from public, anon;
grant execute on function public.staff_update_guest_booking(uuid, text, text) to authenticated;

-- ---------------------------------------------------------------------------
-- 8. cancel_booking — skip refunds for guests
-- ---------------------------------------------------------------------------
create or replace function public.cancel_booking(
  p_booking_id uuid,
  p_reason     text default null
)
returns public.bookings
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_user_id           uuid;
  v_booking           public.bookings%rowtype;
  v_cancelled         public.bookings%rowtype;
  v_session_starts_at timestamptz;
  v_is_staff          boolean;
  v_is_recurring      boolean;
  v_log               public.recurring_prebook_materialization_log%rowtype;
  v_start_time        time;
  v_guest_charges     integer;
begin
  v_user_id := auth.uid();
  if v_user_id is null then
    raise exception 'Not authenticated' using errcode = 'P0001';
  end if;

  v_is_staff := (select private.is_staff());

  select * into v_booking
    from public.bookings
   where id = p_booking_id
     for update;

  if not found then
    raise exception 'Booking not found' using errcode = 'P0010';
  end if;

  if v_booking.attendee_kind = 'guest' then
    if not v_is_staff then
      raise exception 'Not authorised to cancel this booking'
        using errcode = 'P0011';
    end if;
  elsif v_booking.user_id != v_user_id then
    if not v_is_staff then
      raise exception 'Not authorised to cancel this booking'
        using errcode = 'P0011';
    end if;
  end if;

  if v_booking.status not in ('booked', 'waitlisted') then
    raise exception 'Booking cannot be cancelled (status: %)', v_booking.status
      using errcode = 'P0012';
  end if;

  select s.starts_at into v_session_starts_at
    from public.sessions s
   where s.id = v_booking.session_id;

  if v_booking.attendee_kind <> 'guest'
     and v_booking.user_id = v_user_id
     and not v_is_staff
     and v_session_starts_at is not null
     and v_session_starts_at <= now() + interval '4 hours' then
    raise exception
      'Cancellations must be made more than 4 hours before class start'
      using errcode = 'P0029';
  end if;

  if v_booking.attendee_kind = 'guest' then
    select count(*) into v_guest_charges
      from public.booking_credit_charges
     where booking_id = v_booking.id;
    if v_guest_charges > 0 then
      raise exception 'Guest booking has unexpected credit charges'
        using errcode = 'P0045';
    end if;
  elsif v_booking.status = 'booked' then
    if exists (
      select 1 from public.booking_credit_charges
       where booking_id = v_booking.id
    ) then
      update public.user_packages up
         set credits_remaining = case
               when up.credits_remaining is null then null
               else up.credits_remaining + charges.credits_used
             end,
             status = case
               when up.status = 'used_up' then 'active'
               else up.status
             end
        from public.booking_credit_charges charges
       where charges.booking_id = v_booking.id
         and charges.user_package_id = up.id
         and up.status in ('active', 'used_up');
    else
      update public.user_packages
         set credits_remaining = case
               when credits_remaining is null then null
               else credits_remaining + v_booking.credits_used
             end,
             status = case
               when status = 'used_up' then 'active'
               else status
             end
       where id = v_booking.user_package_id
         and status in ('active', 'used_up');
    end if;
  end if;

  update public.bookings
     set status                  = 'cancelled',
         cancelled_at            = now(),
         cancellation_reason     = p_reason,
         cancelled_by_user_id    = v_user_id,
         cancellation_actor_note = null
   where id = p_booking_id
  returning * into v_cancelled;

  v_is_recurring := v_booking.booking_source = 'recurring'
    or v_booking.recurring_materialization_log_id is not null;

  if v_is_recurring and v_is_staff then
    select lg.* into v_log
      from public.recurring_prebook_materialization_log lg
     where lg.id = v_booking.recurring_materialization_log_id
        or lg.booking_id = p_booking_id
     order by case when lg.id = v_booking.recurring_materialization_log_id then 0 else 1 end
     limit 1;

    if found then
      select sl.start_time into v_start_time
        from public.recurring_prebook_schedule_lines sl
       where sl.id = v_log.schedule_line_id;

      if v_start_time is null then
        v_start_time := (v_log.occurrence_starts_at at time zone 'Europe/Nicosia')::time;
      end if;

      insert into public.recurring_prebook_skipped_occurrences (
        rule_id, occurrence_date, start_time, skipped_by, reason
      )
      values (
        v_log.rule_id,
        v_log.occurrence_date,
        v_start_time,
        v_user_id,
        coalesce(p_reason, 'Cancelled by staff')
      )
      on conflict (rule_id, occurrence_date, start_time) do nothing;

      update public.recurring_prebook_materialization_log
         set status          = 'skipped',
             health_status   = null,
             booking_id      = null,
             failure_code    = 'staff_cancelled',
             failure_message = coalesce(p_reason, 'Skipped after staff cancellation')
       where id = v_log.id;
    end if;
  elsif v_is_recurring then
    delete from public.recurring_prebook_materialization_log lg
     where lg.booking_id = p_booking_id
        or (
          v_booking.recurring_materialization_log_id is not null
          and lg.id = v_booking.recurring_materialization_log_id
        );
  end if;

  return v_cancelled;
end;
$$;

comment on function public.cancel_booking is
  'Cancels a booking. Guests skip refunds and recurring skips. Staff cancel of recurring still skips. Client self-cancel blocked within 4 hours (P0029).';

-- ---------------------------------------------------------------------------
-- 9. mark_booking_not_attended — explicit guest rejection
-- ---------------------------------------------------------------------------
create or replace function public.mark_booking_not_attended(p_booking_id uuid)
returns jsonb
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_actor uuid;
  v_booking public.bookings;
  v_session public.sessions;
  v_charge_count integer;
  v_charge public.booking_credit_charges;
  v_package public.user_packages;
  v_catalog public.packages;
  v_replacement_catalog_id uuid;
  v_issued timestamptz;
  v_expires timestamptz;
  v_replacement_id uuid;
  v_existing_id uuid;
  v_existing_expires timestamptz;
  v_existing_type text;
begin
  if not coalesce((
    select enabled from private.feature_gates where feature_key = 'not_attended_replacement'
  ), false) then
    raise exception 'Not attended is disabled'
      using errcode = 'P3000';
  end if;

  v_actor := auth.uid();
  if v_actor is null or not private.is_staff() then
    raise exception 'Only instructors, admins, and owners can mark Not attended'
      using errcode = 'P3001';
  end if;

  select * into v_booking
    from public.bookings
   where id = p_booking_id
   for update;
  if not found then
    raise exception 'Booking not found' using errcode = 'P3002';
  end if;

  if v_booking.attendee_kind = 'guest' then
    raise exception 'Guest bookings cannot receive a replacement credit'
      using errcode = 'P0043';
  end if;

  select up.id, up.expires_at, p.class_type
    into v_existing_id, v_existing_expires, v_existing_type
    from public.user_packages up
    join public.packages p on p.id = up.package_id
   where up.replacement_source_booking_id = p_booking_id;

  if v_existing_id is not null then
    if v_booking.status = 'not_attended' then
      return jsonb_build_object(
        'booking_id', p_booking_id,
        'replacement_user_package_id', v_existing_id,
        'class_type', v_existing_type,
        'expires_at', v_existing_expires,
        'already_issued', true
      );
    end if;
    raise exception 'Replacement linkage is inconsistent for this booking'
      using errcode = 'P3003';
  end if;

  select * into v_session
    from public.sessions
   where id = v_booking.session_id
   for update;
  if not found then
    raise exception 'Session not found' using errcode = 'P3002';
  end if;

  if v_session.status = 'cancelled' then
    raise exception 'The session is cancelled' using errcode = 'P3004';
  end if;
  if v_session.ends_at > clock_timestamp() then
    raise exception 'The session has not ended' using errcode = 'P3005';
  end if;
  if v_booking.status not in ('booked', 'finished') then
    raise exception 'This booking status cannot be marked Not attended'
      using errcode = 'P3006';
  end if;

  select count(*) into v_charge_count
    from public.booking_credit_charges
   where booking_id = v_booking.id;
  if v_charge_count <> 1 then
    raise exception 'Not attended requires exactly one credit charge'
      using errcode = 'P3007';
  end if;

  select * into v_charge
    from public.booking_credit_charges
   where booking_id = v_booking.id
   for update;

  if v_charge.credits_used <> 1 or v_booking.credits_used <> 1 then
    raise exception 'Not attended requires a single consumed credit'
      using errcode = 'P3008';
  end if;
  if v_charge.user_package_id <> v_booking.user_package_id then
    raise exception 'Credit charge does not match the booking package'
      using errcode = 'P3009';
  end if;

  select * into v_package
    from public.user_packages
   where id = v_booking.user_package_id
   for update;
  if v_package.user_id <> v_booking.user_id then
    raise exception 'Package owner does not match the booking'
      using errcode = 'P3009';
  end if;
  if v_package.credits_remaining is null then
    raise exception 'Unlimited packages cannot be marked Not attended'
      using errcode = 'P3008';
  end if;

  select * into v_catalog from public.packages where id = v_package.package_id;
  if v_catalog.class_type is distinct from v_charge.class_type
     or v_catalog.class_type not in ('reformer', 'mat') then
    raise exception 'Not attended requires one Reformer or Mat category'
      using errcode = 'P3009';
  end if;

  select id into v_replacement_catalog_id
    from public.packages
   where is_replacement and class_type = v_catalog.class_type;

  v_issued := clock_timestamp();
  v_expires := v_issued + interval '30 days';

  insert into public.user_packages (
    user_id, package_id, credits_remaining, purchased_at, starts_at, expires_at,
    status, replacement_source_booking_id
  ) values (
    v_booking.user_id, v_replacement_catalog_id, 1, v_issued, v_issued, v_expires,
    'active', v_booking.id
  )
  returning id into v_replacement_id;

  insert into public.booking_outcome_events (
    booking_id, actor_user_id, prior_status, new_status, replacement_user_package_id, action, occurred_at
  ) values (
    v_booking.id, v_actor, v_booking.status, 'not_attended', v_replacement_id, 'not_attended', v_issued
  );

  update public.bookings
     set status = 'not_attended'
   where id = v_booking.id;

  return jsonb_build_object(
    'booking_id', v_booking.id,
    'replacement_user_package_id', v_replacement_id,
    'class_type', v_catalog.class_type,
    'issued_at', v_issued,
    'expires_at', v_expires,
    'already_issued', false
  );
exception
  when unique_violation then
    select up.id, up.expires_at, p.class_type
      into v_existing_id, v_existing_expires, v_existing_type
      from public.user_packages up
      join public.packages p on p.id = up.package_id
     where up.replacement_source_booking_id = p_booking_id;
    if v_existing_id is null then
      raise;
    end if;
    return jsonb_build_object(
      'booking_id', p_booking_id,
      'replacement_user_package_id', v_existing_id,
      'class_type', v_existing_type,
      'expires_at', v_existing_expires,
      'already_issued', true
    );
end;
$$;

comment on function public.mark_booking_not_attended(uuid) is
  'Staff marks an ended booking Not attended and issues one 30-day replacement credit. Guests are rejected (P0043).';

revoke all on function public.mark_booking_not_attended(uuid) from public;
grant execute on function public.mark_booking_not_attended(uuid) to authenticated;

notify pgrst, 'reload schema';

commit;
