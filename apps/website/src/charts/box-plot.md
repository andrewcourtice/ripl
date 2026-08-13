---
title: Box Plot Chart
description: Compare distributions per category with interquartile boxes, median lines, 1.5x IQR whiskers and outlier points from the shared boxplotStats transform.
---

# Box Plot Chart

The **Box Plot Chart** summarizes the distribution of a numeric field per category using the shared `boxplotStats` transform: a box spanning the interquartile range (Q1–Q3), a median line, whiskers to the 1.5×IQR fences, and outlier points. It answers how spread out and how skewed, where a bar per category would show only the average. `key` and `value` pick the grouping and the measure, `categoryOrder` fixes the order along the axis, and `color` paints the boxes. Being a cartesian chart it also takes a crosshair, grid, tooltips and [annotations](/charts/advanced/annotations), and renders to Canvas, SVG or a [terminal context](/charts/advanced/rendering-targets).

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
        <RiplChartConfig :config="config" extra-title="Box Plot" :extras-reset="reset">
            <template #colors>
                <RiplField label="Box color" inline option="color">
                    <RiplColorInput v-model="extras.color" />
                </RiplField>
            </template>
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
    createBoxPlotChart,
} from '@ripl/charts';

import {
    ref,
    watch,
} from 'vue';

const REGIONS = ['US', 'EU', 'APAC', 'LATAM'];

const { extras, reset } = useChartExtras({
    color: '#7cacf8',
});

const config = useChartConfig({
    features: {
        title: true,
        grid: true,
        tooltip: true,
        format: true,
        animation: true,
        theme: true,
        axes: true,
        crosshair: true,
    },
    title: 'Latency by Region',
});

const example = ref();

function generateData() {
    return REGIONS.flatMap((region, index) => {
        const center = 60 + index * 30;

        return Array.from({ length: 20 }, () => ({
            region,
            latency: Math.round(center + (Math.random() - 0.5) * 80),
        }));
    });
}

let data = generateData();

function buildOptions() {
    return {
        color: extras.color,
        ...buildCommonOptions(config),
    };
}

const { contextChanged, chart } = useRiplChart(context => {
    return createBoxPlotChart(context, {
        data,
        key: 'region',
        value: 'latency',
        categoryOrder: REGIONS,
        axis: {
            x: { title: 'Region' },
            y: { title: 'Latency (ms)' },
        },
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
    createBoxPlotChart,
} from '@ripl/charts';

const chart = createBoxPlotChart('#container', {
    data: [/* ... */],
    key: 'region',
    value: 'latency',
});
```

## Data Format

Each item contributes one numeric value to a category. The chart groups items by the `key`
accessor and summarizes the `value` accessor per group, so no pre-aggregation is required.

## Options

A full configuration for this chart. The options every chart shares — `padding`, `title`,
`animation`, `theme` and the rest — behave the same everywhere and are documented on
[Shared Options](/charts/shared-options).

<!-- eslint-skip -->
```ts
createBoxPlotChart('#container', {
    data,
    key: 'team',
    value: 'score',
    // Fixes the order the categories are drawn in; without it they follow the data.
    categoryOrder: ['Alpha', 'Bravo', 'Charlie'],
    color: '#7cacf8',
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
// Emitted when a box is clicked.
chart.on('boxclick', event => console.log(event.data)); // event.data: BoxPlotBoxEvent
// Emitted when the pointer enters a box.
chart.on('boxenter', event => console.log(event.data)); // event.data: BoxPlotBoxEvent
// Emitted when the pointer leaves a box.
chart.on('boxleave', event => console.log(event.data)); // event.data: BoxPlotBoxEvent
```
<!-- events:end -->

## Programmatic Interaction

`highlightBox` puts a box into the same hover state the pointer would — its fill softens — without
waiting for one. A box summarizes a whole category, so the selector is that category: its key, the
`{ key }` ref form, or an accessor over the chart's data returning either. `{ tooltip: true }` opens
the box's median/quartile tooltip where hovering would, and `{ crosshair: true }` places the
crosshair on it.

```ts
const chart = createBoxPlotChart('#container', { data, key: 'region', value: 'latency' });

// Light the EU box, with its tooltip and the crosshair.
chart.highlightBox('EU', { tooltip: true, crosshair: true });

// The category of the first row, whatever it happens to be.
chart.highlightBox(data => data[0].region);

chart.clearHighlight();
```

One highlight is active at a time — a matching call replaces the last — and it is one-shot: the next
render (a resize, an `update`) or the next pointer hover restores the chart, and it emits none of
the `box*` events above. `clearHighlight()` restores it explicitly; `highlightBox` returns `false`
when the selector matched no live box.