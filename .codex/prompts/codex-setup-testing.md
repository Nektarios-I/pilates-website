Read and follow:

- `AGENTS.md`
- `README.md`
- `docs/architecture.md`
- `docs/testing-strategy.md`
- `.codex/playbooks/implementation-playbook.md`
- `.codex/playbooks/testing-playbook.md`
- `.codex/playbooks/review-playbook.md`

Task:
Set up the testing foundation for this repository.

Goal:
Create a clean, maintainable testing setup for unit/integration testing and end-to-end testing in this Next.js App Router project.

Context:
The repository is in the early setup phase.
The architecture and testing strategy are already documented.
The project should use React Testing Library for unit/integration tests and Playwright for end-to-end tests.

Requirements:

- Add the smallest clean testing setup needed.
- Prefer maintainability and clarity over cleverness.
- Keep the setup aligned with the documented architecture.
- Add or update scripts in `package.json` if needed.
- Create shared test setup utilities only when justified.
- Add at least:
  - one minimal RTL render/smoke test
  - one minimal Playwright smoke test
- Use accessible selectors.
- Keep tests behavior-focused.

Constraints:

- Do not over-engineer the setup.
- Do not add unnecessary mocking complexity.
- Do not over-test trivial markup.
- Do not invent unsupported APIs or dependencies beyond what is needed for the documented testing stack.
- If some setup depends on packages not yet installed, state exactly what is missing.

Verification:

- Run the relevant test, lint, and build commands if available.
- If verification is blocked, state the exact blocker.

Done when:

- the test foundation exists,
- the project has a minimal RTL path,
- the project has a minimal Playwright path,
- the required scripts/config are in place or clearly identified,
- and the next implementation task can safely build on the testing setup.

Output format:

1. Files changed
2. What was implemented
3. Tests added or updated
4. Checks run
5. Assumptions / limitations
6. Recommended next task
