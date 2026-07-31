# Sankey Chart

The **Sankey Chart** visualizes flow between nodes using weighted links. It's ideal for showing energy flows, budget allocations, process pipelines, or user journeys. Nodes are positioned automatically using a layout algorithm, and link widths are proportional to flow values. Hover any link to highlight it, and data transitions animate smoothly.

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
        <RiplChartConfig :config="config" extra-title="Nodes" :extras-reset="reset">
            <RiplField label="Node width" option="nodeWidth">
                <RiplInputRange v-model="extras.nodeWidth" :min="8" :max="40" :step="1" />
            </RiplField>
            <RiplField label="Node padding" option="nodePadding">
                <RiplInputRange v-model="extras.nodePadding" :min="0" :max="30" :step="1" />
            </RiplField>
            <RiplField label="Layout passes" option="iterations">
                <RiplInputRange
                    v-model="extras.iterations"
                    :min="1"
                    :max="32"
                    :step="1"
                />
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
    createSankeyChart,
} from '@ripl/charts';

import {
    ref,
    watch,
} from 'vue';

const { extras, reset } = useChartExtras({
    nodeWidth: 20,
    nodePadding: 10,
    iterations: 6,
});

const config = useChartConfig({
    features: {
        title: true,
        legend: true,
        format: true,
        animation: true,
        theme: true,
    },
    title: 'Budget Flow',
});

function generateLinks() {
    return [
        {
            source: 'budget',
            target: 'engineering',
            value: Math.round(Math.random() * 300 + 200),
        },
        {
            source: 'budget',
            target: 'marketing',
            value: Math.round(Math.random() * 200 + 100),
        },
        {
            source: 'budget',
            target: 'operations',
            value: Math.round(Math.random() * 150 + 80),
        },
        {
            source: 'engineering',
            target: 'frontend',
            value: Math.round(Math.random() * 150 + 50),
        },
        {
            source: 'engineering',
            target: 'backend',
            value: Math.round(Math.random() * 150 + 50),
        },
        {
            source: 'marketing',
            target: 'ads',
            value: Math.round(Math.random() * 100 + 50),
        },
        {
            source: 'marketing',
            target: 'content',
            value: Math.round(Math.random() * 80 + 30),
        },
    ];
}

let links = generateLinks();

function buildOptions() {
    return {
        nodeWidth: extras.nodeWidth,
        nodePadding: extras.nodePadding,
        iterations: extras.iterations,
        ...buildCommonOptions(config),
    };
}

const example = ref();

const { contextChanged, chart } = useRiplChart(context => {
    return createSankeyChart(context, {
        nodes: [
            { id: 'budget', label: 'Budget' },
            { id: 'engineering', label: 'Engineering' },
            { id: 'marketing', label: 'Marketing' },
            { id: 'operations', label: 'Operations' },
            { id: 'frontend', label: 'Frontend' },
            { id: 'backend', label: 'Backend' },
            { id: 'ads', label: 'Ads' },
            { id: 'content', label: 'Content' },
        ],
        links,
        ...buildOptions(),
    });
});

watch([config, extras], () => chart.value?.update(buildOptions()), { deep: true });


function randomize() {
    links = generateLinks();
    chart.value?.update({ links });
}
</script>

## Usage

```ts
import {
    createSankeyChart,
} from '@ripl/charts';

const chart = createSankeyChart('#container', {
    nodes: [
        {
            id: 'a',
            label: 'Source A',
        },
        {
            id: 'b',
            label: 'Target B',
        },
    ],
    links: [
        {
            source: 'a',
            target: 'b',
            value: 100,
        },
    ],
});
```

## Data Format

A sankey chart takes nodes and the links between them. A link's `source` and `target` are node ids,
and its `value` sets the ribbon's thickness:

```ts
const nodes = [
    {
        id: 'search',
        label: 'Search',
    },
    {
        id: 'signup',
        label: 'Sign up',
    },
    {
        id: 'purchase',
        label: 'Purchase',
    },
];

const links = [
    {
        source: 'search',
        target: 'signup',
        value: 620,
    },
    {
        source: 'signup',
        target: 'purchase',
        value: 180,
    },
];
```

Node depth is computed from the link graph, so nodes do not need to be ordered.

## Options

A full configuration for this chart. The options every chart shares — `padding`, `title`,
`animation`, `theme` and the rest — behave the same everywhere and are documented on
[Shared Options](/charts/shared-options).

<!-- eslint-skip -->
```ts
createSankeyChart('#container', {
    nodes,
    links,
    // Width of each node rectangle, in pixels.
    nodeWidth: 20,
    // Vertical gap between stacked nodes in a column, in pixels.
    nodePadding: 10,
    // Layout relaxation passes. Accepted and reserved for tuning node positioning — the current
    // layout does not read it, so changing it has no visible effect yet.
    iterations: 6,
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
// Emitted when a node is clicked.
chart.on('nodeclick', event => console.log(event.data)); // event.data: SankeyChartNodeEvent<TData>
// Emitted when the pointer enters a node.
chart.on('nodeenter', event => console.log(event.data)); // event.data: SankeyChartNodeEvent<TData>
// Emitted when the pointer leaves a node.
chart.on('nodeleave', event => console.log(event.data)); // event.data: SankeyChartNodeEvent<TData>
// Emitted when a link is clicked.
chart.on('linkclick', event => console.log(event.data)); // event.data: SankeyChartLinkEvent
// Emitted when the pointer enters a link.
chart.on('linkenter', event => console.log(event.data)); // event.data: SankeyChartLinkEvent
// Emitted when the pointer leaves a link.
chart.on('linkleave', event => console.log(event.data)); // event.data: SankeyChartLinkEvent
```
<!-- events:end -->
