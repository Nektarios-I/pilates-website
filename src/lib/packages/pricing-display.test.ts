import { describe, expect, it } from 'vitest';

import {
  build_public_pricing_catalog,
  format_package_price_eur,
  get_homepage_pricing_preview,
} from './pricing-display';
import type { PublicPackage } from './types';

const sample_packages: PublicPackage[] = [
  {
    id: '1',
    name: 'Reformer · Single Class',
    description: 'One class',
    class_type: 'reformer',
    package_type: 'drop_in',
    credits_included: 1,
    validity_days: 30,
    price: 15,
    sort_order: 1,
    is_active: true,
  },
  {
    id: '2',
    name: 'Reformer · 1 Month · 2×/week',
    description: '8 classes',
    class_type: 'reformer',
    package_type: 'credit_pack',
    credits_included: 8,
    validity_days: 30,
    price: 100,
    sort_order: 2,
    is_active: true,
  },
  {
    id: '3',
    name: 'Reformer · 3 Months · 2×/week',
    description: '24 classes',
    class_type: 'reformer',
    package_type: 'credit_pack',
    credits_included: 24,
    validity_days: 90,
    price: 265,
    sort_order: 5,
    is_active: true,
  },
];

describe('pricing-display', () => {
  it('formats whole euro prices without decimals', () => {
    expect(format_package_price_eur(15)).toBe('€15');
    expect(format_package_price_eur(265)).toBe('€265');
  });

  it('groups packages into marketing buckets', () => {
    const catalog = build_public_pricing_catalog(sample_packages);

    expect(catalog.reformer.single).toHaveLength(1);
    expect(catalog.reformer.single[0]?.price).toBe('€15');
    expect(catalog.reformer.one_month).toHaveLength(1);
    expect(catalog.reformer.one_month[0]?.price).toBe('€100');
    expect(catalog.reformer.three_month).toHaveLength(1);
    expect(catalog.reformer.three_month[0]?.price).toBe('€265');
  });

  it('builds homepage preview from reformer packages', () => {
    const preview = get_homepage_pricing_preview(sample_packages);

    expect(preview).toHaveLength(3);
    expect(preview[0]?.price).toBe('€15');
    expect(preview[1]?.featured).toBe(true);
    expect(preview[2]?.price).toBe('€265');
  });
});
