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
            <RiplField label="Segment gap">
                <RiplInputRange v-model="extras.gap" :min="0" :max="16" :step="1" />
            </RiplField>
            <RiplField label="Corner radius">
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
        padding: { top: 12, right: 40, bottom: 12, left: 40 },
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

## Options

- **`data`** — The data array (ordered from widest to narrowest)
- **`key`** — Unique key accessor
- **`value`** — Value accessor (determines bar width)
- **`label`** — Label accessor (displayed inside bars)
- **`colorBy`** — Optional per-item color accessor
- **`legend`** — Legend configuration; shown by default, pass `false` to hide
- **`gap`** — Gap between segments in pixels (default `4`)
- **`borderRadius`** — Segment corner radius (default `4`)
