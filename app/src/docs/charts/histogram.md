# Histogram Chart

The **Histogram Chart** bins a numeric field and draws each bin as a bar on a continuous value axis against a frequency axis — the go-to view for the shape of a distribution. Binning uses the shared `bin` transform (nice uniform bins by default, or explicit `thresholds`), and bars animate on entry, update, and exit.

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
        <RiplChartConfig :config="config" extra-title="Bins">
            <RiplField label="Bin count" inline>
                <RiplInputRange v-model="bins" :min="4" :max="20" :step="1" />
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
    createHistogramChart,
} from '@ripl/charts';

import {
    ref,
    watch,
} from 'vue';

const bins = ref(10);

const config = useChartConfig({
    features: { title: true, animation: true, navigator: true },
    title: 'Response Time Distribution',
});

function generateData() {
    // A roughly normal distribution via the central-limit trick.
    return Array.from({ length: 240 }, () => {
        const sample = (Math.random() + Math.random() + Math.random()) / 3;

        return { value: Math.round(sample * 400 + 50) };
    });
}

let data = generateData();

const { contextChanged, chart } = useRiplChart(context => {
    return createHistogramChart(context, {
        data,
        value: 'value',
        bins: bins.value,
        padding: { top: 20, right: 20, bottom: 40, left: 40 },
        axis: {
            x: { title: 'Response time (ms)' },
            y: { title: 'Frequency' },
        },
        ...buildCommonOptions(config),
    });
});

function apply() {
    chart.value?.update({
        bins: bins.value,
        ...buildCommonOptions(config),
    });
}

watch(config, apply, { deep: true });
watch(bins, apply);

function randomize() {
    data = generateData();
    chart.value?.update({ data });
}
</script>

## Usage

```ts
import {
    createHistogramChart,
} from '@ripl/charts';

const chart = createHistogramChart('#container', {
    data: [/* ... */],
    value: 'amount',
    bins: 12,
});
```

## Data Format

Each item contributes one numeric value, read via the `value` accessor (a field name or a function). The chart bins those values — no pre-aggregation required.

## Options

- **`data`** — The data array
- **`value`** — Accessor for the numeric field to bin (field name or function)
- **`bins`** — Target number of bins (default: Sturges' rule)
- **`thresholds`** — Explicit bin boundaries (overrides `bins`)
- **`color`** — Bar colour (default: first palette colour)
- **`borderRadius`** — Bar corner radius (default `2`)
- **`format`** — Format applied to bin bounds in tooltips
