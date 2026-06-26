# Phase 8 kickoff — production and content readiness

**Date:** 2026-06-24  
**Agent:** Cursor  
**Status:** IN PROGRESS

## Completed this session (8.5 partial)

- Extended `src/app/sitemap.ts` to include `/about` and `/book` (public discovery routes missing from nav-only sitemap)
- Updated `e2e/navigation.spec.ts` sitemap assertions

## Phase 8 checklist status

### 8.1 Production deployment
- [x] Vercel project linked and preview live
- [ ] Merge `99ca9d0` (auth fixes) into `master` and push
- [ ] Confirm production URL serves latest commit
- [ ] Custom domain (when available)

### 8.2 Real content replacement
- [ ] Studio address, hours finalization
- [ ] Hero copy approval
- [ ] Instructor bios and photos
- [ ] Pricing final numbers
- [ ] FAQ from studio owner

### 8.3 Photography
- [ ] Replace all `bg-[#E8E2D0]` placeholders with real images

### 8.4 Contact form backend
- [ ] Wire submission (Resend / Supabase edge / Formspree)
- [ ] Success/error UI states

### 8.5 SEO and metadata
- [x] Unique titles/descriptions per public page (`createPageMetadata`)
- [x] `robots.ts` configured
- [x] `sitemap.xml` includes nav routes + `/about` + `/book`
- [ ] `og:image` asset for social sharing
- [ ] JSON-LD local business structured data

### 8.6 Performance
- [ ] Lighthouse on production after real photos

### 8.7 Accessibility
- [ ] Playwright a11y pass on all public pages
- [ ] `#B8A678` on `#F4F1E8` contrast check for small text

## Recommended next action
1. Merge latest branch to `master` and redeploy Vercel
2. Choose contact form backend (8.4) — blocks launch conversion
3. Begin content/photography checklist with studio owner (8.2–8.3)
