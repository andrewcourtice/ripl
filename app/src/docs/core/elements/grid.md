---
outline: "deep"
---

# Grid

A **Grid** is a dynamic layout container that arranges its children into rows and columns of sized tracks — like CSS grid, for canvas and SVG scenes. You define a column count (or explicit track widths) and the Grid places children row-major, sizing rows and columns automatically or to the sizes you provide.

Like [Flex](/docs/core/elements/flex), a Grid **positions** its children and re-flows automatically whenever children or options change. Children remain ordinary, queryable, styleable elements — the Grid simply drives their placement.

## Example

:::tabs
== Demo
<ripl-example @context-changed="contextChanged">
    <template #footer>
        <RiplControlGroup>
            <span>Columns</span>
            <RiplInputRange v-model="columns" :min="1" :max="6" :step="1" />
            <span>Column gap</span>
            <RiplInputRange v-model="columnGap" :min="0" :max="40" :step="1" />
            <span>Row gap</span>
            <RiplInputRange v-model="rowGap" :min="0" :max="40" :step="1" />
            <span>Align</span>
            <RiplButtonGroup v-model="alignItems" :options="alignOptions" />
        </RiplControlGroup>
    </template>
</ripl-example>
== Code
```ts
import {
    createGrid,
    createRect,
    createRenderer,
    createScene,
} from '@ripl/web';

const grid = createGrid({
    x: 40,
    y: 40,
    columns: 3,
    columnGap: 12,
    rowGap: 12,
    children: Array.from({ length: 9 }, () => createRect({
        x: 0,
        y: 0,
        width: 60,
        height: 60,
        fill: '#3a86ff',
    })),
});

const scene = createScene('.mount-element', { children: grid });
const renderer = createRenderer(scene);
```
:::

## Options

| Option | Type | Description |
|--------|------|-------------|
| `x` / `y` | `number` | Top-left origin of the grid. |
| `width` / `height` | `number` | Optional fixed size. When `columns`/`rows` is a count and a size is set, tracks divide the space into equal fractions. |
| `columns` | `number \| number[]` | Column count, or explicit column track widths in pixels. Defaults to `1`. |
| `rows` | `number \| number[]` | Row count, or explicit row track heights. Defaults to as many rows as needed. |
| `columnGap` / `rowGap` | `number` | Gap between columns / rows. Falls back to `gap`. |
| `gap` | `number` | Shared gap used when `columnGap`/`rowGap` are not set. |
| `justifyItems` | `'start' \| 'end' \| 'center' \| 'stretch'` | Horizontal alignment of a child within its cell. |
| `alignItems` | `'start' \| 'end' \| 'center' \| 'stretch'` | Vertical alignment of a child within its cell. |
| `padding` | `number \| { top, right, bottom, left }` | Inner padding around the content. |

## Track sizing

- **Auto** (default): each column is as wide as its widest child; each row as tall as its tallest child.
- **Explicit tracks**: pass an array, e.g. `columns: [120, 80, 120]`, to fix track sizes.
- **Fractions**: pass a count plus a fixed `width`/`height` to split the available space evenly, e.g. `columns: 3, width: 600`.

## Usage

```ts
import {
    createGrid,
    createRect,
} from '@ripl/web';

const gallery = createGrid({
    x: 0,
    y: 0,
    columns: 4,
    columnGap: 10,
    rowGap: 10,
    children: items.map(() => createRect({
        x: 0,
        y: 0,
        width: 80,
        height: 80,
    })),
});
```

Grids **nest** with Flex containers and other Grids — see [Layout](/docs/core/essentials/layout) for the shared model.

> [!NOTE]
> For the full property list, see the [Grid API Reference](/docs/api/@ripl/core/).

<script lang="ts" setup>
import {
    useAdvRiplExample,
} from '../../../.vitepress/compositions/example';

import {
    createGrid,
    createRect,
} from '@ripl/web';

import type {
    FlexAlign,
    Grid,
} from '@ripl/web';

import {
    ref,
    watch,
} from 'vue';

const columns = ref(3);
const columnGap = ref(12);
const rowGap = ref(12);
const alignItems = ref<FlexAlign>('stretch');

const alignOptions = [
    { label: 'Start', value: 'start' },
    { label: 'Center', value: 'center' },
    { label: 'End', value: 'end' },
    { label: 'Stretch', value: 'stretch' },
];

const palette = ['#3a86ff', '#ff006e', '#ffbe0b', '#8338ec', '#06d6a0', '#fb5607'];

let grid: Grid | undefined;

const {
    contextChanged,
} = useAdvRiplExample(({ context, scene }) => {
    const margin = 40;

    const children = Array.from({ length: 12 }, (_, index) => createRect({
        x: 0,
        y: 0,
        width: 60,
        height: 40 + (index % 3) * 16,
        borderRadius: 6,
        fill: palette[index % palette.length],
    }));

    grid = createGrid({
        x: margin,
        y: margin,
        width: context.width - margin * 2,
        columns: columns.value,
        columnGap: columnGap.value,
        rowGap: rowGap.value,
        alignItems: alignItems.value,
        children,
    });

    scene.add(grid);

    context.on('resize', () => {
        if (grid) {
            grid.width = context.width - margin * 2;
        }
    });
});

watch([columns, columnGap, rowGap, alignItems], () => {
    if (!grid) {
        return;
    }

    grid.columns = columns.value;
    grid.columnGap = columnGap.value;
    grid.rowGap = rowGap.value;
    grid.alignItems = alignItems.value;
});
</script>
