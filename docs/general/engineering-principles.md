# Engineering Principles

## Purpose

This document defines the software engineering standards for the project.

## Core objective

The project should remain stable, clean, understandable, and easy to evolve as requirements change.

## Principles

### 1. Separation of concerns

Keep routing, layout composition, domain logic, styling, configuration, and testing concerns clearly separated.

### 2. Modularity

Build small, cohesive modules with clear responsibilities.
Avoid giant files and tightly coupled structures.

### 3. Readability first

Choose clarity over cleverness.
Prefer explicit names and understandable code flow.

### 4. Low coupling

Components and modules should depend on as little as necessary.
Avoid hidden assumptions between unrelated parts of the application.

### 5. High cohesion

Each file and module should have a focused purpose.

### 6. Refactor early

When a file starts becoming too large or repetitive, refactor before complexity grows.

### 7. Reuse thoughtfully

Extract reusable code when duplication becomes real and meaningful.
Do not abstract too early.

### 8. Comments with discipline

Comments should explain intent, constraints, or non-obvious reasoning.
They should not restate obvious code.

### 9. Consistency

Use consistent naming, formatting, file placement, and structure across the repository.

### 10. Testability

Code should be structured so important behavior can be tested without brittle hacks.

## Practical rules

- Keep route files thin.
- Prefer pure utilities when possible.
- Keep configuration centralized.
- Avoid mixing business logic with presentational markup.
- Avoid dead code and unused imports.
- Avoid massive prop chains when composition is cleaner.
- Prefer semantic HTML.
- Prefer stable patterns over flashy patterns.

## Code smell warnings

Refactor when you notice:

- giant page files
- repeated layout markup
- styling hardcoded everywhere
- mixed responsibilities in one file
- duplicated business logic
- unclear naming
- brittle tests
- client components used without real need

## Review standard

A change is not complete just because it works.
It should also:

- fit the structure,
- be readable,
- be testable,
- avoid unnecessary complexity,
- and remain easy to modify later.

## Definition of success

The engineering standard is successful if:

- new changes can be added safely,
- the code does not accumulate obvious smells,
- and the project remains understandable over time.
