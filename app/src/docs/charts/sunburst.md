# Sunburst Chart

The **Sunburst Chart** displays hierarchical data as concentric rings, where each ring represents a level in the hierarchy and arc size represents value. It's excellent for visualizing tree structures like org charts, file systems, or category breakdowns. Nodes can have nested `children`, and arcs animate on entry and update.

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
    createSunburstChart,
} from '@ripl/charts';

import {
    ref,
} from 'vue';

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
import {
    createSunburstChart,
} from '@ripl/charts';

const chart = createSunburstChart('#container', {
    data: [
        {
            id: 'tech',
            label: 'Technology',
            value: 500,
            children: [
                { id: 'web',
                    label: 'Web',
                    value: 200 },
                { id: 'mobile',
                    label: 'Mobile',
                    value: 150 },
            ],
        },
    ],
});
```

## Options

- **`data`** — Array of `SunburstNode` objects with `id`, `label`, `value`, optional `color` and `children`
