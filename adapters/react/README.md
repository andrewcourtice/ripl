# @ripl/react

[![npm](https://img.shields.io/npm/v/@ripl/react)](https://www.npmjs.com/package/@ripl/react)
[![license](https://img.shields.io/npm/l/@ripl/react)](https://github.com/andrewcourtice/ripl/blob/main/LICENSE)
[![size](https://img.shields.io/bundlephobia/minzip/@ripl/react)](https://bundlephobia.com/package/@ripl/react)

> **Declarative React components for [Ripl](https://www.ripl.run).** Describe a scene graph as JSX, bind props to element state, and let your own state drive the graph.

## Features

- **Every built-in element as a component** — `<RiplArc>`, `<RiplCircle>`, `<RiplEllipse>`, `<RiplImage>`, `<RiplLine>`, `<RiplPath>`, `<RiplPolygon>`, `<RiplPolyline>`, `<RiplRect>`, `<RiplText>` and `<RiplGroup>`, each typed with its own state properties.
- **Three levels of engine, all optional** — a context alone paints; add `<RiplScene>` for a hoisted graph and z-ordering; add `<RiplRenderer>` for an animation loop and transitions.
- **`<RiplTransition>`** — enter, update and leave phases with per-element staggering.
- **Pointer events as props** — `onClick`, `onMouseenter`, `onDrag` and the rest, subscribed only when you bind them so hit testing stays accurate, and never resubscribed just because you passed a new arrow.
- **Hooks for the imperative escape hatch** — `useRiplContext`, `useRiplScene`, `useRiplRenderer` and `useRiplElement`.
- **Strict TypeScript, tree-shakable, SSR-safe, StrictMode-clean.**

## Installation

```bash
# npm
npm install @ripl/react

# yarn
yarn add @ripl/react

# pnpm
pnpm add @ripl/react
```

`react` (18.3 or later, including 19) is a peer dependency you already have. `@ripl/core`, `@ripl/web`, `@ripl/adapters` and friends arrive as dependencies of this package; you never install them yourself.

> This package targets `@ripl/web`, i.e. Canvas 2D. To render through another backend, build the context yourself and pass it in via the `context` prop on `<RiplContext>`.

## Quick start

There is no plugin and no global registration. Import the components you use:

```tsx
import {
    RiplCircle,
    RiplContext,
    RiplRenderer,
    RiplScene,
    RiplTransition,
} from '@ripl/react';

export function Chart({ items, onSelect }) {
    return (
        <RiplContext style={{ width: 400, height: 300 }}>
            <RiplScene>
                <RiplRenderer>
                    <RiplTransition
                        enter={{ duration: 400, state: { opacity: 0, radius: 0 } }}
                        update={{ duration: 250 }}
                        leave={{ duration: 200, state: { opacity: 0 } }}
                    >
                        {items.map(item => (
                            <RiplCircle
                                key={item.id}
                                cx={item.x}
                                cy={item.y}
                                radius={item.radius}
                                fill="#1e6978"
                                onClick={() => onSelect(item)}
                            />
                        ))}
                    </RiplTransition>
                </RiplRenderer>
            </RiplScene>
        </RiplContext>
    );
}
```

`<RiplContext>` renders a plain element the canvas fills, so give it a size through `style` or `className`.

## The three tiers

Each level adds capability, and every element picks up the highest one above it:

| Tree | What you get |
| --- | --- |
| `<RiplContext>` | Elements paint directly. Pointer events and hit testing work. |
| `+ <RiplScene>` | A hoisted, flat instruction stream: z-ordering, group clipping, efficient large graphs. |
| `+ <RiplRenderer>` | An animation loop, and `<RiplTransition>`. |

## Transitions

`enter` is the state an element animates *from*; `leave` is the state it animates *to*; `update` is how a prop change animates. Each takes an options object, or a factory called per element to stagger them:

```tsx
<RiplTransition
    enter={(element, index, length) => ({
        duration: 400,
        delay: (index / length) * 200,
        state: { opacity: 0 },
    })}
>
    {bars.map(bar => <RiplRect key={bar.id} {...bar} />)}
</RiplTransition>
```

An enter phase can reference a property you never bind: the target is read off the element before the enter state is applied, so fading in from `{ opacity: 0 }` recovers a target of `1` from the element's inherited or default state.

`loop` repeats a phase: `true` restarts it, `'alternate'` plays it back and forth. A looping phase never completes, so its `onComplete` never fires and the renderer cannot idle while one runs; it is cancelled when its element leaves, and ignored on the `leave` phase, which has to finish in order to destroy the element.

## Hooks

```tsx
import {
    useRiplContext,
    useRiplElement,
    useRiplRenderer,
    useRiplScene,
} from '@ripl/react';

const context = useRiplContext();
const scene = useRiplScene();
const renderer = useRiplRenderer();
const element = useRiplElement();
```

Each returns the Ripl object itself, or `undefined` outside its provider and during server rendering. A provider builds its object in a layout effect and publishes it through state, so a descendant always renders once it exists.

A `ref` on any component resolves to the Ripl object it wraps, typed as that object:

```tsx
const circle = useRef<Circle>(null);

<RiplContext>
    <RiplCircle ref={circle} cx={50} cy={50} radius={20} />
</RiplContext>
```

## Notes

- A prop you do not bind is never written, so Ripl's own defaults and a group's cascading state survive. Changing a bound prop back to `undefined` likewise leaves the last value in place.
- Props are compared by identity, so an inline `lineDash={[4, 2]}`, or an object literal handed to `data`, re-applies on every render. Hoist those to a `useMemo` or a module constant. `className` is normalised first, so every binding form is stable.
- `className` binds the element's own class list, not the marker node the component renders, so `scene.query('.segment')` finds it.

## Extending

`@ripl/react` exports the pieces it is built from, so a sibling adapter can wrap a different kind of Ripl object without re-implementing the machinery. `@ripl/react-3d` and `@ripl/react-charts` are built this way.

| Export | Use |
| --- | --- |
| `defineRiplElement`, `elementFactory` | Wrap anything that extends `Element` as a component. |
| `useRiplInstance`, `useRiplResource`, `useRiplLazy` | Build a Ripl object and tie its lifetime to the component's. |
| `useElementProps`, `useElementTransition` | Keep an element in sync with props, and run its transition phases. |
| `useForwardedEvents` | Forward a bus's own `$events` to listener props, subscribing only to bound ones. |
| `RIPL_CONTEXT`, `RIPL_SCENE`, `RIPL_RENDERER`, `RIPL_PARENT`, `RIPL_ELEMENT`, `RIPL_TREE`, `RIPL_TRANSITION` | The React contexts the components provide. |
| `readElementSnapshot`, `readBoundProps`, `collectChangedProps`, `partitionProps`, `applyState`, `applyFields` | The prop pipeline. |

The framework-agnostic half of that toolkit lives in [`@ripl/adapters`](../../packages/adapters) and is re-exported here, so one import covers a whole adapter.

Two contracts a sibling adapter depends on:

- **`@ripl/adapters` owns the `@ripl/web` import**, and with it the platform factory: `requestAnimationFrame`, `devicePixelRatio`, `getDefaultState` and `measureText`. A sibling adapter inherits that through its dependency on this package and should not add an `@ripl/web` import of its own, because a bare side-effect import inside a `sideEffects: false` package can be tree-shaken away, whereas the value imports there cannot.
- **The React contexts live in a registry keyed by `Symbol.for`**, so the two copies of this module that the standalone IIFE builds produce still resolve to the same context.

## Documentation

Full documentation lives at [ripl.run](https://www.ripl.run/docs/react/).

## License

MIT
