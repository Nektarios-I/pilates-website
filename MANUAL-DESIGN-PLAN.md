Below is the best one-week plan for your current stage. It is ordered, explicit about what is already locked, and clearly marks what still needs your decision or research before implementation should continue.

What is already locked
These are the things you should treat as fixed constraints for this week unless you consciously decide to change them:

The app is a Next.js App Router marketing site with server-rendering support.

Environment/config access is centralized and should stay centralized, with NEXT_PUBLIC_SITE_URL especially important for canonical, sitemap, and robots correctness.

Public marketing routes already exist conceptually: Home, About, Classes, Pricing, Instructors, Contact, FAQ, Blog, and Blog article.

Route-level content should stay factual, calm, trust-oriented, mobile-first, and CTA-driven, with no invented claims.

Reusable section patterns are already defined: intro section, content block section, trust section, conversion section.

The project should remain portable beyond Vercel; do not hardcode provider-specific assumptions into app logic.

Metadata ownership stays centralized in helpers; route files should only provide route-specific title/description inputs.

Testing foundation already exists and should be preserved, not bypassed.

Brand direction is not yet approved, so visual tuning remains provisional and components must stay easy to restyle.

What still needs your clarification
These are not locked and should be collected this week:

Final brand direction choice: Refined Minimalist, Warm Elegance, Strong Modern, or a deliberate hybrid.

Final class list, levels, durations, availability model, and whether there are private sessions, intro offers, or reformer/mat distinctions.

Final instructor roster, bios, specialties, certifications, and photo availability.

Final pricing structure, package names, billing cadence, intro offer, and policy notes.

Final contact details: address, email, phone, map embed, hours, and response expectations.

FAQ policy content: cancellations, lateness, beginner guidance, private sessions, booking rules.

Approved trust signals: verified qualifications, years of experience, verified testimonials, real space photos.

Final hero media direction and whether the homepage should lean more community, premium, or modern-performance.

One-week action plan
Day 1 — Stabilize and audit
Goal: make the repo and current milestone stable so the rest of the week is based on clean ground.

Tasks
Work only from the normalized lowercase Windows path.

Ensure .env.local exists and includes a correct local value for NEXT_PUBLIC_SITE_URL=http://localhost:3000.

Re-run the core checks locally:

npm run lint

npm run typecheck

npm run test

npm run test:e2e

npm run build

Run npm run dev and manually inspect:

homepage load,

header/footer,

CTA links,

mobile viewport,

tablet viewport,

desktop viewport.

Review the homepage-shell diff and the component notes doc created by Codex.

Commit any uncommitted Milestone 2/homepage-shell work only if local checks pass.

Output of Day 1
You should end Day 1 with:

clean working tree,

stable local preview,

verified current homepage shell,

no uncertainty about whether the current baseline passes.

Locked decisions to follow
Do not start redesigning components yet.

Do not add new dependencies this day.

Do not touch CMS, booking, analytics, or backend work.

Day 2 — Gather business content inputs
Goal: collect all missing business facts that block clean page implementation later.

Tasks
Create a structured content-gathering checklist for the client/studio. Organize it by page.

Home
Ask for:

approved value proposition,

approved hero image/video direction,

final CTA label,

2–4 verified trust points,

approved testimonials if available.

About
Ask for:

founder/story summary,

teaching philosophy,

beginner approach,

studio environment description,

credentials/years of experience,

real studio photos.

Classes
Ask for:

class names,

short description for each,

beginner/intermediate/advanced level guidance,

duration,

format,

who it is for,

any equipment used,

whether intro classes exist.

Pricing
Ask for:

package names,

price points,

billing cadence,

intro offer,

inclusions/exclusions,

cancellation/payment policy summary.

Instructors
Ask for:

full names,

specialties,

short bios,

certifications,

years teaching,

photos,

preferred display order.

Contact
Ask for:

final phone,

email,

address,

opening hours,

parking/location notes,

map embed link,

response-time expectation.

FAQ
Ask for:

beginner questions,

what to wear,

what to bring,

lateness policy,

cancellation policy,

private-session policy,

booking basics.

Output of Day 2
You should produce one document or note with sections:

approved,

drafted,

unknown,

blocked by client.

Important rule
Do not let Copilot invent any of this. This must come from you/client inputs, because the content architecture explicitly avoids invented messaging and unknown-content tracking exists to prevent hidden assumptions.

Day 3 — Decide brand/design direction
Goal: lock the visual direction enough that future styling work has a stable target.

Tasks
Review the available brand directions and choose one:

Refined Minimalist,

Warm Elegance,

Strong Modern,

or a clearly described hybrid.

For the chosen direction, write down:

target audience,

desired emotional tone,

typography preference,

color preference,

imagery preference,

what the site must not feel like.

Decision questions you must answer
Should the studio feel premium and calm, warm/community-oriented, or modern/performance-focused?

Should the homepage emphasize transformation, professionalism, or welcome/accessibility?

Should imagery prioritize sharp motion, warm human connection, or minimal refined space?

Output of Day 3
Create a short decision note with:

chosen direction,

