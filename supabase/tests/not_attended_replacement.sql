-- Disposable rehearsal database only. Refuses any other database name.
-- Synthetic rows use the not-attended-test.local email domain and are removed at the end.

do $$
begin
  if current_database() <> 'rehearsal' then
    raise exception 'Refusing Not attended tests on database %', current_database();
  end if;
end $$;

create or replace function auth.uid()
returns uuid
language sql
stable
as $$
  select nullif(current_setting('request.jwt.claim.sub', true), '')::uuid
$$;

create or replace function pg_temp.expect_sqlstate(p_sql text, p_state text)
returns void
language plpgsql
as $$
begin
  execute p_sql;
  raise exception 'expected % but statement succeeded', p_state;
exception
  when others then
    if sqlstate <> p_state then
      raise exception 'expected % but got %: %', p_state, sqlstate, sqlerrm;
    end if;
end;
$$;

do $$
declare
  v_staff uuid := gen_random_uuid();
  v_admin uuid := gen_random_uuid();
  v_owner uuid := gen_random_uuid();
  v_client uuid := gen_random_uuid();
  v_other uuid := gen_random_uuid();
  v_pkg uuid;
  v_unlimited uuid;
  v_mat_pkg uuid;
  v_session uuid;
  v_booking uuid;
  v_result jsonb;
  v_again jsonb;
  v_balance integer;
  v_expiry timestamptz;
  v_status text;
  v_pool integer;
  v_picked uuid;
  v_future uuid;
  v_spent uuid;
  v_original_balance integer;
