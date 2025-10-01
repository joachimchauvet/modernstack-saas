# Project Guidelines

## Core Technologies

- Frontend: SvelteKit ^2.30 with Svelte 5.
- Backend: Convex (database, serverless functions, real-time).
- Styling: Tailwind CSS v4 with shadcn-svelte components.
- Package Manager: pnpm.

## Key Conventions

- Package Management: IMPORTANT: Always use `pnpm` for all package management operations (`pnpm install`, `pnpm add`, etc.). YOU MUST NOT use `npm` or `yarn`.
- Backend Development: All backend logic is in the `convex/` directory.
- File-based Routing: Use SvelteKit's file-based routing system in `src/routes/`.
- Shared Code: Place reusable code in `src/lib/`.
- Use `git mv` instead of creating a new file and deleting the old one or just `mv` if moving existing files that have been committed already.
- Do not commit changes on your own. Humans will do that after approval.
- Before making edits in files involving Svelte 5 or Convex, make sure you read the svelte/overview.md and convex.md documentation or you have it in your context.
- Most of the time, `pnpm dev` and `pnpm convex dev` will be running in another terminal already. No need to run those commands yourself.

## Svelte Best Practices

### High-Level Principles

- Write concise, technical, and accurate Svelte 5/SvelteKit code.
- Leverage SSR and SSG.
- Prioritize performance and minimal JavaScript.
- Use descriptive variable names and follow official conventions.

### Code Style and Structure

- Prefer functional and declarative patterns.
- Avoid code duplication through iteration and modularization.
- Structure files logically: component logic, markup, styles, helpers, types.

### TypeScript Usage

- Use TypeScript for all code.
- Prefer interfaces over types.
- Avoid enums; use `as const` objects.
- Enable strict mode.
- Don't use Any as type. That's not precise or clear enough.

## Available Documentation

Refer to the following documents for detailed information on specific topics. These are your primary source of truth for the project. Always double-check when in doubt.

- `docs/autumn.md`: Guidelines for integrating Autumn billing and subscription management with SvelteKit and Convex.
- `docs/better_auth.md`: A guide to using Better Auth for the project's authentication system, with links to official documentation.
- `docs/convex.md`: Guidelines and best practices for Convex (database schema, queries, mutations).
- `docs/tailwind_v4.md`: Overview of Tailwind CSS v4, including the new CSS-first customization and dynamic utilities.
- `docs/svelte/overview.md`: Comprehensive Svelte 5 guide covering component patterns, state management, and conventions.
- `docs/svelte/advanced_state_management.md`: Patterns for reusable state stores and a guide on avoiding common pitfalls with effects.
- `docs/svelte/animations_and_integrations.md`: Guide to Svelte 5's animation features and integrating third-party libraries.
- `docs/svelte/templating_and_components.md`: Advanced templating, data binding, and component composition with snippets and the Context API.
- `docs/svelte/remote_functions.md`: In-depth guide to SvelteKit's remote functions (`query`, `form`, `command`).
- `docs/svelte/reactivity_deep_dive.md`: Advanced look at Svelte 5's reactivity model, signals, and effects.
