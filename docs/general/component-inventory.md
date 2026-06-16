# Component Inventory

Purpose: identify reusable components for the current scaffold and upcoming homepage/design milestones, before broader page implementation.

Scope rules:

- Grounded in current files under `src/components` and `src/app/(marketing)`.
- Includes expected near-term marketing components only.
- Excludes booking, CMS, analytics, and deep app-specific integrations.

Columns:

- Component name
- Purpose
- Likely props
- Depends on tokens? (yes/no)
- Likely pages/routes using it
- Priority (now/later)
- Status (existing/planned)

---

## Shared layout components

| Component           | Purpose                                                       | Likely props                                               | Depends on tokens? | Likely pages/routes                                                                                | Priority | Status   |
| ------------------- | ------------------------------------------------------------- | ---------------------------------------------------------- | ------------------ | -------------------------------------------------------------------------------------------------- | -------- | -------- |
| `PageShell`         | Global marketing shell that composes header/main/footer       | `children`                                                 | Yes                | All pages under `src/app/(marketing)/*`                                                            | Now      | Existing |
| `SiteHeader`        | Top-of-page identity + primary nav + secondary CTA entrypoint | `className?` (future), `showCta?` (future)                 | Yes                | `/`, `/about`, `/classes`, `/pricing`, `/instructors`, `/contact`, `/faq`, `/blog`, `/blog/[slug]` | Now      | Existing |
| `SiteFooter`        | Bottom-of-page trust/navigation area                          | `className?` (future), `showNav?` (future)                 | Yes                | Same as header on all marketing routes                                                             | Now      | Existing |
| `SiteNavigation`    | Reusable nav list renderer from config                        | `label`, `className?`, `items?` (future override)          | Yes                | Header/footer, future sidebar/nav blocks                                                           | Now      | Existing |
| `NavItem`           | Single nav link primitive for active/hover/focus states       | `href`, `label`, `isActive?`, `description?`, `className?` | Yes                | Header/footer nav lists                                                                            | Later    | Planned  |
| `SkipToContentLink` | Keyboard accessibility shortcut to main content               | `targetId` (default `main`), `label?`                      | Yes                | All marketing routes via shell                                                                     | Later    | Planned  |

---

## Reusable content/section components

| Component                        | Purpose                                                                | Likely props                                                                 | Depends on tokens? | Likely pages/routes                                          | Priority | Status   |
| -------------------------------- | ---------------------------------------------------------------------- | ---------------------------------------------------------------------------- | ------------------ | ------------------------------------------------------------ | -------- | -------- |
| `PagePlaceholder`                | Current scaffold placeholder section for unfinished pages              | `eyebrow`, `title`, `description`, `nextStep?`                               | Yes                | All current marketing placeholders including blog index/slug | Now      | Existing |
| `PageHero`                       | Reusable top section for homepage and major pages                      | `eyebrow?`, `title`, `description`, `primaryCta?`, `secondaryCta?`, `media?` | Yes                | `/` now, later reused on `/about`, `/classes`, `/pricing`    | Now      | Planned  |
| `SectionWrapper` (content-level) | Standardized section heading + spacing + optional background tone      | `id?`, `eyebrow?`, `title?`, `description?`, `tone?`, `children`             | Yes                | Homepage sections, future structured page sections           | Now      | Planned  |
| `CtaBlock`                       | Reusable conversion section with primary and optional secondary action | `title`, `description?`, `primaryCta`, `secondaryCta?`, `variant?`           | Yes                | `/`, `/classes`, `/pricing`, `/contact`                      | Now      | Planned  |
| `ClassCard`                      | Class/service summary card                                             | `name`, `summary`, `level?`, `duration?`, `format?`, `cta?`                  | Yes                | `/classes`, homepage class preview                           | Now      | Planned  |
| `InstructorCard`                 | Instructor profile summary card                                        | `name`, `role`, `bioSnippet`, `specialties?`, `image?`, `cta?`               | Yes                | `/instructors`, homepage instructor preview                  | Now      | Planned  |
| `PricingCard`                    | Offer/package display card                                             | `name`, `priceLabel`, `details[]`, `highlighted?`, `cta?`                    | Yes                | `/pricing`, homepage pricing preview                         | Now      | Planned  |
| `FaqItem`                        | Accessible expandable question/answer row                              | `question`, `answer`, `defaultOpen?`, `id?`                                  | Yes                | `/faq`, homepage FAQ preview                                 | Now      | Planned  |
| `TestimonialCard`                | Trust signal card for quote + author                                   | `quote`, `name`, `context?`, `image?`                                        | Yes                | Homepage trust section, later `/about`                       | Later    | Planned  |
| `BlogPostCard`                   | Blog index card for article preview                                    | `title`, `slug`, `excerpt`, `publishedAt?`, `tags?`                          | Yes                | `/blog`, future homepage blog preview                        | Later    | Planned  |
| `EmptyStateMessage`              | Generic empty-state helper for list sections                           | `title`, `description`, `cta?`                                               | Yes                | `/blog` (pre-content), future list-based sections            | Later    | Planned  |

