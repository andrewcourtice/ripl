# Radar Chart

The **Radar Chart** displays multivariate data on a radial grid, ideal for comparing strengths and weaknesses across multiple dimensions. Each axis radiates from a shared center, and data series form filled polygons whose shape reveals the profile at a glance. It supports multiple overlapping series, configurable grid levels, markers that animate in sync with the area polygon, and an optional legend.

> [!NOTE]
> For the full API, see the [Charts API Reference](/docs/api/@ripl/charts/).

## Example

<ripl-example ref="example" @context-changed="contextChanged">
    <template #footer>
        <RiplControlGroup>
            <RiplButton @click="randomize">Randomize</RiplButton>
            <RiplButton @click="addAxis">Add Axis</RiplButton>
            <RiplButton @click="removeAxis">Remove Axis</RiplButton>
        </RiplControlGroup>
    </template>
    <template #config>
        <RiplChartConfig :config="config" :series="seriesMeta" extra-title="Radar" :extras-reset="reset">
            <RiplField label="Grid levels">
                <RiplInputRange v-model="extras.levels" :min="3" :max="8" :step="1" />
            </RiplField>
            <RiplField label="Max value">
                <RiplInputNumber v-model="extras.max" placeholder="auto" />
            </RiplField>
            <RiplField label="Fill opacity">
                <RiplInputRange v-model="extras.fillOpacity" :min="0" :max="1" :step="0.05" />
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
    seedColors,
    useChartConfig,
    useChartExtras,
} from '../.vitepress/compositions/use-chart-config';

import {
    createRadarChart,
} from '@ripl/charts';

import {
    ref,
    watch,
} from 'vue';

const AXIS_POOL = ['Speed', 'Strength', 'Defense', 'Magic', 'Luck', 'Agility', 'Stamina', 'Wisdom'];

const seriesMeta = [
    { id: 'player1', label: 'Player 1' },
    { id: 'player2', label: 'Player 2' },
];

let axisCount = 6;

const { extras, reset } = useChartExtras({
    levels: 5,
    max: undefined as number | undefined,
    fillOpacity: 0.25,
});

const config = useChartConfig({
    features: {
        title: true,
        legend: true,
        format: true,
        animation: true,
        theme: true,
    },
    title: 'Player Comparison',
    colors: seedColors(seriesMeta.map(s => s.id)),
});

function currentAxes() {
    return AXIS_POOL.slice(0, axisCount);
}

function generateData() {
    return currentAxes().map(axis => ({
        axis,
        player1: Math.round(Math.random() * 80 + 20),
        player2: Math.round(Math.random() * 80 + 20),
    }));
}

let data = generateData();

function getSeries() {
    return seriesMeta.map(s => ({
        id: s.id,
        value: s.id,
        label: s.label,
        fillOpacity: extras.fillOpacity,
        color: config.colors[s.id],
    }));
}

function buildOptions() {
    const options = {
        categories: currentAxes(),
        levels: extras.levels,
        series: getSeries(),
        ...buildCommonOptions(config),
    };

    // max is optional (blank = auto-computed from the data); only pass it when set.
    if (extras.max !== undefined) {
        options.max = extras.max;
    }

    return options;
}

const example = ref();

const { contextChanged, chart } = useRiplChart(context => {
    return createRadarChart(context, {
        data,
        ...buildOptions(),
    });
});

watch([config, extras], () => chart.value?.update(buildOptions()), { deep: true });


function randomize() {
    data = generateData();
    chart.value?.update({ data });
}

function addAxis() {
    if (axisCount < AXIS_POOL.length) {
        axisCount++;
        data = generateData();
        chart.value?.update({ categories: currentAxes(), data });
    }
}

function removeAxis() {
    if (axisCount > 3) {
        axisCount--;
        data = generateData();
        chart.value?.update({ categories: currentAxes(), data });
    }
}
</script>

## Usage

```ts
import {
    createRadarChart,
} from '@ripl/charts';

const chart = createRadarChart('#container', {
    data: [/* ... */],
    categories: ['Speed', 'Strength', 'Defense', 'Magic', 'Luck', 'Agility'],
    series: [
        { id: 'player1', value: 'player1', label: 'Player 1' },
    ],
});
```

