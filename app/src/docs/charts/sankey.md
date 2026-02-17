# Sankey Chart

The `SankeyChart` visualizes flow between nodes using weighted links. Ideal for showing energy flows, budget allocations, or user journeys.

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
import { createSankeyChart } from '@ripl/charts';
import { useRiplChart } from '../../.vitepress/compositions/example';

function generateLinks() {
    return [
        { source: 'budget', target: 'engineering', value: Math.round(Math.random() * 300 + 200) },
        { source: 'budget', target: 'marketing', value: Math.round(Math.random() * 200 + 100) },
        { source: 'budget', target: 'operations', value: Math.round(Math.random() * 150 + 80) },
        { source: 'engineering', target: 'frontend', value: Math.round(Math.random() * 150 + 50) },
        { source: 'engineering', target: 'backend', value: Math.round(Math.random() * 150 + 50) },
        { source: 'marketing', target: 'ads', value: Math.round(Math.random() * 100 + 50) },
        { source: 'marketing', target: 'content', value: Math.round(Math.random() * 80 + 30) },
    ];
}

const links = ref(generateLinks());

const { contextChanged } = useRiplChart(context => {
    return createSankeyChart(context, {
        nodes: [
            { id: 'budget', label: 'Budget' },
            { id: 'engineering', label: 'Engineering' },
            { id: 'marketing', label: 'Marketing' },
            { id: 'operations', label: 'Operations' },
            { id: 'frontend', label: 'Frontend' },
            { id: 'backend', label: 'Backend' },
            { id: 'ads', label: 'Ads' },
            { id: 'content', label: 'Content' },
        ],
        links: links.value,
        padding: { top: 20, right: 80, bottom: 20, left: 20 },
    });
});

function randomize() {
    links.value = generateLinks();
}
</script>

## Usage

```ts
import { createSankeyChart } from '@ripl/charts';

const chart = createSankeyChart('#container', {
    nodes: [
        { id: 'a', label: 'Source A' },
        { id: 'b', label: 'Target B' },
    ],
    links: [
        { source: 'a', target: 'b', value: 100 },
    ],
});
```

## Options

- **`nodes`** — Array of `{ id, label, color? }`
- **`links`** — Array of `{ source, target, value }`
- **`nodeWidth`** — Width of node rectangles (default `20`)
- **`nodePadding`** — Vertical padding between nodes (default `10`)
