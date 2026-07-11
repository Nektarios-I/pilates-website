export const brand_seo_images = {
  logo: {
    path: '/images/seo/corehouse_logo.png',
    width: 571,
    height: 347,
    alt: 'corehouse Pilates Studio logo',
  },
  favicon: {
    path: '/favicon.ico',
  },
  icon_png: {
    path: '/images/seo/favicon-192.png',
    width: 192,
    height: 192,
    type: 'image/png' as const,
  },
  apple_icon: {
    path: '/images/seo/apple-icon.png',
    width: 180,
    height: 180,
    type: 'image/png' as const,
  },
} as const;

export function brand_logo_absolute_url(site_url: string): string {
  return `${site_url}${brand_seo_images.logo.path}`;
}
