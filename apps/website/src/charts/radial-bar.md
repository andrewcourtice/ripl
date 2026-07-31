# Radial Bar Chart

The **Radial Bar Chart** lays each category out as a concentric ring whose arc length encodes its value. This circular take on the bar chart reads well for a handful of comparable metrics or progress-style values. Each ring has a faint track behind a colored value arc that sweeps clockwise from the top.

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
        <RiplChartConfig :config="config" extra-title="Rings" :extras-reset="reset">
            <RiplField label="Max value" option="max">
                <RiplInputNumber v-model="extras.max" placeholder="auto" />
            </RiplField>
            <RiplField label="Inner radius" option="innerRadius">
                <RiplInputRange v-model="extras.innerRadius" :min="0" :max="0.6" :step="0.05" />
            </RiplField>
            <RiplField label="Range (°)" option="range">
                <RiplInputRange v-model="extras.range" :min="180" :max="360" :step="10" />
            </RiplField>
            <RiplField label="Ring gap" option="gap">
                <RiplInputRange v-model="extras.gap" :min="0" :max="0.9" :step="0.05" />
            </RiplField>
            <RiplField label="Rounded" inline option="rounded">
                <RiplSwitch v-model="extras.rounded" />
            </RiplField>
            <template #colors>
                <RiplField label="Track color" inline option="trackColor">
                    <RiplColorInput v-model="extras.trackColor" />
                </RiplField>
            </template>
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
    createRadialBarChart,
} from '@ripl/charts';

import {
    ref,
    watch,
} from 'vue';

const LANGUAGES = ['JavaScript', 'Python', 'Rust', 'Go', 'TypeScript'];

const { extras, reset } = useChartExtras({
    max: 100 as number | undefined,
    innerRadius: 0.25,
    range: 300,
    gap: 0.25,
    rounded: true,
    trackColor: '#eceff3',
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
    title: 'Language Popularity',
});

const example = ref();

function generateData() {
    return LANGUAGES.map(language => ({
        language,
        share: Math.round(Math.random() * 80 + 20),
    }));
}

let data = generateData();

function buildOptions() {
    const options = {
        max: extras.max,
        innerRadius: extras.innerRadius,
        range: extras.range,
        gap: extras.gap,
        rounded: extras.rounded,
        trackColor: extras.trackColor,
        ...buildCommonOptions(config),
    };

    // The demo's bespoke format applies when no preset is selected.
    options.format ??= (v: number) => `${v}%`;

    return options;
}

const { contextChanged, chart } = useRiplChart(context => {
    return createRadialBarChart(context, {
        data,
        key: 'language',
        value: 'share',
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
    createRadialBarChart,
} from '@ripl/charts';

const chart = createRadialBarChart('#container', {
    data: [
        {
            language: 'JavaScript',
            share: 92,
        },
        {
            language: 'Python',
            share: 78,
        },
        {
            language: 'Rust',
            share: 61,
        },
    ],
    key: 'language',
    value: 'share',
    max: 100,
    format: v => `${v}%`,
});
```

## Data Format

Each item provides a category key and a numeric value:

```ts
const data = [
    {
        language: 'JavaScript',
        share: 92,
    },
    {
        language: 'Python',
        share: 78,
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
createRadialBarChart('#container', {
    data,  // TData[]
    key,   // keyof TData | ((item: TData) => string)
    value, // NumericAccessor<TData>
});
```
<!-- required:end -->

### All options

<!-- options:start -->
<!-- eslint-skip -->
```ts
interface RadialBarChartOptions<TData> {
    // Chart-specific
    /** The dataset to render, one concentric ring per item. */
    data: TData[];

    /** Accessor for each item's unique key, used to match rings across data updates. */
    key: keyof TData | ((item: TData) => string);

    /** Accessor for each item's numeric value, which determines its arc length. */
    value: NumericAccessor<TData>;

    /** Optional accessor for each item's display label (defaults to its key). */
    label?: keyof TData | ((item: TData) => string);

    /** Optional accessor for a per-item color override (otherwise a palette color is generated). */
    colorBy?: keyof TData | ((item: TData) => string);

    /** Maximum value mapped to a full sweep (defaults to the largest value in the data). */
    max?: number;

    /** Inner hole radius as a ratio of the chart size (0–1). Defaults to 0.2. */
    innerRadius?: number;

    /** Angular sweep of a full-value bar, in degrees. Defaults to 360 (a full circle). */
    range?: number;

    /** Gap between concentric rings as a ratio of the ring thickness (0–0.9). Defaults to 0.25. */
    gap?: number;

    /** Color of the faint full-length track drawn behind each value bar. Defaults to a light gray. */
    trackColor?: string;

    /** Round the ends of each value bar (and its track). Defaults to `false`. */
    rounded?: boolean;

    /** Legend configuration. Shown by default when there is more than one ring. */
    legend?: ChartLegendInput;

    /** Format applied to values shown as text (e.g. tooltips). */
    format?: ValueFormatInput;

    /**
     * Show each ring's value just past the end of its bar, at the ring's mid-radius
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

interface RadialBarChartEventMap {
    /** Emitted when a bar is clicked. */
    barclick: RadialBarChartBarEvent;

    /** Emitted when the pointer enters a bar. */
    barenter: RadialBarChartBarEvent;

    /** Emitted when the pointer leaves a bar. */
    barleave: RadialBarChartBarEvent;
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
// Emitted when a bar is clicked.
chart.on('barclick', event => console.log(event.data)); // event.data: RadialBarChartBarEvent
// Emitted when the pointer enters a bar.
chart.on('barenter', event => console.log(event.data)); // event.data: RadialBarChartBarEvent
// Emitted when the pointer leaves a bar.
chart.on('barleave', event => console.log(event.data)); // event.data: RadialBarChartBarEvent
```
<!-- events:end -->
