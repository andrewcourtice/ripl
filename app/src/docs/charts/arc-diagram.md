# Arc Diagram

The **Arc Diagram** is a cartesian axis whose points are nodes, connected by semicircular arcs whose thickness encodes the strength of each relationship. Keeping nodes on one axis makes it easy to spot clusters and bridges — a clean way to show connections in an ordered set (character co-occurrence, module dependencies, adjacency). The axis can run horizontally or vertically, and nodes can be sized by their connection count.

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
        <RiplChartConfig :config="config" extra-title="Arc Diagram">
            <RiplField label="Vertical" inline>
                <RiplSwitch v-model="vertical" />
            </RiplField>
            <RiplField label="Size by connections" inline>
                <RiplSwitch v-model="sizeByConnections" />
            </RiplField>
        </RiplChartConfig>
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

const vertical = ref(false);
const sizeByConnections = ref(true);

const config = useChartConfig({
    features: { title: true, animation: true },
    title: 'Character Co-occurrence',
});

const nodes = [
    { id: 'valjean', label: 'Valjean', group: 'a' },
    { id: 'myriel', label: 'Myriel', group: 'a' },
    { id: 'javert', label: 'Javert', group: 'a' },
    { id: 'fantine', label: 'Fantine', group: 'b' },
    { id: 'cosette', label: 'Cosette', group: 'b' },
    { id: 'marius', label: 'Marius', group: 'b' },
    { id: 'thenardier', label: 'Thénardier', group: 'c' },
    { id: 'mme', label: 'Mme.T', group: 'c' },
    { id: 'eponine', label: 'Éponine', group: 'c' },
    { id: 'enjolras', label: 'Enjolras', group: 'd' },
    { id: 'gavroche', label: 'Gavroche', group: 'd' },
    { id: 'combeferre', label: 'Combeferre', group: 'd' },
    { id: 'courfeyrac', label: 'Courfeyrac', group: 'd' },
    { id: 'bossuet', label: 'Bossuet', group: 'd' },
    { id: 'joly', label: 'Joly', group: 'd' },
    { id: 'gillenormand', label: 'Gillenormand', group: 'b' },
    { id: 'mabeuf', label: 'Mabeuf', group: 'd' },
    { id: 'bahorel', label: 'Bahorel', group: 'd' },
];

function makeLinks() {
    const pairs = [
        ['valjean', 'myriel'], ['valjean', 'javert'], ['valjean', 'fantine'], ['valjean', 'cosette'],
        ['valjean', 'thenardier'], ['valjean', 'marius'], ['fantine', 'thenardier'], ['cosette', 'marius'],
        ['cosette', 'thenardier'], ['marius', 'gillenormand'], ['marius', 'enjolras'], ['marius', 'eponine'],
        ['thenardier', 'mme'], ['thenardier', 'eponine'], ['thenardier', 'javert'], ['enjolras', 'gavroche'],
        ['enjolras', 'combeferre'], ['enjolras', 'courfeyrac'], ['enjolras', 'bossuet'], ['enjolras', 'joly'],
        ['enjolras', 'bahorel'], ['gavroche', 'mabeuf'], ['courfeyrac', 'mabeuf'], ['combeferre', 'courfeyrac'],
        ['bossuet', 'joly'], ['bahorel', 'bossuet'], ['eponine', 'marius'], ['javert', 'fantine'],
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
        nodeRadius: 8,
        orientation: vertical.value ? 'vertical' : 'horizontal',
        sizeByConnections: sizeByConnections.value,
        format: v => `${v} scenes`,
        padding: { top: 20, right: 20, bottom: 20, left: 20 },
        ...buildCommonOptions(config),
    });
});

function apply() {
    chart.value?.update({
        links,
        orientation: vertical.value ? 'vertical' : 'horizontal',
        sizeByConnections: sizeByConnections.value,
        ...buildCommonOptions(config),
    });
}

watch(config, apply, { deep: true });
watch([vertical, sizeByConnections], apply);

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

Provide `nodes` (each with a unique `id`, optional `label`, `group`, `color`) laid out in order along the axis, and `links` (`source`/`target` node ids with an optional `value` controlling arc thickness). Nodes in the same `group` share a color.

## Options

- **`nodes`** — Array of `{ id, label?, group?, color? }`, laid out along the axis in order
- **`links`** — Array of `{ source, target, value? }`
- **`nodeRadius`** — Node dot radius, or the maximum radius when `sizeByConnections` is on (default `6`)
- **`orientation`** — `'horizontal'` (default) or `'vertical'` (a Y axis with arcs bulging right)
- **`sizeByConnections`** — Scale each node's dot by its connection count, like a bubble chart (default `false`)
- **`format`** — Value formatter for tooltips
- **`padding`**, **`title`**, **`animation`** — Standard chart options
