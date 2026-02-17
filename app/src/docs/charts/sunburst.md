# Sunburst Chart

The `SunburstChart` displays hierarchical data as concentric rings, where each ring represents a level in the hierarchy and arc size represents value.

## Example

<ripl-example @context-changed="contextChanged">
    <template #footer>
        <div layout="row">
            <button class="ripl-button" @click="randomize">Randomize</button>
        </div>
    </template>
</ripl-example>

<script setup lang="ts">
import { ref } from 'vue';
import { createSunburstChart } from '@ripl/charts';
import { useRiplChart } from '../../.vitepress/compositions/example';

function generateData() {
    return [
        {
            id: 'tech',
            label: 'Technology',
            value: Math.round(Math.random() * 200 + 300),
            children: [
                { id: 'web', label: 'Web', value: Math.round(Math.random() * 100 + 50) },
                { id: 'mobile', label: 'Mobile', value: Math.round(Math.random() * 80 + 40) },
                { id: 'cloud', label: 'Cloud', value: Math.round(Math.random() * 60 + 30) },
            ],
        },
        {
            id: 'finance',
            label: 'Finance',
            value: Math.round(Math.random() * 150 + 200),
            children: [
                { id: 'banking', label: 'Banking', value: Math.round(Math.random() * 80 + 40) },
                { id: 'insurance', label: 'Insurance', value: Math.round(Math.random() * 60 + 30) },
            ],
        },
        {
            id: 'health',
            label: 'Health',
            value: Math.round(Math.random() * 100 + 150),
        },
    ];
}

const data = ref(generateData());

const { contextChanged } = useRiplChart(context => {
    return createSunburstChart(context, {
        data: data.value,
        padding: { top: 20, right: 20, bottom: 20, left: 20 },
    });
});

function randomize() {
    data.value = generateData();
}
</script>

## Usage

```ts
import { createSunburstChart } from '@ripl/charts';

const chart = createSunburstChart('#container', {
    data: [
        {
            id: 'tech',
            label: 'Technology',
            value: 500,
            children: [
                { id: 'web', label: 'Web', value: 200 },
                { id: 'mobile', label: 'Mobile', value: 150 },
            ],
        },
    ],
});
```

## Options

- **`data`** — Array of `SunburstNode` objects with `id`, `label`, `value`, optional `color` and `children`
