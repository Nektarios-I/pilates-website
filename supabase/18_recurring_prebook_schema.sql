-- =============================================================================
-- 18_recurring_prebook_schema.sql — Recurring prebook tables + booking provenance
-- Pilates Studio · Supabase / PostgreSQL 15+
--
-- WHAT THIS SCRIPT DOES
--   1. Creates four recurring-prebook tables (rules, schedule lines, skips, log).
--   2. Adds booking provenance columns to public.bookings.
--   3. Enables RLS and staff-only policies on the new tables.
--
-- DOES NOT: booking RPC changes, materialization functions, cron, or horizon rules.
--
-- RUN ORDER: After 17_booking_one_per_time_slot.sql.
-- Safe to re-run: uses IF NOT EXISTS / DROP POLICY IF EXISTS patterns.
-- =============================================================================

-- ---------------------------------------------------------------------------
-- TABLE: recurring_prebook_rules
-- Persistent staff-managed recurring preference per client (not a booking).
-- ---------------------------------------------------------------------------
create table if not exists public.recurring_prebook_rules (
  id                uuid        primary key default gen_random_uuid(),
  client_user_id    uuid        not null references public.profiles(id) on delete cascade,
  session_card_id   uuid        not null references public.session_cards(id) on delete restrict,
  label             text,
  status            text        not null default 'active'
                      check (status in ('active', 'deactivated')),
  created_by        uuid        not null references public.profiles(id) on delete restrict,
  deactivated_at    timestamptz,
  deactivated_by    uuid        references public.profiles(id) on delete set null,
  created_at        timestamptz not null default now(),
  updated_at        timestamptz not null default now()
);

comment on table public.recurring_prebook_rules is
  'Staff-managed recurring prebook preference for a client. Materializes into normal bookings in a later phase.';
comment on column public.recurring_prebook_rules.status is
  'active = eligible for materialization; deactivated = soft-disabled, retained for audit.';

create trigger set_recurring_prebook_rules_updated_at
  before update on public.recurring_prebook_rules
  for each row execute procedure extensions.moddatetime(updated_at);

create index if not exists idx_recurring_prebook_rules_client_status
  on public.recurring_prebook_rules (client_user_id, status);

create index if not exists idx_recurring_prebook_rules_status_active
  on public.recurring_prebook_rules (status)
  where status = 'active';

-- ---------------------------------------------------------------------------
-- TABLE: recurring_prebook_schedule_lines
-- Weekly time preferences within a rule (multiple lines per rule allowed).
-- ---------------------------------------------------------------------------
create table if not exists public.recurring_prebook_schedule_lines (
  id                uuid        primary key default gen_random_uuid(),
  rule_id           uuid        not null references public.recurring_prebook_rules(id) on delete cascade,
  day_of_week       smallint    not null check (day_of_week between 1 and 7),
  start_time        time        not null,
  duration_minutes  integer     not null default 60 check (duration_minutes between 15 and 180),
  is_active         boolean     not null default true,
  sort_order        integer     not null default 0,
  created_at        timestamptz not null default now(),
  updated_at        timestamptz not null default now()
);

comment on table public.recurring_prebook_schedule_lines is
  'One weekly slot preference (ISO DOW + local studio time) attached to a recurring rule.';
comment on column public.recurring_prebook_schedule_lines.day_of_week is
  'ISO day of week: 1 = Monday … 7 = Sunday (Europe/Nicosia local scheduling).';

create trigger set_recurring_prebook_schedule_lines_updated_at
  before update on public.recurring_prebook_schedule_lines
  for each row execute procedure extensions.moddatetime(updated_at);

create index if not exists idx_recurring_prebook_schedule_lines_rule_active
  on public.recurring_prebook_schedule_lines (rule_id, is_active);

-- One active line per rule + weekday + start time.
create unique index if not exists recurring_prebook_schedule_lines_active_slot
  on public.recurring_prebook_schedule_lines (rule_id, day_of_week, start_time)
  where is_active;

