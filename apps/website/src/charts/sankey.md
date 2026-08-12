---
title: Sankey Chart
description: Route weighted flows between nodes as proportional links, with an iterative layout pass, configurable node width and padding, hover highlighting and a legend.
---

# Sankey Chart

The **Sankey Chart** routes weighted flows between `nodes` as links whose width is proportional to the value carried, so where a quantity splits and merges is visible without reading a single number. Reach for it for energy and material flows, budget allocation, process pipelines and user journeys. Nodes are placed automatically by a layered layout: `iterations` sets how many relaxation passes it makes, and `nodeWidth` and `nodePadding` size the columns. Hover a link to highlight it, and `legend` and `format` handle the annotation. Renders to Canvas, SVG or a [terminal context](/charts/advanced/rendering-targets).

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

## Programmatic Interaction

`highlightNode` and `highlightLink` put a mark into the same hover state the pointer would — it
brightens out of its rest tint — without waiting for one. A node takes its id or the `{ key }` ref
form; a flow takes its id (`"<source>-<target>"`) or a `{ source, target }` ref naming the nodes it
joins. Either method also accepts an accessor over the chart's `nodes` or `links`. `{ tooltip: true
}` opens the mark's tooltip where hovering would; a sankey diagram draws no crosshair, so
`crosshair` is ignored here.

```ts
const chart = createSankeyChart('#container', { nodes, links });

// Light one node, then the flow leaving it.
chart.highlightNode('signup', { tooltip: true });
chart.highlightLink({ source: 'signup', target: 'purchase' }, { tooltip: true });

// The largest flow, whichever it is.
chart.highlightLink(links => ({ source: links[0].source, target: links[0].target }));

chart.clearHighlight();
```

One highlight is active at a time — a matching call replaces the last, including across the two
methods — and it is one-shot: the next render (a resize, an `update`, a legend toggle) or the next
pointer hover restores the diagram, and it emits none of the events above. `clearHighlight()`
restores it explicitly; both methods return `false` when the selector matched nothing live.