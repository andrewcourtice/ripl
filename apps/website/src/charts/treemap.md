# Treemap Chart

The **Treemap Chart** displays hierarchical data as nested rectangles, where each rectangle's area is proportional to its value. It's great for visualizing how a total breaks down into parts, such as market share, disk usage, or budget allocation. Cells are labeled, automatically colored, and animate smoothly on data changes. Configurable gaps and rounded corners keep the layout clean.

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
        <RiplChartConfig :config="config" extra-title="Treemap" :extras-reset="reset">
            <RiplField label="Cell gap" option="gap">
                <RiplInputRange v-model="extras.gap" :min="0" :max="12" :step="1" />
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
    createTreemapChart,
} from '@ripl/charts';

import {
    ref,
    watch,
} from 'vue';

const CATEGORIES = ['Electronics', 'Clothing', 'Food', 'Books', 'Sports', 'Home', 'Toys', 'Health'];

const { extras, reset } = useChartExtras({
    gap: 3,
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
    title: 'Revenue by Category',
});

function generateData() {
    return CATEGORIES.map(name => ({
        name,
        value: Math.round(Math.random() * 900 + 100),
    }));
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
    return createTreemapChart(context, {
        data,
        key: 'name',
        value: 'value',
        label: 'name',
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
    createTreemapChart,
} from '@ripl/charts';

const chart = createTreemapChart('#container', {
    data: [/* ... */],
    key: 'name',
    value: 'value',
    label: 'name',
});
```

## Data Format

Each item is one rectangle, with a key, a numeric value that sets its area, and a display label:

```ts
const data = [
    {
        id: 'chrome',
        name: 'Chrome',
        share: 64.5,
    },
    {
        id: 'safari',
        name: 'Safari',
        share: 18.8,
    },
    {
        id: 'edge',
        name: 'Edge',
        share: 5.2,
    },
];
```

Rectangles are laid out largest-first, so the ordering of the array does not matter.

## Options

Every option is listed below, generated from the chart's TypeScript definitions so this reference
cannot drift from the code. See [Shared Options](/charts/shared-options) for how the options common
to every chart behave, and [Migration](/charts/migration) if you are upgrading.

### Required

<!-- required:start -->
<!-- eslint-skip -->
```ts
createTreemapChart('#container', {
    data,  // TData[]
    key,   // keyof TData | ((item: TData) => string)
    value, // NumericAccessor<TData>
    label, // keyof TData | ((item: TData) => string)
});
```
<!-- required:end -->

### All options

<!-- options:start -->
<!-- eslint-skip -->
```ts
interface TreemapChartOptions<TData> {
    // Chart-specific
    /** The dataset to render, one cell per item. */
    data: TData[];

    /** Accessor for each item's unique key, used to match cells across data updates. */
    key: keyof TData | ((item: TData) => string);

    /** Accessor for each item's numeric value, which determines its cell area. */
    value: NumericAccessor<TData>;

    /** Accessor for each item's display label (shown inside sufficiently large cells). */
    label: keyof TData | ((item: TData) => string);

    /** Optional per-item color accessor; falls back to a generated palette color. */
    colorBy?: keyof TData | ((item: TData) => string);

    /** Legend configuration. Shown by default; pass `false` to hide. */
    legend?: ChartLegendInput;

    /** Gap in pixels between adjacent cells. Defaults to 3. */
    gap?: number;

    /** Corner radius in pixels applied to each cell. Defaults to 4. */
    borderRadius?: number;

    /** Format applied to cell values shown as text (e.g. tooltips). */
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

interface TreemapChartEventMap {
    /** Emitted when a cell is clicked. */
    nodeclick: TreemapChartNodeEvent;

    /** Emitted when the pointer enters a cell. */
    nodeenter: TreemapChartNodeEvent;

    /** Emitted when the pointer leaves a cell. */
    nodeleave: TreemapChartNodeEvent;
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
// Emitted when a cell is clicked.
chart.on('nodeclick', event => console.log(event.data)); // event.data: TreemapChartNodeEvent
// Emitted when the pointer enters a cell.
chart.on('nodeenter', event => console.log(event.data)); // event.data: TreemapChartNodeEvent
// Emitted when the pointer leaves a cell.
chart.on('nodeleave', event => console.log(event.data)); // event.data: TreemapChartNodeEvent
```
<!-- events:end -->