-- ---------------------------------------------------------------------------
-- TABLE: recurring_prebook_skipped_occurrences
-- Suppress a single future instance without deactivating the whole rule.
-- ---------------------------------------------------------------------------
create table if not exists public.recurring_prebook_skipped_occurrences (
  id                uuid        primary key default gen_random_uuid(),
  rule_id           uuid        not null references public.recurring_prebook_rules(id) on delete cascade,
  occurrence_date   date        not null,
  start_time        time        not null,
  skipped_by        uuid        not null references public.profiles(id) on delete restrict,
  reason            text,
  created_at        timestamptz not null default now()
);

comment on table public.recurring_prebook_skipped_occurrences is
  'Staff-marked skip for one calendar occurrence; rule remains active for other dates.';

create unique index if not exists recurring_prebook_skipped_occurrences_unique
  on public.recurring_prebook_skipped_occurrences (rule_id, occurrence_date, start_time);

create index if not exists idx_recurring_prebook_skipped_occurrences_rule_date
  on public.recurring_prebook_skipped_occurrences (rule_id, occurrence_date);

-- ---------------------------------------------------------------------------
-- TABLE: recurring_prebook_materialization_log
-- Idempotent execution / failure record per rule occurrence.
-- booking_id is set after a successful materialization in a later phase.
-- ---------------------------------------------------------------------------
create table if not exists public.recurring_prebook_materialization_log (
  id                      uuid        primary key default gen_random_uuid(),
  rule_id                 uuid        not null references public.recurring_prebook_rules(id) on delete cascade,
  schedule_line_id        uuid        references public.recurring_prebook_schedule_lines(id) on delete set null,
  occurrence_date         date        not null,
  occurrence_starts_at    timestamptz not null,
  occurrence_ends_at      timestamptz not null,
  status                  text        not null default 'pending'
                            check (status in ('pending', 'succeeded', 'failed', 'skipped')),
  health_status           text
                            check (health_status is null or health_status in ('ready', 'insufficient_tokens', 'failed')),
  failure_code            text
                            check (failure_code is null or failure_code in (
                              'capacity_full',
                              'insufficient_tokens',
                              'slot_conflict',
                              'session_unavailable',
                              'package_expired',
                              'horizon',
                              'other'
                            )),
  failure_message         text,
  booking_id              uuid        references public.bookings(id) on delete set null,
  materialized_at         timestamptz,
  last_attempted_at       timestamptz,
  attempt_count           integer     not null default 0 check (attempt_count >= 0),
  created_at              timestamptz not null default now(),
  updated_at              timestamptz not null default now(),
  constraint recurring_prebook_materialization_log_ends_after_starts
    check (occurrence_ends_at > occurrence_starts_at)
);

comment on table public.recurring_prebook_materialization_log is
  'Per-occurrence materialization audit. Unique on (rule_id, occurrence_starts_at) for idempotency.';
comment on column public.recurring_prebook_materialization_log.health_status is
  'Forecast / attention state for staff UI (green/yellow/red mapping in app layer).';

create trigger set_recurring_prebook_materialization_log_updated_at
  before update on public.recurring_prebook_materialization_log
  for each row execute procedure extensions.moddatetime(updated_at);

create unique index if not exists recurring_prebook_materialization_log_rule_occurrence
  on public.recurring_prebook_materialization_log (rule_id, occurrence_starts_at);

create index if not exists idx_recurring_prebook_materialization_log_status
  on public.recurring_prebook_materialization_log (status, health_status);

create index if not exists idx_recurring_prebook_materialization_log_booking
  on public.recurring_prebook_materialization_log (booking_id)
  where booking_id is not null;

create index if not exists idx_recurring_prebook_materialization_log_occurrence_date
  on public.recurring_prebook_materialization_log (occurrence_date);

-- ---------------------------------------------------------------------------
-- BOOKING PROVENANCE (additive columns on existing bookings table)
-- ---------------------------------------------------------------------------
alter table public.bookings
  add column if not exists booking_source text not null default 'client'
    check (booking_source in ('client', 'staff_manual', 'recurring')),
  add column if not exists created_by_user_id uuid
    references public.profiles(id) on delete set null,
  add column if not exists recurring_materialization_log_id uuid
    references public.recurring_prebook_materialization_log(id) on delete set null;

