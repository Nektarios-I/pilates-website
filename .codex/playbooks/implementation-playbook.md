# Implementation Playbook

## Purpose

Use this playbook when implementing a planned change in this repository.

The goal is not just to generate code.
The goal is to produce code that fits the documented architecture, remains maintainable, and can be verified safely.

---

## Required inputs

Before implementing, read:

- `AGENTS.md`
- the relevant docs in `docs/`
- the current task plan
- the existing related source files

If there is no prior plan for a complex task, create a short plan first.

---

## Implementation process

1. Reconfirm the scope of the task.
2. List the files you intend to create or modify.
3. Implement the smallest clean version first.
4. Keep route files thin and delegate structure/logic appropriately.
5. Extract reusable UI when repetition becomes obvious.
6. Add or update tests for user-visible behavior.
7. Run the relevant checks.
8. Review the diff for:
   - oversized files
   - architecture drift
   - duplicated logic
   - unnecessary client components
   - missing accessibility considerations
   - weak naming
9. Summarize the result clearly.

---

## Architecture guardrails

Always follow these rules:

- Use Next.js App Router.
- Prefer Server Components by default.
- Use Client Components only when necessary.
- Keep `src/app` focused on routing and composition.
- Keep reusable UI in `src/components`.
- Keep domain modules in `src/features`.
- Keep configuration in `src/config`.
- Keep utilities in `src/lib`.
- Keep tests close to behavior and shared setup in `src/test`.

Do not:

- place heavy logic directly in route files,
- create giant monolithic components,
- invent unapproved APIs or integrations,
- add dependencies without a clear need,
- introduce styling chaos or inconsistent naming.

---

## Coding expectations

- Use TypeScript clearly and explicitly.
- Prefer readable names over short names.
- Use semantic HTML.
- Keep placeholder copy explicit and believable.
- Avoid lorem ipsum.
- Prefer boring, reliable patterns.
- Add TODOs only where the missing information is real and known.

---

## Verification expectations

Run the relevant verification commands when available:

- `npm run lint`
- `npm run test`
- `npm run test:e2e`
- `npm run build`

If a command cannot be run because setup is incomplete, say exactly what is missing.

---

## Implementation output format

At the end, return:

1. **Files changed**
2. **What was implemented**
3. **Tests added or updated**
4. **Checks run**
5. **Assumptions / limitations**
6. **Recommended next task**

Keep the report concise and specific.

---

## Done when

An implementation task is done when:

- the requested behavior exists,
- the code fits the repo structure,
- relevant tests exist or are explicitly deferred,
- relevant checks were run or clearly reported,
- and the resulting change is reviewable.
