# Content Model

## Purpose

This document defines the initial content structure for the Corehouse Pilates Studio website.

The goal is to keep content easy to update, easy to replace, and easy to migrate later to a CMS if needed.

## Content strategy

At the initial stage, content should be simple, structured, and replaceable.

Use these rules:

- Keep content separate from layout assumptions whenever practical.
- Prefer structured objects or clearly isolated content blocks over hardcoded content spread throughout many components.
- Use believable placeholder content when final client content is not yet available.
- Do not invent real-world facts that have not been provided by the client.

## Initial content source approach

Phase 1:

- Static content stored locally in code-friendly structures.
- Content should be easy to move later into a CMS or data layer.
- No CMS dependency is required in the first milestone.

Phase 2:

- If needed later, migrate structured content into a headless CMS without changing the route strategy.

## Global site content

### Site settings

Represents site-wide identity and shared metadata.

Suggested fields:

- studioName
- siteUrl
- defaultTitle
- defaultDescription
- contactEmail
- contactPhone
- socialLinks
- bookingUrl
- address
- mapEmbedUrl

### Navigation item

Represents a primary or secondary navigation link.

Suggested fields:

- label
- href
- kind
- order

### CTA config

Represents a reusable call-to-action definition.

Suggested fields:

- label
- href
- variant
- context

## Home page content

### Hero content

Suggested fields:

- eyebrow
- title
- description
- primaryCta
- secondaryCta
- heroImage

### Benefits section

Suggested fields:

- title
- intro
- items[]

Each item:

- title
- description
- iconKey

### Classes preview

Suggested fields:

- title
- intro
- featuredClassIds[]
- sectionCta

### Instructors preview

Suggested fields:

- title
- intro
- featuredInstructorIds[]
- sectionCta

### Testimonials preview

Suggested fields:

- title
- intro
- testimonialIds[]
- sectionCta

### Final CTA section

Suggested fields:

- title
- description
- primaryCta
- secondaryCta

## Domain content types

### Class offering

Represents a Pilates class or service.

Suggested fields:

- id
- slug
- name
- shortDescription
- fullDescription
- audience
- level
- format
- duration
- image
- featured
- order

Examples of likely future entries:

- reformer pilates
- mat pilates
- beginner classes
- private sessions

### Pricing plan

Represents a visible price option or package.

Suggested fields:

- id
- slug
- name
- summary
- priceDisplay
- billingType
- features[]
- featured
- order
- cta

### Instructor profile

Represents an instructor shown on the site.

Suggested fields:

- id
- slug
- fullName
- role
- shortBio
- fullBio
- specialties[]
- qualifications[]
- image
- featured
- order

### Testimonial

Represents a client trust signal.

Suggested fields:

- id
- quote
- clientName
- clientContext
- featured
- order

### FAQ item

Represents one FAQ entry.

Suggested fields:

- id
- question
- answer
- category
- order

### Blog post

Represents a future article.

Suggested fields:

- id
- slug
- title
- excerpt
- body
- coverImage
- author
- publishedAt
- updatedAt
- seoTitle
- seoDescription
- tags[]
- featured

### Contact / studio info

Represents practical studio contact information.

Suggested fields:

- studioName
- email
- phone
- addressLine1
- addressLine2
- city
- postalCode
- country
- mapEmbedUrl
- openingHours[]
- parkingNotes
- visitNotes

## Initial placeholder policy

Until real client content is available:

- use explicit placeholder copy,
- keep content realistic,
- avoid lorem ipsum,
- and make replacements easy.

## Initial implementation recommendation

In the first milestone, structure content so that page sections can consume typed content objects cleanly.
Do not over-engineer a CMS abstraction yet.

## Definition of success

The content model is successful if:

- content is easy to replace,
- page sections do not depend on hardcoded final copy,
- and future migration to a CMS can happen without major route rewrites.