comment on column public.bookings.booking_source is
  'Origin of booking: client self-book, staff manual, or recurring materialization.';
comment on column public.bookings.created_by_user_id is
  'Staff actor when booking_source is staff_manual or recurring (null for client self-book).';
comment on column public.bookings.recurring_materialization_log_id is
  'Link to materialization log row when booking_source = recurring.';

create index if not exists idx_bookings_booking_source
  on public.bookings (booking_source);

create index if not exists idx_bookings_recurring_materialization_log
  on public.bookings (recurring_materialization_log_id)
  where recurring_materialization_log_id is not null;

-- ---------------------------------------------------------------------------
-- RLS: recurring prebook tables (staff only — no client access)
-- ---------------------------------------------------------------------------
alter table public.recurring_prebook_rules enable row level security;
alter table public.recurring_prebook_schedule_lines enable row level security;
alter table public.recurring_prebook_skipped_occurrences enable row level security;
alter table public.recurring_prebook_materialization_log enable row level security;

grant select, insert, update, delete on public.recurring_prebook_rules to authenticated;
grant select, insert, update, delete on public.recurring_prebook_schedule_lines to authenticated;
grant select, insert, update, delete on public.recurring_prebook_skipped_occurrences to authenticated;
grant select, insert, update, delete on public.recurring_prebook_materialization_log to authenticated;

-- recurring_prebook_rules
drop policy if exists "recurring_prebook_rules: staff reads" on public.recurring_prebook_rules;
create policy "recurring_prebook_rules: staff reads"
  on public.recurring_prebook_rules for select
  to authenticated
  using ( (select private.is_staff()) );

drop policy if exists "recurring_prebook_rules: staff manages" on public.recurring_prebook_rules;
create policy "recurring_prebook_rules: staff manages"
  on public.recurring_prebook_rules for all
  to authenticated
  using ( (select private.is_staff()) )
  with check ( (select private.is_staff()) );

-- recurring_prebook_schedule_lines
drop policy if exists "recurring_prebook_schedule_lines: staff reads" on public.recurring_prebook_schedule_lines;
create policy "recurring_prebook_schedule_lines: staff reads"
  on public.recurring_prebook_schedule_lines for select
  to authenticated
  using ( (select private.is_staff()) );

drop policy if exists "recurring_prebook_schedule_lines: staff manages" on public.recurring_prebook_schedule_lines;
create policy "recurring_prebook_schedule_lines: staff manages"
  on public.recurring_prebook_schedule_lines for all
  to authenticated
  using ( (select private.is_staff()) )
  with check ( (select private.is_staff()) );

-- recurring_prebook_skipped_occurrences
drop policy if exists "recurring_prebook_skipped_occurrences: staff reads" on public.recurring_prebook_skipped_occurrences;
create policy "recurring_prebook_skipped_occurrences: staff reads"
  on public.recurring_prebook_skipped_occurrences for select
  to authenticated
  using ( (select private.is_staff()) );

drop policy if exists "recurring_prebook_skipped_occurrences: staff manages" on public.recurring_prebook_skipped_occurrences;
create policy "recurring_prebook_skipped_occurrences: staff manages"
  on public.recurring_prebook_skipped_occurrences for all
  to authenticated
  using ( (select private.is_staff()) )
  with check ( (select private.is_staff()) );

-- recurring_prebook_materialization_log
drop policy if exists "recurring_prebook_materialization_log: staff reads" on public.recurring_prebook_materialization_log;
create policy "recurring_prebook_materialization_log: staff reads"
  on public.recurring_prebook_materialization_log for select
  to authenticated
  using ( (select private.is_staff()) );

drop policy if exists "recurring_prebook_materialization_log: staff manages" on public.recurring_prebook_materialization_log;
create policy "recurring_prebook_materialization_log: staff manages"
  on public.recurring_prebook_materialization_log for all
  to authenticated
  using ( (select private.is_staff()) )
  with check ( (select private.is_staff()) );

-- NOTE: Future materialization RPCs should use SECURITY DEFINER and remain the
-- primary write path for race-sensitive booking creation. Staff RLS here supports
-- staff UI reads and non-booking CRUD until those RPCs land in Phase 2c+.
