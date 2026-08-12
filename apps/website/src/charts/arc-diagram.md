---
title: Arc Diagram
description: Lay out graph nodes along one horizontal or vertical axis joined by semicircular arcs whose thickness encodes link weight, with nodes sized by connection count.
---

# Arc Diagram

The **Arc Diagram** lays nodes out along a single axis and joins them with semicircular arcs whose thickness encodes each link's weight. Reach for it when the order of the nodes carries meaning and you want clusters and bridging links to stand out — character co-occurrence, module dependencies, an adjacency matrix you would rather not read as a grid. `orientation` runs the axis horizontally or vertically, `sizeByConnections` scales each node by its degree, and `nodeRadius` sets the base size. Arcs are hit-tested on their stroke, so a small link nested under a large one is still hoverable. The same options render to Canvas, SVG or a [terminal context](/charts/advanced/rendering-targets).

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
        <RiplChartConfig :config="config" extra-title="Arc Diagram" :extras-reset="reset">
            <RiplField label="Vertical" inline option="orientation">
                <RiplSwitch v-model="extras.orientation" />
            </RiplField>
            <RiplField label="Size by connections" inline option="sizeByConnections">
                <RiplSwitch v-model="extras.sizeByConnections" />
            </RiplField>
            <RiplField label="Node radius" option="nodeRadius">
                <RiplInputRange v-model="extras.nodeRadius" :min="4" :max="16" :step="1" />
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
    createArcDiagramChart,
} from '@ripl/charts';

import {
    ref,
    watch,
} from 'vue';

const { extras, reset } = useChartExtras({
    orientation: false,
    sizeByConnections: true,
    nodeRadius: 8,
});

const config = useChartConfig({
    features: {
        title: true,
        legend: true,
        format: true,
        animation: true,
        theme: true,
    },
    title: 'Character Co-occurrence',
});

const nodes = [
    { id: 'valjean', label: 'Valjean', group: 'a' },
    { id: 'myriel', label: 'Myriel', group: 'a' },
    { id: 'javert', label: 'Javert', group: 'a' },
    { id: 'fantine', label: 'Fantine', group: 'b' },
    { id: 'cosette', label: 'Cosette', group: 'b' },
    { id: 'marius', label: 'Marius', group: 'b' },
    { id: 'thenardier', label: 'Thénardier', group: 'c' },
    { id: 'mme', label: 'Mme.T', group: 'c' },
    { id: 'eponine', label: 'Éponine', group: 'c' },
    { id: 'enjolras', label: 'Enjolras', group: 'd' },
    { id: 'gavroche', label: 'Gavroche', group: 'd' },
    { id: 'combeferre', label: 'Combeferre', group: 'd' },
    { id: 'courfeyrac', label: 'Courfeyrac', group: 'd' },
    { id: 'bossuet', label: 'Bossuet', group: 'd' },
    { id: 'joly', label: 'Joly', group: 'd' },
    { id: 'gillenormand', label: 'Gillenormand', group: 'b' },
    { id: 'mabeuf', label: 'Mabeuf', group: 'd' },
    { id: 'bahorel', label: 'Bahorel', group: 'd' },
];

function makeLinks() {
    const pairs = [
        ['valjean', 'myriel'],
        ['valjean', 'javert'],
        ['valjean', 'fantine'],
        ['valjean', 'cosette'],
        ['valjean', 'thenardier'],
        ['valjean', 'marius'],
        ['fantine', 'thenardier'],
        ['cosette', 'marius'],
        ['cosette', 'thenardier'],
        ['marius', 'gillenormand'],
        ['marius', 'enjolras'],
        ['marius', 'eponine'],
        ['thenardier', 'mme'],
        ['thenardier', 'eponine'],
        ['thenardier', 'javert'],
        ['enjolras', 'gavroche'],
        ['enjolras', 'combeferre'],
        ['enjolras', 'courfeyrac'],
        ['enjolras', 'bossuet'],
        ['enjolras', 'joly'],
        ['enjolras', 'bahorel'],
        ['gavroche', 'mabeuf'],
        ['courfeyrac', 'mabeuf'],
        ['combeferre', 'courfeyrac'],
        ['bossuet', 'joly'],
        ['bahorel', 'bossuet'],
        ['eponine', 'marius'],
        ['javert', 'fantine'],
    ];

    return pairs.map(([source, target]) => ({
        source,
        target,
        value: Math.round(Math.random() * 9 + 1),
    }));
}

