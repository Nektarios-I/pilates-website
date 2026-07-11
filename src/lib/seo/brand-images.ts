export const brand_seo_images = {
  logo: {
    path: '/images/seo/corehouse_logo.png',
    width: 571,
    height: 347,
    alt: 'corehouse Pilates Studio logo',
  },
} as const;

export function brand_logo_absolute_url(site_url: string): string {
  return `${site_url}${brand_seo_images.logo.path}`;
}
