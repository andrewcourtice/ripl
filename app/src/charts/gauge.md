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
                <RiplInputNumber v-model="extras.minValue" placeholder="0" />
            </RiplField>
            <RiplField label="Max value">
                <RiplInputNumber v-model="extras.maxValue" placeholder="100" />
            </RiplField>
            <RiplField label="Ticks">
                <RiplInputRange v-model="extras.tickCount" :min="0" :max="12" :step="1" />
            </RiplField>
            <RiplField label="Tick labels" inline>
                <RiplSwitch v-model="extras.showTickLabels" />
            </RiplField>
            <RiplField label="Fill colour" inline>
                <RiplColorInput v-model="extras.color" />
            </RiplField>
            <RiplField label="Track colour" inline>
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
    minValue: 0 as number | undefined,
    maxValue: 100 as number | undefined,
    tickCount: 10,
    showTickLabels: true,
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
        minValue: extras.minValue,
        maxValue: extras.maxValue,
        color: extras.color,
        trackColor: extras.trackColor,
        tickCount: extras.tickCount,
        showTickLabels: extras.showTickLabels,
        ...buildCommonOptions(config),
    };

    // The demo's bespoke format applies when no preset is selected.
    options.format ??= (v: number) => `${v}%`;

    return options;
}

const { contextChanged, chart } = useRiplChart(context => {
    return createGaugeChart(context, {
        label: 'Performance',
        padding: { top: 10, right: 10, bottom: 10, left: 10 },
        ...buildOptions(),
    });
});

watch([config, extras], () => chart.value?.update(buildOptions()), { deep: true });

function randomize() {
    const min = extras.minValue ?? 0;
    const max = extras.maxValue ?? 100;
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
    minValue: 0,
    maxValue: 100,
    label: 'Performance',
    format: v => `${v}%`,
});

// Update value
chart.update({ value: 85 });
```

## Options

- **`value`** — The current gauge value
- **`min`** — Minimum value (default `0`)
- **`max`** — Maximum value (default `100`)
- **`label`** — Label displayed below the value
- **`color`** — Gauge fill color (default pastel blue)
- **`trackColor`** — Background track color (default `#e5e7eb`)
- **`format`** — Custom value formatter function
- **`tickCount`** — Number of tick marks along the arc (default `5`, set to `0` to hide)
- **`showTickLabels`** — Whether to show value labels at each tick (default `true`)
- **`formatTick`** — Custom formatter for tick labels
