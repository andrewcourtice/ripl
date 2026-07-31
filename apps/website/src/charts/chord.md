# Chord Chart

The **Chord Chart** visualizes relationships between groups using arcs and ribbons arranged in a circle. Each group is represented by an arc segment, and ribbons connect groups to show the magnitude of flow between them. The chart features a sequential entry animation (arcs first, then ribbons), an optional legend, and configurable colors and pad angles.

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
        <RiplChartConfig :config="config" extra-title="Groups" :extras-reset="reset">
            <RiplField label="Pad angle" option="padAngle">
                <RiplInputRange v-model="extras.padAngle" :min="0" :max="0.2" :step="0.01" />
            </RiplField>
            <template #colors>
                <RiplField
                    v-for="(label, index) in LABELS"
                    :key="label"
                    :label="label"
                    option="palette"
                    inline
                >
                    <RiplColorInput
                        :model-value="extras.palette[index]"
                        @update:model-value="setColor(index, $event)"
                    />
                </RiplField>
            </template>
        </RiplChartConfig>
    </template>
</ripl-example>

<script setup lang="ts">
import {
    useRiplChart,
} from '../.vitepress/compositions/example';

import {
    buildCommonOptions,
    paletteColor,
    useChartConfig,
    useChartExtras,
} from '../.vitepress/compositions/use-chart-config';

import {
    createChordChart,
} from '@ripl/charts';

import {
    ref,
    watch,
} from 'vue';

const LABELS = ['Engineering', 'Design', 'Marketing', 'Sales'];

const { extras, reset } = useChartExtras({
    padAngle: 0.04,
    palette: LABELS.map((_, index) => paletteColor(index)),
});

const config = useChartConfig({
    features: {
        title: true,
        legend: true,
        animation: true,
        theme: true,
        format: true,
    },
    title: 'Team Collaboration',
});

function setColor(index: number, value: string) {
    extras.palette = extras.palette.map((color, i) => (i === index ? value : color));
}

function generateMatrix() {
    const size = LABELS.length;
    return Array.from({ length: size }, () =>
        Array.from({ length: size }, () => Math.round(Math.random() * 50))
    );
}

let matrix = generateMatrix();

function buildOptions() {
    return {
        palette: extras.palette,
        padAngle: extras.padAngle,
        ...buildCommonOptions(config),
    };
}

const example = ref();

const { contextChanged, chart } = useRiplChart(context => {
    return createChordChart(context, {
        groups: LABELS,
        matrix,
        ...buildOptions(),
    });
});

watch([config, extras], () => chart.value?.update(buildOptions()), { deep: true });


function randomize() {
    matrix = generateMatrix();
    chart.value?.update({ matrix });
}
</script>

## Usage

```ts
import {
    createChordChart,
} from '@ripl/charts';

const chart = createChordChart('#container', {
    groups: ['A', 'B', 'C'],
    matrix: [
        [0, 10, 20],
        [10, 0, 15],
        [20, 15, 0],
    ],
});
```

## Data Format

A chord chart is driven by a square matrix rather than a row-per-item dataset. `groups` names each
row/column, and `matrix[i][j]` is the flow from group `i` to group `j`:

```ts
const groups = ['Engineering', 'Design', 'Marketing'];

const matrix = [
    //  Eng  Des  Mkt
    [0, 5, 10], // from Engineering
    [5, 0, 6], //  from Design
    [10, 6, 0], //  from Marketing
];
```

The diagonal is normally `0` (a group does not flow to itself), and the matrix must be the same
length as `groups` in both dimensions.

## Options

A full configuration for this chart. The options every chart shares — `padding`, `title`,
`animation`, `theme` and the rest — behave the same everywhere and are documented on
[Shared Options](/charts/shared-options).

<!-- eslint-skip -->
```ts
createChordChart('#container', {
    groups: ['Engineering', 'Design', 'Marketing', 'Sales'],
    // Square flow matrix: matrix[i][j] is the flow from groups[i] to groups[j].
    matrix,
    // One color per group, positional.
    palette: ['#7cacf8', '#6dd5b1', '#b197fc', '#f7c97e'],
    // Gap between adjacent group arcs, in radians.
    padAngle: 0.04,
    legend: { position: 'right' },
    format: 'number',
});
```

## Events

Subscribe with `chart.on(...)`. A handler receives an `Event` object, not the payload directly — the
payload is on `event.data`, and carries the interacted datum plus its `{ x, y }` anchor in chart
pixels. `event.target` and `event.stopPropagation()` are also available.

<!-- events:start -->
<!-- eslint-skip -->
```ts
// Emitted when an outer arc is clicked.
chart.on('segmentclick', event => console.log(event.data)); // event.data: ChordChartSegmentEvent
// Emitted when the pointer enters an outer arc.
chart.on('segmententer', event => console.log(event.data)); // event.data: ChordChartSegmentEvent
// Emitted when the pointer leaves an outer arc.
chart.on('segmentleave', event => console.log(event.data)); // event.data: ChordChartSegmentEvent
// Emitted when a ribbon is clicked.
chart.on('linkclick',    event => console.log(event.data)); // event.data: ChordChartLinkEvent
// Emitted when the pointer enters a ribbon.
chart.on('linkenter',    event => console.log(event.data)); // event.data: ChordChartLinkEvent
// Emitted when the pointer leaves a ribbon.
chart.on('linkleave',    event => console.log(event.data)); // event.data: ChordChartLinkEvent
```
<!-- events:end -->
