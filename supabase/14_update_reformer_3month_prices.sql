-- =============================================================================
-- 14_update_reformer_3month_prices.sql — Owner price update (June 2026)
--
-- WHAT THIS DOES
--   Updates reformer 3-month package prices to the new owner-approved values.
--   Also upserts the full reformer + mat catalog so missing rows are created.
--
-- RUN ORDER: After 04_seed.sql. Safe to re-run (idempotent).
-- =============================================================================

-- Quick price-only update for existing reformer 3-month rows
update public.packages
   set price = 265.00,
       updated_at = now()
 where id = 'b0000000-0000-0000-0000-000000000005';

update public.packages
   set price = 400.00,
       updated_at = now()
 where id = 'b0000000-0000-0000-0000-000000000006';

update public.packages
   set price = 520.00,
       updated_at = now()
 where id = 'b0000000-0000-0000-0000-000000000007';

-- Full catalog upsert (same as 04_seed.sql with updated 3-month reformer prices)
insert into public.packages (id, name, description, class_type, package_type,
  credits_included, validity_days, price, max_per_user, sort_order, is_active)
values
  (
    'b0000000-0000-0000-0000-000000000001',
    'Reformer · Single Class',
    'One reformer class.',
    'reformer', 'drop_in', 1, 30, 15.00, null, 1, true
  ),
  (
    'b0000000-0000-0000-0000-000000000002',
    'Reformer · 1 Month · 2×/week',
    '8 reformer classes within 30 days.',
    'reformer', 'credit_pack', 8, 30, 100.00, null, 2, true
  ),
  (
    'b0000000-0000-0000-0000-000000000003',
    'Reformer · 1 Month · 3×/week',
    '12 reformer classes within 30 days.',
    'reformer', 'credit_pack', 12, 30, 145.00, null, 3, true
  ),
  (
    'b0000000-0000-0000-0000-000000000004',
    'Reformer · 1 Month · 4×/week',
    '16 reformer classes within 30 days.',
    'reformer', 'credit_pack', 16, 30, 185.00, null, 4, true
  ),
  (
    'b0000000-0000-0000-0000-000000000005',
    'Reformer · 3 Months · 2×/week',
    '24 reformer classes within 90 days.',
    'reformer', 'credit_pack', 24, 90, 265.00, null, 5, true
  ),
  (
    'b0000000-0000-0000-0000-000000000006',
    'Reformer · 3 Months · 3×/week',
    '36 reformer classes within 90 days.',
    'reformer', 'credit_pack', 36, 90, 400.00, null, 6, true
  ),
  (
    'b0000000-0000-0000-0000-000000000007',
    'Reformer · 3 Months · 4×/week',
    '48 reformer classes within 90 days.',
    'reformer', 'credit_pack', 48, 90, 520.00, null, 7, true
  ),
  (
    'c0000000-0000-0000-0000-000000000001',
    'Mat · Single Class',
    'One mat Pilates class.',
    'mat', 'drop_in', 1, 30, 10.00, null, 101, true
  ),
  (
    'c0000000-0000-0000-0000-000000000002',
    'Mat · 1 Month · 2×/week',
    '8 mat classes within 30 days.',
    'mat', 'credit_pack', 8, 30, 70.00, null, 102, true
  ),
  (
    'c0000000-0000-0000-0000-000000000003',
    'Mat · 1 Month · 3×/week',
    '12 mat classes within 30 days.',
    'mat', 'credit_pack', 12, 30, 95.00, null, 103, true
  ),
  (
    'c0000000-0000-0000-0000-000000000004',
    'Mat · 1 Month · 4×/week',
    '16 mat classes within 30 days.',
    'mat', 'credit_pack', 16, 30, 120.00, null, 104, true
  ),
  (
    'c0000000-0000-0000-0000-000000000005',
    'Mat · 3 Months · 2×/week',
    '24 mat classes within 90 days.',
    'mat', 'credit_pack', 24, 90, 195.00, null, 105, true
  ),
  (
    'c0000000-0000-0000-0000-000000000006',
    'Mat · 3 Months · 3×/week',
    '36 mat classes within 90 days.',
    'mat', 'credit_pack', 36, 90, 275.00, null, 106, true
  ),
  (
    'c0000000-0000-0000-0000-000000000007',
    'Mat · 3 Months · 4×/week',
    '48 mat classes within 90 days.',
    'mat', 'credit_pack', 48, 90, 350.00, null, 107, true
  )
on conflict (id) do update set
  name = excluded.name,
  description = excluded.description,
  class_type = excluded.class_type,
  package_type = excluded.package_type,
  credits_included = excluded.credits_included,
  validity_days = excluded.validity_days,
  price = excluded.price,
  max_per_user = excluded.max_per_user,
  sort_order = excluded.sort_order,
  is_active = excluded.is_active,
  updated_at = now();
