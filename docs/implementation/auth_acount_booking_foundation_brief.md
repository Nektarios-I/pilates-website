# Pilates Studio Auth, Account Management, and Booking Foundation Brief

## Purpose

This document defines the intended long-term direction for authentication, account management, package ownership, booking eligibility, and booking operations for the Pilates studio website. It is a source-of-truth planning brief for implementation scaffolding and early milestones, not a requirement to build every business feature immediately.

The implementation should proceed in bounded phases. Early milestones should create a correct, maintainable foundation that later work can build on cleanly.

## Product model

The product has two major surfaces:

1. **Public marketing surface**
   - Anyone can browse the website without logging in.
   - Public pages include the homepage and the informational pages such as classes, pricing, instructors, contact, and FAQ.
   - Public users can view offerings and understand how the studio works.

2. **Protected member surface**
   - Users must have an approved account and be signed in to buy a package or book a session.
   - Protected areas include account/profile, package summary, booking summary, and future package purchase and booking flows.

This split is intentional. Authentication, authorization, package ownership, and booking rules must remain separate concerns even when the UI brings them together.

## Auth and infrastructure decision

Use the following stack as the default architecture direction:

- **Auth:** Supabase Auth
- **Database:** Supabase Postgres
- **App integration:** Next.js App Router with SSR-aware auth/session handling
- **Authorization model:** role-aware access with controlled account creation
- **Session behavior:** persistent login after successful authentication

Implementation should follow current official Supabase guidance for Next.js SSR and avoid outdated helper patterns if the official docs recommend a newer package or setup style.

## Membership and account policy

The studio does **not** allow fully open public signup for booking-capable accounts.

Rules:

- Browsing is public.
- Buying a package requires login.
- Booking requires login.
- Booking also requires an eligible active package/subscription with remaining usable entitlement.
- Accounts are owner-approved, invite-only, or staff-created.
- Unknown users should not be silently created through public passwordless flows.

The implementation direction should preserve controlled membership from day one, even if some onboarding details are deferred.

## Login UX policy

### Clients / members

Preferred login UX:

- Primary: magic link email login
- Possible future fallback: email/password
- Optional future addition: email OTP

Clients should get the lowest-friction login experience that still respects controlled membership.

### Staff roles

For owner, admin, and instructor roles:

- Primary: email/password
- Persistent sessions should still be supported

This split is intentional because staff users usually tolerate password-based login better, while clients benefit from simpler access.

## Roles

The system should be designed around the following roles:

- `client`
- `instructor`
- `admin`
- `owner`

### Role expectations

- **client**
  - can view own account
  - can view own package/credit status
  - can view own upcoming bookings
  - can later buy packages
  - can later book eligible sessions

- **instructor**
  - can later view instructor-specific schedule information
  - can later view their assigned sessions and class rosters if enabled

- **admin**
  - can manage members, packages, sessions, and bookings
  - can support onboarding and account activation workflows

- **owner**
  - has top-level studio control
  - can perform administrative tasks and ownership-level management

Implementation should avoid hard-coding assumptions that every user has exactly one fixed permanent role forever. The first schema can still be simple, but it should not make future role evolution difficult.

## Onboarding and account creation model

The intended onboarding direction supports both of these controlled flows:

### Flow A — staff-created member account

- Staff creates a member record or account entry.
- The member later receives an activation or login link.
- The member completes the first sign-in.
- The member remains signed in through persistent session handling.

### Flow B — invite-based approved access

- Staff/admin sends an invite to an approved email address.
- The user completes activation through a secure auth link or password setup flow.
- The account becomes active and usable.

These flows should both remain possible in the architecture. If the first milestone only scaffolds one of them fully, the code and TODO hooks should still leave room for the other.

### Explicitly not desired for V1

- open public self-signup for booking-capable accounts
- social login
- SMS login
- uncontrolled magic-link login that auto-creates unknown users

## Protected actions policy

The following actions must be treated as protected business actions:

- buying a package
- accessing package/credit details
- booking a session
- viewing own bookings
- cancelling a booking
- accessing member dashboard/account area

Public users may browse the site, but must not be allowed to perform protected member actions unless authenticated and authorized.

## Account area vision

The long-term account area should support these member-facing sections:

- account overview
- profile basics
- package summary
- remaining credits / eligibility summary
- upcoming bookings
- booking history or recent booking activity
- sign out

Possible later additions:

- package purchase history
- saved preferences
- onboarding completion status
- waiver / consent status
- notifications

The first auth/account milestone should build the protected foundation and basic structure, not the full finished dashboard.

## Book page vision

The `/book` page is an internal page.

Eventually it should become the booking entry point for authenticated members. The page should later support:

- authenticated access checks
- package eligibility checks
- session discovery
- booking actions
- booking confirmation
- cancellation flow
- clear handling for users who are logged out or ineligible

Before full booking logic is implemented, the `/book` page should remain structurally ready for these checks and actions.

## Booking rules

Booking must be enforced on the server side, not only in the UI.

A booking should only succeed if all required conditions are true:

- the user is authenticated
- the user account is active
- the user has an allowed role for booking, normally `client`
- the user has at least one active package or valid entitlement
- the relevant package/subscription has remaining usable appointments or credits
- the session exists and is bookable
- the session has remaining capacity
- any timing, cutoff, or cancellation constraints are satisfied

