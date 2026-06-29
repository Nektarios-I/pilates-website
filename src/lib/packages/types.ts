export type PublicPackage = {
  id: string;
  name: string;
  description: string | null;
  class_type: 'reformer' | 'mat';
  package_type: string;
  credits_included: number | null;
  validity_days: number | null;
  price: number;
  sort_order: number;
  is_active: boolean;
};

export type PricingPlanCard = {
  id?: string;
  title: string;
  price: string;
  description: string;
  featured?: boolean;
};

export type PricingGroupBuckets = {
  single: PricingPlanCard[];
  one_month: PricingPlanCard[];
  three_month: PricingPlanCard[];
};

export type PublicPricingCatalog = {
  reformer: PricingGroupBuckets;
  mat: PricingGroupBuckets;
};
