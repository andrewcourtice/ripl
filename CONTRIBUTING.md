# Contributing to Ripl

Thanks for your interest in contributing to Ripl! This guide covers the essentials for getting started, making changes, and submitting contributions.

> **Note:** Ripl is currently in beta. See the [README](README.md) for an overview of the project and its features.

## Getting Started

### Prerequisites

- **Node.js** 22+
- **Yarn 4** (Berry) — the repo includes Yarn via `.yarn/releases/`

### Setup

```bash
git clone https://github.com/andrewcourtice/ripl.git
cd ripl
yarn install
```

### Repository Structure

Yarn 4 monorepo with workspaces:

```
packages/
├── core/         # Core rendering: elements, scene, renderer, animation, scales, math, color, interpolation
├── canvas/       # Canvas 2D rendering context
├── svg/          # SVG context implementation
├── charts/       # Pre-built chart components (bar, line, area, pie, radar, heatmap, etc.)
├── 3d/           # 3D rendering (experimental)
├── webgpu/       # WebGPU 3D rendering context
├── terminal/     # Terminal rendering context
├── node/         # Node.js runtime bindings
├── web/          # Main browser entry point
├── dom/          # DOM utilities
├── utilities/    # Shared typed utility functions
└── test-utils/   # Test utilities
app/              # Documentation site (VitePress) with demos
```

Each package follows:

```
src/          # Source code
test/         # Tests (mirrors src/ structure)
package.json
tsconfig.json
```

## Development Workflow

```bash
# Build all packages (via Lerna)
yarn build

# Run tests (Vitest + jsdom)
yarn test

# Lint (ESLint)
yarn lint
```

The documentation site lives in `app/` and is built with VitePress.

## Code Style

ESLint enforces most style rules automatically. Key points:

| Rule | Value |
|------|-------|
| Indentation | 4 spaces |
| Quotes | Single quotes |
| Semicolons | Always |
| Trailing commas | Always in arrays, objects, imports, exports; **never** in function params |
| Brace style | `1tbs` |
| Line endings | Unix (LF) |

### Naming Conventions

- **Files** — `kebab-case` (e.g. `event-bus.ts`)
- **Variables, functions** — `camelCase`
- **Classes, interfaces, types** — `PascalCase`
- **Constants** — `UPPER_SNAKE_CASE`
- **Min 2-char identifiers** (exceptions: `_`, `i`, `j`, `k`, `x`, `y`, and single-letter math/color vars)

### Import Ordering

Ripl's own packages use named imports/exports (no default exports); default imports come only from third-party modules. One import per line within braces, trailing comma, and members sorted alphabetically within each set of braces.

Imports are **grouped by kind** (`ripl/import-export-spacing`): same-kind statements sit together with no blank line, and different kinds are separated by a blank line — side-effect imports group together, default imports group together, and each braced (`import { … }` / `import type { … }`) import is its own blank-separated group. The same applies to re-exports (`export * from` groups; braced `export { … }` is separated). The rule only inserts blank lines; it never reorders imports.

```typescript
import 'some-side-effect';
import 'another-side-effect';

import classNames from 'classnames';
import mitt from 'mitt';

// Internal (current package)
import {
    CONTEXT_OPERATIONS,
    TRACKED_EVENTS,
} from './constants';

// Other Ripl packages
import {
    typeIsArray,
    typeIsFunction,
} from '@ripl/utilities';

import type {
    Context,
} from '../context';
```

Use `import type { ... }` for type-only imports.

## TypeScript Conventions

- **Strict mode** — `"strict": true`, no implicit any, strict null checks
- **Interfaces over types** for object definitions
- **Named exports only** — no default exports
- **Explicit member accessibility** — every class member must have `private`, `protected`, `public`, or `static`; `private` members carry a leading underscore (`private _name`)
- **Generics** for reusable, type-safe code

## Architecture Quick Reference

### Elements & Shapes

Every built-in element follows this pattern:

1. **State interface** extending `BaseElementState`
2. **Class** extending `Shape<TState>` with getter/setter pairs via `getStateValue`/`setStateValue`
3. **Constructor** calling `super(type, options)`
4. **`_getLocalBoundingBox()`** returning the element's raw local-space `Box` (the base composes the public `getBoundingBox(local?)` from it)
5. **`render(context)`** calling `super.render(context, path => { ... })`
6. **Factory function** — `createX()`
7. **Type guard** — `elementIsX()`

Always prefer factory functions (`createX()`) over `new X()` in consumer-facing code.

### Charts

All charts extend `Chart<TOptions>` and export a `createXChart()` factory. Charts compose reusable components (`ChartXAxis`, `ChartYAxis`, `Grid`, `Legend`, `Tooltip`, `Crosshair`) and use `arrayJoin()` for data diffing.

### Context

`Context` is the rendering abstraction. `@ripl/web` is the main browser entry point (re-exports `@ripl/core` + `@ripl/canvas`). For SVG, import `createContext` from `@ripl/svg`. Elements are context-agnostic.

For a detailed breakdown of all patterns and conventions, see [AGENTS.md](AGENTS.md).

## Testing

- **Framework:** Vitest with `jsdom` environment
- **File naming:** `*.test.ts` in `test/` directories mirroring `src/`
- **Structure:** `describe` blocks to group related tests
- **Test names:** `"Should [expected behavior]"` format
- **Assertions:** One per line, destructure test values where appropriate

```typescript
import {
    describe,
    expect,
    test,
} from 'vitest';

describe('Scale', () => {

    describe('Linear Scale', () => {

        test('Should scale a domain to a range', () => {
            const scale = scaleContinuous(domain, range);

            expect(scale(domain[0])).toBe(range[0]);
            expect(scale(domain[1])).toBe(range[1]);
        });

    });

});
```

## Submitting Changes

1. **Branch** from `main`
2. **Write tests** for new features and bug fixes
3. **Ensure all tests pass** — `yarn test`
4. **Ensure linting passes** — `yarn lint`
5. **Keep changes focused and atomic** — one concern per PR
6. **Document public API** with JSDoc comments (parameters, return values, examples)
7. **Do not add runtime dependencies** — zero runtime dependencies is a core promise of the project

## CI

Pull requests to `main` trigger the test workflow:

- **Node 22** on Ubuntu
- `yarn install --immutable` (lockfile must be up to date)
- `yarn test` with JUnit and coverage reporting

Ensure your changes pass locally before pushing to avoid CI failures.

## Releasing

Releases are **tag-triggered**. Bumping the version locally with Lerna pushes a `vX.Y.Z` tag, and the [Release workflow](.github/workflows/release.yml) builds and publishes every public `@ripl/*` package to npm.

```bash
# from an up-to-date main branch
yarn release   # lerna version --force-publish: choose a bump, then it commits, tags, and pushes
```

Publishing is **tokenless**: the workflow authenticates to npm via GitHub Actions OIDC ([trusted publishing](https://docs.npmjs.com/trusted-publishers)) and attaches build provenance, so no `NPM_TOKEN` secret is required. Before a package's first automated release it must have a trusted publisher configured on npm (Organization `andrewcourtice`, Repository `ripl`, workflow `release.yml`). Because `@ripl/*` cross-dependencies use the `workspace:^` protocol, the workflow packs each package with Yarn (which rewrites `workspace:^` to the concrete version) before publishing the tarball with the npm CLI.

## AI Agents

If you are an AI coding agent, refer to [AGENTS.md](AGENTS.md) for comprehensive conventions, architecture details, and patterns specific to automated contributions.

## License

By contributing, you agree that your contributions will be licensed under the [MIT License](LICENSE).
