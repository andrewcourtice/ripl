---
outline: "deep"
---

# Custom Contexts

Ripl's context-agnostic architecture means you can create your own rendering context to target any medium — WebGL, PDF, terminal output, or anything else. A custom context implements the abstract methods defined by the base `Context` class, and all existing elements will render to it automatically.

## Architecture Overview

The rendering pipeline flows like this:

```text
Element → render(context) → context.createPath() / context.createText()
                          → context.fill() / context.stroke()
                          → context.save() / context.restore()
```

A context must implement these operations for its target medium. The Canvas context translates them to Canvas 2D API calls; the SVG context translates them to SVG DOM nodes. Your custom context translates them to whatever your target requires.

## Extending Context

To create a custom context, extend the base `Context` class and implement all abstract methods:

```ts
import { Context, ContextPath, ContextText } from '@ripl/core';
import type { BaseContextState } from '@ripl/core';

class MyContext extends Context {

    constructor(target: string | HTMLElement) {
        super('my-context', target, {
            buffer: false,
        });
    }

    // --- Abstract methods to implement ---

    // Create the root DOM element for this context
    protected createRootElement(): HTMLElement {
        const el = document.createElement('div');
        this.root.appendChild(el);
        return el;
    }

    // Apply a state property to the rendering target
    protected setStateValue(
        key: string,
        value: unknown,
        element: HTMLElement
    ): void {
        // Map Ripl state properties to your rendering target
        // e.g., for a CSS-based renderer:
        // element.style[key] = value;
    }

    // Create a path object for shape rendering
    createPath(key?: string): ContextPath {
        return new MyContextPath(key);
    }

    // Create a text object for text rendering
    createText(options: {
        id?: string;
        x: number;
        y: number;
        content: string;
    }): ContextText {
        return new MyContextText(options);
    }

    // Fill a path or text
    fill(target: ContextPath | ContextText, fillRule?: string): void {
        // Implement fill rendering
    }

    // Stroke a path
    stroke(target: ContextPath): void {
        // Implement stroke rendering
    }

    // Clear the rendering area
    clear(): void {
        // Clear your rendering target
    }

    // Measure text dimensions
    measureText(text: string): TextMetrics {
        // Return text measurements
    }

    // Hit testing
    isPointInPath(path: ContextPath, x: number, y: number): boolean {
        return false;
    }

    isPointInStroke(path: ContextPath, x: number, y: number): boolean {
        return false;
    }

    // Transform operations
    rotate(angle: number): void {}
    scale(x: number, y: number): void {}
    translate(x: number, y: number): void {}
    setTransform(a: number, b: number, c: number, d: number, e: number, f: number): void {}
    transform(a: number, b: number, c: number, d: number, e: number, f: number): void {}
    clip(path: ContextPath, fillRule?: string): void {}
    reset(): void {}
}
```

## Implementing ContextPath

A `ContextPath` represents a geometric path. Your custom implementation must track the path commands so they can be rendered later:

```ts
class MyContextPath extends ContextPath {
    private commands: Array<{ type: string; args: number[] }> = [];

    moveTo(x: number, y: number): void {
        this.commands.push({ type: 'moveTo', args: [x, y] });
    }

    lineTo(x: number, y: number): void {
        this.commands.push({ type: 'lineTo', args: [x, y] });
    }

    arc(x: number, y: number, radius: number,
        startAngle: number, endAngle: number,
        counterclockwise?: boolean): void {
        this.commands.push({
            type: 'arc',
            args: [x, y, radius, startAngle, endAngle,
                   counterclockwise ? 1 : 0],
        });
    }

    ellipse(x: number, y: number, radiusX: number, radiusY: number,
            rotation: number, startAngle: number, endAngle: number,
            counterclockwise?: boolean): void {
        this.commands.push({
            type: 'ellipse',
            args: [x, y, radiusX, radiusY, rotation,
                   startAngle, endAngle, counterclockwise ? 1 : 0],
        });
    }

    rect(x: number, y: number, width: number, height: number): void {
        this.commands.push({ type: 'rect', args: [x, y, width, height] });
    }

    circle(x: number, y: number, radius: number): void {
        this.commands.push({ type: 'circle', args: [x, y, radius] });
    }

    bezierCurveTo(cp1x: number, cp1y: number,
                  cp2x: number, cp2y: number,
                  x: number, y: number): void {
        this.commands.push({
            type: 'bezierCurveTo',
            args: [cp1x, cp1y, cp2x, cp2y, x, y],
        });
    }

    quadraticCurveTo(cpx: number, cpy: number,
                     x: number, y: number): void {
        this.commands.push({
            type: 'quadraticCurveTo',
            args: [cpx, cpy, x, y],
        });
    }

    closePath(): void {
        this.commands.push({ type: 'closePath', args: [] });
    }
}
```

## Implementing ContextText

A `ContextText` represents a text element to be rendered:

```ts
class MyContextText extends ContextText {
    readonly x: number;
    readonly y: number;
    readonly content: string;

    constructor(options: { x: number; y: number; content: string }) {
        super();
        this.x = options.x;
        this.y = options.y;
        this.content = options.content;
    }
}
```

## State Management

The base `Context` class manages a state stack via `save()` and `restore()`. Your context inherits this automatically. The `setStateValue` method is called whenever a state property changes — this is where you map Ripl's unified state properties to your target's API.

Key state properties to handle:

| Property | Description |
| --- | --- |
| `fillStyle` | Fill color or gradient string |
| `strokeStyle` | Stroke color or gradient string |
| `lineWidth` | Stroke width |
| `lineCap` | Line end style |
| `lineJoin` | Line join style |
| `globalAlpha` | Opacity |
| `font` | Font string |
| `textAlign` | Text alignment |
| `textBaseline` | Text baseline |

## Persistent Path Keys

When `createPath(key)` is called with a key, the key acts as a persistent identifier for that path across renders. This is critical for contexts that maintain a DOM (like SVG) — it allows efficient diffing and reconciliation instead of recreating elements every frame.

For Canvas-like contexts that redraw from scratch each frame, the key can be ignored.

## Registering Your Context

Once implemented, your context is used exactly like the built-in ones:

```ts
function createContext(target: string | HTMLElement) {
    return new MyContext(target);
}

// Use it with any Ripl element
const context = createContext('.my-container');
const circle = createCircle({ fillStyle: '#3a86ff', cx: 100, cy: 100, radius: 50 });
circle.render(context);
```

## Reference Implementations

For complete working examples of custom contexts, study the built-in implementations:

- **Canvas Context** — `@ripl/core` (`packages/core/src/context/canvas.ts`) — The simplest implementation, maps directly to the Canvas 2D API
- **SVG Context** — `@ripl/svg` (`packages/svg/src/index.ts`) — A more complex implementation with virtual DOM reconciliation and gradient management