why it was chosen,

non-negotiables,

things to avoid,

open questions.

Locked guidance
Do not copy reference sites directly. Use them only for inspiration, because the brand direction docs are intended to guide tokens, spacing, imagery, and tone rather than produce imitation.

Day 4 — Prepare structured content modules
Goal: define the data shape for the next implementation milestone before writing more UI.

Tasks
Plan the content models for:

classes,

instructors,

pricing,

FAQs,

trust signals,

contact data.

Even if final content is missing, define the correct structure now using placeholder-safe entries.

Suggested data model fields
Classes
slug

name

summary

whoItsFor

level

duration

format

ctaLabel

ctaHref

status (placeholder, drafted, approved)

Instructors
slug

name

role

shortBio

specialties

credentials

yearsExperience

photo

status

Pricing
planName

summary

priceDisplay

billingCadence

includes

notes

ctaLabel

ctaHref

status

FAQ
category

question

answer

status

Trust signals
type (credential, testimonial, practical-assurance, service-clarity)

label

detail

verified

status

Contact
phone

email

address

hours

mapEmbedUrl

instagramUrl

facebookUrl

bookingUrl

status

Output of Day 4
A written schema draft you can later hand to Codex/Copilot. This is important because it keeps presentation separate from content, which the architecture and component inventory both strongly support.

Day 5 — Manual UX and component review
Goal: review the current homepage implementation as an engineering system, not just visually.

Tasks
Inspect the current homepage components and answer:

Is page.tsx thin?

Are sections reusable?

Is any data hardcoded inside presentation components?

Are CTA paths using existing routes only?

Is there any unnecessary client-side logic?

Are props simple and descriptive?

Would a new design system be able to restyle these components without major rewrites?

Use the component documentation Codex created and compare it to actual files.

What to look for
No direct env reads in components.

No hidden browser side effects.

No duplicated layout wrappers.

No styling decisions that prevent future redesign.

No giant “god component.”

No business facts embedded where a data module should own them.

Output of Day 5
Create a review checklist with three buckets:

keep as-is,

refactor soon,

safe to defer.

Day 6 — Design validation prep
Goal: prepare the non-production design validation work so future styling is deliberate rather than accidental.

Tasks
Read the design token and design test page specifications carefully.
Decide whether the next visual milestone should be:

token implementation first,

or page implementation first with light styling and token work immediately after.

Given your current status, I recommend:

content models next,

then design test page,

then broader page styling.

That sequence is safer because the design docs explicitly position the design test page as the place to validate typography, color, spacing, shadows, radius, and component patterns before full implementation.

Prepare inputs for that milestone
chosen brand direction,

likely font pair direction,

rough color family,

hero imagery style,

CTA emphasis style,

accessibility constraints.

Output of Day 6
A small “design-ready inputs” note that can later feed the design-token/design-test implementation milestone.

Day 7 — Milestone planning for next Codex window
Goal: convert this week’s decisions into the exact next build sequence.

Tasks
Prepare the next three milestones in order.

Milestone A — Content modules
Implement typed content/config modules for:

classes,

instructors,

pricing,

FAQs,

contact,

trust signals.

Why first:

homepage previews can read from them,

future pages can reuse them,

redesign becomes easier,

no invented content needs to live inside UI.

Milestone B — Classes and Instructors pages
Implement the two next highest-value pages using the shared section system and new content modules.

Why second:

the homepage already previews them,

they are trust/conversion critical,

they are less blocked than full pricing/contact backend behavior.

Milestone C — Design test page + token validation
Implement the non-production design page and verify tokens/components against the chosen brand direction.

Why third:

by then you will have real component surfaces to test visually,

you can validate reusable primitives before styling every route.

Output of Day 7
A single prioritized milestone note:

Content modules

Classes + Instructors

Design test page

Pricing + Contact

FAQ

SEO/metadata refinement

CI/deployment hardening

Daily command routine
Use this every day you touch code:

bash
npm run dev
npm run lint
npm run typecheck
npm run test
npm run build
Use these when relevant:

npm run test:e2e for route/navigation checks.

npm run start after a production build for smoke checks.

Things you should not do this week
Do not do these yet:

Do not add CMS integration.

Do not add booking backend logic.

Do not add analytics.

Do not add schema/JSON-LD yet unless content is approved.

Do not finalize OG assets before brand direction is approved.

Do not deeply style every page before the design direction and token validation are settled.

Do not let Copilot generate final marketing copy from thin air.

Week-end definition of success
At the end of the week, success means:

the current repo remains green locally,

business-content unknowns are documented,

brand direction is chosen or narrowed to one clear option,

structured content model shapes are prepared,

homepage components are reviewed for extensibility,

the next three milestones are ready to execute with minimal ambiguity.

Highest-priority unknowns you must resolve
These are the most important missing inputs:

Brand direction choice.

Final classes structure.

Final instructor roster and credentials.

Final pricing model.

Final contact details and map/embed URLs.

Approved trust signals/testimonials.

Hero media direction.

If you want, I can turn this into a copy-pasteable checklist document you can put directly into docs/next-week-plan.md.
