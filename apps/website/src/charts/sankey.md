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
        <RiplChartConfig :config="config" extra-title="Layout" :extras-reset="reset">
            <RiplField label="Node width">
                <RiplInputRange v-model="extras.nodeWidth" :min="8" :max="40" :step="1" />
            </RiplField>
            <RiplField label="Node padding">
                <RiplInputRange v-model="extras.nodePadding" :min="0" :max="30" :step="1" />
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
        padding: { right: 80 },
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

Every option is listed below, generated from the chart's TypeScript definitions so this reference
cannot drift from the code. See [Shared Options](/charts/shared-options) for how the options common
to every chart behave, and [Migration](/charts/migration) if you are upgrading.

### Required

<!-- required:start -->
<!-- eslint-skip -->
```ts
createSankeyChart('#container', {
    nodes, // SankeyNode<TData>[]
    links, // SankeyLink[]
});
```
<!-- required:end -->

### All options

<!-- options:start -->
<!-- eslint-skip -->
```ts
interface SankeyChartOptions<TData> {
    // Chart-specific
    /** The nodes in the diagram. */
    nodes: SankeyNode<TData>[];

    /** The directional flows connecting nodes. */
    links: SankeyLink[];

    /** Width of each node rectangle in pixels. Defaults to 20. */
    nodeWidth?: number;

    /** Vertical gap between stacked nodes in a column, in pixels. Defaults to 10. */
    nodePadding?: number;

    /** Number of layout relaxation iterations (reserved for tuning node positioning). */
    iterations?: number;

    /**
     * Legend configuration. Shown automatically when there is more than one node; pass `false` to
     * hide.
     */
    legend?: ChartLegendInput;

    /** Format applied to node and link values shown as text (e.g. tooltips). */
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

interface SankeyNode<TData> {
    /** Unique identifier for the node, referenced by link `source`/`target`. */
    id: string;

    /** Display label shown beside the node. */
    label: string;

    /** Optional color override for the node (otherwise a palette color is generated). */
    color?: string;

    /** Arbitrary datum carried through to node interaction events. */
    data?: TData;
}

interface SankeyLink {
    /** Id of the node the flow originates from. */
    source: string;

    /** Id of the node the flow terminates at. */
    target: string;

    /** Magnitude of the flow, which determines the link's width. */
    value: number;
}

interface SankeyChartEventMap<TData> {
    /** Emitted when a node is clicked. */
    nodeclick: SankeyChartNodeEvent<TData>;

    /** Emitted when the pointer enters a node. */
    nodeenter: SankeyChartNodeEvent<TData>;

    /** Emitted when the pointer leaves a node. */
    nodeleave: SankeyChartNodeEvent<TData>;

    /** Emitted when a link is clicked. */
    linkclick: SankeyChartLinkEvent;

    /** Emitted when the pointer enters a link. */
    linkenter: SankeyChartLinkEvent;

    /** Emitted when the pointer leaves a link. */
    linkleave: SankeyChartLinkEvent;
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
