-- =============================================================================
-- 13_migrate_legacy_packages.sql — One-time upgrade for OLD databases only
--
-- WHEN TO RUN
--   Only if you previously seeded packages with a0000000-… IDs (before reformer
--   catalog update). Fresh installs that ran 04_seed.sql already have b000… IDs —
--   skip this file.
--
-- WHAT THIS DOES
--   Deactivates legacy a000… packages and ensures the reformer b000… catalog
--   is marked as reformer. Run 04_seed.sql first for the full reformer + mat catalog.
--
-- RUN ORDER: After 04_seed.sql on an existing database. Safe to re-run.
-- =============================================================================

update public.packages
   set is_active = false
 where id in (
   'a0000000-0000-0000-0000-000000000001',
   'a0000000-0000-0000-0000-000000000002',
   'a0000000-0000-0000-0000-000000000003',
   'a0000000-0000-0000-0000-000000000004',
   'a0000000-0000-0000-0000-000000000005',
   'a0000000-0000-0000-0000-000000000006',
   'a0000000-0000-0000-0000-000000000007'
 );

insert into public.packages (id, name, description, class_type, package_type,
  credits_included, validity_days, price, max_per_user, sort_order, is_active)
values
  (
    'b0000000-0000-0000-0000-000000000001',
    'Single Class',
    'One reformer class.',
    'reformer', 'drop_in', 1, 30, 15.00, null, 1, true
  ),
  (
    'b0000000-0000-0000-0000-000000000002',
    '1 Month · 2×/week',
    '8 reformer classes within 30 days.',
    'reformer', 'credit_pack', 8, 30, 100.00, null, 2, true
  ),
  (
    'b0000000-0000-0000-0000-000000000003',
    '1 Month · 3×/week',
    '12 reformer classes within 30 days.',
    'reformer', 'credit_pack', 12, 30, 145.00, null, 3, true
  ),
  (
    'b0000000-0000-0000-0000-000000000004',
    '1 Month · 4×/week',
    '16 reformer classes within 30 days.',
    'reformer', 'credit_pack', 16, 30, 185.00, null, 4, true
  ),
  (
    'b0000000-0000-0000-0000-000000000005',
    '3 Months · 2×/week',
    '24 reformer classes within 90 days.',
    'reformer', 'credit_pack', 24, 90, 285.00, null, 5, true
  ),
  (
    'b0000000-0000-0000-0000-000000000006',
    '3 Months · 3×/week',
    '36 reformer classes within 90 days.',
    'reformer', 'credit_pack', 36, 90, 415.00, null, 6, true
  ),
  (
    'b0000000-0000-0000-0000-000000000007',
    '3 Months · 4×/week',
    '48 reformer classes within 90 days.',
    'reformer', 'credit_pack', 48, 90, 525.00, null, 7, true
  )
on conflict (id) do update set
  name = excluded.name,
  description = excluded.description,
  class_type = excluded.class_type,
  package_type = excluded.package_type,
  credits_included = excluded.credits_included,
  validity_days = excluded.validity_days,
  price = excluded.price,
  sort_order = excluded.sort_order,
  is_active = excluded.is_active;
