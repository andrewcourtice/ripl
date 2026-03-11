# Chord Chart

The **Chord Chart** visualizes relationships between groups using arcs and ribbons arranged in a circle. Each group is represented by an arc segment, and ribbons connect groups to show the magnitude of flow between them. The chart features a sequential entry animation (arcs first, then ribbons), an optional legend, and configurable colors and pad angles.

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
    createChordChart,
} from '@ripl/charts';

import {
    ref,
} from 'vue';

function generateMatrix() {
    const size = 4;
    return Array.from({ length: size }, () =>
        Array.from({ length: size }, () => Math.round(Math.random() * 50))
    );
}

const matrix = ref(generateMatrix());

const { contextChanged } = useRiplChart(context => {
    return createChordChart(context, {
        labels: ['Engineering', 'Design', 'Marketing', 'Sales'],
        matrix: matrix.value,
        legend: true,
        padding: { top: 30, right: 30, bottom: 30, left: 30 },
    });
});

function randomize() {
    matrix.value = generateMatrix();
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
