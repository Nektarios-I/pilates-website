Review the generated code in this repository against the project rules.

First, read:

- [Copilot instructions](../copilot-instructions.md)
- [Architecture](../../docs/architecture.md)
- [Testing strategy](../../docs/testing-strategy.md)

Task:
Review the current changes and identify problems before implementation continues.

Check for:

- violations of folder structure
- business logic inside route files
- oversized components
- unnecessary client components
- missing metadata opportunities
- accessibility issues
- test gaps
- weak naming
- duplicated UI or logic
- dependency additions that are not justified

Output format:

1. Problems found
2. Why each problem matters
3. Exact files to refactor
4. Recommended fix order
5. What is already good and should remain unchanged
