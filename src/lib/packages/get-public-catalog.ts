import { createClient } from '@/lib/supabase/server';

import {
  build_pricing_from_site_content,
  build_public_pricing_catalog,
  get_homepage_pricing_preview,
} from './pricing-display';
import type { PublicPackage, PublicPricingCatalog } from './types';

function map_row(row: {
  id: string;
  name: string;
  description: string | null;
  class_type: string;
  package_type: string;
  credits_included: number | null;
  validity_days: number | null;
  price: number | string;
  sort_order: number;
  is_active: boolean;
}): PublicPackage {
  return {
    id: row.id,
    name: row.name,
    description: row.description,
    class_type: row.class_type as 'reformer' | 'mat',
    package_type: row.package_type,
    credits_included: row.credits_included,
    validity_days: row.validity_days,
    price: Number(row.price),
    sort_order: row.sort_order,
    is_active: row.is_active,
  };
}

export async function fetch_public_packages(): Promise<PublicPackage[] | null> {
  try {
    const supabase = await createClient();
    const { data, error } = await supabase
      .from('packages')
      .select(
        'id, name, description, class_type, package_type, credits_included, validity_days, price, sort_order, is_active',
      )
      .eq('is_active', true)
      .order('sort_order', { ascending: true });

    if (error) {
      console.error('[fetch_public_packages] query failed:', error.message);
      return null;
    }

    if (!data || data.length === 0) return null;

    const seen = new Set<string>();
    return data
      .map(map_row)
      .filter((pkg) => {
        if (seen.has(pkg.id)) return false;
        seen.add(pkg.id);
        return true;
      });
  } catch (error) {
    console.error('[fetch_public_packages] unavailable:', error);
    return null;
  }
}

export async function get_public_pricing_catalog(): Promise<PublicPricingCatalog> {
  const packages = await fetch_public_packages();
  if (!packages) {
    const fallback = build_pricing_from_site_content();
    return {
      reformer: fallback.reformer,
      mat: fallback.mat,
    };
  }

  return build_public_pricing_catalog(packages);
}

export async function get_homepage_pricing_items() {
  const packages = await fetch_public_packages();
  if (!packages) {
    return build_pricing_from_site_content().homepage_preview;
  }

  return get_homepage_pricing_preview(packages);
}
