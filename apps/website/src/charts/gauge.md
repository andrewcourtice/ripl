---
title: Gauge Chart
description: Render a single KPI value on a semi-circular gauge with configurable ticks, tick labels, a custom value formatter and animated transitions, on Canvas or SVG.
---

# Gauge Chart

The **Gauge Chart** puts one number on a semi-circular arc, filled from `min` to `max` in proportion to `value`. Use it when a dashboard tile needs one reading against a known range — utilization, progress to target, a health score. `ticks` and `tickLabels` place graduations around the arc, `format` and `tickFormat` control how the number and the graduations read, and `color`, `trackColor` and `label` set the rest. The arc sweeps to its new position whenever the value changes. It works against any Ripl [rendering target](/charts/advanced/rendering-targets): Canvas, SVG or a terminal.

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
        <RiplChartConfig :config="config" extra-title="Gauge" :extras-reset="reset">
            <RiplField label="Value">
                <RiplInputRange v-model="extras.value" :min="0" :max="100" :step="1" />
            </RiplField>
            <RiplField label="Min value" option="min">
                <RiplInputNumber v-model="extras.min" placeholder="0" />
            </RiplField>
            <RiplField label="Max value" option="max">
                <RiplInputNumber v-model="extras.max" placeholder="100" />
            </RiplField>
            <RiplField label="Ticks" option="ticks">
                <RiplInputRange v-model="extras.ticks" :min="0" :max="12" :step="1" />
            </RiplField>
            <RiplField label="Tick labels" inline option="tickLabels">
                <RiplSwitch v-model="extras.tickLabels" />
            </RiplField>
            <template #colors>
                <RiplField label="Fill color" inline option="color">
                    <RiplColorInput v-model="extras.color" />
                </RiplField>
                <RiplField label="Track color" inline option="trackColor">
                    <RiplColorInput v-model="extras.trackColor" />
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
    useChartConfig,
    useChartExtras,
} from '../.vitepress/compositions/use-chart-config';

import {
    createGaugeChart,
} from '@ripl/charts';

import {
    ref,
    watch,
} from 'vue';

const { extras, reset } = useChartExtras({
    value: 72,
    min: 0 as number | undefined,
    max: 100 as number | undefined,
    ticks: 10,
    tickLabels: true,
    color: '#7cacf8',
    trackColor: '#e5e7eb',
});

const config = useChartConfig({
    features: {
        title: true,
        format: true,
        animation: true,
        theme: true,
    },
    title: 'Performance',
    titleVisible: false,
});

const example = ref();

function buildOptions() {
    const options = {
        value: extras.value,
        min: extras.min,
        max: extras.max,
        color: extras.color,
        trackColor: extras.trackColor,
        ticks: extras.ticks,
        tickLabels: extras.tickLabels,
        ...buildCommonOptions(config),
    };

    // The demo's bespoke format applies when no preset is selected.
    options.format ??= (v: number) => `${v}%`;

    return options;
}

const { contextChanged, chart } = useRiplChart(context => {
    return createGaugeChart(context, {
        label: 'Performance',
        ...buildOptions(),
    });
});

watch([config, extras], () => chart.value?.update(buildOptions()), { deep: true });

function randomize() {
    const min = extras.min ?? 0;
    const max = extras.max ?? 100;
    extras.value = Math.round(min + Math.random() * (max - min));
}
</script>

## Usage

```ts
import {
    createGaugeChart,
} from '@ripl/charts';

const chart = createGaugeChart('#container', {
    value: 72,
    min: 0,
    max: 100,
    label: 'Performance',
    format: v => `${v}%`,
});

// Update value
chart.update({ value: 85 });
```

## Data Format

A gauge shows a single number rather than a dataset, so there is no `data` option — pass `value`
directly and update it as it changes:

```ts
const chart = createGaugeChart('#container', {
    value: 72,
    min: 0,
    max: 100,
});

chart.update({ value: 85 });
```

## Options

A full configuration for this chart. The options every chart shares — `padding`, `title`,
`animation`, `theme` and the rest — behave the same everywhere and are documented on
[Shared Options](/charts/shared-options).

<!-- eslint-skip -->
```ts
createGaugeChart('#container', {
    value: 72,
    min: 0,
    max: 100,
    label: 'Utilisation',
    color: '#6dd5b1',
    trackColor: '#e5e7eb',
    ticks: 5,
    tickLabels: true,
    // `format` styles the central value; `tickFormat` styles the tick labels around the arc.
    format: 'number',
    tickFormat: v => `${v}%`,
});
```

## Events

Subscribe with `chart.on(...)`. A handler receives an `Event` object, not the payload directly — the
payload is on `event.data`, and carries the interacted datum plus its `{ x, y }` anchor in chart
pixels. `event.target` and `event.stopPropagation()` are also available.

<!-- events:start -->
<!-- eslint-skip -->
```ts
// Emitted when the value arc is clicked.
chart.on('valueclick', event => console.log(event.data)); // event.data: GaugeChartValueEvent
// Emitted when the pointer enters the value arc.
chart.on('valueenter', event => console.log(event.data)); // event.data: GaugeChartValueEvent
// Emitted when the pointer leaves the value arc.
chart.on('valueleave', event => console.log(event.data)); // event.data: GaugeChartValueEvent
```
<!-- events:end -->

## Programmatic Interaction

A gauge draws a single value arc, so there is nothing to select: `highlightValue` applies the
treatment hovering that arc does — it lifts out of its track — and takes only the options.
`{ tooltip: true }` opens the arc's tooltip where hovering would; a gauge draws no crosshair, so
`crosshair` is ignored here.

```ts
const chart = createGaugeChart('#container', { value: 72, min: 0, max: 100 });

// Light the value arc and open its tooltip.
chart.highlightValue({ tooltip: true });

chart.clearHighlight();
```

The highlight is one-shot: the next render (a resize, an `update`) or the next pointer hover restores
the gauge, and it emits none of the `value*` events above. `clearHighlight()` restores it explicitly;
`highlightValue` returns `false` when there is no live arc to light.
