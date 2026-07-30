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

Every option is listed below, generated from the chart's TypeScript definitions so this reference
cannot drift from the code. See [Shared Options](/charts/shared-options) for how the options common
to every chart behave, and [Migration](/charts/migration) if you are upgrading.

### Required

<!-- required:start -->
<!-- eslint-skip -->
```ts
createSunburstChart('#container', {
    data, // SunburstNode<TData>[]
});
```
<!-- required:end -->

### All options

<!-- options:start -->
<!-- eslint-skip -->
```ts
interface SunburstChartOptions<TData> {
    // Chart-specific
    /** The root nodes of the hierarchy to render as concentric rings. */
    data: SunburstNode<TData>[];

    /** Legend configuration, listing the top-level nodes. */
    legend?: ChartLegendInput;

    /** Format applied to node values shown as text (e.g. tooltips). */
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

interface SunburstNode<TData> {
    /** Unique identifier for the node. */
    id: string;

    /** Display label shown in the legend and tooltips. */
    label: string;

    /** The node's numeric value, which determines its angular extent. */
    value: number;

    /** Optional color override; child nodes inherit their parent's color when omitted. */
    color?: string;

    /** Child nodes rendered in the next ring outward, within this node's angular range. */
    children?: SunburstNode<TData>[];

    /** Arbitrary datum carried through to segment interaction events. */
    data?: TData;
}

interface SunburstChartEventMap<TData> {
    /** Emitted when a segment is clicked. */
    nodeclick: SunburstChartNodeEvent<TData>;

    /** Emitted when the pointer enters a segment. */
    nodeenter: SunburstChartNodeEvent<TData>;

    /** Emitted when the pointer leaves a segment. */
    nodeleave: SunburstChartNodeEvent<TData>;
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
// Emitted when a segment is clicked.
chart.on('nodeclick', event => console.log(event.data)); // event.data: SunburstChartNodeEvent<TData>
// Emitted when the pointer enters a segment.
chart.on('nodeenter', event => console.log(event.data)); // event.data: SunburstChartNodeEvent<TData>
// Emitted when the pointer leaves a segment.
chart.on('nodeleave', event => console.log(event.data)); // event.data: SunburstChartNodeEvent<TData>
```
<!-- events:end -->
