# Gauge Chart

The **Gauge Chart** displays a single value on a semi-circular arc, ideal for KPIs, progress indicators, and dashboard metrics. It supports configurable tick marks along the arc with optional labels, a custom value formatter, and smooth animated transitions when the value changes. The track and fill colors are fully customizable.

> [!NOTE]
> For the full API, see the [Charts API Reference](/docs/api/@ripl/charts/).

## Example

<ripl-example @context-changed="contextChanged">
    <template #footer>
        <RiplControlGroup>
            <RiplButton @click="randomize">Randomize</RiplButton>
        </RiplControlGroup>
    </template>
    <template #config>
        <RiplChartConfig :config="config" extra-title="Gauge">
            <RiplField label="Value">
                <RiplInputRange v-model="value" :min="0" :max="100" :step="1" />
            </RiplField>
            <RiplField label="Ticks">
                <RiplInputRange v-model="tickCount" :min="0" :max="12" :step="1" />
            </RiplField>
            <RiplField label="Fill colour" inline>
                <RiplColorInput v-model="color" />
            </RiplField>
        </RiplChartConfig>
    </template>
</ripl-example>

<script setup lang="ts">
import {
    useRiplChart,
} from '../../.vitepress/compositions/example';

import {
    buildCommonOptions,
    useChartConfig,
} from '../../.vitepress/compositions/use-chart-config';

import {
    createGaugeChart,
} from '@ripl/charts';

import {
    ref,
    watch,
} from 'vue';

const value = ref(72);
const tickCount = ref(10);
const color = ref('#7cacf8');

const config = useChartConfig({
    features: { title: true, animation: true },
    title: 'Performance',
    titleVisible: false,
});

const { contextChanged, chart } = useRiplChart(context => {
    return createGaugeChart(context, {
        value: value.value,
        min: 0,
        max: 100,
        label: 'Performance',
        color: color.value,
        formatValue: v => `${v}%`,
        tickCount: tickCount.value,
        showTickLabels: true,
        formatTickLabel: v => `${v}%`,
        padding: { top: 20, right: 20, bottom: 20, left: 20 },
        ...buildCommonOptions(config),
    });
});

function apply() {
    chart.value?.update({
        value: value.value,
        color: color.value,
        tickCount: tickCount.value,
        ...buildCommonOptions(config),
    });
}

watch(config, apply, { deep: true });
watch([value, tickCount, color], apply);

function randomize() {
    value.value = Math.round(Math.random() * 100);
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
    formatValue: v => `${v}%`,
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
- **`formatValue`** — Custom value formatter function
- **`tickCount`** — Number of tick marks along the arc (default `5`, set to `0` to hide)
- **`showTickLabels`** — Whether to show value labels at each tick (default `true`)
- **`formatTickLabel`** — Custom formatter for tick labels
