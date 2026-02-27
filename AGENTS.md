# AGENTS.md — Ripl Coding Agent Guide

This document defines the coding practices, architecture, and conventions for the Ripl project. It is intended to provide AI coding agents with the context needed to contribute effectively.

## Project Overview

Ripl (pronounced "ripple") is a library that provides a **unified API for 2D graphics rendering** (Canvas & SVG) in the browser, with a focus on high performance and interactive data visualization. Key design goals:

- **Unified API** — One API surface for both Canvas and SVG rendering; switching contexts is a single-line change
- **DOM/CSSOM mimicry** — Grouping, property inheritance, event bubbling/delegation, CSS-like querying (`query`, `queryAll`, `getElementById`, etc.)
- **Zero runtime dependencies** — All functionality is self-contained
- **Tree-shakable** — Fully modular; consumers only ship what they use
- **Strict TypeScript** — The entire codebase is strictly typed

## Communication Style
In all interactions and commit messages, be extremely concise and sacrifice grammar for the sake of concision.

## Repository Structure

Yarn 4 monorepo with workspaces:

```
packages/
├── core/         # Core rendering: elements, scene, renderer, animation, scales, math, color, interpolation
├── charts/       # Pre-built chart components (bar, line, area, pie, radar, heatmap, etc.)
├── svg/          # SVG context implementation
├── utilities/    # Shared typed utility functions
├── vdom/         # Virtual DOM utilities
└── 3d/           # 3D rendering (experimental)
app/              # Documentation site (VitePress) with demos
```

Each package follows:
```
src/          # Source code
test/         # Tests (mirrors src/ structure)
package.json
tsconfig.json
```

## Architecture & Key Abstractions

### Class Hierarchy

```
EventBus<TEventMap>
├── Element<TState, TEventMap>     # Base renderable with state, events, interpolation
│   ├── Shape<TState>              # Adds path management, autoFill/autoStroke, hit testing
│   │   ├── Circle, Rect, Arc, Line, Polygon, Polyline, Ellipse, Text, Path, Image
│   │   └── (custom shapes)
│   └── Group<TEventMap>           # Container with children, scenegraph, querying
│       └── Scene                  # Top-level group bound to a Context
├── Renderer                       # Animation loop with transition management
└── Chart<TOptions, TEventMap>     # Base chart (in @ripl/charts)
```

### Context Abstraction

`Context` is the rendering abstraction. Canvas (`@ripl/core`) and SVG (`@ripl/svg`) each export a `createContext` function. All elements render through `Context`, making them context-agnostic.

### Scenegraph

Elements are organized in `Group` trees. `Scene` maintains a **hoisted buffer** — a flattened list of all renderable elements — converting render traversal from O(n^c) to O(n). The `Renderer` drives the animation loop via `requestAnimationFrame`.

### Event System

`EventBus` provides `on`, `off`, `once`, `emit` with:
- **Typed events** via `EventMap` generics
- **Event bubbling** through parent chain (mimics DOM capture phase)
- **Stop propagation** via `event.stopPropagation()`
- **Disposable subscriptions** — `on()` returns `{ dispose }` for cleanup
- **Self-only filtering** via `{ self: true }` subscription option

## Element & Shape Patterns

### Defining a Built-in Element

Every element follows this exact pattern:

1. **State interface** extending `BaseElementState`
2. **Class** extending `Shape<TState>` with getter/setter pairs using `getStateValue`/`setStateValue`
3. **Constructor** calling `super(type, options)` with a string type name
4. **`getBoundingBox()`** returning a `Box` instance
5. **`render(context)`** calling `super.render(context, path => { ... })`
6. **Factory function** `createX()`
7. **Type guard** `elementIsX()`

Example (from `circle.ts`):

```typescript
export interface CircleState extends BaseElementState {
    cx: number;
    cy: number;
    radius: number;
}

export class Circle extends Shape<CircleState> {

    public get cx() {
        return this.getStateValue('cx');
    }

    public set cx(value) {
        this.setStateValue('cx', value);
    }

    // ... cy, radius follow the same pattern

    constructor(options: ShapeOptions<CircleState>) {
        super('circle', options);
    }

    public getBoundingBox(): Box {
        return new Box(
            this.cy - this.radius,
            this.cx - this.radius,
            this.cy + this.radius,
            this.cx + this.radius
        );
    }

    public render(context: Context) {
        return super.render(context, path => {
            path.circle(this.cx, this.cy, Math.max(0, this.radius));
        });
    }

}

export function createCircle(...options: ConstructorParameters<typeof Circle>) {
    return new Circle(...options);
}

export function elementIsCircle(value: unknown): value is Circle {
    return value instanceof Circle;
}
```

