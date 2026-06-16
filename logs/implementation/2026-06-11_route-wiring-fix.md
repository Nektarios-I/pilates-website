# Route Wiring Fix

**Date:** 2026-06-11
**Agent:** Kiro
**Task:** Fix broken booking CTA and legal link wiring

## Root cause

The `/book` route existed in the Next.js build output, but user-facing "Book Now" CTAs were wired to the placeholder value `TODO_BUSINESS_BOOKING_URL` instead of the internal `/book` route.

This occurred because:

1. `site_content.ts` was created with placeholder business values
2. `primary_cta.href` was set to `'TODO_BUSINESS_BOOKING_URL'`
3. `hero_content.primary_cta_href` was set to `'TODO_BUSINESS_BOOKING_URL'`
4. Footer "Book Now" link was set to `'TODO_BUSINESS_BOOKING_URL'`
5. When `/book` page was implemented, these config values were not updated

Result: Clicking any "Book Now" CTA requested `/TODO_BUSINESS_BOOKING_URL` → 404

## Wiring audit findings

### Broken links (BEFORE FIX)

1. **Header primary CTA** → `TODO_BUSINESS_BOOKING_URL` ❌
2. **Homepage hero primary CTA** → `TODO_BUSINESS_BOOKING_URL` ❌
3. **Footer Contact group "Book Now"** → `TODO_BUSINESS_BOOKING_URL` ❌
4. **All page CTA sections** → Used `site_content.primary_cta.href` = `TODO_BUSINESS_BOOKING_URL` ❌
5. **Footer legal links** → `/privacy` and `/terms` (non-existent routes) ❌

### Working links (BEFORE FIX)

1. Navigation items → All correct ✓
2. Homepage section CTAs → All correct (classes, pricing, instructors, contact, faq) ✓
3. Footer page links → All correct ✓
4. Inter-page CTAs → All correct ✓

## Fixes applied

### 1. Booking CTA fix

**File:** `src/config/site_content.ts`

**Changed:**

```typescript
// BEFORE
primary_cta: {
  label: 'Book Now',
  href: 'TODO_BUSINESS_BOOKING_URL',
},

hero_content: {
  // ...
  primary_cta_label: 'Book Now',
  primary_cta_href: 'TODO_BUSINESS_BOOKING_URL',
  // ...
},

// AFTER
primary_cta: {
  label: 'Book Now',
  href: '/book',
},

hero_content: {
  // ...
  primary_cta_label: 'Book Now',
  primary_cta_href: '/book',
  // ...
},
```

**Impact:** Fixed all booking CTAs across the site

- Header "Book Now" button ✓
- Homepage hero primary CTA ✓
- Classes page CTA section ✓
- Pricing page CTA section ✓
- Instructors page CTA section ✓
- Contact page CTA section ✓
- FAQ page CTA section ✓

### 2. Footer "Book Now" fix

**File:** `src/config/site_content.ts`

**Changed:**

```typescript
// BEFORE
{
  title: 'Contact',
  links: [
    { label: 'Phone', href: 'tel:TODO_BUSINESS_PHONE' },
    { label: 'Email', href: 'mailto:TODO_BUSINESS_EMAIL' },
    { label: 'Book Now', href: 'TODO_BUSINESS_BOOKING_URL' },
  ],
},

// AFTER
{
  title: 'Contact',
  links: [
    { label: 'Phone', href: 'tel:TODO_BUSINESS_PHONE' },
    { label: 'Email', href: 'mailto:TODO_BUSINESS_EMAIL' },
    { label: 'Book Now', href: '/book' },
  ],
},
```

### 3. Footer legal links fix

**File:** `src/config/site_content.ts`

**Changed:**

```typescript
// BEFORE
legal_links: [
  { label: 'Rules', href: '/faq' },
  { label: 'Privacy', href: '/privacy' },  // ❌ Route doesn't exist
  { label: 'Terms', href: '/terms' },      // ❌ Route doesn't exist
],

// AFTER
legal_links: [
  { label: 'Rules', href: '/faq' },
],
```

**Rationale:** Removed non-existent `/privacy` and `/terms` links to avoid exposing known broken links. These can be added back when those pages are implemented.

## Wiring audit (AFTER FIX)

### Booking flow

- **Header** → `/book` ✓
- **Homepage hero** → `/book` ✓
- **Classes page CTA** → `/book` ✓
- **Pricing page CTA** → `/book` ✓
- **Instructors page CTA** → `/book` ✓
- **Contact page CTA** → `/book` ✓
- **FAQ page CTA** → `/book` ✓
- **Footer Contact group** → `/book` ✓

### Navigation integrity

- **Header nav** → All valid internal routes ✓
- **Footer page links** → All valid internal routes ✓
- **Footer legal links** → Only existing routes ✓
- **Social links** → Placeholder external URLs (intentional) ✓
- **Contact links** → tel: and mailto: with placeholder values (intentional) ✓

## Verification results

### Lint

✅ **PASS**

```
> eslint
Exit Code: 0
```

### Typecheck

✅ **PASS**

```
> tsc --noEmit
Exit Code: 0
```

### Build

✅ **PASS**

```
Route (app)
├ ○ /book ✓
├ ○ /classes ✓
├ ○ /pricing ✓
├ ○ /instructors ✓
├ ○ /contact ✓
├ ○ /faq ✓
├ ○ /login ✓
├ ○ /account ✓
└ ... (17 total routes)

Exit Code: 0
```

### Booking CTA verification

✅ **CONFIRMED** — Booking CTA now resolves to `/book`

Verified by:

1. Grepped for `TODO_BUSINESS_BOOKING_URL` → No results ✓
2. Grepped for `primary_cta` usage → All use corrected `/book` value ✓
3. Checked all page files → All booking CTAs point to valid routes ✓

### Live link verification

✅ **CONFIRMED** — No known broken live links remain

- All navigation links → Valid routes ✓
- All footer page links → Valid routes ✓
- Footer legal links → Only existing `/faq` route ✓
- All CTA buttons → Valid internal routes ✓

## Auth/booking logic check

✅ **CONFIRMED** — No auth/booking logic added

- No Supabase packages ✓
- No Supabase imports ✓
- No auth state management ✓
- No protected routes ✓
- Only route wiring fixes ✓

## Files changed

**Updated (1 file):**

1. `src/config/site_content.ts`
   - Fixed `primary_cta.href` → `/book`
   - Fixed `hero_content.primary_cta_href` → `/book`
   - Fixed footer Contact group "Book Now" → `/book`
   - Removed non-existent `/privacy` and `/terms` from footer legal links

**No files created or deleted**

## Status

✅ **READY FOR AUTH FOUNDATION**

All route wiring is now correct:

- Booking CTAs work across the entire site
- No broken internal links remain
- Footer only exposes existing routes
- All checks pass
- No premature auth/booking logic added
