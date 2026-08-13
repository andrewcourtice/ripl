---
title: Force-Directed Network
description: Lay out a node-link graph with a deterministic physics simulation, tuning charge, linkDistance, linkStrength, centerStrength and the iteration count.
---

# Force-Directed Network

The **Force-Directed Network** lays out a graph of `nodes` and `links` with a physics simulation: repulsion pushes nodes apart, link springs pull connected nodes together, and a centering force keeps the whole thing on screen. Use it when the shape of a relationship graph is what you want to read — social graphs, dependency trees, topic maps — and no fixed ordering exists to lay it out by. `charge`, `linkDistance`, `linkStrength`, `centerStrength` and `iterations` tune the simulation, and `root` picks the node the entry animation springs from. The layout is deterministic, so the same data always settles the same way; reweighting relaxes the simulation from its current positions rather than restarting it. Canvas is the default target; pass an SVG or [terminal context](/charts/advanced/rendering-targets) to draw the same graph elsewhere.

> [!NOTE]
> For the full API, see the [Charts API Reference](/docs/api/@ripl/charts/).

## Example

<ripl-example ref="example" @context-changed="contextChanged">
    <template #footer>
        <RiplControlGroup>
            <RiplButton @click="randomize">Reweight</RiplButton>
        </RiplControlGroup>
    </template>
    <template #config>
        <RiplChartConfig :config="config" extra-title="Force-Directed" :extras-reset="reset">
            <RiplField label="Node radius" option="nodeRadius">
                <RiplInputRange v-model="extras.nodeRadius" :min="4" :max="16" :step="1" />
            </RiplField>
            <RiplField label="Charge" option="charge">
                <RiplInputRange v-model="extras.charge" :min="-500" :max="-60" :step="10" />
            </RiplField>
            <RiplField label="Link distance" option="linkDistance">
                <RiplInputRange v-model="extras.linkDistance" :min="30" :max="120" :step="5" />
            </RiplField>
            <RiplField label="Link strength" option="linkStrength">
                <RiplInputRange v-model="extras.linkStrength" :min="0" :max="1" :step="0.05" />
            </RiplField>
            <RiplField label="Iterations" option="iterations">
                <RiplInputRange
                    v-model="extras.iterations"
                    :min="50"
                    :max="600"
                    :step="50"
                />
            </RiplField>
            <RiplField label="Center strength" option="centerStrength">
                <RiplInputRange v-model="extras.centerStrength" :min="0" :max="0.3" :step="0.01" />
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
    createForceDirectedChart,
} from '@ripl/charts';

import {
    ref,
    watch,
} from 'vue';

const { extras, reset } = useChartExtras({
    nodeRadius: 7,
    charge: -140,
    linkDistance: 34,
    linkStrength: 0.5,
    centerStrength: 0.05,
    iterations: 300,
});

const config = useChartConfig({
    features: {
        title: true,
        legend: true,
        format: true,
        animation: true,
        theme: true,
    },
    title: 'Organisation Network',
});

// Build a clustered network of 130 nodes: 6 hubs, each with a fan of members, plus a few
// cross-cluster bridges, enough structure to show the springy, cascading entry.
const CLUSTERS = ['eng', 'design', 'gtm', 'ops', 'data', 'exec'];
const nodes = [];
const baseLinks = [];

CLUSTERS.forEach((group, c) => {
    const hub = `${group}-hub`;
    nodes.push({
        id: hub,
        label: group.toUpperCase(),
        group,
    });

    const members = 15 + (c % 4) * 4;
    for (let i = 0; i < members; i++) {
        const id = `${group}-${i}`;
        nodes.push({ id, label: '', group });
        baseLinks.push([hub, id]);
        // A little intra-cluster meshing so it doesn't look like a pure star.
        if (i > 0 && i % 3 === 0) {
            baseLinks.push([`${group}-${i - 1}`, id]);
        }
    }
});

// Bridges between hubs so the graph is one connected component.
for (let c = 0; c < CLUSTERS.length; c++) {
    baseLinks.push([`${CLUSTERS[c]}-hub`, `${CLUSTERS[(c + 1) % CLUSTERS.length]}-hub`]);
}

function makeLinks() {
    return baseLinks.map(([source, target]) => ({
        source,
        target,
        value: Math.round(Math.random() * 8 + 1),
    }));
}

let links = makeLinks();

