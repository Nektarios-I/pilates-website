# Environment and Project Setup for a Production‑Grade Pilates Studio Website

## 1. Overview and Goals

This document describes how to prepare the environment, repository, and tooling to build a production‑grade Pilates studio website using VS Code, GitHub Copilot, Next.js (App Router), TypeScript, and Vercel, with a focus on TDD, separation of concerns, and long‑term maintainability. It focuses on everything that must be decided and set up *before* writing production features: stack choices, folder structure, testing tools, VS Code and Copilot configuration, and deployment wiring.[^1][^2][^3][^4][^5][^6]

The target product is a marketing and booking site for a Pilates studio, optimized for conversion, SEO, and easy content updates, with a modern responsive design and clear calls to action. The site should initially deploy to Vercel but remain portable to other Node‑based hosts by avoiding vendor‑specific lock‑in.[^7][^8][^9][^10]

## 2. Recommended Tech Stack and Architecture

For 2025–2026, a Next.js 15 App Router project with TypeScript is a strong default for SEO‑friendly, server‑rendered React applications, especially when deploying to Vercel. Next.js App Router provides file‑system routing, layouts, server components, data fetching, and a first‑class Metadata API, which simplifies SEO and performance tuning compared to manual React setups.[^2][^11][^5][^6][^12][^13]

A recommended core stack for this project:
- **Frontend framework**: Next.js 15 (App Router) with React and TypeScript.[^6][^2]
- **Styling**: Tailwind CSS or CSS Modules with a small design system; Tailwind is popular in the Next.js ecosystem and works well with utility‑first theming.[^11][^5][^2]
- **Testing**: Jest or Vitest with React Testing Library for unit/integration tests; Playwright for end‑to‑end browser tests.[^14][^15][^16][^17][^18]
- **Tooling**: ESLint, Prettier, TypeScript strict mode, and Husky + lint‑staged for pre‑commit hooks.[^5][^11]
- **Deployment**: Vercel for default hosting, with a standard Next.js `next.config` that remains compatible with generic Node or serverless hosting providers.[^5][^6]

The architecture should follow feature‑oriented modularity: shared UI primitives, feature modules (e.g., booking, schedules, instructors), and route segments composed from these modules rather than large, monolithic pages.[^2][^11][^6][^5]

## 3. Business and UX Requirements for a Pilates Studio Site

Before coding, requirements for a Pilates studio website should be grounded in industry‑specific UX patterns that convert visitors into clients. Common guidance emphasizes scannable layouts, vivid imagery of real classes, simple navigation, and prominent calls to action to book intro sessions or memberships.[^19][^8][^9][^10][^7]

Essential content and page types typically include:
- **Home**: Clear headline with value proposition, hero imagery of real clients/instructors, primary CTA (book a class / intro offer), social proof.
- **Classes/Schedule**: Class types, schedule/filters, intro offers, difficulty levels.
- **Pricing/Offers**: Transparent pricing, intro packs, membership options.
- **Instructors/About**: Instructor bios and credentials, studio philosophy and methodology.[^10][^19]
- **Booking**: Flow to book classes or link to external booking system.
- **Contact/Location**: Map, contact form, directions, parking info.
- **FAQ/Blog**: Answer common objections, share educational content to help SEO.[^9][^7][^10]

These requirements should be documented in a `docs/product-requirements.md` file and used to drive route planning and test scenarios.

## 4. GitHub Repository and Project Metadata

The project should live in a dedicated GitHub repository with clear metadata files so that both humans and AI tools (including Copilot) can infer conventions and constraints. Recommended top‑level metadata files include:[^3][^1][^11][^5]

- `README.md`: Project overview, tech stack, local setup, scripts, deployment process, and contribution guidelines at a high level.[^11]
- `docs/architecture.md`: High‑level architecture description (stack, layering, dependencies, data flow, routing strategy).
- `docs/testing-strategy.md`: Testing pyramid, tools used, and how to run different test suites.[^15][^18][^14]
- `docs/copilot-instructions.md` or `STYLE.md`: Coding style, React/Next.js patterns, testing expectations, and guidelines that Copilot tends to follow when present in the repo.[^4][^1]
- `LICENSE`, `CODE_OF_CONDUCT.md`, `CONTRIBUTING.md`: Standard project governance files if the code is shared beyond a single developer or used as a long‑term asset.
- `.gitignore` and `.gitattributes`: Ignore Node artifacts and ensure consistent line endings.

