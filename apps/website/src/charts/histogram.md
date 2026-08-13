---
title: Histogram Chart
description: Bin a numeric field and draw its distribution as bars over a continuous value axis, using nice uniform bins or explicit thresholds, animated as bins change.
---

# Histogram Chart

The **Histogram Chart** bins a numeric field and draws each bin as a bar on a continuous value axis against a frequency axis. Its job is the shape of a distribution — where the mass sits, how long the tail runs, whether it is one peak or two — not a comparison of named categories. Binning uses the shared `bin` transform: `bins` asks for a bin count and gets nice round boundaries, or `thresholds` sets the cut points exactly. `borderRadius`, `color` and `format` handle the finish, and bars animate on entry, update and exit as the binning changes. Being a cartesian chart it also takes a crosshair, grid and [annotations](/charts/advanced/annotations), on a Canvas, SVG or [terminal target](/charts/advanced/rendering-targets).

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
        <RiplChartConfig :config="config" extra-title="Bins" :extras-reset="reset">
            <RiplField label="Bin count" option="bins">
                <RiplInputRange v-model="extras.bins" :min="4" :max="20" :step="1" />
            </RiplField>
            <RiplField label="Corner radius" option="borderRadius">
                <RiplInputRange v-model="extras.borderRadius" :min="0" :max="8" :step="1" />
            </RiplField>
            <template #colors>
                <RiplField label="Bar color" inline option="color">
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
    createHistogramChart,
} from '@ripl/charts';

import {
    ref,
    watch,
} from 'vue';

const { extras, reset } = useChartExtras({
    bins: 10,
    borderRadius: 2,
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
        crosshair: true,
        axes: true,
    },
    title: 'Response Time Distribution',
});

const example = ref();

function generateData() {
    // A roughly normal distribution via the central-limit trick.
    return Array.from({ length: 240 }, () => {
        const sample = (Math.random() + Math.random() + Math.random()) / 3;

        return { value: Math.round(sample * 400 + 50) };
    });
}

let data = generateData();

function buildOptions() {
    return {
        bins: extras.bins,
        borderRadius: extras.borderRadius,
        color: extras.color,
        ...buildCommonOptions(config),
    };
}

const { contextChanged, chart } = useRiplChart(context => {
    return createHistogramChart(context, {
        data,
        value: 'value',
        axis: {
            x: { title: 'Response time (ms)' },
            y: { title: 'Frequency' },
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
    createHistogramChart,
} from '@ripl/charts';

const chart = createHistogramChart('#container', {
    data: [/* ... */],
    value: 'amount',
    bins: 12,
});
```

## Data Format

Each item contributes one numeric value, read via the `value` accessor (a field name or a function). The chart bins those values itself, so no pre-aggregation is required.

## Options

A full configuration for this chart. The options every chart shares — `padding`, `title`,
`animation`, `theme` and the rest — behave the same everywhere and are documented on
[Shared Options](/charts/shared-options).

<!-- eslint-skip -->
```ts
createHistogramChart('#container', {
    data,
    value: 'duration',
    // Target bin count — the binner treats it as a hint and rounds to a readable step.
    // `thresholds` below is the alternative, and wins when both are given.
    bins: 20,
    color: '#7cacf8',
    borderRadius: 2,
    format: 'number',
});
```

To place the bin edges yourself — uneven buckets, or a scale that has to match another
chart — pass `thresholds` instead of `bins`:

<!-- eslint-skip -->
```ts
createHistogramChart('#container', {
    data,
    value: 'duration',
    // n edges produce n - 1 bins: 0–50, 50–100, 100–250, 250–500.
    thresholds: [0, 50, 100, 250, 500],
});
```

## Events

Subscribe with `chart.on(...)`. A handler receives an `Event` object, not the payload directly — the
payload is on `event.data`, and carries the interacted datum plus its `{ x, y }` anchor in chart
pixels. `event.target` and `event.stopPropagation()` are also available.

<!-- events:start -->
<!-- eslint-skip -->
```ts
// Emitted when a bin bar is clicked.
chart.on('binclick', event => console.log(event.data)); // event.data: HistogramBinEvent
// Emitted when the pointer enters a bin bar.
chart.on('binenter', event => console.log(event.data)); // event.data: HistogramBinEvent
// Emitted when the pointer leaves a bin bar.
chart.on('binleave', event => console.log(event.data)); // event.data: HistogramBinEvent
```
<!-- events:end -->

## Programmatic Interaction

`highlightBin` puts a bin bar into the same hover state the pointer would — its fill goes to full
strength — without waiting for one. Bins are derived from the data rather than carrying keys of
their own, so a bin is addressed by index: `0` is the leftmost bar and the index counts up across
the value axis. An accessor over the chart's data can compute that index instead.
`{ tooltip: true }` opens the bin's tooltip where hovering would, and `{ crosshair: true }` places
the crosshair on it.

```ts
const chart = createHistogramChart('#container', { data, value: 'amount', bins: 12 });

// Light the leftmost bin, with its tooltip and the crosshair.
chart.highlightBin(0, { tooltip: true, crosshair: true });

// The last of the twelve bins.
chart.highlightBin(11);

chart.clearHighlight();
```

One highlight is active at a time — a matching call replaces the last — and it is one-shot: the next
render (a resize, an `update`) or the next pointer hover restores the chart, and it emits none of
the `bin*` events above. `clearHighlight()` restores it explicitly; `highlightBin` returns `false`
when the index falls outside the histogram, which it can after `bins` or the data changes.