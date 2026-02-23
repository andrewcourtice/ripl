# Chord Chart

The `ChordChart` visualizes relationships between groups using arcs and ribbons arranged in a circle. Ideal for showing inter-group flows and connections.

## Example

<ripl-example @context-changed="contextChanged">
    <template #footer>
        <div class="ripl-control-group">
            <button class="ripl-button" @click="randomize">Randomize</button>
        </div>
    </template>
</ripl-example>

<script setup lang="ts">
import { ref } from 'vue';
import { createChordChart } from '@ripl/charts';
import { useRiplChart } from '../../.vitepress/compositions/example';

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
        showLegend: true,
        padding: { top: 30, right: 30, bottom: 30, left: 30 },
    });
});

function randomize() {
    matrix.value = generateMatrix();
}
</script>

## Usage

```ts
import { createChordChart } from '@ripl/charts';

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
- **`showLegend`** — Show a legend for the groups (default `true`)
