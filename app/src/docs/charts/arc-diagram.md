# Arc Diagram

The **Arc Diagram** places nodes along a single baseline and connects related pairs with semicircular arcs whose thickness encodes the strength of each relationship. Keeping nodes in one dimension makes it easy to spot clusters and bridges — a clean way to show connections in an ordered set (character co-occurrence, module dependencies, adjacency).

> [!NOTE]
> For the full API, see the [Charts API Reference](/docs/api/@ripl/charts/).

## Example

<ripl-example @context-changed="contextChanged">
    <template #footer>
        <RiplControlGroup>
            <RiplButton @click="randomize">Reweight</RiplButton>
        </RiplControlGroup>
    </template>
    <template #config>
        <RiplChartConfig :config="config" extra-title="Arc Diagram" />
    </template>
</ripl-example>

<script setup lang="ts">
import {
    useRiplChart,
} from '../../.vitepress/compositions/example';

import {
    buildCommonOptions,
    useChartConfig,
} from '../../.vitepress/compositions/use-chart-config';

import {
    createArcDiagramChart,
} from '@ripl/charts';

import {
    ref,
    watch,
} from 'vue';

const config = useChartConfig({
    features: { title: true, animation: true },
    title: 'Character Co-occurrence',
});

const nodes = [
    { id: 'valjean', label: 'Valjean', group: 'a' },
    { id: 'javert', label: 'Javert', group: 'a' },
    { id: 'cosette', label: 'Cosette', group: 'b' },
    { id: 'marius', label: 'Marius', group: 'b' },
    { id: 'fantine', label: 'Fantine', group: 'c' },
    { id: 'thenardier', label: 'Thénardier', group: 'c' },
    { id: 'enjolras', label: 'Enjolras', group: 'd' },
    { id: 'gavroche', label: 'Gavroche', group: 'd' },
];

function makeLinks() {
    const pairs = [
        ['valjean', 'javert'], ['valjean', 'cosette'], ['valjean', 'fantine'],
        ['cosette', 'marius'], ['marius', 'enjolras'], ['enjolras', 'gavroche'],
        ['fantine', 'thenardier'], ['thenardier', 'gavroche'], ['javert', 'thenardier'],
    ];

    return pairs.map(([source, target]) => ({
        source,
        target,
        value: Math.round(Math.random() * 9 + 1),
    }));
}

let links = makeLinks();

const { contextChanged, chart } = useRiplChart(context => {
    return createArcDiagramChart(context, {
        nodes,
        links,
        nodeRadius: 6,
        format: v => `${v} scenes`,
        padding: { top: 20, right: 20, bottom: 20, left: 20 },
        ...buildCommonOptions(config),
    });
});

function apply() {
    chart.value?.update({
        links,
        ...buildCommonOptions(config),
    });
}

watch(config, apply, { deep: true });

function randomize() {
    links = makeLinks();
    apply();
}
</script>

## Usage

```ts
import {
    createArcDiagramChart,
} from '@ripl/charts';

const chart = createArcDiagramChart('#container', {
    nodes: [
        { id: 'a', label: 'A' },
        { id: 'b', label: 'B' },
        { id: 'c', label: 'C' },
    ],
    links: [
        { source: 'a', target: 'b', value: 4 },
        { source: 'a', target: 'c', value: 2 },
    ],
});
```

## Data Format

Provide `nodes` (each with a unique `id`, optional `label`, `group`, `color`) laid out in order along the baseline, and `links` (`source`/`target` node ids with an optional `value` controlling arc thickness). Nodes in the same `group` share a color.

## Options

- **`nodes`** — Array of `{ id, label?, group?, color? }`, laid out along the baseline in order
- **`links`** — Array of `{ source, target, value? }`
- **`nodeRadius`** — Node dot radius (default `5`)
- **`format`** — Value formatter for tooltips
- **`padding`**, **`title`**, **`animation`** — Standard chart options
