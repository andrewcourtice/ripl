# Arc Diagram

The **Arc Diagram** is a cartesian axis whose points are nodes, connected by semicircular arcs whose thickness encodes the strength of each relationship. Keeping nodes on one axis makes it easy to spot clusters and bridges, which makes this a clean way to show connections in an ordered set (character co-occurrence, module dependencies, adjacency). The axis can run horizontally or vertically, and nodes can be sized by their connection count.

> [!NOTE]
> For the full API, see the [Charts API Reference](/docs/api/@ripl/charts/).

## Example

<ripl-example ref="example" @context-changed="contextChanged">
    <template #footer>
        <RiplControlGroup>
            <RiplButton @click="randomize">Reweight</RiplButton>
        </RiplControlGroup>
    </template>
    <template #config>
        <RiplChartConfig :config="config" extra-title="Arc Diagram" :extras-reset="reset">
            <RiplField label="Vertical" inline>
                <RiplSwitch v-model="extras.orientation" />
            </RiplField>
            <RiplField label="Size by connections" inline>
                <RiplSwitch v-model="extras.sizeByConnections" />
            </RiplField>
            <RiplField label="Node radius">
                <RiplInputRange v-model="extras.nodeRadius" :min="4" :max="16" :step="1" />
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
    createArcDiagramChart,
} from '@ripl/charts';

import {
    ref,
    watch,
} from 'vue';

const { extras, reset } = useChartExtras({
    orientation: false,
    sizeByConnections: true,
    nodeRadius: 8,
});

const config = useChartConfig({
    features: {
        title: true,
        legend: true,
        format: true,
        animation: true,
        theme: true,
    },
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
        ['valjean', 'myriel'],
        ['valjean', 'javert'],
        ['valjean', 'fantine'],
        ['valjean', 'cosette'],
        ['valjean', 'thenardier'],
        ['valjean', 'marius'],
        ['fantine', 'thenardier'],
        ['cosette', 'marius'],
        ['cosette', 'thenardier'],
        ['marius', 'gillenormand'],
        ['marius', 'enjolras'],
        ['marius', 'eponine'],
        ['thenardier', 'mme'],
        ['thenardier', 'eponine'],
        ['thenardier', 'javert'],
        ['enjolras', 'gavroche'],
        ['enjolras', 'combeferre'],
        ['enjolras', 'courfeyrac'],
        ['enjolras', 'bossuet'],
        ['enjolras', 'joly'],
        ['enjolras', 'bahorel'],
        ['gavroche', 'mabeuf'],
        ['courfeyrac', 'mabeuf'],
        ['combeferre', 'courfeyrac'],
        ['bossuet', 'joly'],
        ['bahorel', 'bossuet'],
        ['eponine', 'marius'],
        ['javert', 'fantine'],
    ];

    return pairs.map(([source, target]) => ({
        source,
        target,
        value: Math.round(Math.random() * 9 + 1),
    }));
}

let links = makeLinks();

function buildOptions() {
    const options = {
        nodeRadius: extras.nodeRadius,
        orientation: extras.orientation ? 'vertical' : 'horizontal',
        sizeByConnections: extras.sizeByConnections,
        ...buildCommonOptions(config),
    };

    // The demo's bespoke format applies when no preset is selected.
    options.format ??= (v: number) => `${v} scenes`;

    return options;
}

const example = ref();

const { contextChanged, chart } = useRiplChart(context => {
    return createArcDiagramChart(context, {
        nodes,
        links,
        padding: { top: 10, right: 10, bottom: 10, left: 10 },
        ...buildOptions(),
    });
});

watch([config, extras], () => chart.value?.update(buildOptions()), { deep: true });


function randomize() {
    links = makeLinks();
    chart.value?.update({ links });
}
</script>

## Usage

```ts
import {
    createArcDiagramChart,
} from '@ripl/charts';

const chart = createArcDiagramChart('#container', {
    nodes: [
        {
            id: 'a',
            label: 'A',
        },
        {
            id: 'b',
            label: 'B',
        },
        {
            id: 'c',
            label: 'C',
        },
    ],
    links: [
        {
            source: 'a',
            target: 'b',
            value: 4,
        },
        {
            source: 'a',
            target: 'c',
            value: 2,
        },
    ],
});
```

## Data Format

Provide `nodes` (each with a unique `id`, optional `label`, `group`, `color`) laid out in order along the axis, and `links` (`source`/`target` node ids with an optional `value` controlling arc thickness). Nodes in the same `group` share a color.

## Options

- **`nodes`**: array of `{ id, label?, group?, color? }`, laid out along the axis in order
- **`links`**: array of `{ source, target, value? }`
- **`nodeRadius`**: node dot radius, or the maximum radius when `sizeByConnections` is on (default `6`)
- **`orientation`**: `'horizontal'` (default) or `'vertical'` (a Y axis with arcs bulging right)
- **`sizeByConnections`**: scale each node's dot by its connection count, like a bubble chart (default `false`)
- **`format`**: value formatter for tooltips
- **`padding`**, **`title`**, **`animation`**: standard chart options
