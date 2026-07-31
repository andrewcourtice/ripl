# Funnel Chart

The **Funnel Chart** displays data as progressively narrowing horizontal bars, ideal for visualizing conversion pipelines, sales funnels, and drop-off rates. Each stage is labeled and colored automatically, with configurable gaps and rounded corners. Values animate smoothly when data changes.

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
        <RiplChartConfig :config="config" extra-title="Funnel" :extras-reset="reset">
            <RiplField label="Segment gap" option="gap">
                <RiplInputRange v-model="extras.gap" :min="0" :max="16" :step="1" />
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
    createFunnelChart,
} from '@ripl/charts';

import {
    ref,
    watch,
} from 'vue';

const { extras, reset } = useChartExtras({
    gap: 4,
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
    title: 'Conversion Funnel',
    // The funnel is a single centred shape, so it reads better inset from the edges than filling
    // them. Seeded through the config rather than passed as a literal, so the Layout control starts
    // here and still drives the chart.
    padding: 40,
});

function generateData() {
    let remaining = 10000;
    return ['Visitors', 'Leads', 'Prospects', 'Negotiations', 'Closed'].map(stage => {
        const value = remaining;
        remaining = Math.round(remaining * (0.3 + Math.random() * 0.4));
        return { stage, value };
    });
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
    return createFunnelChart(context, {
        data,
        key: 'stage',
        value: 'value',
        label: 'stage',
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
    createFunnelChart,
} from '@ripl/charts';

const chart = createFunnelChart('#container', {
    data: [/* ... */],
    key: 'stage',
    value: 'value',
    label: 'stage',
});
```

## Data Format

Each item is one stage of the funnel, with a key, a numeric value and a display label. Stages render
top to bottom in array order, so sort the data the way you want it read:

```ts
const data = [
    {
        stage: 'visited',
        label: 'Visited',
        count: 12_480,
    },
    {
        stage: 'signed-up',
        label: 'Signed up',
        count: 4_210,
    },
    {
        stage: 'purchased',
        label: 'Purchased',
        count: 1_150,
    },
];
```

## Options

Every option is listed below, generated from the chart's TypeScript definitions so this reference
cannot drift from the code. See [Shared Options](/charts/shared-options) for how the options common
to every chart behave, and [Migration](/charts/migration) if you are upgrading.

### Required

<!-- required:start -->
<!-- eslint-skip -->
```ts
createFunnelChart('#container', {
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
interface FunnelChartOptions<TData> {
    // Chart-specific
    /** The dataset rendered as funnel segments, top to bottom. */
    data: TData[];

    /** Accessor for each item's unique key (used for color assignment and data joins). */
    key: keyof TData | ((item: TData) => string);

    /** Accessor for each segment's numeric value (drives its width). */
    value: NumericAccessor<TData>;

    /** Accessor for each segment's display label. */
    label: keyof TData | ((item: TData) => string);

    /** Optional per-item color accessor; falls back to the generated palette. */
    colorBy?: keyof TData | ((item: TData) => string);

    /** Legend configuration. Shown by default; pass `false` to hide. */
    legend?: ChartLegendInput;

    /** Vertical gap in pixels between segments. Defaults to 4. */
    gap?: number;

    /** Corner radius in pixels applied to each segment. Defaults to 4. */
    borderRadius?: number;

    /** Format applied to segment values shown as text (e.g. tooltips). */
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

interface FunnelChartEventMap {
    /** Emitted when a segment is clicked. */
    segmentclick: FunnelChartSegmentEvent;

    /** Emitted when the pointer enters a segment. */
    segmententer: FunnelChartSegmentEvent;

    /** Emitted when the pointer leaves a segment. */
    segmentleave: FunnelChartSegmentEvent;
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
chart.on('segmentclick', event => console.log(event.data)); // event.data: FunnelChartSegmentEvent
// Emitted when the pointer enters a segment.
chart.on('segmententer', event => console.log(event.data)); // event.data: FunnelChartSegmentEvent
// Emitted when the pointer leaves a segment.
chart.on('segmentleave', event => console.log(event.data)); // event.data: FunnelChartSegmentEvent
```
<!-- events:end -->
