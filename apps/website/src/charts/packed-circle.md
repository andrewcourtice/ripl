---
title: Packed Circle Chart
description: Encode each value as a circle area and pack the circles tightly inside one containing circle, with automatic labels on larger nodes and animated repacking.
---

# Packed Circle Chart

The **Packed Circle Chart** gives each datum a circle whose **area** encodes its value and packs those circles tightly, without overlap, inside one containing circle. Prefer it to a [treemap](/charts/treemap) when the parts of a whole are many and unordered, and a rigid grid of rectangles would imply structure the data does not have. `key`, `value` and `label` bind the circles, `colorBy` groups their colors, and `format` sets how values read; larger circles are labeled automatically and the pack re-solves with an animation when the data changes. The [target](/charts/advanced/rendering-targets) can be a Canvas, an SVG context or a terminal.

> [!NOTE]
> For the full API, see the [Charts API Reference](/docs/api/@ripl/charts/).

## Example

<ripl-example ref="example" @context-changed="contextChanged">
    <template #footer>
        <RiplControlGroup>
            <RiplButton @click="randomize">Randomize</RiplButton>
            <RiplButton @click="addItem">Add</RiplButton>
            <RiplButton @click="removeItem">Remove</RiplButton>
        </RiplControlGroup>
    </template>
    <template #config>
        <RiplChartConfig :config="config" />
    </template>
</ripl-example>

<script setup lang="ts">
import {
    useRiplChart,
} from '../.vitepress/compositions/example';

import {
    buildCommonOptions,
    useChartConfig,
} from '../.vitepress/compositions/use-chart-config';

import {
    createPackedCircleChart,
} from '@ripl/charts';

import {
    ref,
    watch,
} from 'vue';

const NAMES = [
    'Alpha',
    'Bravo',
    'Charlie',
    'Delta',
    'Echo',
    'Foxtrot',
    'Golf',
    'Hotel',
    'India',
    'Juliet',
    'Kilo',
    'Lima',
];

const config = useChartConfig({
    features: {
        title: true,
        legend: true,
        format: true,
        animation: true,
        theme: true,
    },
    title: 'Team Sizes',
});

function makeItem(name: string) {
    return {
        name,
        size: Math.round(Math.random() * 90 + 10),
    };
}

let data = NAMES.slice(0, 8).map(makeItem);

function buildOptions() {
    const options = {
        ...buildCommonOptions(config),
    };

    // The demo's bespoke format applies when no preset is selected.
    options.format ??= (v: number) => `${v} people`;

    return options;
}

const example = ref();

const { contextChanged, chart } = useRiplChart(context => {
    return createPackedCircleChart(context, {
        data,
        key: 'name',
        value: 'size',
        label: 'name',
        ...buildOptions(),
    });
});

watch(config, () => chart.value?.update(buildOptions()), { deep: true });


function randomize() {
    // Re-roll every circle's value, keeping the same members, so the pack reflows smoothly.
    data = data.map(item => makeItem(item.name));
    chart.value?.update({ data: [...data] });
}

function addItem() {
    if (data.length < NAMES.length) {
        // Append one new circle; existing circles keep their values and animate to new positions.
        data = [...data, makeItem(NAMES[data.length])];
        chart.value?.update({ data: [...data] });
    }
}

function removeItem() {
    if (data.length > 3) {
        // Remove one circle; the rest re-pack inside the containing circle.
        data = data.slice(0, -1);
        chart.value?.update({ data: [...data] });
    }
}
</script>

## Usage

```ts
import {
    createPackedCircleChart,
} from '@ripl/charts';

const chart = createPackedCircleChart('#container', {
    data: [
        {
            name: 'Alpha',
            size: 82,
        },
        {
            name: 'Bravo',
            size: 45,
        },
        {
            name: 'Charlie',
            size: 26,
        },
    ],
    key: 'name',
    value: 'size',
    label: 'name',
});
```

## Data Format

Each item provides a unique key, a numeric value (encoded as the circle's area), and optionally a label:

```ts
const data = [
    {
        name: 'Alpha',
        size: 82,
    },
    {
        name: 'Bravo',
        size: 45,
    },
];
```

## Options

A full configuration for this chart. The options every chart shares — `padding`, `title`,
`animation`, `theme` and the rest — behave the same everywhere and are documented on
[Shared Options](/charts/shared-options).

<!-- eslint-skip -->
```ts
createPackedCircleChart('#container', {
    data,
    key: 'id',
    value: 'size',
    label: 'name',
    colorBy: 'group',
    legend: { position: 'bottom' },
    format: 'number',
});
```

## Events

Subscribe with `chart.on(...)`. A handler receives an `Event` object, not the payload directly — the
payload is on `event.data`, and carries the interacted datum plus its `{ x, y }` anchor in chart
pixels. `event.target` and `event.stopPropagation()` are also available.

<!-- events:start -->
<!-- eslint-skip -->
```ts
// Emitted when a circle is clicked.
chart.on('nodeclick', event => console.log(event.data)); // event.data: PackedCircleChartNodeEvent
// Emitted when the pointer enters a circle.
chart.on('nodeenter', event => console.log(event.data)); // event.data: PackedCircleChartNodeEvent
// Emitted when the pointer leaves a circle.
chart.on('nodeleave', event => console.log(event.data)); // event.data: PackedCircleChartNodeEvent
```
<!-- events:end -->

## Programmatic Interaction

`highlightNode` puts a circle into the same hover state the pointer would — it lifts out of its rest
tint to full color — without waiting for one. Pass the circle's key, the `{ key }` ref form, or an
accessor over the chart's data returning either. `{ tooltip: true }` opens the circle's tooltip
where hovering would; a packed circle chart draws no crosshair, so `crosshair` is ignored here.

```ts
const chart = createPackedCircleChart('#container', { data, key: 'name', value: 'size', label: 'name' });

// Light the Alpha circle and open its tooltip.
chart.highlightNode('Alpha', { tooltip: true });

// The first circle in the dataset.
chart.highlightNode(data => data[0].name);

chart.clearHighlight();
```

One highlight is active at a time — a matching call replaces the last — and it is one-shot: the next
render (a resize, an `update`, a legend toggle) or the next pointer hover restores the chart, and it
emits none of the `node*` events above. `clearHighlight()` restores it explicitly; `highlightNode`
returns `false` when the selector matched no live circle.