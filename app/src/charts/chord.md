# Chord Chart

The **Chord Chart** visualizes relationships between groups using arcs and ribbons arranged in a circle. Each group is represented by an arc segment, and ribbons connect groups to show the magnitude of flow between them. The chart features a sequential entry animation (arcs first, then ribbons), an optional legend, and configurable colors and pad angles.

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
    createChordChart,
} from '@ripl/charts';

import {
    watch,
} from 'vue';

const config = useChartConfig({
    features: { title: true, legend: true, animation: true },
    title: 'Team Collaboration',
});

function generateMatrix() {
    const size = 4;
    return Array.from({ length: size }, () =>
        Array.from({ length: size }, () => Math.round(Math.random() * 50))
    );
}

let matrix = generateMatrix();

const { contextChanged, chart } = useRiplChart(context => {
    return createChordChart(context, {
        labels: ['Engineering', 'Design', 'Marketing', 'Sales'],
        matrix,
        padding: { top: 30, right: 30, bottom: 30, left: 30 },
        ...buildCommonOptions(config),
    });
});

watch(config, () => chart.value?.update(buildCommonOptions(config)), { deep: true });

function randomize() {
    matrix = generateMatrix();
    chart.value?.update({ matrix });
}
</script>

## Usage

```ts
import {
    createChordChart,
} from '@ripl/charts';

const chart = createChordChart('#container', {
    labels: ['A', 'B', 'C'],
    matrix: [
        [0, 10, 20],
        [10, 0, 15],
        [20, 15, 0],
    ],
});
```

## Options

- **`labels`** — Array of group labels
- **`matrix`** — Square matrix of flow values between groups
- **`colors`** — Optional array of colors for each group
- **`padAngle`** — Gap angle between arcs in radians (default `0.04`)
- **`legend`** — `boolean | ChartLegendOptions` — Show/configure legend