A small ADR (Architecture Decision Record) directory like `docs/adr/ADR-0001-tech-stack.md` is helpful to log decisions such as “Next.js + TypeScript + Tailwind,” and “Playwright for e2e,” making future refactors easier to reason about.[^11][^5]

## 5. Node, Package Manager, and Scripts

To ensure reproducible environments, a Node version should be pinned using `.nvmrc` or `.node-version` and referenced in documentation and CI; this is standard practice for modern JS projects. A single package manager (npm, pnpm, or yarn) should be chosen and its lockfile committed; pnpm is increasingly popular for larger monorepos, but any single choice is acceptable if used consistently.[^2][^5][^11]

The `package.json` scripts should be designed for discoverability and automation:
- `dev`: Run Next.js dev server.
- `build`: Production build.
- `start`: Start production server.
- `lint`: Run ESLint.
- `test`: Run unit/integration tests.
- `test:watch`, `test:coverage`: Developer‑friendly variants.
- `test:e2e`: Run Playwright tests.
- `lint:fix`, `format`: Auto‑fix ESLint and run Prettier.

These scripts become the entry points for Copilot Chat agents in VS Code when asked to “run tests” or “run the build,” and for CI workflows in GitHub Actions.[^20][^17][^18]

## 6. VS Code and Workspace Configuration

A project‑local `.vscode` folder should define workspace settings so all contributors share consistent formatting, linting, and Copilot behavior when the repo is opened. Common workspace settings include enabling format on save with Prettier, enforcing Unix line endings, setting TypeScript preferences (e.g., single quotes, import sorting), and turning on specific lint rules.[^3]

Useful VS Code extensions for this stack:
- GitHub Copilot and Copilot Chat.
- ESLint and Prettier.
- Tailwind CSS IntelliSense (if Tailwind is used).
- GitLens for Git history.
- Playwright or testing extensions for test discovery.

Team‑wide Copilot configuration can be partially standardized through workspace settings and profiles, which helps avoid inconsistent AI suggestions across machines. Using VS Code profiles also allows a dedicated “web‑dev + Copilot” profile with minimal, focused extensions to reduce noise during development.[^4][^20][^3]

## 7. GitHub Copilot Configuration and Usage Patterns

For best results, Copilot should be configured intentionally rather than left at defaults; official guidance suggests using it for tests, repetitive code, and boilerplate, while keeping humans in charge of design and security‑sensitive logic. VS Code’s Copilot integration supports inline completions, Copilot Chat, and project‑aware agents that can plan and apply multi‑file changes, which is useful for refactors and consistent pattern application.[^1][^20][^4]

Recommended pre‑setup steps for Copilot:
- Enable Copilot and Copilot Chat in VS Code and sign in with the GitHub account attached to the repo.[^20][^4]
- Add a `STYLE.md` or `docs/copilot-instructions.md` outlining conventions: “use functional React components,” “prefer Next.js App Router features,” “use React Testing Library for tests,” “write tests before or alongside new components,” and “follow ESLint rules; no unused imports.”[^1][^4]
- Use repository workspace settings to control when Copilot suggestions appear, e.g., limiting suggestions in large files or adjusting `editor.inlineSuggest.enabled` and keybindings.[^3][^1]

Effective Copilot workflows for this project:
- **Comment‑first coding**: Write a comment or TODO outlining behavior, then accept or refine Copilot’s implementation.[^4][^1]
- **Test‑first**: Write component or route tests with Copilot’s help, then generate implementation to satisfy tests, aligning with TDD.[^14][^4]
- **Refactor assistance**: Ask Copilot Chat to extract a component, move logic to a hook, or split a file to improve separation of concerns, and then run tests to validate.[^20][^1]

## 8. Next.js Project Structure and Separation of Concerns

Next.js documentation and community guides recommend a structure built around the `app` directory (for App Router) with clear separation between route segments, shared components, utilities, and domain‑specific modules. A commonly recommended high‑level layout is:[^6][^5][^2][^11]

