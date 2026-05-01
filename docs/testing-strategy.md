# Testing Strategy

## Goal

Build confidence in the website through fast feedback, stable automated tests, and a testable architecture.

## Principles

- Test important user behavior.
- Prefer simple, deterministic tests.
- Keep tests maintainable and readable.
- Use different test layers for different risks.
- Avoid relying on implementation details.
- Treat critical user journeys as release blockers.

## Testing stack

- React Testing Library for component and integration tests
- Jest or Vitest for test runner setup
- Playwright for end-to-end tests

## Locked testing decisions

### Unit / integration test runner

The locked runner for unit and integration testing is **Vitest** with React Testing Library.

Why this is locked:

- it is a strong fit for a modern TypeScript setup,
- it keeps the setup lightweight,
- and it matches the intended project direction.

### End-to-end testing

The locked E2E runner is **Playwright**.

### First testing milestone

Testing should not be fully implemented before the foundation scaffold exists.

For Milestone 1:

- define the testing strategy,
- lock the test runners,
- and prepare the repository so testing setup can be added immediately after the scaffold.

For Milestone 2:

- add the actual Vitest + React Testing Library setup,
- add the Playwright setup,
- add initial smoke tests.

## Test layers

### 1. Unit / component tests

Use these for:

- reusable UI components
- isolated behavior
- conditional rendering
- CTA presence
- accessibility-relevant output
- small pure utilities

Examples:

- Button renders correct variant
- Header shows primary CTA
- FAQ accordion toggles correctly
- Pricing cards render expected plans

### 2. Integration tests

Use these for:

- page section composition
- navigation behavior
- forms with validation
- interactions between components
- metadata helper behavior where practical

Examples:

- Home page renders hero, benefits, and CTA
- Navigation contains expected links
- Contact form shows validation messages
- Classes page renders class categories correctly

### 3. End-to-end tests

Use these for the most important user journeys.

Critical initial E2E flows:

- Visitor lands on home page and sees main CTA
- Visitor navigates from home to classes
- Visitor navigates from pricing to contact
- Contact form page loads and basic submission path is validated when implemented
- Key public pages return successful responses

## TDD expectations

Use test-driven development for non-trivial features whenever practical.

Recommended cycle:

1. Define behavior
2. Write failing test
3. Implement minimal code
4. Refactor
5. Keep tests green

## What to test first

The first automated tests should cover:

- app shell rendering
- homepage render
- header navigation
- primary CTA visibility
- one Playwright smoke test covering home page load and navigation

## What not to over-test

Do not over-test:

- Tailwind class strings unless behavior depends on them
- framework internals
- trivial markup with no business value
- implementation details such as internal state shape when user behavior is the real concern

## Test naming

- Use descriptive test names based on behavior
- Prefer “renders”, “shows”, “navigates”, “submits”, “validates”, “displays”
- Group tests by feature or component responsibility

## Selector strategy

In RTL:

- prefer `getByRole`
- then `getByLabelText`
- then `getByText` where appropriate

In Playwright:

- prefer role selectors and accessible names
- avoid brittle CSS selectors when possible

## Accessibility and testing

Good accessibility supports better testing.
Use:

- semantic headings
- labels
- buttons with clear names
- links with meaningful text
- landmarks where appropriate

## Minimum quality gate before merge

Every meaningful PR should pass:

- lint
- typecheck
- unit/integration tests
- build

For important UI or routing changes, also run:

- Playwright smoke tests

## Initial test plan

Phase 1:

- homepage render test
- header navigation test
- footer render test
- basic smoke E2E test

Phase 2:

- classes page render test
- pricing page render test
- contact form validation test
- FAQ interaction test

Phase 3:

- blog route tests
- metadata-related checks where useful
- regression coverage for reused sections

## CI expectations

CI should run on pull requests and pushes to the main branch.
The pipeline should include:

- dependency install
- lint
- typecheck
- unit/integration tests
- production build
- Playwright tests when configured

## Definition of done

A task is not fully done unless:

- code is readable,
- architecture rules are respected,
- tests are added or updated when needed,
- and the change passes automated validation.
