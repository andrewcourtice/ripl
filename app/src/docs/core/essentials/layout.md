---
outline: "deep"
---

# Layout

**Layout containers** position their children dynamically. Where a [Group](/docs/core/essentials/group) only organises elements and cascades styles, a layout container computes and applies each child's position based on layout rules — and keeps them arranged as content and options change.

Ripl ships two layout containers, both built on a shared `Layout` base:

- **[Flex](/docs/core/elements/flex)** — one-dimensional rows/columns with distribution, wrapping, and alignment (like CSS flexbox).
- **[Grid](/docs/core/elements/grid)** — two-dimensional rows and columns of sized tracks (like CSS grid).

## The model

A layout container is an abstract `Group`, so it inherits child management (`add`, `remove`, `set`, `clear`), querying (`query`, `getElementsByType`, …), and style inheritance. On top of that it adds:

- **An origin** — `x` and `y` define the top-left of the layout box. Children are positioned relative to it.
- **Optional size** — set `width`/`height` for a fixed box, or leave them out to **size to content** (the container measures its children and reports a bounding box that hugs them).
- **Spacing** — `padding` (uniform or per-edge) and `gap` between children.

Layout containers **nest**: a Flex or Grid can contain another as a child, and positions compose into absolute scene coordinates.

```ts
import {
    createFlex,
    createGrid,
    createRect,
} from '@ripl/web';

const card = createFlex({
    x: 0,
    y: 0,
    flexDirection: 'column',
    gap: 12,
    padding: 16,
    children: [
        createRect({
            x: 0,
            y: 0,
            width: 200,
            height: 24,
        }), // title
        createGrid({
            x: 0,
            y: 0,
            columns: 2,
            gap: 8,
            children: items.map(() => createRect({
                x: 0,
                y: 0,
                width: 90,
                height: 60,
            })),
        }),
    ],
});
```

## How positioning works

Ripl's renderer draws a flattened list of leaf elements, so a container's own transform is never applied to its children. Instead, a layout container writes **concrete positions onto the children themselves**:

- **Leaf shapes** are positioned via their `translateX` / `translateY`.
- **Nested layout containers** are positioned via their own `x` / `y` origin, which cascades to their children.

The practical consequence: a laid-out child's `translateX`/`translateY` is **owned by the layout**. Don't also set `translate` manually on a child that a layout manages — instead adjust its intrinsic coordinates, wrap it, or animate it after layout. Everything else about the child (fill, stroke, events, querying) is untouched.

## Reactivity

Layout is automatic. A container re-flows when:

- children are **added or removed**,
- a child's **size changes** (e.g. a `Rect`'s `width`, a `Text`'s content),
- one of the container's own **layout options changes** (`gap`, `justify`, `padding`, …).

These changes are detected through Ripl's event system and coalesced into a **single relayout per animation frame**, so bursts of updates cost one pass. After a reflow the scene is repainted automatically.

You can also force a synchronous relayout at any time:

```ts
flex.reflow();
```

## Animating layout

Because layout options and child positions are ordinary animatable state, reflow can be animated. Note that `renderer.transition(...)` writes state directly (bypassing the change events), so animating a layout option won't auto-reflow every frame on its own. To animate a rearrangement smoothly, call `reflow()` on each renderer `tick` while the transition runs; otherwise the layout snaps to its new arrangement in a single frame.

> [!NOTE]
> For full APIs, see [Flex](/docs/core/elements/flex) and [Grid](/docs/core/elements/grid).
