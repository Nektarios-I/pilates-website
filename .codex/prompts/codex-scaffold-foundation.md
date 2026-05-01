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

Task:
Scaffold the initial foundation of the Pilates studio website repository.

Goal:
Create the clean structural starting point for implementation without prematurely building the final visual design.

Context:
The repository docs and guidance files already exist.
This task should create the route and shared structure needed for safe future implementation.

Create:

- `src/app/(marketing)/layout.tsx`
- `src/app/(marketing)/page.tsx`
- placeholder route files for:
  - about
  - classes
  - pricing
  - instructors
  - contact
  - faq
  - blog
  - blog/[slug]
- shared layout components needed for header/footer/page shell
- minimal reusable UI primitives only if justified
- root metadata defaults
- `robots.ts`
- `sitemap.ts`
- typed env/config module
- initial shared test utilities only if needed
- the smallest clean placeholder content structure

Constraints:

- Use Next.js App Router only.
- Use TypeScript.
- Prefer server components by default.
- Keep route files thin.
- Keep business logic out of route files.
- Use semantic HTML.
- Do not create polished final UI yet.
- Do not use lorem ipsum.
- Do not invent real booking integrations.
- Do not add unnecessary dependencies.
- Use explicit placeholder content where real business content is missing.

Testing requirements:

- Add at least minimal coverage appropriate for the scaffold if test setup already exists.
- If test setup does not yet exist, state clearly what should be added next.

Verification requirements:

- Run the relevant checks if the repository is already configured for them.
- If checks cannot run, report exactly what is missing.

Output format:

1. Files changed
2. What was implemented
3. Tests added or updated
4. Checks run
5. Assumptions / limitations
6. Recommended next task
