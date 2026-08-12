---
title: Chord Chart
description: Show flows between groups as ribbons inside a ring of arcs, sized from a square matrix, with configurable padAngle, padWidth, palette and hover dimming.
---

# Chord Chart

The **Chord Chart** draws a ring of arcs, one per group, and connects them with ribbons whose width encodes the flow between each pair. It suits a square `matrix` of group-to-group volumes where both directions of a relationship matter: migration between regions, trade between sectors, hand-offs between teams. `palette` sets the group colors, `padAngle` and `padWidth` control the gap between arcs, and `legend` and `format` handle the labelling. Arcs enter first, ribbons follow; hovering an arc dims the other arcs and every ribbon it is not attached to. The [target](/charts/advanced/rendering-targets) can be a Canvas, an SVG context or a terminal.

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
            <RiplField label="Arc gap" option="padWidth">
                <RiplInputRange v-model="extras.padWidth" :min="0" :max="12" :step="1" />
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
    padWidth: 2,
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
        padWidth: extras.padWidth,
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
    // Gap between adjacent group arcs, in pixels — a constant width whatever the radius.
    padWidth: 2,
    // Deprecated: an angular gap, in radians, taken out of the ring before the arcs are sized.
    // Ignored while `padWidth` is set.
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

## Programmatic Interaction

`highlightSegment` and `highlightLink` put a mark into the same hover state the pointer would —
which reads as everything else dimming — without waiting for one. A group's outer arc takes its
label or the `{ key }` ref form. A ribbon is drawn once per pair, so it takes its id or a `{ source,
target }` ref naming the groups it joins, in the order the events above report them. Either method
also accepts an accessor over the chart's `groups`. `{ tooltip: true }` opens the mark's tooltip
where hovering would; a chord chart draws no crosshair, so `crosshair` is ignored here.

```ts
const chart = createChordChart('#container', { groups, matrix });

// Light one group's arc, then the ribbon joining it to another.
chart.highlightSegment('Engineering', { tooltip: true });
chart.highlightLink({ source: 'Engineering', target: 'Design' }, { tooltip: true });

// The first group in the list.
chart.highlightSegment(groups => groups[0]);

chart.clearHighlight();
```

One highlight is active at a time — a matching call replaces the last, including across the two
methods — and it is one-shot: the next render (a resize, an `update`, a legend toggle) or the next
pointer hover restores the chart, and it emits none of the events above. `clearHighlight()` restores
it explicitly; both methods return `false` when the selector matched nothing live.