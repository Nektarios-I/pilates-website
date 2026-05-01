# Testing Playbook

## Purpose

Use this playbook whenever a task changes behavior, routing, metadata, UI structure, or critical user flows.

Testing in this repository should validate user-visible behavior and reduce regression risk without becoming brittle.

---

## Testing principles

- Test behavior, not implementation details.
- Prefer readable, deterministic tests.
- Use accessible selectors first.
- Keep test coverage strongest on critical user journeys.
- Avoid fragile selectors and over-mocking.

---

## Testing stack

Use:

- React Testing Library for unit and integration behavior tests
- Playwright for end-to-end tests

If test tooling is not fully configured yet, implement the smallest clean setup needed.

---

## Test selection guide

Add or update **RTL tests** when:

- a component renders important content,
- a CTA appears or changes,
- navigation structure changes,
- a section has meaningful conditional behavior,
- a form validates input,
- reusable UI primitives are introduced.

Add or update **Playwright tests** when:

- routing changes,
- a critical page is added,
- the main CTA flow changes,
- shared navigation changes,
- there is a meaningful cross-page user journey.

---

## Selector rules

In RTL, prefer:

1. `getByRole`
2. `getByLabelText`
3. `getByText` when appropriate

In Playwright, prefer:

- role-based selectors
- accessible names
- stable, meaningful locators

Avoid brittle CSS selectors unless no better option exists.

---

## Verification process

For tasks with behavior changes:

1. identify which tests should change,
2. implement or update tests,
3. run the smallest relevant test set first,
4. expand to broader checks if needed,
5. report clearly what passed and what remains pending.

When available, use:

- `npm run test`
- `npm run test:e2e`
- `npm run build`

Also run `npm run lint` for meaningful UI or route changes.

---

## Minimum expectations by task type

### Small component change

- relevant RTL test
- lint if possible

### Shared layout or navigation change

- RTL coverage
- Playwright smoke coverage
- lint and build if possible

### New page scaffold

- at least one render test or navigation test
- metadata consideration
- route smoke check if e2e exists

### Critical CTA or contact flow

- RTL behavior tests
- Playwright end-to-end test

---

## Testing output format

Return:

1. **Behavior under test**
2. **Tests added or updated**
3. **Commands run**
4. **Results**
5. **Known gaps**
6. **Recommended follow-up**

---

## Done when

A testing task is done when:

- the important behavior is covered appropriately,
- the chosen tests are stable and readable,
- checks were run or clearly reported as blocked,
- and the repository has more confidence than before the change.
