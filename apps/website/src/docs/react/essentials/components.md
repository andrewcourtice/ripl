---
title: Components
description: "The built-in element components, how props map onto element state, className and data binding, and grouping with <RiplGroup>."
---

# Components

Every built-in Ripl element has a component. Props map directly onto the element's state, so the names match the imperative API exactly.

| Component | Own state props |
| --- | --- |
| `<RiplArc>` | `cx`, `cy`, `startAngle`, `endAngle`, `radius`, `innerRadius`, `padAngle`, `padWidth`, `borderRadius` |
| `<RiplCircle>` | `cx`, `cy`, `radius` |
| `<RiplEllipse>` | `cx`, `cy`, `radiusX`, `radiusY`, `startAngle`, `endAngle` |
| `<RiplImage>` | `image`, `x`, `y`, `width`, `height` |
| `<RiplLine>` | `x1`, `y1`, `x2`, `y2` |
| `<RiplPath>` | `x`, `y`, `width`, `height` |
| `<RiplPolygon>` | `cx`, `cy`, `radius`, `sides` |
| `<RiplPolyline>` | `points`, `renderer`, `segments` |
| `<RiplRect>` | `x`, `y`, `width`, `height`, `borderRadius` |
| `<RiplText>` | `x`, `y`, `content`, `pathData`, `startOffset` |
| `<RiplGroup>` | — |

## Shared props

On top of its own state, every component accepts the full base state (`fill`, `stroke`, `opacity`, `lineWidth`, `lineDash`, `lineCap`, `lineJoin`, `font`, `textAlign`, `shadowBlur`, `zIndex`, `translateX`, `translateY`, `rotation`, `transformScaleX`, `transformOriginX` and the rest) plus:

| Prop | Description |
| --- | --- |
| `id` | Stable id used for querying and for matching an element across renders. |
| `className` | Class names for querying: a string, an array, or an object whose truthy keys are the active names. |
| `data` | Arbitrary user data, typically the datum backing the element. |
| `pointerEvents` | Which parts respond to hit testing: `all`, `none`, `stroke` or `fill`. |
| `interpolators` | Per-property interpolator overrides, layered over the element type's own. Read once, at construction. |
| `autoFill`, `autoStroke`, `clip`, `cachePath` | Painting flags on path-backed shapes. |

`className` binds the element's own class list rather than anything in the DOM, so `scene.query('.segment')` finds it:

```tsx
<RiplCircle className={['segment', { active: isActive }]} cx={10} cy={10} radius={5} />
```

## Unbound props keep Ripl's defaults

A prop you do not bind is not written to the element. This matters for the base state, which is inherited: leaving `fill` unbound lets a parent group's fill cascade through, whereas binding it to `undefined` would not.

```tsx
<RiplGroup fill="#e5484d">
    {/* red, inherited from the group */}
    <RiplCircle cx={10} cy={10} radius={5} />
    {/* blue, its own */}
    <RiplCircle cx={30} cy={10} radius={5} fill="#1e6978" />
</RiplGroup>
```

A prop cannot be *unset* later either: changing a bound prop back to `undefined` leaves the element at its last value rather than restoring the default. Bind the default explicitly if you need to return to it.

## Object and array bindings

Props are compared by identity, so an inline `lineDash={[4, 2]}`, or an object literal handed to `data`, looks like a change on every render. Hoist those to a `useMemo`, a module constant, or the datum itself:

```tsx
const dash = useMemo(() => (emphasised ? [4, 2] : []), [emphasised]);

return <RiplLine x1={0} y1={0} x2={100} y2={0} lineDash={dash} />;
```

`className` is exempt: it is normalised before comparison, so every binding form is stable.

## `<RiplGroup>`

Groups its children, cascading its own state to them and transforming them as a unit. Groups nest arbitrarily.

```tsx
<RiplGroup className="axis" fill="#e5484d" translateX={20} translateY={10} opacity={0.8}>
    <RiplCircle cx={0} cy={0} radius={5} />
    <RiplGroup rotation={Math.PI / 4}>
        <RiplRect x={0} y={0} width={10} height={10} />
    </RiplGroup>
</RiplGroup>
```

A group's `opacity` composites multiplicatively with its children's, and its transform applies to the whole subtree.

## Paint order

Children paint in JSX order, and reordering a keyed list reorders the paint order to match. Use `zIndex` when you need an order that differs from the markup:

```tsx
<>
    <RiplRect x={0} y={0} width={50} height={50} zIndex={1} fill="#1e6978" />
    <RiplCircle cx={25} cy={25} radius={20} zIndex={0} fill="#e5484d" />
</>
```

`zIndex` is additive down the tree: a child's effective z-index is its own plus its parent's.

## Custom components

`defineRiplElement` builds a component for an element Ripl does not ship, given its state property names and a factory:

```tsx
import {
    defineRiplElement,
} from '@ripl/react';

const RiplStar = defineRiplElement({
    name: 'RiplStar',
    stateKeys: ['cx', 'cy', 'radius', 'points'],
    create: options => createStar(options),
});
```