```text
project-root/
├── app/                # App Router entry, route segments
├── src/                # Application source (optional but encouraged)
│   ├── app/            # If colocating app under src
│   ├── components/     # Shared UI components
│   ├── features/       # Feature modules (booking, schedule, etc.)
│   ├── lib/            # Utilities, API clients, helpers
│   ├── hooks/          # Reusable React hooks
│   └── styles/         # Global styles or Tailwind config
├── public/             # Static assets (logos, OG images)
├── tests/              # Integration/unit tests (or colocated with src)
├── e2e/                # Playwright tests
└── config/             # App config, if needed
```

Within `app/`, Next.js encourages splitting by route segments, keeping shared layouts and error boundaries near their usage. Large components should be further divided into “dumb” presentational components (e.g., UI cards, buttons) and “smart” containers that manage data fetching and orchestration, which aligns with separation of concerns and maintainability best practices for React projects.[^5][^6][^2][^11]

## 9. SEO, Metadata, and Static Assets

Next.js App Router provides a Metadata API to define `metadata` and `generateMetadata` export per route, which is the recommended way to manage titles, descriptions, canonical URLs, and Open Graph tags in modern Next.js versions. Current SEO best practices recommend centralizing site‑wide defaults (title templates, base URL, open graph defaults) and overriding them for high‑value pages like Home, Classes, and Articles.[^12][^13][^21][^6]

For this Pilates project, the environment should include:
- `app/metadata.ts` or a root layout `metadata` with brand‑level defaults.[^13][^12]
- Per‑page `generateMetadata` for dynamic routes (e.g., blog posts, instructor profiles) to reflect specific titles and descriptions.[^22][^12][^13]
- `app/robots.ts` and `app/sitemap.ts` so robots rules and sitemaps are versioned alongside code and easily tested.[^12][^13]
- Open Graph and Twitter card images placed in `public/` and referenced via metadata; dynamic OG images can be generated with specialized routes if desired.[^13][^12]

Pilates‑specific SEO should emphasize location‑based keywords, service terms (reformer Pilates, mat Pilates, private sessions), and well‑structured content on key pages, following Pilates SEO content guidance.[^7][^9][^10]

## 10. Testing Stack and TDD Workflow

Modern React/Next.js testing strategies increasingly favor React Testing Library for unit and integration tests, combined with Playwright for full‑stack end‑to‑end tests in real browsers. Testing pyramids typically place more emphasis on fast unit and integration tests, with a smaller but critical set of end‑to‑end flows that cover the main user journeys.[^16][^17][^18][^15][^14]

Recommended tooling and patterns:
- **Unit/integration**: Jest or Vitest with React Testing Library; test components in jsdom and focus on user behavior (queries by role, label, text) rather than implementation details.[^17][^18][^14]
- **E2E**: Playwright configured via `npx playwright init`, with tests stored in `e2e/` and a `webServer` entry in `playwright.config.ts` to boot `next dev` or a production build before tests.[^18][^15][^16][^14]
- **Network mocking**: Mock Service Worker (MSW) for integration tests and potentially for Playwright to avoid flaky external dependencies.[^15][^14]

A TDD‑oriented workflow for this project:
1. Write or update a test that captures a user story (e.g., “visitor can view class schedule and book an intro class”) with Copilot assistance for boilerplate.
2. Run tests and see them fail.
3. Implement the minimal component/route code to satisfy the tests, again using Copilot to propose implementations that are then reviewed and refined.
4. Refactor with Copilot help while keeping tests green.

## 11. Continuous Integration and Deployment

From the start, a GitHub Actions workflow should be configured to run linting, type‑checking, tests, and production builds on each pull request; Playwright’s init script can generate a ready‑made GitHub Actions workflow for e2e tests. This ensures that Copilot‑generated changes and refactors are always validated by automated checks before being merged.[^16][^18][^15]

Vercel integrates directly with GitHub, creating preview deployments for pull requests and promoting the main branch to production once tests pass, which is a common best practice for Next.js projects. To keep the app portable, deployment‑specific configuration (e.g., environment variables, base URLs, analytics keys) should be managed via environment variables and `next.config` rather than hard‑coding Vercel‑specific assumptions.[^6][^2][^11][^5]

## 12. Environment Variables and Configuration

