# Gauge Chart

The **Gauge Chart** displays a single value on a semi-circular arc, ideal for KPIs, progress indicators, and dashboard metrics. It supports configurable tick marks along the arc with optional labels, a custom value formatter, and smooth animated transitions when the value changes. The track and fill colors are fully customizable.

> [!NOTE]
> For the full API, see the [Charts API Reference](/docs/api/charts/charts).

## Example

<ripl-example @context-changed="contextChanged">
    <template #footer>
        <RiplControlGroup>
            <RiplButton @click="randomize">Randomize</RiplButton>
        </RiplControlGroup>
    </template>
</ripl-example>

<script setup lang="ts">
import {
    useRiplChart,
} from '../../.vitepress/compositions/example';

import {
    createGaugeChart,
} from '@ripl/charts';

import {
    ref,
} from 'vue';

const value = ref(72);

const { contextChanged } = useRiplChart(context => {
    return createGaugeChart(context, {
        value: value.value,
        min: 0,
        max: 100,
        label: 'Performance',
        formatValue: v => `${v}%`,
        tickCount: 10,
        showTickLabels: true,
        formatTickLabel: v => `${v}%`,
        padding: { top: 20, right: 20, bottom: 20, left: 20 },
    });
});

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
