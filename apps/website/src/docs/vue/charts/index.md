---
title: Charts
description: "@ripl/vue-charts turns each of Ripl's 25 chart types into a component whose props are the chart's options, updated in place as those props change."
---

# Charts

`@ripl/vue-charts` wraps every chart in [`@ripl/charts`](/docs/api/@ripl/charts/) as a component. Props are the chart's options, and changing one updates the chart in place rather than rebuilding it.

```bash
npm install @ripl/vue-charts
```

```ts
import {
    createRiplCharts,
} from '@ripl/vue-charts';

createApp(App).use(createRiplCharts()).mount('#app');
```

`createRiplCharts()` installs the core `@ripl/vue` components too, so a chart can share a page with hand-drawn elements. Applying `createRipl()` as well is harmless in either order.

## A chart

:::tabs
== Demo
<example-vue-charts />
== Code
```vue
<template>
    <ripl-bar-chart
        :data="data"
        :series="series"
        key-by="month"
        title="Monthly breakdown"
        :legend="true"
        :border-radius="4"
        @barclick="onBarClick"
    />
</template>

<script setup lang="ts">
const data = ref([
    {
        month: 'Jan',
        revenue: 12000,
        costs: 5000,
    },
    {
        month: 'Feb',
        revenue: 15500,
        costs: 6200,
    },
]);

const series = [
    {
        id: 'revenue',
        label: 'Revenue',
        value: 'revenue',
    },
    {
        id: 'costs',
        label: 'Costs',
        value: 'costs',
    },
];

function onBarClick(payload) {
    console.log(payload.xValue, payload.yValue);
}
</script>
```
:::

A chart sizes itself to its root element and re-renders on resize, so give the component a size the way you would any other element.

## Props are options

Every prop maps to a top-level chart option, including the furniture: `axis`, `grid`, `legend`, `tooltip`, `crosshair`, `annotations`, `navigator`, `title`, `animation`, `theme` and `padding`.

How the chart merges those options gives you two rules to work to. An unbound prop is never written, so the chart keeps its own default and binding nothing is different from binding `undefined`. And a bound object replaces the whole option, since the merge is shallow and top-level: `:axis="{ y: { ticks: 5 } }"` replaces the entire `axis` option rather than merging into it, so pass the whole thing.

Props are compared by identity, so hoist object and array bindings to a `computed` rather than writing them inline. Otherwise every parent render looks like a change.

### `keyBy`, not `key`

Charts that group by a category take a `key` option. Vue reserves `key` as the vnode key, so it can never reach a component as a prop; bind **`key-by`** instead and the adapter renames it on the way in.

```vue
<template>
    <!-- not :key="'month'", which Vue would eat -->
    <ripl-line-chart key-by="month" :data="data" :series="series" />
</template>
```

## Events

Listener props come from the events each chart declares, so they match the imperative API exactly: `@barclick` on a bar chart, `@segmententer` on a pie chart, `@nodeclick` and `@linkclick` on a sankey diagram. Every payload carries the chart-space `x` and `y` alongside the datum.

```vue
<template>
    <ripl-pie-chart
        :data="data"
        key-by="label"
        :value="'value'"
        :label="'label'"
        @segmentclick="select"
        @segmententer="hover"
    />
</template>
```

As with the core components, a chart only subscribes to an event you actually bind.

## Sharing a context

A chart builds its own scene and renderer, so it is a peer of `<ripl-context>` rather than something that lives inside a `<ripl-scene>`. Given one, it draws into it instead of creating its own:

```vue
<template>
    <ripl-context style="width: 640px; height: 360px">
        <ripl-bar-chart :data="data" :series="series" key-by="month" />
    </ripl-context>
</template>
```

Unmounting the chart then leaves the context alone, since the context component owns it. A standalone chart destroys the surface it made.

## Reaching the chart

A template ref resolves to the chart itself, and `useRiplChart()` reaches it from a descendant:

```vue
<template>
    <ripl-bar-chart ref="chart" :data="data" :series="series" key-by="month" />
</template>

<script setup lang="ts">
import {
    useTemplateRef,
} from 'vue';

const chart = useTemplateRef('chart');

const download = () => window.open(chart.value?.export().toURL());
</script>
```

This is also how you reach the handful of imperative APIs that have no declarative equivalent: `chart.navigator` on a cartesian chart, and `push()` / `clear()` on a realtime chart.

## Every chart

See [the component list](/docs/vue/charts/components) for all 25.