function buildOptions() {
    const options = {
        nodeRadius: extras.nodeRadius,
        charge: extras.charge,
        linkDistance: extras.linkDistance,
        linkStrength: extras.linkStrength,
        centerStrength: extras.centerStrength,
        iterations: extras.iterations,
        ...buildCommonOptions(config),
    };

    // The demo's bespoke format applies when no preset is selected.
    options.format ??= (v: number) => `${v} threads`;

    return options;
}

const example = ref();

const { contextChanged, chart } = useRiplChart(context => {
    return createForceDirectedChart(context, {
        nodes,
        links,
        root: 'eng-hub',
        ...buildOptions(),
    });
});

watch([config, extras], () => chart.value?.update(buildOptions()), { deep: true });


function randomize() {
    // Re-roll link weights; the layout re-runs from its current positions and glides to the new one.
    links = makeLinks();
    chart.value?.update({ links });
}
</script>

## Usage

```ts
import {
    createForceDirectedChart,
} from '@ripl/charts';

const chart = createForceDirectedChart('#container', {
    nodes: [
        {
            id: 'a',
            label: 'A',
            group: 'x',
        },
        {
            id: 'b',
            label: 'B',
            group: 'x',
        },
        {
            id: 'c',
            label: 'C',
            group: 'y',
        },
    ],
    links: [
        {
            source: 'a',
            target: 'b',
            value: 4,
        },
        {
            source: 'b',
            target: 'c',
            value: 2,
        },
    ],
});
```

## Data Format

Provide `nodes` (each with a unique `id`, optional `label`, `group`, `value`, `color`) and `links` (each with `source`/`target` node ids and an optional `value`). Node size defaults to its link degree when no `value` is given; nodes in the same `group` share a color.

## Options

A full configuration for this chart. The options every chart shares — `padding`, `title`,
`animation`, `theme` and the rest — behave the same everywhere and are documented on
[Shared Options](/charts/shared-options).

<!-- eslint-skip -->
```ts
createForceDirectedChart('#container', {
    nodes,
    links,
    nodeRadius: 7,
    // Negative charge repels; a larger magnitude spreads the graph further.
    charge: -160,
    linkDistance: 40,
    linkStrength: 0.6,
    centerStrength: 0.05,
    // Simulation passes run before the layout is drawn.
    iterations: 300,
    // The node the layout springs out from on entry; defaults to the highest-degree node.
    root: 'core',
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
chart.on('nodeclick', event => console.log(event.data)); // event.data: ForceDirectedNodeEvent<TData>
// Emitted when the pointer enters a node.
chart.on('nodeenter', event => console.log(event.data)); // event.data: ForceDirectedNodeEvent<TData>
// Emitted when the pointer leaves a node.
chart.on('nodeleave', event => console.log(event.data)); // event.data: ForceDirectedNodeEvent<TData>
// Emitted when a link is clicked.
chart.on('linkclick', event => console.log(event.data)); // event.data: ForceDirectedLinkEvent
// Emitted when the pointer enters a link.
chart.on('linkenter', event => console.log(event.data)); // event.data: ForceDirectedLinkEvent
// Emitted when the pointer leaves a link.
chart.on('linkleave', event => console.log(event.data)); // event.data: ForceDirectedLinkEvent
```
<!-- events:end -->

## Programmatic Interaction

`highlightNode` and `highlightLink` put a mark into the same hover state the pointer would — it
brightens out of its rest tint — without waiting for one. A node takes its id or the `{ key }` ref
form. Links carry no id of their own, so one takes a `{ source, target }` ref naming the nodes it
joins — in the order the events above report them — or the `"source->target"` string that flattens
to. Either method also accepts an accessor over the chart's `nodes` or `links`. `{ tooltip: true }`
opens the mark's tooltip where hovering would; a force-directed chart draws no crosshair, so
`crosshair` is ignored here.

```ts
const chart = createForceDirectedChart('#container', { nodes, links });

// Light one node, then the link joining it to another.
chart.highlightNode('a', { tooltip: true });
chart.highlightLink({ source: 'a', target: 'b' }, { tooltip: true });

// The first node in the dataset.
chart.highlightNode(nodes => nodes[0].id);

chart.clearHighlight();
```

One highlight is active at a time — a matching call replaces the last, including across the two
methods — and it is one-shot: the next render (a resize, an `update`, a legend toggle) or the next
pointer hover restores the network, and it emits none of the events above. `clearHighlight()`
restores it explicitly; both methods return `false` when the selector matched nothing live.