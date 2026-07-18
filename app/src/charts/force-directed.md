# Force-Directed Network

The **Force-Directed Network** lays out a graph of nodes and links using a physics simulation — repulsion pushes nodes apart, link springs pull connected nodes together, and a gentle centering force keeps the whole thing on screen. It's ideal for relationship data: social graphs, dependency trees, topic maps. The layout is deterministic, so the same data always settles the same way. On entry the graph springs out from its root node in cascading waves, and reweighting relaxes the simulation from its current positions so nodes glide smoothly to their new places.

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
        <RiplChartConfig :config="config" extra-title="Force-Directed" :extras-reset="reset">
            <RiplField label="Node radius">
                <RiplInputRange v-model="extras.nodeRadius" :min="4" :max="16" :step="1" />
            </RiplField>
            <RiplField label="Charge">
                <RiplInputRange v-model="extras.charge" :min="-500" :max="-60" :step="10" />
            </RiplField>
            <RiplField label="Link distance">
                <RiplInputRange v-model="extras.linkDistance" :min="30" :max="120" :step="5" />
            </RiplField>
            <RiplField label="Link strength">
                <RiplInputRange v-model="extras.linkStrength" :min="0" :max="1" :step="0.05" />
            </RiplField>
            <RiplField label="Center strength">
                <RiplInputRange v-model="extras.centerStrength" :min="0" :max="0.3" :step="0.01" />
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
    createForceDirectedChart,
} from '@ripl/charts';

import {
    ref,
    watch,
} from 'vue';

const { extras, reset } = useChartExtras({
    nodeRadius: 7,
    charge: -140,
    linkDistance: 34,
    linkStrength: 0.5,
    centerStrength: 0.05,
});

const config = useChartConfig({
    features: {
        title: true,
        legend: true,
        format: true,
        animation: true,
        theme: true,
    },
    title: 'Organisation Network',
});

// Build a clustered network of 130 nodes: 6 hubs, each with a fan of members, plus a few
// cross-cluster bridges — enough structure to show the springy, cascading entry.
const CLUSTERS = ['eng', 'design', 'gtm', 'ops', 'data', 'exec'];
const nodes = [];
const baseLinks = [];

CLUSTERS.forEach((group, c) => {
    const hub = `${group}-hub`;
    nodes.push({ id: hub, label: group.toUpperCase(), group });

    const members = 15 + (c % 4) * 4;
    for (let i = 0; i < members; i++) {
        const id = `${group}-${i}`;
        nodes.push({ id, label: '', group });
        baseLinks.push([hub, id]);
        // A little intra-cluster meshing so it doesn't look like a pure star.
        if (i > 0 && i % 3 === 0) {
            baseLinks.push([`${group}-${i - 1}`, id]);
        }
    }
});

// Bridges between hubs so the graph is one connected component.
for (let c = 0; c < CLUSTERS.length; c++) {
    baseLinks.push([`${CLUSTERS[c]}-hub`, `${CLUSTERS[(c + 1) % CLUSTERS.length]}-hub`]);
}

function makeLinks() {
    return baseLinks.map(([source, target]) => ({
        source,
        target,
        value: Math.round(Math.random() * 8 + 1),
    }));
}

let links = makeLinks();

function buildOptions() {
    return {
        nodeRadius: extras.nodeRadius,
        charge: extras.charge,
        linkDistance: extras.linkDistance,
        linkStrength: extras.linkStrength,
        centerStrength: extras.centerStrength,
        ...buildCommonOptions(config),
    };
}

const example = ref();

const { contextChanged, chart } = useRiplChart(context => {
    return createForceDirectedChart(context, {
        nodes,
        links,
        root: 'eng-hub',
        format: v => `${v} threads`,
        padding: { top: 20, right: 20, bottom: 20, left: 20 },
        ...buildOptions(),
    });
});

// Furniture options are read only at construction, so rebuild on any customization change.
watch([config, extras], () => example.value?.recreate(), { deep: true });

function randomize() {
    // Re-roll link weights; the layout re-runs from its current positions and glides to the new one.
    links = makeLinks();
    chart.value?.update({ links });
}
</script>

## Usage

```ts
import {
    createForceDirectedChart,
} from '@ripl/charts';

const chart = createForceDirectedChart('#container', {
    nodes: [
        { id: 'a',
            label: 'A',
            group: 'x' },
        { id: 'b',
            label: 'B',
            group: 'x' },
        { id: 'c',
            label: 'C',
            group: 'y' },
    ],
    links: [
        { source: 'a',
            target: 'b',
            value: 4 },
        { source: 'b',
            target: 'c',
            value: 2 },
    ],
});
```

## Data Format

Provide `nodes` (each with a unique `id`, optional `label`, `group`, `value`, `color`) and `links` (each with `source`/`target` node ids and an optional `value`). Node size defaults to its link degree when no `value` is given; nodes in the same `group` share a color.

## Options

- **`nodes`** — Array of `{ id, label?, value?, group?, color? }`
- **`links`** — Array of `{ source, target, value? }`
- **`nodeRadius`** — Base node radius (nodes scale around this by value/degree, default `8`)
- **`charge`** — Repulsion strength (negative, default `-240`)
- **`linkDistance`** — Target distance for link springs (default `60`)
- **`linkStrength`** — Link spring strength (default `0.5`)
- **`centerStrength`** — Centering pull (default `0.05`)
- **`iterations`** — Simulation iterations (default `300`)
- **`root`** — Id of the node the entry animation springs out from (defaults to the highest-degree node)
- **`format`** — Value formatter for tooltips
- **`padding`**, **`title`**, **`animation`** — Standard chart options
