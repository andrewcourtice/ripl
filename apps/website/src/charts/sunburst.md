# Sunburst Chart

The **Sunburst Chart** displays hierarchical data as concentric rings, where each ring represents a level in the hierarchy and arc size represents value. It's excellent for visualizing tree structures like org charts, file systems, or category breakdowns. Nodes can have nested `children`, and arcs animate on entry and update.

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
    createSunburstChart,
} from '@ripl/charts';

import {
    ref,
    watch,
} from 'vue';

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

const { contextChanged, chart } = useRiplChart(context => {
    return createSunburstChart(context, {
        data,
        ...buildCommonOptions(config),
    });
});

watch(config, () => chart.value?.update(buildCommonOptions(config)), { deep: true });


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
