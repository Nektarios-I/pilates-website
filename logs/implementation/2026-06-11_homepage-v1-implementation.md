# Homepage V1 Implementation

**Date:** 2026-06-11
**Agent:** Kiro
**Task:** Implement homepage V1 following approved design direction

## Objective

Implement the first stable, professional homepage for the pilates studio website following the V1 design direction with Pilates Republic as the single inspiration source.

## Changes made

### Files updated (5)

1. **src/features/home/home-content.ts** — Complete rewrite to align with V1 spec
   - Replaced placeholder shell content with approved V1 section structure
   - Mapped all content from `src/config/site_content.ts`
   - Implemented correct 8-section homepage flow (hero + 7 content sections)
   - Removed unapproved "benefits" and "trust" sections
   - Added required sections: studio_overview, pricing, contact, faq

2. **src/app/(marketing)/page.tsx** — Updated homepage rendering
   - Removed unapproved CtaBlock component usage
   - Implemented correct V1 section order
   - Added all required preview sections with section-level CTAs
   - Used centralized `site_content` for SEO metadata

3. **src/components/layout/site-header.tsx** — Updated for booking prominence
   - Changed studio name from `siteConfig.name` to `site_content.studio_info.studio_name`
   - Changed primary CTA from "Contact" to "Book Now"
   - Updated href to use `site_content.primary_cta.href`
   - Removed `variant="secondary"` to make booking CTA primary

4. **src/components/layout/site-navigation.tsx** — Updated navigation source
   - Changed from `primaryNavigation` to `site_content.navigation_items`
   - Now uses V1-approved nav items only (Home, Classes, Pricing, Instructors, Contact, FAQ)

5. **src/components/layout/site-footer.tsx** — Complete rewrite for professional footer
   - Replaced simple footer with complete structured footer
   - Added studio name, brand line, navigation groups, social links, legal links
   - Used `site_content.footer_content` structure throughout
   - Removed meta-commentary about placeholders

## Homepage V1 structure

Final homepage section order:
1. Header (with prominent "Book Now" CTA)
2. Hero
3. Studio overview
4. Classes preview
5. Pricing preview
6. Instructors preview
7. Contact preview
8. FAQ preview
9. Footer

## Content strategy

All content now sources from `src/config/site_content.ts`, which uses placeholder tokens from `business_placeholders.md`:
- All TODO_ placeholders remain visible and centralized
- No "Corehouse Pilates Studio" branding remains in user-facing content
- No meta-commentary about shells or pending content in user-facing areas

## Verification status

✅ TypeScript compilation: Pass
✅ ESLint: Pass
✅ Production build: Pass
✅ Homepage section order: Correct
✅ Booking prominence: Implemented in header and hero
✅ Navigation: V1-approved items only
✅ Placeholder centralization: Complete
✅ Scope control: Homepage only

## Assumptions

All business data uses placeholder tokens per approved strategy:
- Studio name, tagline, descriptions
- Contact details (phone, email, address, hours)
- Booking URL and provider
- Class details (descriptions, durations, levels, capacity)
- Pricing (all prices and package descriptions)
- Instructor details (names, bios, roles)
- FAQ answers
- Social media links

## Next recommended action

Review homepage V1 in browser, then proceed to next page per rollout plan: **Classes page**.

## Notes

- No new components created; reused existing primitives
- No architectural changes; adapted existing structure
- Studio overview section uses simple card grid instead of PreviewCardGrid for variety
- Each preview section includes centered CTA button below cards for clear next actions
- Footer is now complete and professional per V1 spec requirements
