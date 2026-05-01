Read and follow:

- `AGENTS.md`
- `README.md`
- `.github/copilot-instructions.md`
- `docs/product-requirements.md`
- `docs/site-map.md`
- `docs/architecture.md`
- `docs/testing-strategy.md`
- `.codex/playbooks/implementation-playbook.md`
- `.codex/playbooks/testing-playbook.md`
- `.codex/playbooks/review-playbook.md`

Task:
Implement the homepage shell for the Pilates studio website.

Goal:
Create a production-grade homepage structure that is semantically correct, modular, maintainable, and ready for later visual refinement.

Context:
The site is for a professional Pilates studio.
The homepage should establish trust quickly, explain the core offering clearly, preview key sections of the business, and present a strong CTA.
This task is about structure and clean implementation, not final polished content design.

Required homepage sections:

- hero
- value proposition / benefits
- classes preview
- instructors preview
- testimonials or trust signals
- final CTA

Requirements:

- Use semantic HTML and clear section structure.
- Keep `page.tsx` thin.
- Split meaningful sections into reusable components.
- Use explicit placeholder copy where final business copy is not available.
- Do not use lorem ipsum.
- Prefer server components unless client behavior is actually needed.
- Reuse shared layout components where appropriate.
- Keep the code easy to extend later with real content or CMS data.
- Add or update React Testing Library coverage for homepage rendering and primary CTA presence.

Constraints:

- Do not build fake booking logic.
- Do not add unnecessary dependencies.
- Do not create giant monolithic components.
- Do not over-design or create a generic AI-looking landing page.
- Do not violate the repo architecture.

Verification:

- Run relevant tests and linting if available.
- Report clearly if any checks are blocked by missing setup.

Done when:

- the homepage shell exists,
- the structure matches the documented product goals,
- components are modular,
- tests cover the key visible homepage behavior,
- and the result is ready for later content and design refinement.

Output format:

1. Files changed
2. What was implemented
3. Tests added or updated
4. Checks run
5. Assumptions / limitations
6. Recommended next task
