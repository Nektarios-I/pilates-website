# Environment Matrix

Purpose: document the current environment-variable strategy for local, preview, and production use, based on repository reality.

## Source audit (current repo)

Primary sources used:

- `.env.example`
- `src/config/site.ts`
- `src/lib/metadata.ts`
- `src/app/robots.ts`
- `src/app/sitemap.ts`
- `docs/architecture.md`
- `README.md`

Audit result summary:

- All environment variable reads are centralized in `src/config/site.ts`.
- All currently used env vars are `NEXT_PUBLIC_*` variables (public at build/runtime).
- `.env.example` includes all variables currently used by config.
- No server-only env variables are currently implemented in runtime config.

---

## Variable matrix

| Variable                            | Purpose                                                   | Scope (public/server-only) | Local | Preview | Production | Required or optional                                                                    | Current status                                          | Notes                                                                                                                                           |
| ----------------------------------- | --------------------------------------------------------- | -------------------------- | ----- | ------- | ---------- | --------------------------------------------------------------------------------------- | ------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------- |
| `NEXT_PUBLIC_SITE_URL`              | Base canonical URL used by metadata, sitemap, and robots  | Public                     | Used  | Used    | Used       | Optional in code fallback, effectively required for correct preview/production behavior | Present in `.env.example`; read in `src/config/site.ts` | Fallback is `http://localhost:3000`; must be explicitly set in preview/prod to generate correct canonical URLs in metadata, robots, and sitemap |
| `NEXT_PUBLIC_STUDIO_NAME`           | Brand/studio name used in site metadata and UI labels     | Public                     | Used  | Used    | Used       | Optional                                                                                | Present in `.env.example`; read in `src/config/site.ts` | Fallback is `Corehouse Pilates Studio`                                                                                                          |
| `NEXT_PUBLIC_CONTACT_EMAIL`         | Public contact email shown in site configuration surfaces | Public                     | Used  | Used    | Used       | Optional                                                                                | Present in `.env.example`; read in `src/config/site.ts` | Fallback is `hello@example.com`                                                                                                                 |
| `NEXT_PUBLIC_CONTACT_PHONE`         | Public contact phone shown in site configuration surfaces | Public                     | Used  | Used    | Used       | Optional                                                                                | Present in `.env.example`; read in `src/config/site.ts` | Fallback is `+357-00-000000`                                                                                                                    |
| `NEXT_PUBLIC_INSTAGRAM_URL`         | Public Instagram profile URL                              | Public                     | Used  | Used    | Used       | Optional                                                                                | Present in `.env.example`; read in `src/config/site.ts` | Fallback is `https://instagram.com/example`                                                                                                     |
| `NEXT_PUBLIC_FACEBOOK_URL`          | Public Facebook profile URL                               | Public                     | Used  | Used    | Used       | Optional                                                                                | Present in `.env.example`; read in `src/config/site.ts` | Fallback is `https://facebook.com/example`                                                                                                      |
| `NEXT_PUBLIC_BOOKING_URL`           | Public booking/conversion target URL                      | Public                     | Used  | Used    | Used       | Optional                                                                                | Present in `.env.example`; read in `src/config/site.ts` | Fallback is `/contact`; booking integration remains out of scope for now                                                                        |
| `NEXT_PUBLIC_GOOGLE_MAPS_EMBED_URL` | Public map embed URL for location blocks                  | Public                     | Used  | Used    | Used       | Optional                                                                                | Present in `.env.example`; read in `src/config/site.ts` | Fallback is placeholder Google Maps embed URL                                                                                                   |

---

## Environment usage profile

### Local

- `.env.local` values are expected for realistic local behavior.
- App can still run without env values due defaults in `src/config/site.ts`.

### Preview

- Same variable set should be provided in preview environment.
- `NEXT_PUBLIC_SITE_URL` must be set to the preview host URL (e.g., `https://staging.example.com`) to ensure all canonical URLs, robots, and sitemap entries reference the correct domain during validation.

### Production

- Same variable set should be provided in production environment.
- `NEXT_PUBLIC_SITE_URL` should be explicitly set to the production domain.

---

## Mismatch check: `.env.example` vs docs vs config

### Confirmed matches

- `.env.example` contains every variable currently read in `src/config/site.ts`.
- `docs/architecture.md` states env access should be centralized; current code matches this.
- Metadata/indexing files (`src/lib/metadata.ts`, `src/app/robots.ts`, `src/app/sitemap.ts`) consume `siteConfig`, not direct `process.env` calls.

### Notable gaps (non-blocking)

- No server-only env variables are currently modeled; all current vars are public-facing.
- Because of runtime defaults, none of the current vars are hard-required by code, but `NEXT_PUBLIC_SITE_URL` is operationally critical for correct preview/production canonical/sitemap/robots URLs.

### No current hard mismatch found

- No variable appears in config without `.env.example` coverage.
- No variable appears in `.env.example` that is unused by `src/config/site.ts`.

---

## Current strategy statement

Current strategy is a fallback-friendly public config model:

- keep all active public site settings in `NEXT_PUBLIC_*` variables,
- centralize all env access in `src/config/site.ts` (no direct `process.env` calls elsewhere),
- provide safe defaults for scaffold operation,
- rely on deployment environment values to override defaults for preview/production correctness.

## Future server-only environment variables

When future integrations (analytics, external APIs, CMS, booking systems) require secret or server-only configuration:

- Define new server-only env variables with a `SECRET_` or descriptive prefix (not `NEXT_PUBLIC_`).
- Document them separately in a new section of this matrix or in a dedicated secrets/deployment guide.
- Ensure they are never mixed into `src/config/site.ts` public exports.
- Always consume server-only vars within Next.js API routes, server actions, or build-time context only.
