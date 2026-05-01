# Review Playbook

## Purpose

Use this playbook after a non-trivial implementation or before accepting a generated change.

The review step should catch architectural drift, regressions, unnecessary complexity, and weak verification before the change is considered complete.

---

## Review principles

- Review against repository rules, not personal improvisation.
- Prefer identifying concrete issues over vague style criticism.
- Focus on risk, maintainability, correctness, and fit with the repo architecture.
- Highlight what should remain unchanged when it is already good.

---

## Required review inputs

Before reviewing, inspect:

- `AGENTS.md`
- the relevant docs in `docs/`
- the modified files
- the test changes
- the diff or uncommitted changes

If the task was supposed to follow a prior plan, compare the implementation against that plan.

---

## Review checklist

Check for:

### Architecture

- Does the code follow the documented folder structure?
- Is business logic kept out of route files where possible?
- Are components appropriately scoped?
- Is shared UI actually reusable?
- Are unnecessary client components introduced?

### Maintainability

- Are files too large?
- Is logic duplicated?
- Are names clear?
- Are abstractions justified?
- Were unnecessary dependencies added?

### Accessibility and UX

- Is semantic HTML used?
- Are interactive elements likely keyboard accessible?
- Are headings and landmarks sensible?
- Are accessible names likely present?
- Does placeholder content remain explicit and believable?

### SEO / metadata

- Are important public pages missing metadata considerations?
- Are page names and structure aligned with the site map?
- Are public routes consistent with the content goals?

### Testing

- Were appropriate tests added or updated?
- Are tests behavior-oriented?
- Were meaningful checks run?
- Are important gaps clearly acknowledged?

---

## Review output format

Return exactly:

1. **Overall assessment**
2. **What is good and should remain**
3. **Problems found**
4. **Why they matter**
5. **Exact files to fix**
6. **Recommended fix order**
7. **Verification to rerun after fixes**

Be concrete.
Prefer actionable feedback over generic commentary.

---

## Severity guidance

Classify issues informally as:

- critical
- important
- minor

Use critical only for correctness, security, major architecture violations, or major regression risk.

---

## Done when

A review task is done when:

- the implementation has been checked against repo rules,
- meaningful risks are identified clearly,
- the next fix order is obvious,
- and the team can decide whether to accept or revise the change confidently.
