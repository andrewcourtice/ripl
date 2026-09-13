---
title: Hooks
description: "useRiplContext, useRiplScene, useRiplRenderer and useRiplElement: reaching the underlying Ripl objects when the declarative surface is not enough."
---

# Hooks

Four hooks expose the objects the components build. Use them for the things JSX cannot express: exporting an image, querying the graph, driving an ad-hoc transition.

```ts
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

Each returns the Ripl object itself, not a wrapper. A descendant always sees a resolved value:

```tsx
function Probe() {
    const scene = useRiplScene();

    // Already resolved.
    console.log(scene?.width, scene?.height);

    return null;
}
```

They are `undefined` outside the matching provider, and during server rendering. Both are ordinary, so guard with `?.` rather than asserting.

## `useRiplContext`

The rendering context, which is the drawing surface. Useful for exporting:

```tsx
function Download() {
    const context = useRiplContext();

    const download = () => {
        const url = context?.export().toURL();

        if (url) {
            window.open(url);
        }
    };

    return <button onClick={download}>Export</button>;
}
```

## `useRiplScene`

The scene, when a `<RiplScene>` encloses the caller. Gives you the graph query API:

```ts
const scene = useRiplScene();

const active = scene?.queryAll('.segment.active');
const byId = scene?.getElementById('total');
```

## `useRiplRenderer`

The renderer, when a `<RiplRenderer>` encloses the caller. Use it to drive a transition that no prop change describes:

```ts
const renderer = useRiplRenderer();
const element = useRiplElement();

const pulse = () => renderer?.transition(element!, {
    duration: 300,
    loop: 'alternate',
    state: {
        opacity: 0.4,
    },
});
```

`renderer.transition` returns a cancelable promise, so it can be awaited or aborted.

## `useRiplElement`

The nearest enclosing element, group or scene. Called from a component nested inside a `<RiplGroup>`, it returns that group, which lets you write a component that contributes to whatever group it is dropped into:

```tsx
import {
    isGroup,
} from '@ripl/web';

function Bounds() {
    const parent = useRiplElement();
    const bounds = isGroup(parent) ? parent.getBoundingBox() : undefined;

    return null;
}
```

## Refs

A `ref` on any Ripl component resolves to the object that component wraps, not to anything React owns, so a ref is the second way to reach one alongside the hooks and `<RiplContext>`'s `onReady`:

```tsx
import {
    useRef,
} from 'react';

import type {
    Circle,
    Context,
} from '@ripl/web';

function Chart() {
    const context = useRef<Context>(null);
    const circle = useRef<Circle>(null);

    const download = () => window.open(context.current?.export().toURL());

    return (
        <RiplContext ref={context}>
            <RiplScene>
                <RiplCircle ref={circle} cx={50} cy={50} radius={20} />
            </RiplScene>
        </RiplContext>
    );
}
```

Each ref is typed as the object it holds, so `circle.current.radius` and `scene.current.queryAll(...)` are checked as you would expect. A ref is set on commit, so read it from an effect or an event handler rather than during render. Reach for the hooks when you need the object during render.

## Holding Ripl objects

Ripl instances are deeply mutable and carry `Set`s, `Map`s and caches, so they do not belong in `useState` as values you expect React to diff. The hooks hand back raw instances; if you store one yourself, use a ref or keep the reference stable.
