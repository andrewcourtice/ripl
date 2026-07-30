# Gauge Chart

The **Gauge Chart** displays a single value on a semi-circular arc, ideal for KPIs, progress indicators, and dashboard metrics. It supports configurable tick marks along the arc with optional labels, a custom value formatter, and smooth animated transitions when the value changes. The track and fill colors are fully customizable.

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
        <RiplChartConfig :config="config" extra-title="Gauge" :extras-reset="reset">
            <RiplField label="Value">
                <RiplInputRange v-model="extras.value" :min="0" :max="100" :step="1" />
            </RiplField>
            <RiplField label="Min value">
                <RiplInputNumber v-model="extras.min" placeholder="0" />
            </RiplField>
            <RiplField label="Max value">
                <RiplInputNumber v-model="extras.max" placeholder="100" />
            </RiplField>
            <RiplField label="Ticks">
                <RiplInputRange v-model="extras.ticks" :min="0" :max="12" :step="1" />
            </RiplField>
            <RiplField label="Tick labels" inline>
                <RiplSwitch v-model="extras.tickLabels" />
            </RiplField>
            <RiplField label="Fill color" inline>
                <RiplColorInput v-model="extras.color" />
            </RiplField>
            <RiplField label="Track color" inline>
                <RiplColorInput v-model="extras.trackColor" />
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
    createGaugeChart,
} from '@ripl/charts';

import {
    ref,
    watch,
} from 'vue';

const { extras, reset } = useChartExtras({
    value: 72,
    min: 0 as number | undefined,
    max: 100 as number | undefined,
    ticks: 10,
    tickLabels: true,
    color: '#7cacf8',
    trackColor: '#e5e7eb',
});

const config = useChartConfig({
    features: {
        title: true,
        format: true,
        animation: true,
        theme: true,
    },
    title: 'Performance',
    titleVisible: false,
});

const example = ref();

function buildOptions() {
    const options = {
        value: extras.value,
        min: extras.min,
        max: extras.max,
        color: extras.color,
        trackColor: extras.trackColor,
        ticks: extras.ticks,
        tickLabels: extras.tickLabels,
        ...buildCommonOptions(config),
    };

    // The demo's bespoke format applies when no preset is selected.
    options.format ??= (v: number) => `${v}%`;

    return options;
}

const { contextChanged, chart } = useRiplChart(context => {
    return createGaugeChart(context, {
        label: 'Performance',
        ...buildOptions(),
    });
});

watch([config, extras], () => chart.value?.update(buildOptions()), { deep: true });

function randomize() {
    const min = extras.min ?? 0;
    const max = extras.max ?? 100;
    extras.value = Math.round(min + Math.random() * (max - min));
}
</script>

## Usage

```ts
import {
    createGaugeChart,
} from '@ripl/charts';

const chart = createGaugeChart('#container', {
    value: 72,
    min: 0,
    max: 100,
    label: 'Performance',
    format: v => `${v}%`,
});

// Update value
chart.update({ value: 85 });
```

## Data Format

A gauge shows a single number rather than a dataset, so there is no `data` option — pass `value`
directly and update it as it changes:

```ts
const chart = createGaugeChart('#container', {
    value: 72,
    min: 0,
    max: 100,
});

chart.update({ value: 85 });
```

## Options

Every option is listed below, generated from the chart's TypeScript definitions so this reference
cannot drift from the code. See [Shared Options](/charts/shared-options) for how the options common
to every chart behave, and [Migration](/charts/migration) if you are upgrading.

### Required

<!-- required:start -->
<!-- eslint-skip -->
```ts
createGaugeChart('#container', {
    value, // number
});
```
<!-- required:end -->

### All options

<!-- options:start -->
<!-- eslint-skip -->
```ts
interface GaugeChartOptions {
    // Chart-specific
    /** The value displayed by the gauge (clamped to `min`–`max`). */
    value: number;

    /** Lower bound of the gauge scale. Defaults to 0. */
    min?: number;

    /** Upper bound of the gauge scale. Defaults to 100. */
    max?: number;

    /** Optional descriptive text shown below the value. */
    label?: string;

    /** Color of the value arc. */
    color?: string;

    /** Color of the background track arc. */
    trackColor?: string;

    /**
     * How the central value display is formatted: a built-in format type, Intl number-format
     * options, or a custom function.
     */
    format?: ValueFormatInput;

    /** Number of tick marks along the gauge arc. Defaults to 5. Set to 0 to hide the ticks. */
    ticks?: number;

    /** Show a value label at each tick. Defaults to `true`. */
    tickLabels?: boolean;

    /** How tick labels are formatted. Defaults to `GaugeChartOptions.format`. */
    tickFormat?: ValueFormatInput;

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

interface GaugeChartEventMap {
    /** Emitted when the value arc is clicked. */
    valueclick: GaugeChartValueEvent;

    /** Emitted when the pointer enters the value arc. */
    valueenter: GaugeChartValueEvent;

    /** Emitted when the pointer leaves the value arc. */
    valueleave: GaugeChartValueEvent;
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
// Emitted when the value arc is clicked.
chart.on('valueclick', event => console.log(event.data)); // event.data: GaugeChartValueEvent
// Emitted when the pointer enters the value arc.
chart.on('valueenter', event => console.log(event.data)); // event.data: GaugeChartValueEvent
// Emitted when the pointer leaves the value arc.
chart.on('valueleave', event => console.log(event.data)); // event.data: GaugeChartValueEvent
```
<!-- events:end -->
