import { site_content } from '@/config/site_content';

import type {
  PricingGroupBuckets,
  PricingPlanCard,
  PublicPackage,
  PublicPricingCatalog,
} from './types';

export function format_package_price_eur(price: number): string {
  const rounded = Math.round(price * 100) / 100;
  return Number.isInteger(rounded) ? `€${rounded}` : `€${rounded.toFixed(2)}`;
}

export function package_card_description(pkg: PublicPackage): string {
  const parts: string[] = [];
  if (pkg.credits_included != null) {
    parts.push(`${pkg.credits_included} class${pkg.credits_included === 1 ? '' : 'es'}`);
  }
  if (pkg.validity_days != null) {
    parts.push(`${pkg.validity_days} days`);
  }
  if (parts.length > 0) return parts.join(' · ');
  return pkg.description?.trim() || '';
}

export function package_display_title(pkg: PublicPackage): string {
  const segments = pkg.name.split('·').map((part) => part.trim());
  if (segments.length >= 2) {
    const last = segments[segments.length - 1] ?? pkg.name;
    if (/single/i.test(last)) return 'Single class';
    return last.replace('/week', ' per week');
  }
  return pkg.name;
}

function to_plan_card(pkg: PublicPackage, featured = false): PricingPlanCard {
  return {
    id: pkg.id,
    title: package_display_title(pkg),
    price: format_package_price_eur(pkg.price),
    description: package_card_description(pkg),
    featured,
  };
}

function bucket_active_packages(
  packages: PublicPackage[],
  class_type: 'reformer' | 'mat',
): PricingGroupBuckets {
  const filtered = packages
    .filter((pkg) => pkg.class_type === class_type && pkg.is_active)
    .sort((a, b) => a.sort_order - b.sort_order);

  const single = filtered
    .filter((pkg) => pkg.package_type === 'drop_in')
    .map((pkg) => to_plan_card(pkg));
  const one_month = filtered
    .filter((pkg) => pkg.package_type === 'credit_pack' && pkg.validity_days === 30)
    .map((pkg, index, list) => to_plan_card(pkg, list.length > 1 && index === 1));
  const three_month = filtered
    .filter((pkg) => pkg.package_type === 'credit_pack' && pkg.validity_days === 90)
    .map((pkg, index, list) => to_plan_card(pkg, list.length > 1 && index === 1));

  return { single, one_month, three_month };
}

export function build_public_pricing_catalog(packages: PublicPackage[]): PublicPricingCatalog {
  return {
    reformer: bucket_active_packages(packages, 'reformer'),
    mat: bucket_active_packages(packages, 'mat'),
  };
}

export function get_homepage_pricing_preview(packages: PublicPackage[]): PricingPlanCard[] {
  const reformer = packages
    .filter((pkg) => pkg.class_type === 'reformer' && pkg.is_active)
    .sort((a, b) => a.sort_order - b.sort_order);

  const picks = [
    reformer.find((pkg) => pkg.package_type === 'drop_in'),
    reformer.find(
      (pkg) =>
        pkg.package_type === 'credit_pack' &&
        pkg.validity_days === 30 &&
        pkg.credits_included === 8,
    ),
    reformer.find(
      (pkg) =>
        pkg.package_type === 'credit_pack' &&
        pkg.validity_days === 90 &&
        pkg.credits_included === 24,
    ),
  ].filter((pkg): pkg is PublicPackage => pkg != null);

  if (picks.length === 0) return build_pricing_from_site_content().homepage_preview;

  return picks.map((pkg, index) => {
    const title =
      index === 0
        ? 'Single class'
        : index === 1
          ? '1 month · 2×/week'
          : '3 months · 2×/week';
    const description =
      index === 0
        ? '1 reformer class'
        : index === 1
          ? '8 classes'
          : '24 classes';

    return {
      id: pkg.id,
      title,
      price: format_package_price_eur(pkg.price),
      description,
      featured: index === 1,
    };
  });
}

function site_plan_cards(
  plans: readonly { name: string; price: string; description: string }[],
  featured_index = 1,
): PricingPlanCard[] {
  return plans.map((plan, index) => ({
    title: plan.name,
    price: plan.price,
    description: plan.description,
    featured: plans.length > 1 && index === featured_index,
  }));
}

export function build_pricing_from_site_content(): PublicPricingCatalog & {
  homepage_preview: PricingPlanCard[];
} {
  const { mat, reformer, plans } = site_content.pricing_preview;

  return {
    reformer: {
      single: site_plan_cards([reformer.single]),
      one_month: site_plan_cards(reformer.one_month),
      three_month: site_plan_cards(reformer.three_month),
    },
    mat: {
      single: site_plan_cards([mat.single]),
      one_month: site_plan_cards(mat.one_month),
      three_month: site_plan_cards(mat.three_month),
    },
    homepage_preview: plans.map((plan, index) => ({
      title: plan.name,
      price: plan.price,
      description: plan.description,
      featured: index === 1,
    })),
  };
}