### Key Rules

- State is managed through `getStateValue`/`setStateValue` — never set backing fields directly
- Each property must have an explicit getter/setter pair
- `Shape` provides `autoFill` and `autoStroke` — these automatically call `context.fill(path)` and `context.stroke(path)` after the render callback
- Use persistent path keys (`context.createPath(this.id)`) for SVG diffing efficiency

## Chart Patterns

### Base Chart Class

All charts extend `Chart<TOptions>` from `@ripl/charts`:

```typescript
export class BarChart<TData> extends Chart<BarChartOptions<TData>> {
    constructor(target: Context | string | HTMLElement, options?: BarChartOptions<TData>) {
        super(target, options);
        // setup...
        this.init();
    }
}
```

The base `Chart` class provides:
- **`scene`** and **`renderer`** — created automatically from the target
- **`render(callback)`** — async render with error handling
- **`update(options)`** — merges partial options and re-renders
- **`getChartArea()`** / **`getPadding()`** — layout helpers
- **`getAnimationDuration()`** — scales durations relative to `animationDuration` option
- **Color management** — `resolveSeriesColors()` and `getSeriesColor()` with a built-in color generator

### Chart Options

Chart option interfaces extend `BaseChartOptions`:

```typescript
export interface BarChartOptions<TData> extends BaseChartOptions {
    data: TData[];
    series: BarChartSeriesOptions<TData>[];
    keyBy: keyof TData | ((item: TData) => string);
    // ...
}
```

Charts should always provide a high level of options and customisation to the consumer. Underlying options such as axis, legend etc should also be passed through at the top level for configuration where applicable and appropriate.

### Reusable Chart Components

Charts compose reusable components from `@ripl/charts/components`:
- **`ChartXAxis` / `ChartYAxis`** — axis rendering with labels and ticks
- **`Grid`** — background grid lines
- **`Legend`** — series legend with positioning
- **`Tooltip`** — hover tooltips
- **`Crosshair`** — crosshair overlay for data exploration

### Data Binding — Array Join

Use `arrayJoin()` from `@ripl/utilities` to diff new data against existing elements:

```typescript
const {
    left: entries,
    inner: updates,
    right: exits,
} = arrayJoin(newData, existingElements, (datum, element) => datum.id === element.data);

arrayForEach(exits, el => el.destroy());
```

This returns new entries (`left`), matched updates (`inner`), and removed exits (`right`). Exits must be manually destroyed where appropriate. For more complex charts, such as multi-series charts, there will be multiple levels of data joining necessary to accurately render and animate. For example:

- Series Entries: New series entering the chart
  - Data Point Entries: New data points for this series
- Series Updates: Already exists on the chart
  - Data Point Entries: New data points for this series, often same as series entry animation
  - Data Point Updates: Existing data points changing in this series. often smoothly transition to new state
  - Data Point Exits: Data points leaving an existing series
- Series Exits: Series is exiting the chart
  - Data Point Exits: Data points exiting

Charts should handle these complex animation paths between initial render and updates. This principal also applies to more fixed assets like axes, where they should be drawn straight away on entry, but only transition to new states when the chart is updated, as opposed to completely redrawing again.

## TypeScript Standards

### General Rules

- **Strict mode** (`"strict": true`) — no implicit any, strict null checks, etc.
- **Target** ES2020, **module** ESNext
- Prefer **interfaces** over type aliases for object definitions
- Use **generics** for reusable, type-safe code
- Use meaningful, descriptive type names

### Import/Export Conventions

This is strictly enforced by ESLint:

