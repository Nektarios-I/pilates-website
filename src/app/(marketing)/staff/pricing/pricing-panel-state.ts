import type { EditablePackage, PackageInput } from './actions';

export function dedupe_packages_by_id(packages: EditablePackage[]): EditablePackage[] {
  const seen = new Set<string>();
  const unique: EditablePackage[] = [];

  for (const pkg of packages) {
    if (seen.has(pkg.id)) continue;
    seen.add(pkg.id);
    unique.push(pkg);
  }

  return unique.sort((a, b) => a.sort_order - b.sort_order || a.name.localeCompare(b.name));
}

export function partition_packages_by_class(
  packages: EditablePackage[],
  dirty_edits: Record<string, Partial<PackageInput>>,
): { reformer: EditablePackage[]; mat: EditablePackage[] } {
  const unique = dedupe_packages_by_id(packages);
  const reformer: EditablePackage[] = [];
  const mat: EditablePackage[] = [];

  for (const pkg of unique) {
    const class_type = resolve_package_input(pkg, dirty_edits).class_type;
    if (class_type === 'mat') {
      mat.push(pkg);
    } else {
      reformer.push(pkg);
    }
  }

  return { reformer, mat };
}

export function package_to_input(pkg: EditablePackage): PackageInput {
  return {
    name: pkg.name,
    description: pkg.description,
    class_type: pkg.class_type,
    package_type: pkg.package_type,
    credits_included: pkg.credits_included,
    validity_days: pkg.validity_days,
    price: pkg.price,
    sort_order: pkg.sort_order,
    is_active: pkg.is_active,
  };
}

export function resolve_package_input(
  pkg: EditablePackage,
  dirty_edits: Record<string, Partial<PackageInput>>,
): PackageInput {
  return {
    ...package_to_input(pkg),
    ...dirty_edits[pkg.id],
  };
}
