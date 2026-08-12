---
title: Sunburst Chart
description: Show a tree as concentric rings where each ring is a depth level and arc width encodes value, with a constant-width padWidth gap and hover dimming.
---

# Sunburst Chart

The **Sunburst Chart** draws a tree as concentric rings: each ring is one level of depth, and each arc's angular width is its share of its parent. It shows both the shape of a hierarchy and the proportions within it — org charts, file systems, nested category breakdowns. Nodes nest through `children`, `padWidth` sets a constant-width gap between segments, and `format` sets how values read. Segments are filled with a translucent tint of their color; hovering one dims the rest, and arcs animate on entry and update. Canvas, SVG and [terminal contexts](/charts/advanced/rendering-targets) all draw it from the same options.

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
        <RiplChartConfig :config="config" extra-title="Sunburst" :extras-reset="reset">
            <RiplField label="Segment gap" option="padWidth">
                <RiplInputRange v-model="extras.padWidth" :min="0" :max="10" :step="1" />
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
    createSunburstChart,
} from '@ripl/charts';

import {
    ref,
    watch,
} from 'vue';

const { extras, reset } = useChartExtras({
    padWidth: 2,
});

const config = useChartConfig({
    features: {
        title: true,
        legend: true,
        format: true,
        animation: true,
        theme: true,
    },
    title: 'Sector Breakdown',
});

function generateData() {
    return [
        {
            id: 'tech',
            label: 'Technology',
            value: Math.round(Math.random() * 200 + 300),
            children: [
                {
                    id: 'web',
                    label: 'Web',
                    value: Math.round(Math.random() * 100 + 50),
                },
                {
                    id: 'mobile',
                    label: 'Mobile',
                    value: Math.round(Math.random() * 80 + 40),
                },
                {
                    id: 'cloud',
                    label: 'Cloud',
                    value: Math.round(Math.random() * 60 + 30),
                },
            ],
        },
        {
            id: 'finance',
            label: 'Finance',
            value: Math.round(Math.random() * 150 + 200),
            children: [
                {
                    id: 'banking',
                    label: 'Banking',
                    value: Math.round(Math.random() * 80 + 40),
                },
                {
                    id: 'insurance',
                    label: 'Insurance',
                    value: Math.round(Math.random() * 60 + 30),
                },
            ],
        },
        {
            id: 'health',
            label: 'Health',
            value: Math.round(Math.random() * 100 + 150),
        },
    ];
}

let data = generateData();

const example = ref();

function buildOptions() {
    return {
        padWidth: extras.padWidth,
        ...buildCommonOptions(config),
    };
}

const { contextChanged, chart } = useRiplChart(context => {
    return createSunburstChart(context, {
        data,
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
    createSunburstChart,
} from '@ripl/charts';

const chart = createSunburstChart('#container', {
    data: [
        {
            id: 'tech',
            label: 'Technology',
            value: 500,
            children: [
                {
                    id: 'web',
                    label: 'Web',
                    value: 200,
                },
                {
                    id: 'mobile',
                    label: 'Mobile',
                    value: 150,
                },
            ],
        },
    ],
});
```

## Data Format

A sunburst takes a tree of nodes rather than a flat dataset. Each node has an id, a label and a
value, and `children` nests the next ring outward:

```ts
const data = [
    {
        id: 'engineering',
        label: 'Engineering',
        value: 0,
        children: [
            {
                id: 'frontend',
                label: 'Frontend',
                value: 18,
            },
            {
                id: 'backend',
                label: 'Backend',
                value: 24,
            },
        ],
    },
    {
        id: 'design',
        label: 'Design',
        value: 12,
    },
];
```

A branch node's own `value` is ignored when it has children — its arc spans the total of its
descendants.

## Options

A full configuration for this chart. The options every chart shares — `padding`, `title`,
`animation`, `theme` and the rest — behave the same everywhere and are documented on
[Shared Options](/charts/shared-options).

<!-- eslint-skip -->
```ts
createSunburstChart('#container', {
    // Each node carries `id`, `label`, `value` and optional `children`; the ring depth follows
    // the nesting.
    data,
    // Gap between adjacent segments, in pixels — a constant width whatever the radius.
    padWidth: 2,
    legend: { position: 'right' },
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
chart.on('nodeclick', event => console.log(event.data)); // event.data: SunburstChartNodeEvent<TData>
// Emitted when the pointer enters a segment.
chart.on('nodeenter', event => console.log(event.data)); // event.data: SunburstChartNodeEvent<TData>
// Emitted when the pointer leaves a segment.
chart.on('nodeleave', event => console.log(event.data)); // event.data: SunburstChartNodeEvent<TData>
```
<!-- events:end -->

## Programmatic Interaction

`highlightNode` puts an arc into the same hover state the pointer would — which reads as every other
arc dimming — without waiting for one. Pass the node's id, the `{ key }` ref form, or an accessor
over the chart's root nodes returning either. Only that node is picked out, not its branch —
widening the highlight to a whole subtree is what a legend hover does. `{ tooltip: true }` opens the
arc's tooltip where hovering would; a sunburst draws no crosshair, so `crosshair` is ignored here.

```ts
const chart = createSunburstChart('#container', { data });

// Light the Frontend arc and open its tooltip.
chart.highlightNode('frontend', { tooltip: true });

// A root node, addressed by position in the tree.
chart.highlightNode(nodes => nodes[1].id);

chart.clearHighlight();
```

One highlight is active at a time — a matching call replaces the last — and it is one-shot: the next
render (a resize, an `update`, a legend toggle) or the next pointer hover restores the chart, and it
emits none of the `node*` events above. `clearHighlight()` restores it explicitly; `highlightNode`
returns `false` when the selector matched no live arc.