This logic may be implemented in a later milestone, but the architecture must reserve clean hooks for it.

## Data model direction

The initial schema foundation should support the following core tables or equivalents.

### `profiles`

Purpose:

- one row per auth user
- application-level profile and membership state

Suggested fields:

- `id` (same as auth user id)
- `email`
- `full_name`
- `phone`
- `status` (`invited`, `active`, `suspended`)
- `created_at`
- `updated_at`

### `user_roles`

Purpose:

- separate role assignment from the profile row
- allow future flexibility if role handling expands

Suggested fields:

- `id`
- `user_id`
- `role` (`client`, `instructor`, `admin`, `owner`)
- `created_at`

### `packages`

Purpose:

- define sellable/assignable studio offerings

Suggested fields:

- `id`
- `name`
- `package_type` (for example `monthly`, `credit_pack`, `intro_offer`)
- `credits_total`
- `validity_days`
- `price`
- `is_active`
- `created_at`

### `user_packages`

Purpose:

- track which package a specific user owns or has been assigned

Suggested fields:

- `id`
- `user_id`
- `package_id`
- `credits_remaining`
- `starts_at`
- `expires_at`
- `status` (`active`, `expired`, `used_up`, `cancelled`)
- `created_at`

### `sessions`

Purpose:

- define bookable Pilates sessions/classes

Suggested fields:

- `id`
- `title`
- `instructor_id`
- `starts_at`
- `ends_at`
- `capacity`
- `session_type`
- `location`
- `status`
- `created_at`

### `bookings`

Purpose:

- track each booking relationship between a user and a session

Suggested fields:

- `id`
- `user_id`
- `session_id`
- `user_package_id`
- `status` (`booked`, `cancelled`, `waitlisted`, `attended`, `no_show`)
- `created_at`
- `updated_at`

### Optional later table

#### `activity_logs` or `audit_logs`

Purpose:

- record administrative and important operational actions

This can be deferred unless the current milestone naturally introduces it cleanly.

## RLS and authorization direction

Authorization should not rely only on client-side checks.

The system should be designed to support Row Level Security and ownership-aware access patterns. At minimum, the architecture should support:

- user-specific access to own profile/account data
- user-specific access to own packages
- user-specific access to own bookings
- controlled access to staff/admin surfaces later
- server-enforced booking checks later

The implementation should follow safe Supabase/Postgres access patterns and avoid assuming the frontend alone is the source of truth.

## Milestone strategy

The implementation should proceed in this order.

### Milestone A — Auth/account foundation

Build now:

- Supabase integration
- environment variables and config structure
- SSR/session-aware auth utilities
- login page foundation
- protected account area foundation
- role-aware structure
- initial schema or migration foundation
- TODO hooks for later booking and onboarding work

Do **not** fully implement booking or full admin behavior yet.

### Milestone B — Controlled onboarding flows

Build after the auth foundation:

- invite-only / staff-created account flow
- activation/approval flow
- controlled member onboarding behavior

### Milestone C — Package gating and account enrichment

Build after onboarding:

- package summary logic
- eligibility summary
- account visibility into owned package state
- gating logic that determines whether booking can proceed

### Milestone D — Booking MVP

Build after package gating:

- session list/calendar structure
- booking action
- booking confirmation state
- cancellation flow
- server-side eligibility enforcement
- credit/package usage linkage

### Milestone E — Admin and instructor expansion

Build later:

- instructor schedule tools
- admin management surfaces
- package/session management
- operational dashboards

## Implementation principles

The implementation should follow these principles:

- prefer official documentation-backed patterns
- do not guess when critical details are unclear
- report blockers or ambiguities explicitly
- keep foundations minimal but correct
- keep the structure easy to extend
- avoid premature UI polish work during architecture milestones
- avoid mixing marketing-page styling work into auth/database milestones
- use clear TODO hooks for deferred business logic
- preserve maintainability and separation of concerns

## Notes for the current auth foundation milestone

For the immediate next milestone, it is appropriate to include the **actual Supabase SQL migration files now**, provided the repo is ready to adopt a real database foundation.

This is recommended because:

- auth/account logic depends on a real schema direction
- roles, profiles, packages, sessions, and bookings should not stay only as vague notes
- later booking and account work will be cleaner if the schema foundation already exists
- migration files are part of the correct technical foundation, not an optional polish task

However, the milestone should still stay bounded:

- create the first real migration/schema foundation
- do not fully implement all business operations yet
- avoid speculative over-modeling if a field or rule is not yet needed

If the current repo has no established Supabase or migration workflow yet, the implementation should create the smallest clean structure necessary and explain it clearly.

## Explicit instructions for the implementing agent

When implementing this architecture:

1. Read the current official Supabase docs relevant to Next.js SSR, auth, passwordless flows, and RLS.
2. Inspect the existing repo before choosing file locations or integration patterns.
3. Do not guess when a structural decision is ambiguous; report it.
4. Keep public browsing open and protected actions gated.
5. Do not introduce open public signup.
6. Keep `/book` as the later booking entry point for authenticated, eligible users.
7. Build the auth/account foundation first.
8. Include real migration/schema files now if the repo can support them cleanly.
9. Defer full booking logic to a later milestone.
10. Verify lint, typecheck, build, and critical route behavior before returning.
