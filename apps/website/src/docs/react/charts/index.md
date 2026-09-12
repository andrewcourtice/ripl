---
title: Charts
description: "@ripl/react-charts turns each of Ripl's 25 chart types into a component whose props are the chart's options, updated in place as those props change."
---

# Charts

`@ripl/react-charts` wraps every chart in [`@ripl/charts`](/docs/api/@ripl/charts/) as a component. Props are the chart's options, and changing one updates the chart in place rather than rebuilding it.

```bash
npm install @ripl/react-charts
```

```tsx
import {
    RiplBarChart,
} from '@ripl/react-charts';
```

The core `<RiplContext>` and `useRiplContext` are re-exported too, so a chart can share a page — or a context — with hand-drawn elements from one import.

## A chart

:::tabs
== Demo
<example-react-charts />
== Code
```tsx
const DATA = [
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
];

const SERIES = [
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

export function Revenue() {
    const onBarClick = useCallback(payload => {
        console.log(payload.xValue, payload.yValue);
    }, []);

    return (
        <RiplBarChart
            style={{ width: '100%', height: '100%' }}
            data={DATA}
            series={SERIES}
            keyBy="month"
            title="Monthly breakdown"
            legend
            borderRadius={4}
            onBarclick={onBarClick}
        />
    );
}
```
:::

A chart sizes itself to its root element and re-renders on resize, so give the component a size through `className` or `style` the way you would any other element.

## Props are options

Every prop maps to a top-level chart option, including the furniture: `axis`, `grid`, `legend`, `tooltip`, `crosshair`, `annotations`, `navigator`, `title`, `animation`, `theme` and `padding`.

How the chart merges those options gives you two rules to work to. An unbound prop is never written, so the chart keeps its own default and binding nothing is different from binding `undefined`. And a bound object replaces the whole option, since the merge is shallow and top-level:

```tsx
{/* replaces the entire axis option rather than merging into it, so pass the whole thing */}
<RiplBarChart axis={{ y: { ticks: 5 } }} data={data} series={series} keyBy="month" />
```

Props are compared by identity, so hoist object and array bindings to a module constant or a `useMemo` rather than writing them inline. Otherwise every render looks like a change — and React re-renders more eagerly than you might expect.

### `keyBy`, not `key`

Charts that group by a category take a `key` option. React reserves `key` as the element key, so it can never reach a component as a prop; bind **`keyBy`** instead and the adapter renames it on the way in.

```tsx
{/* not key="month", which React would eat */}
<RiplLineChart keyBy="month" data={data} series={series} />
```

## Events

Listener props come from the events each chart declares, so they match the imperative API exactly: `onBarclick` on a bar chart, `onSegmententer` on a pie chart, `onNodeclick` and `onLinkclick` on a sankey diagram. Every payload carries the chart-space `x` and `y` alongside the datum.

```tsx
<RiplPieChart
    data={data}
    keyBy="label"
    value="value"
    label="label"
    onSegmentclick={select}
    onSegmententer={hover}
/>
```

As with the core components, a chart only subscribes to an event you actually bind, and a new inline handler does not resubscribe.

## Sharing a context

A chart builds its own scene and renderer, so it is a peer of `<RiplContext>` rather than something that lives inside a `<RiplScene>`. Given one, it draws into it instead of creating its own:

```tsx
<RiplContext style={{ width: 640, height: 360 }}>
    <RiplBarChart data={data} series={series} keyBy="month" />
</RiplContext>
```

Unmounting the chart then leaves the context alone, since the context component owns it. A standalone chart destroys the surface it made.

## Reaching the chart

A `ref` resolves to the chart itself, and `useRiplChart()` reaches it from a descendant:

```tsx
import {
    useRef,
} from 'react';

import type {
    BarChart,
} from '@ripl/charts';

function Revenue() {
    const chart = useRef<BarChart>(null);

    const download = () => window.open(chart.current?.export().toURL());

    return <RiplBarChart ref={chart} data={data} series={series} keyBy="month" />;
}
```

This is also how you reach the handful of imperative APIs that have no declarative equivalent: `chart.navigator` on a cartesian chart, and `push()` / `clear()` on a realtime chart.

## Every chart

See [the component list](/docs/react/charts/components) for all 25.
