# Sankey Chart

The **Sankey Chart** visualizes flow between nodes using weighted links. It's ideal for showing energy flows, budget allocations, process pipelines, or user journeys. Nodes are positioned automatically using a layout algorithm, and link widths are proportional to flow values. Hover any link to highlight it, and data transitions animate smoothly.

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
        <RiplChartConfig :config="config" extra-title="Layout" :extras-reset="reset">
            <RiplField label="Node width">
                <RiplInputRange v-model="extras.nodeWidth" :min="8" :max="40" :step="1" />
            </RiplField>
            <RiplField label="Node padding">
                <RiplInputRange v-model="extras.nodePadding" :min="0" :max="30" :step="1" />
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
    createSankeyChart,
} from '@ripl/charts';

import {
    ref,
    watch,
} from 'vue';

const { extras, reset } = useChartExtras({
    nodeWidth: 20,
    nodePadding: 10,
});

const config = useChartConfig({
    features: {
        title: true,
        legend: true,
        format: true,
        animation: true,
        theme: true,
    },
    title: 'Budget Flow',
});

function generateLinks() {
    return [
        {
            source: 'budget',
            target: 'engineering',
            value: Math.round(Math.random() * 300 + 200),
        },
        {
            source: 'budget',
            target: 'marketing',
            value: Math.round(Math.random() * 200 + 100),
        },
        {
            source: 'budget',
            target: 'operations',
            value: Math.round(Math.random() * 150 + 80),
        },
        {
            source: 'engineering',
            target: 'frontend',
            value: Math.round(Math.random() * 150 + 50),
        },
        {
            source: 'engineering',
            target: 'backend',
            value: Math.round(Math.random() * 150 + 50),
        },
        {
            source: 'marketing',
            target: 'ads',
            value: Math.round(Math.random() * 100 + 50),
        },
        {
            source: 'marketing',
            target: 'content',
            value: Math.round(Math.random() * 80 + 30),
        },
    ];
}

let links = generateLinks();

function buildOptions() {
    return {
        nodeWidth: extras.nodeWidth,
        nodePadding: extras.nodePadding,
        ...buildCommonOptions(config),
    };
}

const example = ref();

const { contextChanged, chart } = useRiplChart(context => {
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
        links,
        padding: { right: 80 },
        ...buildOptions(),
    });
});

watch([config, extras], () => chart.value?.update(buildOptions()), { deep: true });


function randomize() {
    links = generateLinks();
    chart.value?.update({ links });
}
</script>

## Usage

```ts
import {
    createSankeyChart,
} from '@ripl/charts';

const chart = createSankeyChart('#container', {
    nodes: [
        {
            id: 'a',
            label: 'Source A',
        },
        {
            id: 'b',
            label: 'Target B',
        },
    ],
    links: [
        {
            source: 'a',
            target: 'b',
            value: 100,
        },
    ],
});
```

## Options

- **`nodes`**: array of `{ id, label, color? }`
- **`links`**: array of `{ source, target, value }`
- **`nodeWidth`**: width of node rectangles (default `20`)
- **`nodePadding`**: vertical padding between nodes (default `10`)
