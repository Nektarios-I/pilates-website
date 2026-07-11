import { describe, expect, it } from 'vitest';

import { siteConfig } from '@/config/site';
import { site_content } from '@/config/site_content';
import { brand_logo_absolute_url } from '@/lib/seo/brand-images';

import { LocalBusinessJsonLd } from './local-business-json-ld';

describe('LocalBusinessJsonLd', () => {
  it('renders structured data for the studio', () => {
    const html = LocalBusinessJsonLd({});
    const payload = JSON.parse(
      (html.props as { dangerouslySetInnerHTML: { __html: string } }).dangerouslySetInnerHTML
        .__html,
    );

    expect(payload['@type']).toBe('SportsActivityLocation');
    expect(payload.name).toBe(site_content.studio_info.studio_name);
    expect(payload.description).toBe(site_content.seo.site_description);
    expect(payload.url).toBe(siteConfig.siteUrl);
    expect(payload.telephone).toBe(siteConfig.contactPhone);
    expect(payload.logo).toBe(brand_logo_absolute_url(siteConfig.siteUrl));
    expect(payload.image).toBe(brand_logo_absolute_url(siteConfig.siteUrl));
  });
});