## Data Format

Each item represents one axis and contains the axis label plus one or more numeric series values:

```ts
const data = [
    {
        axis: 'Speed',
        player1: 80,
        player2: 65,
    },
    {
        axis: 'Strength',
        player1: 55,
        player2: 90,
    },
    {
        axis: 'Defense',
        player1: 70,
        player2: 45,
    },
];
```

The `categories` option lists axis labels, and each series references a numeric field via `value`.

## Variants

### Single series

```ts
createRadarChart('#container', {
    data,
    categories: ['Speed', 'Strength', 'Defense', 'Magic', 'Luck'],
    series: [
        {
            id: 'player1',
            value: 'player1',
            label: 'Player 1',
        },
    ],
});
```

### Custom levels and max value

```ts
createRadarChart('#container', {
    data,
    categories: ['Speed', 'Strength', 'Defense', 'Magic', 'Luck'],
    levels: 10,
    max: 100,
    series: [
        {
            id: 'player1',
            value: 'player1',
            label: 'Player 1',
            fillOpacity: 0.3,
        },
        {
            id: 'player2',
            value: 'player2',
            label: 'Player 2',
            fillOpacity: 0.3,
        },
    ],
});
```

## Options

Every option is listed below, generated from the chart's TypeScript definitions so this reference
cannot drift from the code. See [Shared Options](/charts/shared-options) for how the options common
to every chart behave, and [Migration](/charts/migration) if you are upgrading.

### Required

<!-- required:start -->
<!-- eslint-skip -->
```ts
createRadarChart('#container', {
    data,       // TData[]
    series,     // RadarChartSeriesOptions<TData>[]
    categories, // string[]
});
```
<!-- required:end -->

### All options

<!-- options:start -->
<!-- eslint-skip -->
```ts
interface RadarChartOptions<TData> {
    // Chart-specific
    /** The dataset, with one item per axis (in axis order). */
    data: TData[];

    /** The series to overlay, each rendered as a filled polygon. */
    series: RadarChartSeriesOptions<TData>[];

    /** Axis labels arranged clockwise around the chart, one per data item. */
    categories: string[];

    /** Maximum value mapped to the outer ring (defaults to the largest value across all series). */
    max?: number;

    /** Number of concentric grid rings. Defaults to 5. */
    levels?: number;

    /** Legend configuration. Shown by default when there is more than one series. */
    legend?: ChartLegendInput;

    /** Format applied to point values shown as text (e.g. tooltips). */
    format?: ValueFormatInput;

    /**
     * Show each point's value beside its polygon vertex, offset outward along the vertex's angle
     * (`true`/`false` or detailed label options). Off by default.
     */
    labels?: ChartDataLabelsInput;

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

interface RadarChartSeriesOptions<TData> {
    /** Unique identifier for the series. */
    id: string;

    /** Optional color override for the series (otherwise a palette color is generated). */
    color?: string;

    /** Display label for the series (shown in the legend and tooltips). */
    label: string;

    /** Accessor for each data item's value on the series' axis. */
    value: NumericAccessor<TData>;

    /** Fill opacity of the series' area polygon. Defaults to 0.25. */
    fillOpacity?: number;
}

interface RadarChartEventMap {
    /** Emitted when a point marker is clicked. */
    markerclick: RadarChartMarkerEvent;

    /** Emitted when the pointer enters a point marker. */
    markerenter: RadarChartMarkerEvent;

    /** Emitted when the pointer leaves a point marker. */
    markerleave: RadarChartMarkerEvent;
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
// Emitted when a point marker is clicked.
chart.on('markerclick', event => console.log(event.data)); // event.data: RadarChartMarkerEvent
// Emitted when the pointer enters a point marker.
chart.on('markerenter', event => console.log(event.data)); // event.data: RadarChartMarkerEvent
// Emitted when the pointer leaves a point marker.
chart.on('markerleave', event => console.log(event.data)); // event.data: RadarChartMarkerEvent
```
<!-- events:end -->
