Implement the homepage shell for the Pilates studio website.

First, read:

- [Copilot instructions](../copilot-instructions.md)
- [Product requirements](../../docs/product-requirements.md)
- [Site map](../../docs/site-map.md)
- [Architecture](../../docs/architecture.md)
- [Testing strategy](../../docs/testing-strategy.md)

Task:
Build the homepage shell using semantic, modular sections.

Include:

- hero section
- value proposition / benefits section
- classes preview section
- instructors preview section
- testimonials or trust signals section
- final CTA section
- footer integration through shared layout

Requirements:

- No lorem ipsum
- Use clear placeholder copy where final marketing copy is not yet available
- Keep layout clean and maintainable
- Split reusable sections into components
- Keep business logic out of `page.tsx`
- Add React Testing Library tests for homepage rendering and CTA presence

Do not:

- over-design yet
- use fake booking logic
- create giant monolithic components