begin
  insert into auth.users (id) values (v_staff), (v_admin), (v_owner), (v_client), (v_other);
  insert into public.profiles (id, email, full_name, status) values
    (v_staff, 'not-attended-test-staff@example.test', 'Test Staff', 'active'),
    (v_admin, 'not-attended-test-admin@example.test', 'Test Admin', 'active'),
    (v_owner, 'not-attended-test-owner@example.test', 'Test Owner', 'active'),
    (v_client, 'not-attended-test-client@example.test', 'Test Client', 'active'),
    (v_other, 'not-attended-test-other@example.test', 'Test Other', 'active');
  insert into public.user_roles (user_id, role) values
    (v_staff, 'instructor'),
    (v_admin, 'admin'),
    (v_owner, 'owner'),
    (v_client, 'client');

  insert into public.packages (name, class_type, package_type, credits_included, validity_days, price, is_active)
  values ('Not attended test pack', 'reformer', 'credit_pack', 5, 60, 10, false)
  returning id into v_pkg;
  insert into public.packages (name, class_type, package_type, credits_included, validity_days, price, is_active)
  values ('Not attended test unlimited', 'reformer', 'unlimited', null, 60, 10, false)
  returning id into v_unlimited;
  insert into public.packages (name, class_type, package_type, credits_included, validity_days, price, is_active)
  values ('Not attended test mat', 'mat', 'credit_pack', 5, 60, 10, false)
  returning id into v_mat_pkg;

  insert into public.user_packages (user_id, package_id, credits_remaining, expires_at, status)
  values (v_client, v_pkg, 4, clock_timestamp() + interval '40 days', 'active')
  returning id into v_pkg;

  perform set_config('request.jwt.claim.sub', '', true);
  perform pg_temp.expect_sqlstate(
    format('select public.mark_booking_not_attended(%L)', gen_random_uuid()),
    'P3001'
  );
  perform set_config('request.jwt.claim.sub', v_client::text, true);
  perform pg_temp.expect_sqlstate(
    format('select public.mark_booking_not_attended(%L)', gen_random_uuid()),
    'P3001'
  );

  insert into public.sessions (title, session_type, starts_at, ends_at, status, reformer_credits_required, mat_credits_required)
  values ('Not attended test class', 'reformer', clock_timestamp() - interval '2 hours', clock_timestamp() - interval '1 hour', 'scheduled', 1, 0)
  returning id into v_session;
  insert into public.bookings (user_id, session_id, user_package_id, status, credits_used)
  values (v_client, v_session, v_pkg, 'finished', 1)
  returning id into v_booking;
  insert into public.booking_credit_charges (booking_id, user_package_id, class_type, credits_used)
  values (v_booking, v_pkg, 'reformer', 1);

  select credits_remaining into v_original_balance from public.user_packages where id = v_pkg;

  perform set_config('request.jwt.claim.sub', v_staff::text, true);
  v_result := public.mark_booking_not_attended(v_booking);
  if (v_result->>'already_issued')::boolean then
    raise exception 'first call was treated as a retry';
  end if;
  if v_result->>'class_type' <> 'reformer' then
    raise exception 'wrong replacement class';
  end if;
  select credits_remaining, status into v_balance, v_status from public.user_packages where id = v_pkg;
  if v_balance <> v_original_balance or v_status <> 'active' then
    raise exception 'original package changed';
  end if;
  select expires_at into v_expiry from public.user_packages where id = (v_result->>'replacement_user_package_id')::uuid;
  if v_expiry <> (v_result->>'issued_at')::timestamptz + interval '30 days' then
    raise exception 'expiry is not 30 days after issuance';
  end if;
  select status into v_status from public.bookings where id = v_booking;
  if v_status <> 'not_attended' then
    raise exception 'booking outcome was not stored';
  end if;

  v_again := public.mark_booking_not_attended(v_booking);
  if not (v_again->>'already_issued')::boolean
     or v_again->>'replacement_user_package_id' <> v_result->>'replacement_user_package_id' then
    raise exception 'retry did not return the original replacement';
  end if;
  if (select count(*) from public.user_packages where replacement_source_booking_id = v_booking) <> 1 then
    raise exception 'retry created another replacement';
  end if;

  perform set_config('request.jwt.claim.sub', v_admin::text, true);
  perform public.mark_booking_not_attended(v_booking);
  perform set_config('request.jwt.claim.sub', v_owner::text, true);
  perform public.mark_booking_not_attended(v_booking);

  select private.client_simulated_credit_pool(v_client, 'reformer') into v_pool;
  if v_pool <> v_original_balance then
    raise exception 'forecast pool included the replacement or dropped the original';
  end if;
  select reformer_package_id into v_picked
    from private.pick_client_packages_for_session(v_client, 1, 0);
  if v_picked <> v_pkg then
    raise exception 'automatic selection did not keep the original package';
  end if;

  perform public.finalize_past_bookings();
  select status into v_status from public.bookings where id = v_booking;
  if v_status <> 'not_attended' then
    raise exception 'completion job overwrote not_attended';
  end if;

  update private.feature_gates set enabled = false where feature_key = 'not_attended_replacement';
  perform pg_temp.expect_sqlstate(format('select public.mark_booking_not_attended(%L)', v_booking), 'P3000');
  update private.feature_gates set enabled = true where feature_key = 'not_attended_replacement';

  insert into public.sessions (title, session_type, starts_at, ends_at, reformer_credits_required)
  values ('rollback class', 'reformer', clock_timestamp() - interval '3 hours', clock_timestamp() - interval '2 hours', 1)
  returning id into v_future;
  insert into public.bookings (user_id, session_id, user_package_id, status, credits_used)
  values (v_client, v_future, v_pkg, 'booked', 1)
  returning id into v_spent;
  insert into public.booking_credit_charges (booking_id, user_package_id, class_type, credits_used)
  values (v_spent, v_pkg, 'reformer', 1);
  begin
    perform public.mark_booking_not_attended(v_spent);
    raise exception 'rollback marker';
  exception
    when others then
      if sqlerrm <> 'rollback marker' then
        raise;
      end if;
  end;
  if exists (select 1 from public.user_packages where replacement_source_booking_id = v_spent)
     or exists (select 1 from public.booking_outcome_events where booking_id = v_spent)
     or (select status from public.bookings where id = v_spent) <> 'booked' then
    raise exception 'injected failure left a partial Not attended result';
  end if;

  -- Rejection cases.
  perform set_config('request.jwt.claim.sub', v_staff::text, true);
  insert into public.sessions (title, session_type, starts_at, ends_at, reformer_credits_required)
  values ('future', 'reformer', clock_timestamp() + interval '1 day', clock_timestamp() + interval '1 day 1 hour', 1)
  returning id into v_future;
  insert into public.bookings (user_id, session_id, user_package_id, status, credits_used)
  values (v_client, v_future, v_pkg, 'booked', 1)
  returning id into v_spent;
  insert into public.booking_credit_charges (booking_id, user_package_id, class_type, credits_used)
  values (v_spent, v_pkg, 'reformer', 1);
  perform pg_temp.expect_sqlstate(format('select public.mark_booking_not_attended(%L)', v_spent), 'P3005');
  update public.bookings set status = 'finished' where id = v_spent;
  perform pg_temp.expect_sqlstate(format('select public.mark_booking_not_attended(%L)', v_spent), 'P3005');

  update public.sessions set ends_at = clock_timestamp() - interval '1 hour', starts_at = clock_timestamp() - interval '2 hours', status = 'cancelled' where id = v_future;
  perform pg_temp.expect_sqlstate(format('select public.mark_booking_not_attended(%L)', v_spent), 'P3004');

  update public.sessions set status = 'scheduled' where id = v_future;
  update public.bookings set status = 'cancelled' where id = v_spent;
  perform pg_temp.expect_sqlstate(format('select public.mark_booking_not_attended(%L)', v_spent), 'P3006');
  update public.bookings set status = 'attended' where id = v_spent;
  perform pg_temp.expect_sqlstate(format('select public.mark_booking_not_attended(%L)', v_spent), 'P3006');
  update public.bookings set status = 'waitlisted' where id = v_spent;
  perform pg_temp.expect_sqlstate(format('select public.mark_booking_not_attended(%L)', v_spent), 'P3006');
  update public.bookings set status = 'no_show' where id = v_spent;
  perform pg_temp.expect_sqlstate(format('select public.mark_booking_not_attended(%L)', v_spent), 'P3006');

  update public.bookings set status = 'finished', credits_used = 2 where id = v_spent;
  update public.booking_credit_charges set credits_used = 2 where booking_id = v_spent;
  perform pg_temp.expect_sqlstate(format('select public.mark_booking_not_attended(%L)', v_spent), 'P3008');

  delete from public.booking_credit_charges where booking_id = v_spent;
  update public.bookings set credits_used = 1 where id = v_spent;
  perform pg_temp.expect_sqlstate(format('select public.mark_booking_not_attended(%L)', v_spent), 'P3007');

  insert into public.booking_credit_charges (booking_id, user_package_id, class_type, credits_used)
  values (v_spent, v_pkg, 'reformer', 1);
  update public.user_packages set credits_remaining = null where id = v_pkg;
  perform pg_temp.expect_sqlstate(format('select public.mark_booking_not_attended(%L)', v_spent), 'P3008');
  update public.user_packages set credits_remaining = v_original_balance where id = v_pkg;

  insert into public.booking_credit_charges (booking_id, user_package_id, class_type, credits_used)
  values (v_spent, v_pkg, 'mat', 1);
  perform pg_temp.expect_sqlstate(format('select public.mark_booking_not_attended(%L)', v_spent), 'P3007');
  delete from public.booking_credit_charges where booking_id = v_spent and class_type = 'mat';

  -- Manual use of the issued replacement, then ordinary cancellation.
  insert into public.sessions (title, session_type, starts_at, ends_at, capacity, reformer_credits_required)
  values ('future manual', 'reformer', clock_timestamp() + interval '3 days', clock_timestamp() + interval '3 days 1 hour', 5, 1)
  returning id into v_future;
  perform public.staff_book_session_for_client(v_client, v_future, (v_result->>'replacement_user_package_id')::uuid);
  select credits_remaining into v_balance from public.user_packages where id = (v_result->>'replacement_user_package_id')::uuid;
  if v_balance <> 0 then
    raise exception 'manual booking did not spend the replacement';
  end if;
  perform public.cancel_booking(
    (select id from public.bookings where session_id = v_future and user_id = v_client and status = 'booked'),
    'test cancel'
  );
  select credits_remaining into v_balance from public.user_packages where id = (v_result->>'replacement_user_package_id')::uuid;
  if v_balance <> 1 then
    raise exception 'ordinary future cancellation did not restore the replacement credit';
  end if;

  update public.user_packages
     set status = 'expired', expires_at = clock_timestamp() - interval '1 day', credits_remaining = 0
   where id = (v_result->>'replacement_user_package_id')::uuid;
  insert into public.sessions (title, session_type, starts_at, ends_at, capacity, reformer_credits_required)
  values ('after expiry', 'reformer', clock_timestamp() + interval '4 days', clock_timestamp() + interval '4 days 1 hour', 5, 1)
  returning id into v_future;
  -- Expired package cannot be booked. This records the existing expiry rule.
  begin
    perform public.staff_book_session_for_client(v_client, v_future, (v_result->>'replacement_user_package_id')::uuid);
    raise exception 'expired replacement was bookable';
  exception
    when others then
      if sqlerrm not like '%expired%' and sqlerrm not like '%not active%' then
        raise;
      end if;
  end;

  alter table public.booking_outcome_events disable trigger booking_outcome_events_no_delete;
  alter table public.user_packages disable trigger user_packages_keep_replacement_history;
  alter table public.packages disable trigger packages_keep_replacement_catalog;
  delete from public.booking_outcome_events where actor_user_id in (v_staff, v_admin, v_owner);
  delete from public.booking_credit_charges where booking_id in (select id from public.bookings where user_id in (v_client, v_other));
  delete from public.bookings
   where user_package_id in (
     select id from public.user_packages
      where replacement_source_booking_id is not null
        and user_id in (v_client, v_other)
   );
  delete from public.user_packages
   where replacement_source_booking_id is not null
     and user_id in (v_client, v_other);
  delete from public.bookings where user_id in (v_client, v_other);
  delete from public.user_packages where user_id in (v_client, v_other);
  delete from public.sessions where title like 'Not attended%' or title in ('future', 'future manual', 'after expiry', 'rollback class');
  delete from public.packages where name like 'Not attended test%';
  delete from public.user_roles where user_id in (v_staff, v_admin, v_owner, v_client);
  delete from public.profiles where id in (v_staff, v_admin, v_owner, v_client, v_other);
  delete from auth.users where id in (v_staff, v_admin, v_owner, v_client, v_other);
  alter table public.booking_outcome_events enable trigger booking_outcome_events_no_delete;
  alter table public.user_packages enable trigger user_packages_keep_replacement_history;
  alter table public.packages enable trigger packages_keep_replacement_catalog;
end;
$$;

create or replace function auth.uid()
returns uuid
language sql
stable
as $$
  select null::uuid
$$;
