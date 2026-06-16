# Content Architecture

Purpose: define the structural content blueprint for each public page so implementation can proceed without inventing messaging.

## Scope and constraints

- This document defines structure, intent, and content responsibilities only.
- It does not provide polished marketing copy.
- It does not introduce CMS integration.
- It aligns to current route map and current milestone boundaries.

## Global content rules

1. Keep page messaging factual, calm, and trust-oriented.
2. Keep claims verifiable and avoid invented facts.
3. Keep CTA language action-focused and specific.
4. Keep section order mobile-first and conversion-aware.
5. Keep reusable section patterns consistent across routes.

---

## Page-level architecture

| Page                      | Page purpose                                               | Target visitor intent                                     | Primary CTA            | Secondary CTA    | Required sections                                                                                    | Trust signals needed                                                                    | Content still unknown                                                                        |
| ------------------------- | ---------------------------------------------------------- | --------------------------------------------------------- | ---------------------- | ---------------- | ---------------------------------------------------------------------------------------------------- | --------------------------------------------------------------------------------------- | -------------------------------------------------------------------------------------------- |
| Home /                    | Explain studio value quickly and direct to next step       | First-time visitor evaluating fit and quality             | Contact studio         | View classes     | Hero, value proposition, benefits, classes preview, instructors preview, trust block, final CTA      | Instructor qualifications summary, testimonial summary, clear contact path              | Final value proposition wording, approved hero media, final testimonial set, final CTA label |
| About /about              | Build credibility and explain studio identity              | Visitor validating professionalism and studio approach    | Contact studio         | View instructors | Studio story, teaching philosophy, studio environment, approach for beginners, CTA                   | Years of experience, certifications summary, studio credentials, photos of actual space | Final founder story, final mission wording, approved studio image set                        |
| Classes /classes          | Clarify offerings and help visitor choose a starting point | Visitor comparing class types and deciding where to begin | Contact studio         | View pricing     | Class category overview, who each class is for, level guidance, session format basics, CTA           | Clear instructor linkage, beginner guidance clarity, transparent class expectations     | Final class list, level definitions, duration details, availability model                    |
| Pricing /pricing          | Remove price uncertainty and support conversion            | Visitor deciding affordability and commitment             | Contact studio         | View classes     | Pricing summary blocks, package or membership structure, introductory offer area, pricing notes, CTA | Transparent inclusions, no hidden-fee language, clear terms summary                     | Final prices, package names, billing cadence, policy details                                 |
| Instructors /instructors  | Humanize expertise and build confidence                    | Visitor evaluating instructor fit and qualifications      | Contact studio         | View classes     | Instructor grid, short bios, specialties, credentials, teaching style notes, CTA                     | Credentials, certifications, years teaching, consistent profile format                  | Final instructor roster, final bios, professional photos, specialties list                   |
| Contact /contact          | Provide the fastest path to inquire or visit               | Visitor ready to ask a question or plan a visit           | Submit inquiry or call | View FAQ         | Contact form, phone and email, location details, map block, visit notes, CTA fallback                | Business contact consistency, map/location clarity, response expectations               | Final address, final phone and email, form fields and consent text, opening hours            |
| FAQ /faq                  | Reduce hesitation and resolve common blockers              | Visitor needs practical answers before committing         | Contact studio         | View classes     | FAQ categories, beginner questions, logistics questions, booking and cancellation basics, CTA        | Clear and consistent policy language, beginner-friendly clarity                         | Final policy answers, cancellation details, late-arrival guidance, private-session rules     |
| Blog index /blog          | Organize educational content and support discovery         | Visitor browsing guidance and studio insights             | Read featured article  | Contact studio   | Featured article area, article list, topic grouping, optional newsletter placeholder, CTA            | Author identity consistency, publish/update dates, clear article purpose                | Real article inventory, category taxonomy, publishing cadence                                |
| Blog article /blog/[slug] | Deliver one useful educational entry                       | Visitor seeking a specific Pilates topic answer           | Read related article   | Contact studio   | Article header, key takeaway summary, body content blocks, related posts area, CTA                   | Author attribution, publication date, medically safe phrasing where relevant            | Editorial standards, author profiles, related-content logic, source citation policy          |

---

## Section inventory guidance

Use these reusable section patterns across pages:

1. Intro section: eyebrow, heading, summary, primary CTA.
2. Content block section: heading, supporting text, optional list or cards.
3. Trust section: credentials, testimonials, proof points, or practical assurances.
4. Conversion section: clear next action and fallback path.

Keep section components composable so route files remain thin.

---

## CTA architecture rules

1. Each page must have one primary CTA aligned to its core intent.
2. Each page should include a secondary CTA for visitors not ready for the primary action.
3. CTA labels should be concrete and avoid generic wording.
4. CTA destinations must map to existing routes during scaffold phase.

Default CTA mapping for current scaffold:

- Primary conversion endpoint: contact path.
- Secondary discovery endpoints: classes, pricing, instructors, FAQ, blog.

---

## Trust-signal architecture rules

Trust signals should be explicit and repeatable, not ad hoc.

Minimum trust categories to support across site:

1. Professional credibility: qualifications, certifications, teaching experience.
2. Service clarity: what is offered, who it is for, what to expect.
3. Practical confidence: pricing transparency, contact clarity, logistics.
4. Social proof: testimonials or outcomes once approved and verified.

Do not publish unverified claims, achievements, or numbers.

---

## Unknown-content tracking model

Track unresolved content per page using these fields:

- **page** (route, e.g., `/classes`)
- **content owner** (who is responsible for final copy/details)
- **status** (unknown / drafted / reviewed / approved)
- **required by milestone** (e.g., Milestone 2 or later)
- **placeholder present** (yes/no: is a scaffold placeholder currently there)
- **blocking implementation** (yes/no: can the page be built without final content)

Suggested status values for tracking:

- unknown: not yet assigned or discussed
- drafted: first version written, awaiting review
- reviewed: stakeholder feedback received, awaiting revision
- approved: final version locked for implementation

Use this model in future content collection tasks to avoid hidden assumptions and keep content ownership explicit.

Example entry format (for reference):

| Page           | Content owner  | Status  | Required by | Placeholder present | Blocking | Notes                                                                          |
| -------------- | -------------- | ------- | ----------- | ------------------- | -------- | ------------------------------------------------------------------------------ |
| `/pricing`     | Studio manager | Unknown | Milestone 2 | Yes                 | No       | Awaiting final pricing from studio; placeholder reflects future structure only |
| `/instructors` | Studio manager | Drafted | Milestone 2 | Yes                 | No       | Roster drafted; awaiting bios and photo approvals                              |

---

## Definition of done for Task 12

This content architecture is complete when:

- every key public page has purpose, intent, CTA, required sections, trust signals, and unknown-content notes,
- structure is ready for implementation without copy invention,
- and no CMS integration assumptions were introduced.
