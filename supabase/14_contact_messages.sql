-- =============================================================================
-- 14_contact_messages.sql — Public contact form submissions + admin inbox
--
-- RUN ORDER: After 02_rls.sql (needs private.is_admin()).
-- Safe to re-run (IF NOT EXISTS / DROP POLICY IF EXISTS).
-- =============================================================================

create table if not exists public.contact_messages (
  id                   uuid        primary key default gen_random_uuid(),
  created_at           timestamptz not null default now(),
  updated_at           timestamptz not null default now(),
  name                 text        not null,
  email                text        not null,
  phone                text        not null,
  message              text        not null,
  submitted_by_user_id uuid        references public.profiles(id) on delete set null
);

comment on table public.contact_messages is
  'Inbound messages from the public contact form. Readable/deletable by admin and owner only.';

create index if not exists idx_contact_messages_created_at
  on public.contact_messages (created_at desc);

create trigger set_contact_messages_updated_at
  before update on public.contact_messages
  for each row execute procedure extensions.moddatetime(updated_at);

alter table public.contact_messages enable row level security;

-- anon + authenticated may insert (public contact form via server action)
grant insert on public.contact_messages to anon, authenticated;
grant select, delete on public.contact_messages to authenticated;

drop policy if exists "contact_messages: public insert" on public.contact_messages;
create policy "contact_messages: public insert"
  on public.contact_messages for insert
  to anon, authenticated
  with check (
    length(trim(name)) between 2 and 120
    and length(trim(email)) between 5 and 254
    and length(trim(phone)) between 6 and 32
    and length(trim(message)) between 10 and 5000
    and (
      submitted_by_user_id is null
      or submitted_by_user_id = (select auth.uid())
    )
  );

drop policy if exists "contact_messages: admin reads" on public.contact_messages;
create policy "contact_messages: admin reads"
  on public.contact_messages for select
  to authenticated
  using ( (select private.is_admin()) );

drop policy if exists "contact_messages: admin deletes" on public.contact_messages;
create policy "contact_messages: admin deletes"
  on public.contact_messages for delete
  to authenticated
  using ( (select private.is_admin()) );