Environment variables should be defined via `.env.local` for developer machines and environment‑specific variables configured in Vercel’s dashboard or alternative hosting providers. A `.env.example` file with placeholders should be committed to the repo to document required variables (e.g., `NEXT_PUBLIC_SITE_URL`, booking provider API keys, analytics IDs) without exposing secrets.[^2][^11][^5]

Configuration should be centralized in one or more modules under `src/config/` or `src/lib/config.ts`, providing typed access to environment variables and preventing scattered `process.env` usage throughout the codebase. This pattern makes it easier to move between Vercel and other platforms by changing config at a single abstraction layer.[^11][^5][^2]

## 13. Documentation and Developer Experience

In addition to the basic metadata files, maintaining concise but accurate documentation significantly improves maintainability and allows Copilot to infer more context from the codebase. Next.js organizational guides explicitly recommend documenting project structure and conventions in the root README to make navigation and contribution easier.[^1][^5][^11]

For this Pilates project, recommended docs include:
- `docs/pages-and-routes.md`: Mapping of business pages (Home, Classes, Pricing, Instructors, Booking, Contact, FAQ, Blog) to Next.js route segments.
- `docs/content-model.md`: If a headless CMS is used, define content types (Class, Instructor, Testimonial, BlogPost) and their fields; otherwise, define JSON or markdown structures.
- `docs/ux-principles.md`: Summary of Pilates UX principles (scannable sections, strong CTAs, real photography, mobile‑first design).[^8][^19][^9][^10][^7]
- `docs/testing-playbook.md`: How to write tests, naming conventions, and how to use Copilot to scaffold tests while avoiding over‑reliance.

## 14. Pre‑Implementation Checklist for VS Code + Copilot Setup

Bringing these pieces together, the environment should be prepared before any feature work begins.

**Repository and stack**
- Create GitHub repo, initialize Next.js App Router project with TypeScript, and push initial scaffold.[^6][^2]
- Add ESLint, Prettier, Tailwind (if chosen), Jest/Vitest, React Testing Library, and Playwright with basic config.
- Pin Node version and commit lockfile.[^2][^11]

**Structure and configuration**
- Set up `src/` with `app/`, `components/`, `features/`, `lib/`, `hooks/`, `styles/`, `tests/`, `e2e/`, and `public/` directories.[^5][^11][^6][^2]
- Add `app/metadata.ts`, `app/robots.ts`, `app/sitemap.ts`, and Open Graph assets for SEO.[^12][^13]
- Create central config module(s) and `.env.example`.

**VS Code + Copilot**
- Install recommended extensions, create `.vscode/settings.json` with formatting, linting, and Copilot settings.[^3]
- Add `STYLE.md` or `docs/copilot-instructions.md` describing coding standards and how Copilot should behave.[^4][^1]
- Configure VS Code profile for this project (optional but helpful for focus).[^20][^3]

**Documentation and testing**
- Write initial `README.md`, `docs/architecture.md`, `docs/testing-strategy.md`, and `docs/ux-principles.md` based on Pilates UX sources.[^19][^8][^9][^10][^7]
- Add GitHub Actions workflow(s) to run lint, type‑check, unit/integration tests, and Playwright e2e tests.[^18][^15][^16]
- Document `npm`/`pnpm` scripts that developers and Copilot will use.

Once this environment is in place, the implementation phase can start with confidence: business requirements are known, the structure enforces separation of concerns, testing and CI are aligned with TDD, Copilot is configured as a disciplined assistant, and the project is ready for robust deployment on Vercel and other platforms.

---

## References

