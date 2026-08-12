---
title: Treemap Chart
description: Break a total into nested rectangles whose area encodes value, with a configurable cell gap, corner radius, colorBy grouping, automatic labels and tooltips.
---

# Treemap Chart

The **Treemap Chart** tiles a rectangle with smaller rectangles whose areas are proportional to their values. Reach for it when a total breaks down into many parts and every part has to stay on screen — market share, disk usage, budget allocation — where a pie chart would collapse the small slices into slivers. `key`, `value` and `label` bind the cells, `colorBy` groups their colors, and `gap`, `borderRadius` and `format` set the finish. Cells are labeled and colored automatically, and the layout re-tiles with an animation when the data changes. Point it at a Canvas, SVG or [terminal context](/charts/advanced/rendering-targets) and nothing else changes.

> [!NOTE]
> For the full API, see the [Charts API Reference](/docs/api/@ripl/charts/).

## Example

<ripl-example ref="example" @context-changed="contextChanged">
    <template #footer>
        <RiplControlGroup>
            <RiplButton @click="randomize">Randomize</RiplButton>
        </RiplControlGroup>
    </template>
    <template #config>
        <RiplChartConfig :config="config" extra-title="Treemap" :extras-reset="reset">
            <RiplField label="Cell gap" option="gap">
                <RiplInputRange v-model="extras.gap" :min="0" :max="12" :step="1" />
            </RiplField>
            <RiplField label="Corner radius" option="borderRadius">
                <RiplInputRange v-model="extras.borderRadius" :min="0" :max="12" :step="1" />
            </RiplField>
        </RiplChartConfig>
    </template>
</ripl-example>

<script setup lang="ts">
import {
    useRiplChart,
} from '../.vitepress/compositions/example';

import {
    buildCommonOptions,
    useChartConfig,
    useChartExtras,
} from '../.vitepress/compositions/use-chart-config';

import {
    createTreemapChart,
} from '@ripl/charts';

import {
    ref,
    watch,
} from 'vue';

const CATEGORIES = ['Electronics', 'Clothing', 'Food', 'Books', 'Sports', 'Home', 'Toys', 'Health'];

const { extras, reset } = useChartExtras({
    gap: 3,
    borderRadius: 4,
});

const config = useChartConfig({
    features: {
        title: true,
        legend: true,
        format: true,
        animation: true,
        theme: true,
    },
    title: 'Revenue by Category',
});

function generateData() {
    return CATEGORIES.map(name => ({
        name,
        value: Math.round(Math.random() * 900 + 100),
    }));
}

let data = generateData();

function buildOptions() {
    return {
        gap: extras.gap,
        borderRadius: extras.borderRadius,
        ...buildCommonOptions(config),
    };
}

const example = ref();

const { contextChanged, chart } = useRiplChart(context => {
    return createTreemapChart(context, {
        data,
        key: 'name',
        value: 'value',
        label: 'name',
        ...buildOptions(),
    });
});

watch([config, extras], () => chart.value?.update(buildOptions()), { deep: true });


function randomize() {
    data = generateData();
    chart.value?.update({ data });
}
</script>

## Usage

```ts
import {
    createTreemapChart,
} from '@ripl/charts';

const chart = createTreemapChart('#container', {
    data: [/* ... */],
    key: 'name',
    value: 'value',
    label: 'name',
});
```

## Data Format

Each item is one rectangle, with a key, a numeric value that sets its area, and a display label:

```ts
const data = [
    {
        id: 'chrome',
        name: 'Chrome',
        share: 64.5,
    },
    {
        id: 'safari',
        name: 'Safari',
        share: 18.8,
    },
    {
        id: 'edge',
        name: 'Edge',
        share: 5.2,
    },
];
```

Rectangles are laid out largest-first, so the ordering of the array does not matter.

## Options

A full configuration for this chart. The options every chart shares — `padding`, `title`,
`animation`, `theme` and the rest — behave the same everywhere and are documented on
[Shared Options](/charts/shared-options).

<!-- eslint-skip -->
```ts
createTreemapChart('#container', {
    data,
    key: 'id',
    value: 'size',
    label: 'name',
    colorBy: 'group',
    // Gap between cells, in pixels.
    gap: 2,
    borderRadius: 4,
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
// Emitted when a cell is clicked.
chart.on('nodeclick', event => console.log(event.data)); // event.data: TreemapChartNodeEvent
// Emitted when the pointer enters a cell.
chart.on('nodeenter', event => console.log(event.data)); // event.data: TreemapChartNodeEvent
// Emitted when the pointer leaves a cell.
chart.on('nodeleave', event => console.log(event.data)); // event.data: TreemapChartNodeEvent
```
<!-- events:end -->

## Programmatic Interaction

`highlightNode` puts a cell into the same hover state the pointer would — it lifts out of its rest
tint to full color — without waiting for one. Pass the cell's key, the `{ key }` ref form, or an
accessor over the chart's data returning either. `{ tooltip: true }` opens the cell's tooltip where
hovering would; a treemap draws no crosshair, so `crosshair` is ignored here.

```ts
const chart = createTreemapChart('#container', { data, key: 'name', value: 'share', label: 'name' });

// Light the Chrome cell and open its tooltip.
chart.highlightNode('Chrome', { tooltip: true });

// The first cell in the dataset, wherever the layout put it.
chart.highlightNode(data => data[0].name);

chart.clearHighlight();
```

One highlight is active at a time — a matching call replaces the last — and it is one-shot: the next
render (a resize, an `update`, a legend toggle) or the next pointer hover restores the chart, and it
emits none of the `node*` events above. `clearHighlight()` restores it explicitly; `highlightNode`
returns `false` when the selector matched no live cell.