---
title: Funnel Chart
description: Chart stage-by-stage drop-off as progressively narrowing bars with configurable gap, corner radius, colorBy grouping and a value formatter, animated on update.
---

# Funnel Chart

The **Funnel Chart** draws an ordered set of stages as progressively narrowing bars, so the drop-off between one stage and the next is the width you lose. It fits conversion pipelines, sales stages and any sequence where every item at step N came from step N−1. `key`, `value` and `label` bind the stages, `colorBy` groups their colors, and `gap`, `borderRadius` and `format` set the finish. Stages are labeled and colored automatically, and widths animate when the data changes. Canvas, SVG and [terminal contexts](/charts/advanced/rendering-targets) all draw it from the same options.

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
        <RiplChartConfig :config="config" extra-title="Funnel" :extras-reset="reset">
            <RiplField label="Segment gap" option="gap">
                <RiplInputRange v-model="extras.gap" :min="0" :max="16" :step="1" />
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
    createFunnelChart,
} from '@ripl/charts';

import {
    ref,
    watch,
} from 'vue';

const { extras, reset } = useChartExtras({
    gap: 4,
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
    title: 'Conversion Funnel',
    // The funnel is a single centred shape, so it reads better inset from the edges than filling
    // them. Seeded through the config rather than passed as a literal, so the Layout control starts
    // here and still drives the chart.
    padding: 40,
});

function generateData() {
    let remaining = 10000;
    return ['Visitors', 'Leads', 'Prospects', 'Negotiations', 'Closed'].map(stage => {
        const value = remaining;
        remaining = Math.round(remaining * (0.3 + Math.random() * 0.4));
        return { stage, value };
    });
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
    return createFunnelChart(context, {
        data,
        key: 'stage',
        value: 'value',
        label: 'stage',
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
    createFunnelChart,
} from '@ripl/charts';

const chart = createFunnelChart('#container', {
    data: [/* ... */],
    key: 'stage',
    value: 'value',
    label: 'stage',
});
```

## Data Format

Each item is one stage of the funnel, with a key, a numeric value and a display label. Stages render
top to bottom in array order, so sort the data the way you want it read:

```ts
const data = [
    {
        stage: 'visited',
        label: 'Visited',
        count: 12_480,
    },
    {
        stage: 'signed-up',
        label: 'Signed up',
        count: 4_210,
    },
    {
        stage: 'purchased',
        label: 'Purchased',
        count: 1_150,
    },
];
```

## Options

A full configuration for this chart. The options every chart shares — `padding`, `title`,
`animation`, `theme` and the rest — behave the same everywhere and are documented on
[Shared Options](/charts/shared-options).

<!-- eslint-skip -->
```ts
createFunnelChart('#container', {
    data,
    key: 'stage',
    value: 'value',
    label: 'stage',
    colorBy: 'stage',
    gap: 4,
    borderRadius: 6,
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
// Emitted when a segment is clicked.
chart.on('segmentclick', event => console.log(event.data)); // event.data: FunnelChartSegmentEvent
// Emitted when the pointer enters a segment.
chart.on('segmententer', event => console.log(event.data)); // event.data: FunnelChartSegmentEvent
// Emitted when the pointer leaves a segment.
chart.on('segmentleave', event => console.log(event.data)); // event.data: FunnelChartSegmentEvent
```
<!-- events:end -->

## Programmatic Interaction

`highlightSegment` applies the treatment hovering a stage does — it lifts out of its rest tint and the
rest of the funnel dims — without waiting for a pointer. Pass the segment's key, the `{ key }` ref
form, or an accessor over the chart's data returning either. `{ tooltip: true }` opens the segment's
tooltip where hovering would; a funnel draws no crosshair, so `crosshair` is ignored here.

```ts
const chart = createFunnelChart('#container', { data, key: 'stage', value: 'count', label: 'label' });

// Light the sign-up stage and open its tooltip.
chart.highlightSegment('signed-up', { tooltip: true });

// The stage the funnel ends on.
chart.highlightSegment(data => data[data.length - 1].stage);

chart.clearHighlight();
```

One highlight is active at a time — a matching call replaces the last — and it is one-shot: the next
render (a resize, an `update`, a legend toggle) or the next pointer hover restores the chart, and it
emits none of the `segment*` events above. `clearHighlight()` restores it explicitly;
`highlightSegment` returns `false` when the selector matched no live segment.
