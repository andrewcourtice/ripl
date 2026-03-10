# Radar Chart

The **Radar Chart** displays multivariate data on a radial grid, ideal for comparing strengths and weaknesses across multiple dimensions. Each axis radiates from a shared center, and data series form filled polygons whose shape reveals the profile at a glance. It supports multiple overlapping series, configurable grid levels, markers that animate in sync with the area polygon, and an optional legend.

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
    createRadarChart,
} from '@ripl/charts';

import {
    ref,
} from 'vue';

const AXES = ['Speed', 'Strength', 'Defense', 'Magic', 'Luck', 'Agility'];

function generateData() {
    return AXES.map(axis => ({
        axis,
        player1: Math.round(Math.random() * 80 + 20),
        player2: Math.round(Math.random() * 80 + 20),
    }));
}

const data = ref(generateData());

const { contextChanged } = useRiplChart(context => {
    return createRadarChart(context, {
        data: data.value,
        axes: AXES,
        padding: { top: 30, right: 30, bottom: 30, left: 30 },
        series: [
            { id: 'player1', value: 'player1', label: 'Player 1' },
            { id: 'player2', value: 'player2', label: 'Player 2' },
        ],
    });
});

function randomize() {
    data.value = generateData();
}
</script>

## Usage

```ts
import {
    createRadarChart,
} from '@ripl/charts';

const chart = createRadarChart('#container', {
    data: [...],
    axes: ['Speed', 'Strength', 'Defense', 'Magic', 'Luck', 'Agility'],
    series: [
        { id: 'player1', value: 'player1', label: 'Player 1' },
    ],
});
```

## Options

- **`data`** — The data array (one item per axis)
- **`axes`** — Array of axis labels
- **`series`** — Array of series with `id`, `value`, `label`, optional `color` and `opacity`
- **`maxValue`** — Maximum value for the scale (auto-computed if omitted)
- **`levels`** — Number of concentric grid levels (default `5`)
- **`legend`** — `boolean | ChartLegendOptions` — Show/configure legend
