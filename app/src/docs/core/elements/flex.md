---
outline: "deep"
---

# Flex

A **Flex** is a dynamic layout container that arranges its children along a main axis — a row or a column — with control over spacing, distribution, wrapping, and cross-axis alignment. It works just like CSS flexbox, but for canvas and SVG scenes.

Unlike a plain [Group](/docs/core/essentials/group) (which only organises elements and cascades styles), a Flex **positions** its children for you. As children are added, removed, resized, or as layout options change, the container automatically recomputes and re-applies positions — coalesced into a single frame for performance. Positioning uses a dedicated **layout offset**, so each child's own `translateX` / `translateY` stays free — you can still translate, drag, or animate a laid-out shape relative to its slot, and it stays fully queryable and styleable.

## Example

:::tabs
== Demo
<ripl-example @context-changed="contextChanged">
    <template #footer>
        <RiplControlGroup>
            <span>Direction</span>
            <RiplButtonGroup v-model="direction" :options="directionOptions" />
            <span>Justify</span>
            <RiplButtonGroup v-model="justify" :options="justifyOptions" />
            <span>Align</span>
            <RiplButtonGroup v-model="align" :options="alignOptions" />
            <span>Gap</span>
            <RiplInputRange v-model="gap" :min="0" :max="60" :step="1" />
            <RiplSwitch v-model="wrap" label="Wrap" />
        </RiplControlGroup>
    </template>
</ripl-example>
== Code
```ts
import {
    createFlex,
    createRect,
    createRenderer,
    createScene,
} from '@ripl/web';

const flex = createFlex({
    x: 40,
    y: 40,
    width: 520,
    height: 260,
    gap: 12,
    justify: 'space-between',
    align: 'center',
    children: [
        createRect({
            x: 0,
            y: 0,
            width: 60,
            height: 40,
            fill: '#3a86ff',
        }),
        createRect({
            x: 0,
            y: 0,
            width: 60,
            height: 80,
            fill: '#ff006e',
        }),
        createRect({
            x: 0,
            y: 0,
            width: 60,
            height: 60,
            fill: '#ffbe0b',
        }),
    ],
});

const scene = createScene('.mount-element', { children: flex });
const renderer = createRenderer(scene);

// Changing any layout option re-flows automatically:
flex.justify = 'center';
flex.gap = 24;
```
:::

## Options

| Option | Type | Description |
|--------|------|-------------|
| `x` / `y` | `number` | Top-left origin of the layout box. |
| `width` / `height` | `number` | Optional fixed size. When omitted, the container sizes to its content. A fixed main-axis size is required for `justify` distribution and for `wrap`. |
| `flexDirection` | `'row' \| 'column'` | Main axis. Defaults to `'row'`. |
| `justify` | `'start' \| 'end' \| 'center' \| 'space-between' \| 'space-around' \| 'space-evenly'` | Main-axis distribution. Defaults to `'start'`. |
| `align` | `'start' \| 'end' \| 'center' \| 'stretch'` | Cross-axis alignment within each line. Defaults to `'start'`. |
| `wrap` | `boolean` | Wrap children onto multiple lines when they overflow the main-axis size. Defaults to `false`. |
| `gap` | `number` | Space between children (and between wrapped lines). Defaults to `0`. |
| `padding` | `number \| { top, right, bottom, left }` | Inner padding around the content. |

## Per-child options

Individual children can override the container via a `layout` hint: `order`, `alignSelf`, and the
flex-sizing hints `grow` / `shrink` / `basis`.

```ts
createRect({ width: 64, height: 48, layout: { grow: 1, alignSelf: 'center' } });
```

See [Layout → Per-child options](../essentials/layout#per-child-options) for the full list.

## Usage

```ts
import {
    createFlex,
    createRect,
} from '@ripl/web';

const toolbar = createFlex({
    x: 0,
    y: 0,
    width: 400,
    gap: 8,
    justify: 'space-between',
    align: 'center',
    children: [
        createRect({
            x: 0,
            y: 0,
            width: 40,
            height: 40,
        }),
        createRect({
            x: 0,
            y: 0,
            width: 40,
            height: 40,
        }),
        createRect({
            x: 0,
            y: 0,
            width: 40,
            height: 40,
        }),
    ],
});
```

Flex containers **nest** — a Flex can contain another Flex (or a [Grid](/docs/core/elements/grid)) as a child, composing complex responsive layouts. See [Layout](/docs/core/essentials/layout) for the underlying model.

> [!TIP]
> Transitioning a child's size (e.g. a `Rect`'s `width`) produces a smooth reflow — the renderer reflows the scene's layouts each tick, so siblings rearrange automatically with no manual `reflow()` (pass `{ autoReflow: false }` to opt out). And because the layout uses a separate offset, you can animate a child's own `translateX` / `translateY` (an entrance slide, a hover lift) on top of its slot — the two compose.

> [!NOTE]
> For the full property list, see the [Flex API Reference](/docs/api/@ripl/core/).

<script lang="ts" setup>
import {
    useAdvRiplExample,
} from '../../../.vitepress/compositions/example';

import {
    createFlex,
    createRect,
} from '@ripl/web';

import type {
    Flex,
    FlexAlign,
    FlexDirection,
    FlexJustify,
} from '@ripl/web';

import {
    ref,
    watch,
} from 'vue';

const direction = ref<FlexDirection>('row');
const justify = ref<FlexJustify>('space-between');
const align = ref<FlexAlign>('center');
const gap = ref(12);
const wrap = ref(false);

const directionOptions = [
    { label: 'Row', value: 'row' },
    { label: 'Column', value: 'column' },
];

const justifyOptions = [
    { label: 'Start', value: 'start' },
    { label: 'Center', value: 'center' },
    { label: 'Between', value: 'space-between' },
    { label: 'Around', value: 'space-around' },
    { label: 'Evenly', value: 'space-evenly' },
];

const alignOptions = [
    { label: 'Start', value: 'start' },
    { label: 'Center', value: 'center' },
    { label: 'End', value: 'end' },
    { label: 'Stretch', value: 'stretch' },
];

const palette = ['#3a86ff', '#ff006e', '#ffbe0b', '#8338ec', '#06d6a0'];

let flex: Flex | undefined;

const {
    contextChanged,
} = useAdvRiplExample(({ context, scene }) => {
    const margin = 40;

    const children = palette.map((fill, index) => createRect({
        x: 0,
        y: 0,
        width: 56,
        height: 40 + index * 12,
        borderRadius: 6,
        fill,
    }));

    flex = createFlex({
        x: margin,
        y: margin,
        width: context.width - margin * 2,
        height: context.height - margin * 2,
        gap: gap.value,
        flexDirection: direction.value,
        justify: justify.value,
        align: align.value,
        wrap: wrap.value,
        children,
    });

    scene.add(flex);

    context.on('resize', () => {
        if (!flex) {
            return;
        }

        flex.width = context.width - margin * 2;
        flex.height = context.height - margin * 2;
    });
});

watch([direction, justify, align, gap, wrap], () => {
    if (!flex) {
        return;
    }

    flex.flexDirection = direction.value;
    flex.justify = justify.value;
    flex.align = align.value;
    flex.gap = gap.value;
    flex.wrap = wrap.value;
});
</script>
