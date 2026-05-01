Using the repository instructions and docs, scaffold the initial project foundation.

First, read:

- [Copilot instructions](../copilot-instructions.md)
- [Product requirements](../../docs/product-requirements.md)
- [Site map](../../docs/site-map.md)
- [Architecture](../../docs/architecture.md)
- [Testing strategy](../../docs/testing-strategy.md)

Task:
Create the initial project scaffold for the Pilates studio website.

Create only the structural foundation, not the full final UI.

Include:

- route group for marketing pages
- placeholder route files for the planned pages
- shared marketing layout
- header and footer placeholders
- reusable base UI primitives where justified
- root metadata defaults
- `robots.ts`
- `sitemap.ts`
- typed config module for env variables
- empty feature folders with minimal placeholders if useful
- test setup foundation
- no heavy styling yet

Requirements:

- Keep page files thin
- Keep business logic out of route files
- Use TypeScript
- Prefer server components by default
- Add TODO comments only where real business content is still missing
- Explain the purpose of each created file briefly after generating

Do not:

- invent booking APIs
- add unnecessary dependencies
- build polished visuals yet
- generate placeholder lorem ipsum
