Read and follow:

- `AGENTS.md`
- `README.md`
- `docs/architecture.md`
- `docs/testing-strategy.md`
- `.codex/playbooks/review-playbook.md`

Task:
Review the current repository changes before they are accepted.

Goal:
Identify architectural drift, weak verification, testing gaps, unnecessary complexity, accessibility issues, and opportunities to tighten the implementation.

Context:
This review should evaluate the current changes against the documented project rules, not against generic preferences.
The review should be specific, actionable, and useful for deciding whether to accept or revise the change.

Review focus:

- repository structure
- route/file placement
- component boundaries
- server vs client component use
- accessibility and semantic markup
- metadata/SEO opportunities
- testing completeness
- code duplication
- naming clarity
- unnecessary dependencies
- overall maintainability

Constraints:

- Be concrete.
- Prefer actionable findings over vague criticism.
- Highlight what is good and should remain unchanged.
- Do not rewrite code during the review unless explicitly asked.

Done when:

- the current changes have a clear quality assessment,
- the important problems are identified,
- the exact files to improve are named,
- and the recommended fix order is obvious.

Output format:

1. Overall assessment
2. What is good and should remain
3. Problems found
4. Why they matter
5. Exact files to fix
6. Recommended fix order
7. Verification to rerun after fixes
