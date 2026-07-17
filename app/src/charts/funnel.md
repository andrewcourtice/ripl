# Funnel Chart

The **Funnel Chart** displays data as progressively narrowing horizontal bars, ideal for visualizing conversion pipelines, sales funnels, and drop-off rates. Each stage is labeled and colored automatically, with configurable gaps and rounded corners. Values animate smoothly when data changes.

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
        <RiplChartConfig :config="config" />
    </template>
</ripl-example>

<script setup lang="ts">
import {
    useRiplChart,
} from '../.vitepress/compositions/example';

import {
    buildCommonOptions,
    useChartConfig,
} from '../.vitepress/compositions/use-chart-config';

import {
    createFunnelChart,
} from '@ripl/charts';

import {
    watch,
} from 'vue';

const config = useChartConfig({
    features: { title: true, animation: true },
    title: 'Conversion Funnel',
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

const { contextChanged, chart } = useRiplChart(context => {
    return createFunnelChart(context, {
        data,
        key: 'stage',
        value: 'value',
        label: 'stage',
        padding: { top: 20, right: 40, bottom: 20, left: 40 },
        ...buildCommonOptions(config),
    });
});

watch(config, () => chart.value?.update(buildCommonOptions(config)), { deep: true });

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

## Options

- **`data`** — The data array (ordered from widest to narrowest)
- **`key`** — Unique key accessor
- **`value`** — Value accessor (determines bar width)
- **`label`** — Label accessor (displayed inside bars)
- **`colorBy`** — Optional per-item color accessor
- **`gap`** — Gap between segments in pixels (default `4`)
- **`borderRadius`** — Segment corner radius (default `4`)
