# Chord Chart

The **Chord Chart** visualizes relationships between groups using arcs and ribbons arranged in a circle. Each group is represented by an arc segment, and ribbons connect groups to show the magnitude of flow between them. The chart features a sequential entry animation (arcs first, then ribbons), an optional legend, and configurable colors and pad angles.

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
        <RiplChartConfig :config="config" extra-title="Groups" :extras-reset="reset">
            <RiplField label="Pad angle">
                <RiplInputRange v-model="extras.padAngle" :min="0" :max="0.2" :step="0.01" />
            </RiplField>
            <RiplField
                v-for="(label, index) in LABELS"
                :key="label"
                :label="label"
                inline
            >
                <RiplColorInput
                    :model-value="extras.colors[index]"
                    @update:model-value="setColor(index, $event)"
                />
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
    paletteColor,
    useChartConfig,
    useChartExtras,
} from '../.vitepress/compositions/use-chart-config';

import {
    createChordChart,
} from '@ripl/charts';

import {
    ref,
    watch,
} from 'vue';

const LABELS = ['Engineering', 'Design', 'Marketing', 'Sales'];

const { extras, reset } = useChartExtras({
    padAngle: 0.04,
    colors: LABELS.map((_, index) => paletteColor(index)),
});

const config = useChartConfig({
    features: {
        title: true,
        legend: true,
        animation: true,
        theme: true,
    },
    title: 'Team Collaboration',
});

function setColor(index: number, value: string) {
    extras.colors = extras.colors.map((color, i) => (i === index ? value : color));
}

function generateMatrix() {
    const size = LABELS.length;
    return Array.from({ length: size }, () =>
        Array.from({ length: size }, () => Math.round(Math.random() * 50))
    );
}

let matrix = generateMatrix();

function buildOptions() {
    return {
        colors: extras.colors,
        padAngle: extras.padAngle,
        ...buildCommonOptions(config),
    };
}

const example = ref();

const { contextChanged, chart } = useRiplChart(context => {
    return createChordChart(context, {
        labels: LABELS,
        matrix,
        padding: { top: 10, right: 10, bottom: 10, left: 10 },
        ...buildOptions(),
    });
});

watch([config, extras], () => chart.value?.update(buildOptions()), { deep: true });


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
