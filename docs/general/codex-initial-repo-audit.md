Read and follow:

- `AGENTS.md`
- `README.md`
- `docs/current-state.md`
- `.github/copilot-instructions.md`
- `docs/product-requirements.md`
- `docs/site-map.md`
- `docs/architecture.md`
- `docs/testing-strategy.md`
- `.codex/playbooks/planning-playbook.md`
- `PLANS.md`

Task:
Perform an initial repository audit and planning pass for this Pilates studio website project.

Goal:
Understand the repository exactly as it exists right now, identify what is already prepared, identify what is missing, detect the real environment/tooling state, and produce the best next task before any implementation begins.

Context:
This repository has already been prepared with documentation and agent-guidance files.
However, the actual application scaffold may still be incomplete or missing.
You must inspect the real repository state and not assume that Next.js, package.json scripts, or test tooling already exist unless you actually find them.

Constraints:

- Do not modify any files in this task.
- Do not generate code.
- Do not initialize the project yet.
- Do not invent package versions, libraries, routes, or scripts.
- If something cannot be detected, say so explicitly.
- Distinguish carefully between:
  - detected current state
  - intended future state
  - your recommendations
- Prefer exact facts from the repository over assumptions.
- If a file structure exists, report it.
- If a file does not exist, report it as missing.
- If package/config files exist, extract exact versions, libraries, scripts, and setup details from them.

Inspect at minimum:

- repository root files
- `.github/`
- `.codex/`
- `docs/`
- `src/` if it exists
- `public/` if it exists
- `package.json` if it exists
- lockfiles if any exist
- `.nvmrc` if it exists
- `tsconfig.json` if it exists
- `next.config.*` if it exists
- Tailwind/PostCSS config if present
- test config files if present

Done when:

- you have described the actual repository state,
- listed the important existing files,
- identified missing foundation pieces,
- extracted exact environment/tooling details when available,
- stated what you understand the project to be,
- listed clarifying questions,
- and recommended the single best next Codex task.

Output format:

1. Repository state summary
2. Files and folders already present
3. Important files missing
4. Current folder tree (top 3 levels only, concise)
5. Detected environment and tooling
   - Node version
   - package manager
   - framework
   - libraries/dependencies
   - testing setup
   - lint/format setup
   - deployment-related setup
6. What Codex understands about the intended architecture and workflow
7. Gaps that must be closed before implementation
8. Clarifying questions
9. Best immediate next Codex task
10. Exact suggested prompt for that next task

Important:
Be explicit about the difference between:

- detected facts,
- inferred likely intent,
- and recommended next actions.
