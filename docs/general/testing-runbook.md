# Testing Runbook — Milestone 2 Blueprint

This document is a planning artifact for Codex. It defines the testing shape and workflow for Milestone 2 without prescribing the final implementation in code.

## Locked test stack

- Unit and integration: Vitest + React Testing Library
- End-to-end: Playwright
- Language and project conventions: TypeScript, ESLint, Prettier

## Folder strategy

- Keep test utilities in `src/test/`.
- Keep collocated unit and integration tests beside the component or page they cover.
- Keep Playwright tests in `e2e/`.
- Keep reusable route or nav fixtures in `src/test/fixtures/` or `e2e/fixtures/` when the need is proven.

## Naming conventions

- Unit and integration tests: `<name>.test.tsx` or `<name>.test.ts`
- E2E tests: `<feature>.spec.ts`
- Prefer names that describe observable behavior, not implementation details.

## Test boundaries

### Unit tests

- Use for isolated components and small pure utilities.
- Target render output, props handling, and simple branching.
- Do not use unit tests for routing or cross-page journeys.

### Integration tests

- Use for page composition, navigation structure, metadata helpers, and component combinations.
- Target the interactions that live between pieces of UI.
- Do not use integration tests as a substitute for full user journeys.

### E2E tests

- Use for the smallest set of critical user paths and public surface checks.
- Target page loading, primary navigation, and indexing endpoints.
- Keep the E2E surface narrow until the test baseline is stable.

## Smoke-test philosophy

- Start with the surfaces in `docs/testing-matrix.md` marked `Now`.
- Prefer renderability, semantic structure, navigation, metadata presence, and basic accessibility checks.
- Keep assertions minimal and user-visible.
- Defer broad regression coverage until the scaffold smoke set is stable.

## Selector guidance

Prefer selectors in this order:

1. Role-based queries for landmarks, buttons, links, headings
2. Label-based queries for form fields
3. Text-based queries for visible copy
4. `data-testid` only when a semantic selector is not practical

Avoid brittle selectors such as CSS class names, positional selectors, or implementation-only IDs.

## Expected commands

The repo should eventually support these commands for the testing milestone:

```bash
npm run test
npm run test:watch
npm run test:e2e
npm run lint
npm run build
npm run typecheck
```

If a script does not exist yet, treat it as a Milestone 2 setup item rather than assuming a final command shape.

## Safe workflow for adding tests

1. Pick one surface from the `Now` list in `docs/testing-matrix.md`.
2. Create the smallest test file that proves the minimum assertion.
3. Keep the test focused on behavior the user can observe.
4. Run the narrowest useful check first.
5. Add neighboring coverage only after the first check is stable.
6. Re-run lint, typecheck, and the relevant test subset before moving on.

## Implementation notes

- The final test setup will likely need shared setup helpers and a small fixture layer.
- Keep those decisions lightweight and local when the milestone begins.
- Do not bake in heavy mocking or broad config assumptions here; those belong in the implementation pass.

## Working rule

This runbook is a blueprint, not a pseudo-implementation. Codex should use it to shape Milestone 2, not to pre-commit exact test code or final config details.