---

## Low-level UI primitives

| Component           | Purpose                                                                  | Likely props                                                               | Depends on tokens? | Likely pages/routes                                 | Priority | Status   |
| ------------------- | ------------------------------------------------------------------------ | -------------------------------------------------------------------------- | ------------------ | --------------------------------------------------- | -------- | -------- |
| `ButtonLink`        | Link-styled button primitive with variant support                        | `href`, `variant`, `children`, `className?`                                | Yes                | Used in placeholder now; future hero/CTA/cards      | Now      | Existing |
| `Container`         | Horizontal content constraint + responsive gutters                       | `children`, `className?`                                                   | Yes                | Used across layout and sections on all pages        | Now      | Existing |
| `Section`           | Vertical rhythm wrapper primitive                                        | `children`, `className?`                                                   | Yes                | Used in placeholder now; future section composition | Now      | Existing |
| `Button` (non-link) | Native button primitive for interactive UI                               | `variant`, `size?`, `disabled?`, `onClick`, `children`                     | Yes                | FAQ interaction, future forms/components            | Later    | Planned  |
| `Card`              | Generic card primitive for class/instructor/pricing/testimonial variants | `children`, `variant?`, `interactive?`, `className?`                       | Yes                | Homepage + card-based pages                         | Now      | Planned  |
| `Badge`             | Small semantic/status label primitive                                    | `variant`, `children`, `size?`                                             | Yes                | Class level tags, pricing highlights, blog metadata | Later    | Planned  |
| `InputField`        | Base text input with label/help/error slots                              | `id`, `label`, `type?`, `placeholder?`, `helpText?`, `error?`, `required?` | Yes                | Future contact and newsletter style forms           | Later    | Planned  |
| `TextAreaField`     | Multi-line input primitive                                               | `id`, `label`, `rows?`, `placeholder?`, `helpText?`, `error?`              | Yes                | Future contact/message sections                     | Later    | Planned  |

---

## Explicitly deferred components

These should remain deferred until their upstream dependency is approved or available:

| Deferred component                                         | Why deferred                                             | Unlock condition                                              |
| ---------------------------------------------------------- | -------------------------------------------------------- | ------------------------------------------------------------- |
| `BookingWidget` / `BookingCtaIntegration`                  | Booking integration explicitly out of scope              | Booking provider and integration decision approved            |
| `CmsRichContentRenderer` / `CmsArticleLayout`              | CMS/content model not approved                           | CMS decision + content model finalized                        |
| `AuthorBioCard` / `ArticleMetaBar` (blog depth components) | Blog currently placeholder-only with no article model    | Blog data model and editorial fields defined                  |
| `TestimonialCarousel` (interactive)                        | Interaction pattern and testimonial dataset not approved | Trust-content decision and interaction requirements approved  |
| `LeadCaptureForm` (non-contact)                            | Conversion/data flow not defined                         | Form ownership, endpoint, and compliance requirements defined |

---

## Implementation notes for Codex handoff

- Build `Now` planned components first around existing primitives (`Container`, `Section`, `ButtonLink`).
- Keep route files thin by composing sections from reusable components.
- Prefer semantic HTML and token-driven styling from `docs/design-tokens.md`.
- Promote a component to shared only after it is used by at least two routes or sections.
- Keep blog and form component depth intentionally shallow until model/data decisions are explicit.