1. Always use **named imports/exports** (no default exports)
2. Each import on its **own line** within braces
3. **Trailing comma** after the last import in a group
4. Sort imports **alphabetically** within each group
5. **Blank line** between import groups
6. Group ordering: **internal (current package) → other Ripl packages → external**

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
    typeIsArray,
    typeIsFunction,
    typeIsNil,
} from '@ripl/utilities';
```

### Type-only Imports

Use `import type { ... }` when importing types that are not used as values:

```typescript
import type {
    Context,
} from '../context';
```

## Code Style & Formatting

All enforced via ESLint + `@stylistic/eslint-plugin`:

| Rule | Value |
|------|-------|
| Indentation | 4 spaces |
| Quotes | Single quotes (with `avoidEscape`) |
| Semicolons | Always |
| Trailing commas | Always in arrays, objects, imports, exports; **never** in function params |
| Brace style | `1tbs` |
| Object properties | One per line (`object-property-newline`) |
| Object curlies in imports | Always on new lines |
| Line endings | Unix (LF) |

### Naming Conventions

- `camelCase` — variables, functions, methods
- `PascalCase` — classes, interfaces, types
- `UPPER_SNAKE_CASE` — constants
- **Minimum 2-character** identifiers (exceptions: `_`, `i`, `x`, `y`, color/math single-letter vars like `r`, `g`, `b`, `h`, `s`, `l`, `t`, `n`, `p`, etc.)

### Variable Declarations

- `const` by default
- `let` only when reassignment is necessary
- Never use `var`
- Declare variables close to where they are used

### Function Declarations

- Arrow functions for callbacks and methods
- Function declarations for standalone/exported functions
- Explicit return types for public API functions

## Utility Conventions (`@ripl/utilities`)

The project provides and prefers its own typed utility wrappers. Use these instead of native methods where the project has established the pattern:

### Type Guards (`typeIs*`)
```typescript
typeIsArray(value)    // value is unknown[]
typeIsFunction(value) // value is AnyFunction
typeIsNil(value)      // value is null | undefined
typeIsNumber(value)   // value is number
typeIsString(value)   // value is string
typeIsObject(value)   // value is object
typeIsDate(value)     // value is Date
typeIsBoolean(value)  // value is Boolean
```

### Collection Helpers
```typescript
arrayForEach, arrayMap, arrayFilter, arrayReduce, arrayFind, arrayFlatMap
arrayJoin  // left/inner/right join for data diffing
```

### Common Types
```typescript
OneOrMore<T>     // T | T[]
AnyFunction      // (...args: any[]) => any
AnyObject        // { [key: PropertyKey]: unknown }
Disposable       // { dispose: () => void }
Predicate<L, R>  // (left: L, right: R) => boolean
```

### Value Helpers
```typescript
valueOneOrMore(value)  // normalizes OneOrMore<T> to T[]
functionIdentity       // identity function
stringUniqueId()       // generates unique IDs
```

## Testing Standards

- **Framework:** Vitest with `jsdom` environment
- **File naming:** `*.test.ts` in `test/` directories mirroring `src/`
- **Structure:** `describe` blocks to group related tests
- **Test names:** `"Should [expected behavior]"` format
- **Assertions:** One assertion per line, destructure test values where appropriate
- **Coverage:** V8 provider, `text-summary` reporter

```typescript
import {
    describe,
    expect,
    test,
} from 'vitest';

import {
    scaleContinuous,
} from '../../src';

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

## Build System

**tsup** configuration (shared across packages):

- **Clean** output directory before builds
- **Declaration files** (`.d.ts`) generated
- **Source maps** enabled
- **Target:** ES2018
- **Formats:** ESM, CommonJS, IIFE
- **Entry:** `./src/index.ts`
- **Output:** `./dist`

**Package manager:** Yarn 4 (Berry) with PnP

## Performance Guidelines

1. **Hoisted scenegraph** — Use `Scene` + `Renderer` for rendering many elements. The scene flattens the group tree into a linear buffer for O(n) rendering
2. **Persistent path keys** — Always pass a stable ID to `context.createPath(id)` so SVG contexts can efficiently diff DOM elements between frames
3. **Memory lifecycle** — Be mindful of object creation/disposal; call `destroy()` on elements, scenes, and renderers when done
4. **Animation efficiency** — The `Renderer` uses `requestAnimationFrame` and auto-starts/stops based on activity; transitions are symbol-keyed per element to allow concurrent property animations
5. **`autoStop`** — Renderer stops ticking when idle (no active transitions and mouse has left) to avoid unnecessary CPU usage

## API Design Principles

1. **Unified rendering** — All elements work identically across Canvas and SVG contexts
2. **DOM-like API** — Groups support `add`, `remove`, `clear`, `query`, `queryAll`, `getElementById`, `getElementsByType`, `getElementsByClass`
3. **Composability** — Small, focused primitives compose into complex visualizations
4. **Tree-shakable** — Barrel exports (`export * from`) enable dead-code elimination
5. **Factory functions** — Every class has a corresponding `createX()` factory (e.g., `createCircle`, `createGroup`, `createScene`, `createRenderer`)
6. **Type guards** — Every element has an `elementIsX()` / `isX()` type guard function

## Dependencies

- **Zero runtime dependencies** — This is a core promise of the project. Do not add runtime dependencies.
- **Dev dependencies** are for build and test tooling only: TypeScript, tsup, Vitest, ESLint, happy-dom/jsdom
- When external libraries are necessary, prefer tree-shakable options

## Contribution Workflow

1. Write tests for new features and bug fixes
2. Ensure all tests pass (`yarn test`)
3. Ensure linting passes (`yarn lint`)
4. Follow the code style and patterns described in this document
5. Keep changes focused and atomic
6. Document public API with JSDoc comments (parameters, return values, examples)
7. Do not add runtime dependencies without explicit approval
