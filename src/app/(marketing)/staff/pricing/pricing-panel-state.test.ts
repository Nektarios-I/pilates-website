import { describe, expect, it } from 'vitest';

import type { EditablePackage } from '@/app/(marketing)/staff/pricing/actions';
import {
  dedupe_packages_by_id,
  package_to_input,
  partition_packages_by_class,
  resolve_package_input,
} from '@/app/(marketing)/staff/pricing/pricing-panel-state';

const sample: EditablePackage = {
  id: 'pkg-new',
  name: 'Reformer · Trial Pack',
  description: '3 classes',
  class_type: 'reformer',
  package_type: 'credit_pack',
  credits_included: 3,
  validity_days: 14,
  price: 40,
  sort_order: 20,
  is_active: true,
};

describe('pricing-panel-state', () => {
  it('builds form values for a package without prior edit state', () => {
    const values = resolve_package_input(sample, {});

    expect(values.name).toBe('Reformer · Trial Pack');
    expect(values.price).toBe(40);
  });

  it('merges dirty edits over server package values', () => {
    const values = resolve_package_input(sample, {
      'pkg-new': { price: 45, name: 'Updated trial' },
    });

    expect(values.price).toBe(45);
    expect(values.name).toBe('Updated trial');
    expect(values.credits_included).toBe(3);
  });

  it('maps editable package rows to form input', () => {
    expect(package_to_input(sample).class_type).toBe('reformer');
  });

  it('dedupes packages by id and sorts by sort order', () => {
    const duplicate: EditablePackage = { ...sample, id: 'pkg-new' };
    const other: EditablePackage = { ...sample, id: 'pkg-other', name: 'Alpha', sort_order: 5 };

    const result = dedupe_packages_by_id([duplicate, other, duplicate]);

    expect(result).toHaveLength(2);
    expect(result[0]?.id).toBe('pkg-other');
    expect(result[1]?.id).toBe('pkg-new');
  });

  it('places each package in exactly one class group', () => {
    const mat_package: EditablePackage = { ...sample, id: 'pkg-mat', class_type: 'mat' };
    const dirty = {
      'pkg-new': { class_type: 'mat' as const },
    };

    const groups = partition_packages_by_class([sample, mat_package], dirty);

    expect(groups.reformer).toHaveLength(0);
    expect(groups.mat.map((pkg) => pkg.id)).toEqual(['pkg-new', 'pkg-mat']);
  });
});
