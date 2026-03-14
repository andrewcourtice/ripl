---
outline: "deep"
---

# Group

A **Group** is a container for organizing elements into a hierarchy — much like a `<div>` in HTML. Groups support property inheritance, child management, and powerful querying capabilities inspired by the DOM.

Groups are the backbone of Ripl's scene graph. By nesting elements inside groups, you can apply shared styles (which cascade to children like CSS), manage collections of elements as a unit, and use CSS-like selectors to find elements deep in the tree. Groups themselves don't draw anything — they orchestrate their children.

## Creating a Group

```ts
import {
    createCircle,
    createGroup,
    createRect,
} from '@ripl/web';

const circle = createCircle({
    cx: 100,
    cy: 100,
    radius: 40,
});

const rect = createRect({
    x: 160,
    y: 60,
    width: 80,
    height: 80,
});

const group = createGroup({
    fill: '#3a86ff',
    children: [circle, rect],
});
```

## Property Inheritance

Style properties set on a group are **inherited** by all child elements that don't explicitly set those properties. This works just like CSS inheritance:

```ts
const group = createGroup({
    fill: '#3a86ff', // inherited by all children
    lineWidth: 2, // inherited by all children
    children: [
        createCircle({
            cx: 80,
            cy: 100,
            radius: 40,
        }), // uses group's fill
        createCircle({
            cx: 200,
            cy: 100,
            radius: 40,
            fill: '#ff006e',
        }), // overrides fill
    ],
});
```

## Child Management

### `add(element)`

Add one or more elements to the group:

```ts
group.add(newCircle);
group.add([circle1, circle2]);
```

If an element already has a parent, it is automatically removed from its previous parent before being added.

### `remove(element)`

Remove one or more elements:

```ts
group.remove(circle);
group.remove([circle1, circle2]);
```

### `clear()`

Remove all children:

```ts
group.clear();
```

### `set(elements)`

Replace all children with a new set:

```ts
group.set([newCircle, newRect]);
```

### `children`

Get an array of direct child elements:

```ts
const kids = group.children; // Element[]
```

### `graph(includeGroups?)`

Flatten the entire element tree into a single array. This recursively collects all non-group elements. Pass `true` to include group elements in the result:

```ts
const allElements = group.graph(); // only leaf elements
const everything = group.graph(true); // includes groups too
```

## Querying Elements

Groups provide several methods for finding elements, inspired by the DOM API.

### `getElementById(id)`

```ts
const circle = group.getElementById('my-circle');
```

### `getElementsByType(type)`

```ts
const circles = group.getElementsByType('circle');
const rectsAndLines = group.getElementsByType(['rect', 'line']);
```

### `getElementsByClass(classes)`

```ts
const highlighted = group.getElementsByClass('highlighted');
const both = group.getElementsByClass(['active', 'visible']);
```

### `query(selector)` / `queryAll(selector)`

CSS-like selector querying. Returns the first match or all matches:

```ts
const el = group.query('circle.highlighted');
const all = group.queryAll('.shape');
```

#### Supported Selector Syntax

```css
/* Type */
circle

/* ID */
#my-element

/* Class */
.highlighted

/* Attribute */
circle[radius="50"]

/* Descendants */
.parent circle
.parent > circle

/* Sibling */
rect + circle
```

## Nesting Groups

Groups can contain other groups, creating a tree structure:

```ts
const innerGroup = createGroup({
    fill: '#3a86ff',
    children: [circle1, circle2],
});

const outerGroup = createGroup({
    lineWidth: 2,
    children: [innerGroup, rect],
});
```

Child elements inherit properties through the full chain — `circle1` inherits `lineWidth` from `outerGroup` and `fill` from `innerGroup`.

## Rendering

Call `render(context)` to draw all children in order:

```ts
group.render(context);
```

Groups themselves are **abstract** — they don't draw anything directly. They simply iterate over their children and render each one.

> [!NOTE]
> For the full list of Group properties and methods, see the [Group API Reference](/docs/api/@ripl/core/).

## Demo

:::tabs
== Demo
<ripl-example @context-changed="contextChanged"></ripl-example>
== Code
```ts
import {
    createCircle,
    createContext,
    createGroup,
    createRect,
} from '@ripl/web';

const context = createContext('.mount-element');

const group = createGroup({
    fill: '#3a86ff',
    children: [
        createCircle({
            cx: 120,
            cy: 150,
            radius: 50,
        }),
        createCircle({
            cx: 200,
            cy: 150,
            radius: 35,
            fill: '#ff006e',
        }),
        createRect({
            x: 260,
            y: 110,
            width: 100,
            height: 80,
        }),
    ],
});

group.render(context);
```
:::

<script lang="ts" setup>
import {
    useRiplExample,
} from '../../../.vitepress/compositions/example';

import {
    createCircle,
    createGroup,
    createRect,
    createText,
} from '@ripl/web';

const {
    contextChanged
} = useRiplExample(context => {
    const w = context.width;
    const h = context.height;
    const r = Math.min(w, h) / 7;

    const group = createGroup({
        fill: '#3a86ff',
        children: [
            createCircle({ cx: w * 0.25, cy: h / 2, radius: r }),
            createCircle({ cx: w * 0.5, cy: h / 2, radius: r * 0.7, fill: '#ff006e' }),
            createRect({ x: w * 0.65, y: h / 2 - r * 0.7, width: r * 1.6, height: r * 1.4 }),
        ],
    });

    group.render(context);
    context.on('resize', () => { context.clear(); group.render(context); });
});
</script>
