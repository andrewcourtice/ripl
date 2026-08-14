# @ripl/vue-charts

Declarative Vue 3 components for [Ripl](https://www.ripl.run)'s 25 chart types.

Props are the chart's options, and changing one updates the chart in place rather than rebuilding it.

## Installation

```bash
npm install @ripl/vue-charts
```

[`@ripl/vue`](../vue) and `@ripl/charts` arrive as dependencies. `vue` (3.5 or later) is a peer dependency.

## Quick start

```typescript
import {
    createRiplCharts,
} from '@ripl/vue-charts';

createApp(App).use(createRiplCharts()).mount('#app');
```

`createRiplCharts()` registers the core Ripl components too, so a chart can share a page, or even a context, with hand-drawn elements.

```vue
<template>
    <ripl-bar-chart
        :data="data"
        :series="series"
        key-by="month"
        title="Monthly breakdown"
        :legend="true"
        @barclick="onBarClick"
    />
</template>
```

## Props are options

Every prop maps to a top-level chart option, the furniture included: `axis`, `grid`, `legend`, `tooltip`, `crosshair`, `annotations`, `navigator`, `title`, `animation`, `theme` and `padding`.

- An unbound prop is never written, so the chart keeps its own default.
- A bound object replaces the whole option. The merge is shallow and top-level, so `:axis` must be passed complete rather than partially.
- Props are compared by identity, so hoist object and array bindings to a `computed`.

### `keyBy`, not `key`

Vue reserves `key` as the vnode key, so a chart's `key` option is bound as **`key-by`** and renamed on the way in.

## Events

Listener props come from the events each chart declares, so they match the imperative API exactly: `@barclick`, `@segmententer`, `@nodeclick`. A chart subscribes only to an event you actually bind.

## Sharing a context

A chart builds its own scene and renderer, so it is a peer of `<ripl-context>` rather than something nested in a `<ripl-scene>`. Given one, it draws into it:

```vue
<template>
    <ripl-context style="width: 640px; height: 360px">
        <ripl-bar-chart :data="data" :series="series" key-by="month" />
    </ripl-context>
</template>
```

Unmounting then leaves the context alone; a standalone chart destroys the surface it made.

## Compositions

```typescript
import {
    useRiplChart,
} from '@ripl/vue-charts';

const chart = useRiplChart();
```

A template ref on any chart component resolves to the chart itself, which is how you reach the imperative APIs with no declarative equivalent: `chart.navigator`, and `push()` / `clear()` on a realtime chart.

## Documentation

Full documentation lives at [ripl.run](https://www.ripl.run/docs/vue/charts/).

## License

MIT