let links = makeLinks();

function buildOptions() {
    const options = {
        nodeRadius: extras.nodeRadius,
        orientation: extras.orientation ? 'vertical' : 'horizontal',
        sizeByConnections: extras.sizeByConnections,
        ...buildCommonOptions(config),
    };

    // The demo's bespoke format applies when no preset is selected.
    options.format ??= (v: number) => `${v} scenes`;

    return options;
}

const example = ref();

const { contextChanged, chart } = useRiplChart(context => {
    return createArcDiagramChart(context, {
        nodes,
        links,
        ...buildOptions(),
    });
});

watch([config, extras], () => chart.value?.update(buildOptions()), { deep: true });


function randomize() {
    links = makeLinks();
    chart.value?.update({ links });
}
</script>

## Usage

```ts
import {
    createArcDiagramChart,
} from '@ripl/charts';

const chart = createArcDiagramChart('#container', {
    nodes: [
        {
            id: 'a',
            label: 'A',
        },
        {
            id: 'b',
            label: 'B',
        },
        {
            id: 'c',
            label: 'C',
        },
    ],
    links: [
        {
            source: 'a',
            target: 'b',
            value: 4,
        },
        {
            source: 'a',
            target: 'c',
            value: 2,
        },
    ],
});
```

## Data Format

Provide `nodes` (each with a unique `id`, optional `label`, `group`, `color`) laid out in order along the axis, and `links` (`source`/`target` node ids with an optional `value` controlling arc thickness). Nodes in the same `group` share a color.

## Options

A full configuration for this chart. The options every chart shares — `padding`, `title`,
`animation`, `theme` and the rest — behave the same everywhere and are documented on
[Shared Options](/charts/shared-options).

<!-- eslint-skip -->
```ts
createArcDiagramChart('#container', {
    nodes,
    links,
    // `'horizontal'` (the default) runs the node axis along the bottom with arcs bulging up.
    // `'vertical'` runs it down the left, arcs bulging right.
    orientation: 'vertical',
    // The dot radius — and, with `sizeByConnections` on, the radius of the *most* connected
    // node. The rest scale down from it by degree.
    nodeRadius: 8,
    sizeByConnections: true,
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
chart.on('nodeclick', event => console.log(event.data)); // event.data: ArcDiagramNodeEvent<TData>
// Emitted when the pointer enters a node.
chart.on('nodeenter', event => console.log(event.data)); // event.data: ArcDiagramNodeEvent<TData>
// Emitted when the pointer leaves a node.
chart.on('nodeleave', event => console.log(event.data)); // event.data: ArcDiagramNodeEvent<TData>
// Emitted when a link arc is clicked.
chart.on('linkclick', event => console.log(event.data)); // event.data: ArcDiagramLinkEvent
// Emitted when the pointer enters a link arc.
chart.on('linkenter', event => console.log(event.data)); // event.data: ArcDiagramLinkEvent
// Emitted when the pointer leaves a link arc.
chart.on('linkleave', event => console.log(event.data)); // event.data: ArcDiagramLinkEvent
```
<!-- events:end -->

## Programmatic Interaction

`highlightNode` and `highlightLink` put a mark into the same hover state the pointer would — it
brightens out of its rest tint — without waiting for one. A node takes its id or the `{ key }` ref
form. Arcs carry no id of their own, so one takes a `{ source, target }` ref naming the nodes it
joins — in the order the events above report them — or the `"source->target"` string that flattens
to. Either method also accepts an accessor over the chart's `nodes` or `links`. `{ tooltip: true }`
opens the mark's tooltip where hovering would; an arc diagram draws no crosshair, so `crosshair` is
ignored here.

```ts
const chart = createArcDiagramChart('#container', { nodes, links });

// Light one node, then the arc joining it to another.
chart.highlightNode('a', { tooltip: true });
chart.highlightLink({ source: 'a', target: 'b' }, { tooltip: true });

// The first arc in the dataset.
chart.highlightLink(links => ({ source: links[0].source, target: links[0].target }));

chart.clearHighlight();
```

One highlight is active at a time — a matching call replaces the last, including across the two
methods — and it is one-shot: the next render (a resize, an `update`, a legend toggle) or the next
pointer hover restores the diagram, and it emits none of the events above. `clearHighlight()`
restores it explicitly; both methods return `false` when the selector matched nothing live.