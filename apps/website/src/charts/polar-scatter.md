# Polar Scatter Chart

The **Polar Scatter Chart** plots points on a circular grid, where each point's **angle** encodes one variable and its **distance from the center** another; an optional third variable can drive marker size. It suits directional data (wind, radar returns, cyclical measurements) where a cartesian scatter would misrepresent the wrap-around nature of the angle.

> [!NOTE]
> For the full API, see the [Charts API Reference](/docs/api/@ripl/charts/).

## Example

<ripl-example ref="example" @context-changed="contextChanged">
    <template #footer>
        <RiplControlGroup>
            <RiplButton @click="randomize">Randomize</RiplButton>
            <RiplButton @click="addPoint">Add Point</RiplButton>
            <RiplButton @click="removePoint">Remove Point</RiplButton>
        </RiplControlGroup>
    </template>
    <template #config>
        <RiplChartConfig :config="config" :series="seriesMeta" extra-title="Polar Scatter" :extras-reset="reset">
            <RiplField label="Max value" option="max">
                <RiplInputNumber v-model="extras.max" placeholder="auto" />
            </RiplField>
            <RiplField label="Value rings" option="levels">
                <RiplInputRange v-model="extras.levels" :min="3" :max="8" :step="1" />
            </RiplField>
            <RiplField label="Angle spokes" option="sectors">
                <RiplInputRange v-model="extras.sectors" :min="4" :max="16" :step="1" />
            </RiplField>
            <RiplField label="Min marker" option="minRadius">
                <RiplInputRange v-model="extras.minRadius" :min="2" :max="12" :step="1" />
            </RiplField>
            <RiplField label="Max marker" option="maxRadius">
                <RiplInputRange v-model="extras.maxRadius" :min="8" :max="30" :step="1" />
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
    createPolarScatterChart,
} from '@ripl/charts';

import {
    ref,
    watch,
} from 'vue';

const seriesMeta = [
    { id: 'morning', label: 'Morning' },
    { id: 'evening', label: 'Evening' },
];

const { extras, reset } = useChartExtras({
    max: 100 as number | undefined,
    levels: 4,
    sectors: 8,
    minRadius: 4,
    maxRadius: 14,
});

const config = useChartConfig({
    features: {
        title: true,
        legend: true,
        format: true,
        animation: true,
        theme: true,
        dataLabels: true,
    },
    title: 'Wind Samples',
    colors: seedColors(seriesMeta.map(s => s.id)),
});

// Each sample row carries both readings, so the two series occupy visibly distinct regions:
// a gentler easterly morning breeze vs a stronger westerly evening front.
function makeSample() {
    return {
        morningAngle: Math.round(30 + Math.random() * 120),
        morningSpeed: Math.round(20 + Math.random() * 40),
        morningGust: Math.round(30 + Math.random() * 35),
        eveningAngle: Math.round(210 + Math.random() * 120),
        eveningSpeed: Math.round(50 + Math.random() * 45),
        eveningGust: Math.round(60 + Math.random() * 50),
    };
}

let samples = Array.from({ length: 12 }, makeSample);

function getSeries() {
    return [
        {
            id: 'morning',
            label: 'Morning',
            angleBy: 'morningAngle',
            radiusBy: 'morningSpeed',
            sizeBy: 'morningGust',
            minRadius: extras.minRadius,
            maxRadius: extras.maxRadius,
            color: config.colors.morning,
        },
        {
            id: 'evening',
            label: 'Evening',
            angleBy: 'eveningAngle',
            radiusBy: 'eveningSpeed',
            sizeBy: 'eveningGust',
            minRadius: extras.minRadius,
            maxRadius: extras.maxRadius,
            color: config.colors.evening,
        },
    ];
}

function buildOptions() {
    const options = {
        series: getSeries(),
        max: extras.max,
        levels: extras.levels,
        sectors: extras.sectors,
        ...buildCommonOptions(config),
    };

    // The demo's bespoke format applies when no preset is selected.
    options.format ??= (v: number) => `${v} km/h`;

    return options;
}

const example = ref();

const { contextChanged, chart } = useRiplChart(context => {
    return createPolarScatterChart(context, {
        data: samples,
        ...buildOptions(),
    });
});

watch([config, extras], () => chart.value?.update(buildOptions()), { deep: true });


function randomize() {
    // Re-roll every sample's values but keep the count, so points morph in place.
    samples = samples.map(makeSample);
    chart.value?.update({ data: samples });
}

function addPoint() {
    // Append a single new sample; existing points stay put while the new one animates in.
    samples = [...samples, makeSample()];
    chart.value?.update({ data: samples });
}