1. [GitHub Copilot in VS Code: Complete Integration Guide for 2025](https://skywork.ai/blog/agent/github-copilot-in-vs-code-complete-integration-guide-for-2025/) - Comprehensive guide to GitHub Copilot integration in VS Code. Installation, configuration, keyboard ...

2. [Best Practices for Organizing Your Next.js 15 2025 - DEV Community](https://dev.to/bajrayejoon/best-practices-for-organizing-your-nextjs-15-2025-53ji) - Predictable URLs: With the App Router, your folder structure directly maps to your URLs, making them...

3. [Managing GitHub Copilot & VS Code Settings Across Teams](https://dev.to/pwd9000/managing-github-copilot-vs-code-settings-across-teams-1phj) - How to share, standardise, and enforce VS Code & GitHub Copilot settings: repo config, profiles, scr...

4. [Best practices for using GitHub Copilot](https://docs.github.com/en/copilot/get-started/best-practices) - Learn how to get the most out of Copilot.

5. [Building a Scalable Folder Structure for Large Next.js Projects - Vercel](https://techtales.vercel.app/read/thedon/building-a-scalable-folder-structure-for-large-next-js-projects) - Learn how to structure large-scale Next.js projects for maximum scalability and team efficiency. Boo...

6. [Getting Started: Project Structure | Next.js](https://nextjs.org/docs/app/getting-started/project-structure) - This page provides an overview of all the folder and file conventions in Next.js, and recommendation...

7. [7 Ways to Make Your Pilates Studio Website Stand Out](https://www.pilateseducationinstitute.com/7-ways-to-make-your-pilates-studio-website-stand-out/) - We all know that Pilates is an engaging full-body workout that focuses on low-impact exercises with ...

8. [95 Best Pilates Websites — Pick 3 and Build with AI - Create Today](https://createtoday.io/examples?category=pilates) - I found the best pilates websites that boost client bookings through trust-building design and zero-...

9. [10 Tips for Creating a Pilates Website that Converts](https://mybeststudioblog.com/10-tips-for-creating-a-pilates-website-that-converts/) - Learn how to start an online fitness, yoga or Pilates business, build your brand, find clients, and ...

10. [How to Write SEO-Friendly Website Content to attract New Pilates ...](https://pilatesbridge.com/seo-website-content/) - Learn how to write SEO-friendly website content for your Pilates or Yoga studio website that will he...

11. [The Ultimate Guide to Organizing Your Next.js 15 Project Structure](https://www.wisp.blog/blog/the-ultimate-guide-to-organizing-your-nextjs-15-project-structure) - This comprehensive guide will walk you through a battle-tested Next.js 15 folder structure that scal...

12. [Next.js SEO Best Practices (App Router, 2025 Edition) - AverageDevs](https://www.averagedevs.com/blog/nextjs-seo-best-practices) - A practical, production‑ready checklist for SEO with Next.js App Router - metadata, canonical URLs, ...

13. [Next.js App Router SEO Optimization: Dynamic Metadata in 2026](https://codehero.co.id/en/article/dynamic-metadata-seo-in-nextjs-app-router-2026-best-practices) - Complete guide to SEO optimization using dynamic metadata in Next.js App Router 2026 for high-perfor...

14. [Modern React testing, part 5: Playwright - Artem Sapegin](https://sapegin.me/blog/react-testing-5-playwright/) - Learn how to test React apps end-to-end with Playwright, how to mock network requests with Mock Serv...

15. [React Playwright Testing: Complete Guide](https://www.getautonoma.com/blog/react-playwright-testing-guide) - Learn to test React apps with Playwright. Setup, component testing, hooks, routing, API mocking, deb...

16. [React Playwright Testing: Complete Guide | Autonoma AI](https://getautonoma.com/blog/react-playwright-testing-guide) - Learn to test React apps with Playwright. Setup, component testing, hooks, routing, API mocking, deb...

17. [Migrating from Testing Library - Playwright](https://playwright.dev/docs/testing-library) - Migration principles

18. [Modern React testing, part 5: Playwright](https://dev.to/sapegin/modern-react-testing-part-5-playwright-1jh0) - Learn how to test React apps end-to-end with Playwright, how to mock network requests with Mock Serv...

19. [Create the Best Pilates Studio Website](https://pixalitydesign.com/pixality-blog/pilates-website-design) - Creating a new website for your Pilates studio can be a big undertaking. Here are some tips on how y...

20. [Customize AI for your workflow](https://code.visualstudio.com/docs/copilot/overview) - Describe what you want to build, and let agents in VS Code plan, implement, and verify the changes a...

21. [Where to Add SEO Metadata in Next.js with App Router Instead of ...](https://stackoverflow.com/questions/78356635/where-to-add-seo-metadata-in-next-js-with-app-router-instead-of-page-router) - When using the page router, I had implemented SEO metadata such as Twitter, Facebook, and OpenGraph ...

22. [Next.js 15 App Router: SEO meta tags showing in <body> instead of ...](https://github.com/vercel/next.js/discussions/84518) - I'm a beginner in Next.js and I know I might be “benching above my weight class” here , but I'm tryi...

