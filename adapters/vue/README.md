# @ripl/vue

[![npm](https://img.shields.io/npm/v/@ripl/vue)](https://www.npmjs.com/package/@ripl/vue)
[![license](https://img.shields.io/npm/l/@ripl/vue)](https://github.com/andrewcourtice/ripl/blob/main/LICENSE)
[![size](https://img.shields.io/bundlephobia/minzip/@ripl/vue)](https://bundlephobia.com/package/@ripl/vue)

> **Declarative Vue 3 components for [Ripl](https://www.ripl.run).** Describe a scene graph as a template, bind props to element state, and let `v-if` and `v-for` drive the graph.

## Features

- **Every built-in element as a component** — `<ripl-arc>`, `<ripl-circle>`, `<ripl-ellipse>`, `<ripl-image>`, `<ripl-line>`, `<ripl-path>`, `<ripl-polygon>`, `<ripl-polyline>`, `<ripl-rect>`, `<ripl-text>` and `<ripl-group>`, each typed with its own state properties.
- **Three levels of engine, all optional** — a context alone paints; add `<ripl-scene>` for a hoisted graph and z-ordering; add `<ripl-renderer>` for an animation loop and transitions.
- **`<ripl-transition>`** — enter, update and leave phases with per-element staggering, following Vue's own enter-from / leave-to model.
- **Pointer events as Vue listeners** — `@click`, `@mouseenter`, `@drag` and the rest, subscribed only when you bind them so hit testing stays accurate.
- **Compositions for the imperative escape hatch** — `useRiplContext`, `useRiplScene`, `useRiplRenderer` and `useRiplElement`.
- **Strict TypeScript, tree-shakable, SSR-safe.**

## Installation

```bash
# npm
npm install @ripl/vue

# yarn
yarn add @ripl/vue

# pnpm
pnpm add @ripl/vue
```

`vue` (3.5 or later) is a peer dependency you already have. `@ripl/core`, `@ripl/web`, `@ripl/dom` and `@ripl/utilities` arrive as dependencies of this package; you never install them yourself.

> This package targets `@ripl/web`, i.e. Canvas 2D. To render through another backend, build the context yourself and pass it in via the `context` prop on `<ripl-context>`.

## Quick start

Register the components globally:

```typescript
import {
    createRipl,
} from '@ripl/vue';

import {
    createApp,
} from 'vue';

import App from './app.vue';

createApp(App).use(createRipl()).mount('#app');
```

Then describe a scene. Give `<ripl-context>` a size, since the canvas fills it:

```vue
<template>
    <ripl-context style="width: 400px; height: 300px">
        <ripl-scene>
            <ripl-renderer>
                <ripl-transition
                    :enter="{ duration: 400, state: { opacity: 0, radius: 0 } }"
                    :update="{ duration: 250 }"
                    :leave="{ duration: 200, state: { opacity: 0 } }"
                >
                    <ripl-circle
                        v-for="item in items"
                        :key="item.id"
                        :cx="item.x"
                        :cy="item.y"
                        :radius="item.radius"
                        fill="#1e6978"
                        @click="select(item)"
                    />
                </ripl-transition>
            </ripl-renderer>
        </ripl-scene>
    </ripl-context>
</template>
```

Components can equally be imported one at a time, in which case the plugin is unnecessary.

## The three tiers

Each level adds capability, and every element picks up the highest one above it:

| Template | What you get |
| --- | --- |
| `<ripl-context>` | Elements paint directly. Pointer events and hit testing work. |
| `+ <ripl-scene>` | A hoisted, flat instruction stream: z-ordering, group clipping, efficient large graphs. |
| `+ <ripl-renderer>` | An animation loop, and `<ripl-transition>`. |

## Transitions

`enter` is the state an element animates *from*; `leave` is the state it animates *to*; `update` is how a prop change animates. Each takes an options object or a factory called per element, which is what makes staggering work:

```vue
<template>
    <ripl-transition
        :enter="(element, index, length) => ({
            duration: 400,
            delay: (index / length) * 200,
            state: { opacity: 0 },
        })"
    >
        <ripl-rect v-for="bar in bars" :key="bar.id" v-bind="bar" />
    </ripl-transition>
</template>
```

An enter phase can reference a property the template never binds: the target is read off the element before the enter state is applied, so fading in from `{ opacity: 0 }` recovers a target of `1` from the element's inherited or default state.

`loop` repeats a phase: `true` restarts it, `'alternate'` plays it back and forth. A looping phase never completes, so its `onComplete` never fires and the renderer cannot idle while one runs; it is cancelled when its element leaves, and ignored on the `leave` phase, which has to finish in order to destroy the element.

## Compositions

```typescript
import {
    useRiplContext,
    useRiplElement,
    useRiplRenderer,
    useRiplScene,
} from '@ripl/vue';

const context = useRiplContext();
const scene = useRiplScene();
const renderer = useRiplRenderer();
const element = useRiplElement();
```

Providers construct during `setup()`, so these already resolve in a descendant's own `setup()` with no watching required. They are `undefined` outside a provider, and during server rendering.

A template ref on any of the components resolves to the Ripl object it wraps, typed as that object:

```vue
<template>
    <ripl-context ref="context">
        <ripl-circle ref="circle" :cx="50" :cy="50" :radius="20" />
    </ripl-context>
</template>
```

## Notes

- A prop you do not bind is never written, so Ripl's own defaults and a group's cascading state survive. Changing a bound prop back to `undefined` likewise leaves the last value in place.
- Props are compared by identity, so an inline `:data="{ ... }"` or `:line-dash="[4, 2]"` re-applies on every parent render. Hoist those to a `computed`. `class` is normalised first, so every binding form is stable.

## Extending

`@ripl/vue` exports the pieces it is built from, so a sibling adapter can wrap a different kind of Ripl object without re-implementing the machinery. `@ripl/vue-3d` and `@ripl/vue-charts` are built this way.

| Export | Use |
| --- | --- |
| `defineRiplElement`, `elementFactory` | Wrap anything that extends `Element` as a component. |
| `useElementProps` | Construct an object from bound props and keep it in sync with them. |
| `useForwardedEvents` | Forward a bus's own `$events` to Vue listeners, subscribing only to bound ones. |
| `useExposedInstance` | Make a template ref resolve to the Ripl object rather than a Vue proxy. |
| `registerComponents` | Register components on an app, skipping names already taken. |
| `RIPL_CONTEXT`, `RIPL_SCENE`, `RIPL_RENDERER`, `RIPL_PARENT`, `RIPL_ELEMENT`, `RIPL_TREE`, `RIPL_TRANSITION` | The injection keys the components provide. |
| `readBoundProps`, `collectChangedProps`, `partitionProps`, `applyState`, `applyFields` | The prop pipeline. |

Two contracts a sibling adapter depends on:

- **This package owns the `@ripl/web` import**, and with it the platform factory: `requestAnimationFrame`, `devicePixelRatio`, `getDefaultState` and `measureText`. A sibling adapter inherits that through its dependency on `@ripl/vue` and should not add an `@ripl/web` import of its own, because a bare side-effect import inside a `sideEffects: false` package can be tree-shaken away, whereas the value imports here cannot.
- **The injection keys are registry symbols** (`Symbol.for`), so two copies of this module, which the standalone IIFE builds produce, still resolve to the same key.

Plugins compose in any order: `createRipl3D()` and `createRiplCharts()` install the core components themselves, and registering a name twice is a no-op.

## Documentation

Full documentation lives at [ripl.run](https://www.ripl.run).

## License

MIT
