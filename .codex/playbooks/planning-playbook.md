# Planning Playbook

## Purpose

Use this playbook before any non-trivial implementation task.

This repository values:

- maintainability
- separation of concerns
- modularity
- accessibility
- SEO
- testability
- deployment portability

Planning is mandatory when the task is:

- multi-file
- ambiguous
- architectural
- testing-related
- likely to affect routing or shared components
- likely to affect project structure

---

## Required inputs

Before planning, read:

- `AGENTS.md`
- `README.md`
- `.github/copilot-instructions.md`
- `docs/product-requirements.md`
- `docs/site-map.md`
- `docs/architecture.md`
- `docs/testing-strategy.md`
- `docs/ui-architecture.md`
- `docs/responsive-strategy.md`
- `docs/engineering-principles.md`
- `docs/project-ledger.md`
- `docs/decision-log.md`

Also read any files directly related to the task.

If critical files are missing, say so explicitly before proposing implementation.

---

## Planning process

1. Restate the task in one short paragraph.
2. Identify the relevant existing files and folders.
3. List assumptions and unknowns.
4. Propose the smallest clean file plan that fits the architecture.
5. Identify reusable components or utilities that should be created instead of duplicating logic.
6. Identify what tests should exist for the task.
7. Identify any SEO, accessibility, or content implications.
8. Identify risks before coding.

Do not start editing code during the planning step unless the user explicitly asks for implementation in the same task.

---

## Planning output format

Return exactly these sections:

1. **Task summary**
2. **Relevant repo context**
3. **Assumptions / unknowns**
4. **Proposed file changes**
5. **Implementation sequence**
6. **Testing plan**
7. **Risks / review points**
8. **Recommended first edit**

Keep the plan concrete and repository-specific.

---

## Quality rules

- Prefer modifying existing structure over inventing a parallel structure.
- Prefer small cohesive files over large files.
- Keep route files thin.
- Do not place business logic in `page.tsx` when it belongs in a feature module or shared component.
- Prefer server-first solutions.
- Call out any need for a client component explicitly.
- Call out any placeholder content explicitly.
- Avoid hidden assumptions.

---

## Done when

A planning task is done when:

- the task has been clarified,
- the relevant files are identified,
- the implementation sequence is concrete,
- testing expectations are listed,
- and the plan is small enough to execute safely in the next step.