function removePoint() {
    if (samples.length > 3) {
        // Drop only the newest sample so exactly one point exits.
        samples = samples.slice(0, -1);
        chart.value?.update({ data: samples });
    }
}
</script>

## Usage

```ts
import {
    createPolarScatterChart,
} from '@ripl/charts';

const chart = createPolarScatterChart('#container', {
    data: [
        {
            angle: 45,
            speed: 62,
            gust: 80,
        },
        {
            angle: 120,
            speed: 34,
            gust: 40,
        },
        {
            angle: 250,
            speed: 88,
            gust: 95,
        },
    ],
    series: [
        {
            id: 'wind',
            label: 'Wind',
            angleBy: 'angle',
            radiusBy: 'speed',
            sizeBy: 'gust',
        },
    ],
    max: 100,
});
```

## Data Format

Each item provides an angle (in degrees, `0°` at the top and increasing clockwise), a radial value, and optionally a size value:

```ts
const data = [
    {
        angle: 45,
        speed: 62,
        gust: 80,
    },
    {
        angle: 120,
        speed: 34,
        gust: 40,
    },
];
```

Every series reads **all** rows through its own accessors. For multiple series, keep one row per
observation and point each series at its own fields:

```ts
const data = [
    {
        morningAngle: 60,
        morningSpeed: 32,
        eveningAngle: 250,
        eveningSpeed: 78,
    },
];

const series = [
    {
        id: 'morning',
        label: 'Morning',
        angleBy: 'morningAngle',
        radiusBy: 'morningSpeed',
    },
    {
        id: 'evening',
        label: 'Evening',
        angleBy: 'eveningAngle',
        radiusBy: 'eveningSpeed',
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
createPolarScatterChart('#container', {
    data,   // TData[]
    series, // PolarScatterSeriesOptions<TData>[]
});
```
<!-- required:end -->

### All options

<!-- options:start -->
<!-- eslint-skip -->
```ts
interface PolarScatterChartOptions<TData> {
    // Chart-specific
    /** The dataset plotted across all series. */
    data: TData[];

    /** The series to render, each mapping the data to angle/radius positions. */
    series: PolarScatterSeriesOptions<TData>[];

    /** The value mapped to the outer radius (defaults to the largest radius value in the data). */
    max?: number;

    /** Number of concentric value rings. Defaults to 4. */
    levels?: number;

    /** Number of angular spokes/labels around the circle. Defaults to 8. */
    sectors?: number;

    /** Legend configuration. Shown by default when there is more than one series. */
    legend?: ChartLegendInput;

    /** Format applied to radial values shown as text (tooltips + ring labels). */
    format?: ValueFormatInput;

    /**
     * Show each marker's radial value beside it, just above by default (`true`/`false`, an anchor,
     * or detailed label options). Off by default.
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

interface PolarScatterSeriesOptions<TData> {
    /** Unique identifier for the series. */
    id: string;

    /** Optional color override for the series (otherwise a palette color is generated). */
    color?: string;

    /** Display label for the series (shown in the legend and tooltips). */
    label: string;

    /** Angular position in degrees (0° at the top, increasing clockwise). */
    angleBy: NumericAccessor<TData>;

    /** Radial position (distance from the center), on the radial value scale. */
    radiusBy: NumericAccessor<TData>;

    /** Optional accessor whose value scales each marker's size between `minRadius` and `maxRadius`. */
    sizeBy?: NumericAccessor<TData> | number;

    /** Smallest marker radius in pixels when `sizeBy` is set. Defaults to 4. */
    minRadius?: number;

    /** Largest marker radius in pixels when `sizeBy` is set. Defaults to 14. */
    maxRadius?: number;
}

interface PolarScatterChartEventMap {
    /** Emitted when a marker is clicked. */
    markerclick: PolarScatterMarkerEvent;

    /** Emitted when the pointer enters a marker. */
    markerenter: PolarScatterMarkerEvent;

    /** Emitted when the pointer leaves a marker. */
    markerleave: PolarScatterMarkerEvent;
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
// Emitted when a marker is clicked.
chart.on('markerclick', event => console.log(event.data)); // event.data: PolarScatterMarkerEvent
// Emitted when the pointer enters a marker.
chart.on('markerenter', event => console.log(event.data)); // event.data: PolarScatterMarkerEvent
// Emitted when the pointer leaves a marker.
chart.on('markerleave', event => console.log(event.data)); // event.data: PolarScatterMarkerEvent
```
<!-- events:end -->
