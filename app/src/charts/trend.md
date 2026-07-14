# Trend Chart

The **Trend Chart** is a composite chart that lets you mix bar, line, and area series on the same axes. This makes it ideal for dashboards where you want to overlay a trend line on top of bar data, or combine multiple visualization types in a single view. Each series specifies its `type` (`'bar'`, `'line'`, or `'area'`), and all share common features like grid, legend, and animated transitions.

> [!NOTE]
> For the full API, see the [Charts API Reference](/docs/api/@ripl/charts/).

<ripl-example @context-changed="contextChanged">
    <template #footer>
        <RiplControlGroup>
            <RiplButton @click="addData">Add Data</RiplButton>
            <RiplButton @click="randomise">Randomise</RiplButton>
        </RiplControlGroup>
    </template>
    <template #config>
        <RiplChartConfig :config="config" :series="seriesMeta" extra-title="Trend">
            <RiplField label="Line type">
                <RiplSelect v-model="lineRenderer">
                    <option value="linear">Linear</option>
                    <option value="spline">Spline</option>
                    <option value="basis">Basis</option>
                    <option value="bumpX">Bump X</option>
                    <option value="bumpY">Bump Y</option>
                    <option value="cardinal">Cardinal</option>
                    <option value="catmullRom">Catmull-Rom</option>
                    <option value="monotoneX">Monotone X</option>
                    <option value="monotoneY">Monotone Y</option>
                    <option value="natural">Natural</option>
                    <option value="step">Step</option>
                    <option value="stepBefore">Step Before</option>
                    <option value="stepAfter">Step After</option>
                </RiplSelect>
            </RiplField>
        </RiplChartConfig>
    </template>
</ripl-example>

<script lang="ts" setup>
import {
    useRiplChart,
} from '../.vitepress/compositions/example';

import {
    buildCommonOptions,
    seedColors,
    useChartConfig,
} from '../.vitepress/compositions/use-chart-config';

import {
    createTrendChart,
} from '@ripl/charts';

import {
    scaleContinuous,
} from '@ripl/web';

import {
    stringUniqueId,
} from '@ripl/utilities';

import {
    ref,
    watch,
} from 'vue';

const dataScale = scaleContinuous([0, 1], [-500, 1200]);
const lineRenderer = ref('linear');

const seriesMeta = [
    { type: 'bar', id: 'australia', label: 'Australia', value: 'australia' },
    { type: 'bar', id: 'new-zealand', label: 'New Zealand', value: 'newZealand' },
    { type: 'bar', id: 'sweden', label: 'Sweden', value: 'sweden' },
    { type: 'bar', id: 'united-states', label: 'United States', value: 'unitedStates' },
    { type: 'line', id: 'great-britain', label: 'Great Britain', value: 'greatBritain' },
];

const config = useChartConfig({
    features: { title: true, legend: true, axes: true, grid: true, animation: true },
    title: 'Medal Trend',
    axisY: 'Count',
    colors: seedColors(seriesMeta.map(s => s.id)),
});

function getSeries() {
    return seriesMeta.map(s => ({
        type: s.type,
        id: s.id,
        label: s.label,
        value: s.value,
        color: config.colors[s.id],
        ...(s.type === 'line' ? { lineType: lineRenderer.value } : {}),
    }));
}

let data = Array.from({ length: 15 }, getDataItem);

const {
    chart,
    contextChanged
} = useRiplChart(context => createTrendChart(context, {
    data,
    key: 'id',
    series: getSeries(),
    ...buildCommonOptions(config),
}));

function apply() {
    chart.value?.update({
        series: getSeries(),
        ...buildCommonOptions(config),
    });
}

watch(config, apply, { deep: true });
watch(lineRenderer, apply);

function getDataItem() {
    return {
        id: stringUniqueId(),
        australia: getValue(),
        newZealand: getValue(),
        sweden: getValue(),
        unitedStates: getValue(),
        greatBritain: getValue(),
    }
}

function getValue() {
    return Math.round(dataScale(Math.random()));
}

function addData() {
    data.push(getDataItem());
    chart.value?.update({ data });
}

function randomise() {
    data = data.map(value => ({
        ...getDataItem(),
        id: value.id
    }));

    chart.value?.update({ data });
}
</script>

```typescript
const chart = createTrendChart(context, {
    data,
    key: 'id',
    series: [
        {
            type: 'bar',
            id: 'australia',
            label: 'Australia',
            value: 'australia',
        },
        {
            type: 'bar',
            id: 'new-zealand',
            label: 'New Zealand',
            value: 'newZealand',
        },
        {
            type: 'bar',
            id: 'sweden',
            label: 'Sweden',
            value: 'sweden',
        },
        {
            type: 'line',
            id: 'united-states',
            label: 'United States',
            value: 'unitedStates',
        },
    ],
});
```