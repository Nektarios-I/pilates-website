import { siteConfig } from '@/config/site';
import { site_content } from '@/config/site_content';
import { brand_logo_absolute_url } from '@/lib/seo/brand-images';

type LocalBusinessJsonLdProps = {
  logo_url?: string;
};

export function LocalBusinessJsonLd({ logo_url }: LocalBusinessJsonLdProps) {
  const { contact_preview } = site_content;
  const instagram = siteConfig.socialLinks.instagram;
  const logo = logo_url ?? brand_logo_absolute_url(siteConfig.siteUrl);

  const json_ld = {
    '@context': 'https://schema.org',
    '@type': 'SportsActivityLocation',
    name: site_content.studio_info.studio_name,
    description: site_content.seo.site_description,
    url: siteConfig.siteUrl,
    telephone: siteConfig.contactPhone,
    logo,
    image: logo,
    address: {
      '@type': 'PostalAddress',
      addressLocality: contact_preview.city,
      addressCountry: contact_preview.country,
    },
    sameAs: instagram ? [instagram] : [],
    priceRange: '€€',
    knowsAbout: ['Reformer Pilates', 'Mat Pilates', 'Pilates classes'],
  };

  return (
    <script
      dangerouslySetInnerHTML={{ __html: JSON.stringify(json_ld) }}
      type="application/ld+json"
    />
  );
}
