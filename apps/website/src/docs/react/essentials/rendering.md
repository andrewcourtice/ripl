---
title: Rendering
description: "How <RiplContext>, <RiplScene> and <RiplRenderer> layer up, what each one adds, and why paint order tracks JSX order despite effects running children-first."
---

# Rendering

Three components map onto Ripl's three rendering concerns. Each is optional above the one before it, and an element picks up the highest tier declared above it.

## `<RiplContext>`

Creates the drawing surface and provides it to everything below. It renders a plain element that the canvas fills, so it needs a size, whether from `className`, `style`, or its parent's layout.

```tsx
<RiplContext
    className="chart"
    interactive
    dragThreshold={3}
    onReady={onReady}
    onResize={onResize}
>
    <RiplCircle cx={20} cy={20} radius={10} />
</RiplContext>
```

| Prop | Description |
| --- | --- |
| `context` | An existing `Context` to draw into instead of creating one. Use this for a non-canvas backend, or to keep a context alive across re-mounts. |
| `interactive` | Whether the context listens for and emits pointer and drag events. Defaults to `true`. |
| `dragThreshold` | Minimum pointer movement, in pixels, before a drag is recognised. Defaults to `3`. |
| `meta` | Arbitrary metadata attached to the context. |
| `className`, `style` | Passed through to the component's root element. React has no attribute fallthrough, so a component that owns a real element has to accept these explicitly. |

It fires `onReady` with the context once its host element is in the document, plus `onResize`, `onRender`, and every [pointer event](/docs/react/essentials/events).

Resizing is handled by the context itself through a `ResizeObserver`. Do not add your own.

To render through SVG or another backend, build the context and pass it in:

```tsx
const [context, setContext] = useState<Context>();

useLayoutEffect(() => {
    const created = createContext(host.current!);

    setContext(created);

    return () => created.destroy();
}, []);

return <RiplContext context={context} />;
```

A context you supply is yours to destroy; one the component creates is destroyed with it.

## `<RiplScene>`

Creates a scene bound to the enclosing context and parents its subtree to it. A scene hoists the element tree into a flat instruction stream, which is what makes z-ordering, group clipping and large graphs efficient.

A scene is also an element, so its state props cascade to every descendant that does not set its own:

```tsx
<RiplContext>
    <RiplScene fill="#333" font="14px sans-serif" renderOnResize>
        <RiplText x={10} y={20} content="Inherits the fill and font" />
    </RiplScene>
</RiplContext>
```

`renderOnResize` (default `true`) controls whether the scene repaints automatically when the context resizes.

## `<RiplRenderer>`

Drives the enclosing scene with a `requestAnimationFrame` loop, and makes [transitions](/docs/react/essentials/transitions) available to its subtree.

```tsx
<RiplContext>
    <RiplScene>
        <RiplRenderer autoStop={false} debug={{ fps: true }} onTick={onTick}>
            <RiplCircle cx={x} cy={50} radius={20} />
        </RiplRenderer>
    </RiplScene>
</RiplContext>
```

| Prop | Description |
| --- | --- |
| `autoStart` | Whether the loop starts on creation. Defaults to `true`. |
| `autoStop` | Whether the loop stops when idle: no active transitions and the pointer has left. Defaults to `true`. |
| `immediate` | Whether transitions apply their final state immediately rather than animating. |
| `debug` | Debug overlays: `true` for all, or an object toggling `fps`, `elementCount` and `boundingBoxes`. |

It fires `onStart`, `onStop` and `onTick`.

> [!NOTE]
> A stopped renderer is woken automatically when a prop changes. Ripl's own loop only restarts on graph changes, pointer movement or a transition, so the adapter restarts it explicitly whenever it writes state.

## Ordering, and why it works

React runs layout effects children-first, which is exactly the wrong order for attaching elements to a group. The adapter does not rely on it.

Each element renders a single hidden marker node, and React guarantees those markers land in the DOM in JSX order. The tree reads that order back and replays it onto the group, so paint order tracks the declaration however the effects happened to run. The same mechanism covers a keyed list reorder, which moves components rather than remounting them, and so produces no effects at all.

The objects themselves divide in two:

- **A context, scene or renderer owns a real resource** — a canvas, an observer, an animation loop — so each is built in a layout effect and published through state. Its children render once it exists, which is why a descendant's `useRiplScene()` always resolves. On mount that costs at most three extra passes, all of them synchronous and before paint.
- **An element owns nothing but itself**, so it is constructed during render and only *attached* in an effect. That keeps element trees to a single pass and lets a `<RiplGroup>` exist before its children need it as a parent.

Both halves are symmetric under React's development-mode double mount: anything a cleanup tore down is rebuilt rather than reused.
