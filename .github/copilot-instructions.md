# Ripl - Copilot Instructions

This document outlines the coding patterns, standards, and conventions to follow when contributing to the Ripl project. Ripl is a library that provides a unified API for 2D graphics rendering (canvas & SVG) in the browser with a focus on high performance and interactive data visualization.

## Project Structure

The Ripl project follows a monorepo structure using Yarn workspaces:

- `packages/` - Core packages that make up the Ripl library
  - `core/` - Core rendering functionality
  - `charts/` - Pre-built chart components
  - `svg/` - SVG-specific implementation
  - `utilities/` - Shared utility functions
- `app/` - Documentation site with examples

## TypeScript Standards

### General TypeScript Guidelines

1. Use strict TypeScript with explicit typing whenever possible
2. Use ES2020 target and ESNext module format
3. Follow the established import/export pattern (see below)
4. Prefer interfaces over types for object definitions
5. Use meaningful type names that describe the data structure
6. Use type generics where appropriate to create reusable code

### Import/Export Pattern

Imports and exports should follow these patterns:

1. Always use named imports and exports
2. Group imports from the same module within curly braces
3. Each import should be on its own line within the braces
4. Sort imports alphabetically within each group
5. Place a comma after the last import in a group
6. Separate import groups with a blank line
7. Order import groups as follows:
   - Internal/local imports first (current package)
   - Other Ripl package imports
   - External dependencies

Example:

```typescript
import {
    CONTEXT_OPERATIONS,
    TRACKED_EVENTS,
} from './constants';

import {
    EventBus,
    EventHandler,
    EventMap,
} from './event-bus';

import {
    Box,
    isPointInBox,
} from '../math';

import {
    typeIsArray,
    typeIsFunction,
    typeIsNil,
} from '@ripl/utilities';
```

## Code Style

### Naming Conventions

1. Use `camelCase` for variables, functions, and method names
2. Use `PascalCase` for class names, interfaces, and types
3. Use `UPPER_SNAKE_CASE` for constants
4. Prefix interface names with `I` only when necessary to disambiguate
5. Use descriptive, intention-revealing names

### Function Declarations

1. Prefer arrow functions for callbacks and methods
2. Use function declarations for standalone functions
3. Use explicit return types for public API functions
4. Limit function complexity and length

### Variable Declarations

1. Use `const` by default
2. Use `let` only when reassignment is necessary
3. Avoid `var` entirely
4. Declare variables close to where they are used

## Testing Standards

1. Use Vitest for unit testing
2. Follow the test file naming convention: `*.test.ts`
3. Organize tests with `describe` blocks to group related tests
4. Use clear, descriptive test names with the format "Should [expected behavior]"
5. Each test should focus on testing one specific behavior
6. Structure test assertions clearly, with one assertion per line
7. Extract test values logically, using destructuring where appropriate

Example:

```typescript
describe('Color', () => {
    describe('Parsers', () => {
        test('Should parse a 6 char HEX color to RGBA', () => {
            const [
                red,
                green,
                blue,
                alpha,
            ] = parseHEX('#FF00FF');

            expect(red).toBe(255);
            expect(green).toBe(0);
            expect(blue).toBe(255);
            expect(alpha).toBe(1);
        });
    });
});
```

## Documentation

1. Include JSDoc comments for public API functions and classes
2. Document parameters, return values, and thrown exceptions
3. Provide example usage where appropriate
4. Keep documentation up to date with code changes
5. Use Markdown for documentation files

## Package Structure

Each package should follow this structure:

1. `src/` - Source code
2. `test/` - Test files (mirroring the src directory structure)
3. `package.json` - Package metadata and dependencies
4. `tsconfig.json` - TypeScript configuration
5. `README.md` - Package documentation

## Build System

The project uses `tsup` for building packages with the following configuration:

1. Clean output directory before builds
2. Generate declaration files (`.d.ts`)
3. Generate source maps
4. Target ES2018
5. Output formats: ESM, CommonJS, and IIFE
6. Entry point: `./src/index.ts`
7. Output directory: `./dist`

## Dependencies

1. Minimize external dependencies to maintain the zero-runtime-dependency promise
2. Use devDependencies for build and test tools
3. Prefer tree-shakable dependencies when external libraries are necessary
4. Keep dependencies up to date

## Performance Considerations

1. Optimize render performance by using the hoisted scenegraph
2. Be mindful of memory usage and object creation/disposal
3. Consider animation performance, especially for data visualizations
4. Follow the established patterns for high-performance rendering

## Contribution Workflow

1. Write tests for new features and bug fixes
2. Ensure tests pass before submitting changes
3. Follow the code style and patterns described in this document
4. Keep changes focused and atomic
5. Document changes appropriately

## API Design Principles

1. Follow a unified API approach across rendering contexts
2. Maintain API compatibility between Canvas and SVG implementations
3. Design for composability and reusability
4. Support tree-shaking to allow users to only include what they need
5. Follow established patterns from the DOM/CSSOM where appropriate

By following these guidelines, you'll help maintain consistency and quality across the Ripl codebase.
