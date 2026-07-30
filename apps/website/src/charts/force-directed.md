# Force-Directed Network

The **Force-Directed Network** lays out a graph of nodes and links using a physics simulation: repulsion pushes nodes apart, link springs pull connected nodes together, and a gentle centering force keeps the whole thing on screen. It works well for relationship data like social graphs, dependency trees, topic maps. The layout is deterministic, so the same data always settles the same way. On entry the graph springs out from its root node in cascading waves, and reweighting relaxes the simulation from its current positions so nodes glide smoothly to their new places.

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
            <RiplField label="Node radius">
                <RiplInputRange v-model="extras.nodeRadius" :min="4" :max="16" :step="1" />
            </RiplField>
            <RiplField label="Charge">
                <RiplInputRange v-model="extras.charge" :min="-500" :max="-60" :step="10" />
            </RiplField>
            <RiplField label="Link distance">
                <RiplInputRange v-model="extras.linkDistance" :min="30" :max="120" :step="5" />
            </RiplField>
            <RiplField label="Link strength">
                <RiplInputRange v-model="extras.linkStrength" :min="0" :max="1" :step="0.05" />
            </RiplField>
            <RiplField label="Center strength">
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

Every option is listed below, generated from the chart's TypeScript definitions so this reference
cannot drift from the code. See [Shared Options](/charts/shared-options) for how the options common
to every chart behave, and [Migration](/charts/migration) if you are upgrading.

### Required

<!-- required:start -->
<!-- eslint-skip -->
```ts
createForceDirectedChart('#container', {
    nodes, // ForceNetworkNode<TData>[]
    links, // ForceNetworkLink[]
});
```
<!-- required:end -->

### All options

<!-- options:start -->
<!-- eslint-skip -->
```ts
interface ForceDirectedChartOptions<TData> {
    // Chart-specific
    /** The nodes in the network. */
    nodes: ForceNetworkNode<TData>[];

    /** The links (edges) connecting pairs of nodes. */
    links: ForceNetworkLink[];

    /** Base node radius (nodes with a `value` scale around this). Defaults to 8. */
    nodeRadius?: number;

    /** Force tuning. */
    charge?: number;

    /** Target resting distance between two linked nodes. */
    linkDistance?: number;

    /** Strength pulling linked nodes toward `linkDistance`. */
    linkStrength?: number;

    /** Strength pulling all nodes toward the layout center. */
    centerStrength?: number;

    /** Number of simulation iterations run before the layout is drawn. */
    iterations?: number;

    /** Id of the node the layout springs out from on entry. Defaults to the highest-degree node. */
    root?: string;

    /**
     * Legend configuration. Shown automatically when there is more than one node group; pass
     * `false` to hide.
     */
    legend?: ChartLegendInput;

    /** Format applied to node/link values shown as text (e.g. tooltips). */
    format?: ValueFormatInput;

    // Shared by every chart (BaseChartOptions)
    /**
     * Whether the chart renders automatically on construction and after every `Chart.update`.
     * Defaults to `true`.
     */
    autoRender?: boolean;

    /**
     * Space reserved around the chart, in pixels. A single number applies to all four edges; a
     * `[top, right, bottom, left]` tuple or a partial `{ top, right, bottom, left }` object sets
     * individual edges, leaving unspecified edges at the default. Defaults to `16`.
     */
    padding?: PaddingInput;

    /** Chart title as plain text, or a `ChartTitleOptions` object for full control. */
    title?: string | Partial<ChartTitleOptions>;

    /** Animation configuration, or a boolean toggling all transitions. See `ChartAnimationOptions`. */
    animation?: boolean | Partial<ChartAnimationOptions>;

    /**
     * Theme for this chart: a registered name (`'light'`/`'dark'`/`'auto'`), or a `Theme`. Falls
     * back to the module default (see `setDefaultTheme`).
     */
    theme?: string | Theme;

    /**
     * Accessible description announced by screen readers (sets the rendering element's ARIA
     * label). Defaults to the title text.
     */
    description?: string;
}

interface ForceNetworkNode<TData> {
    /** Unique identifier for the node, referenced by links and used for data joins. */
    id: string;

    /** Text shown beneath the node; defaults to the node's id. */
    label?: string;

    /** Optional magnitude used to size the node; defaults to the node's link degree. */
    value?: number;

    /** Optional grouping; nodes in the same group share a color. */
    group?: string;

    /** Explicit node color; falls back to the group/palette color when omitted. */
    color?: string;

    /** Arbitrary datum carried through to node interaction events. */
    data?: TData;
}

interface ForceNetworkLink {
    /** Id of the node the link starts from. */
    source: string;

    /** Id of the node the link connects to. */
    target: string;

    /** Optional weight; scales the link's line width. */
    value?: number;
}

interface ForceDirectedChartEventMap<TData> {
    /** Emitted when a node is clicked. */
    nodeclick: ForceDirectedNodeEvent<TData>;

    /** Emitted when the pointer enters a node. */
    nodeenter: ForceDirectedNodeEvent<TData>;

    /** Emitted when the pointer leaves a node. */
    nodeleave: ForceDirectedNodeEvent<TData>;

    /** Emitted when a link is clicked. */
    linkclick: ForceDirectedLinkEvent;

    /** Emitted when the pointer enters a link. */
    linkenter: ForceDirectedLinkEvent;

    /** Emitted when the pointer leaves a link. */
    linkleave: ForceDirectedLinkEvent;
}
```
<!-- options:end -->

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
