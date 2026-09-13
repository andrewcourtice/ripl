# @ripl/react-charts

Declarative React components for [Ripl](https://www.ripl.run)'s 25 chart types.

Props are the chart's options, and changing one updates the chart in place rather than rebuilding it.

## Installation

```bash
npm install @ripl/react-charts
```

[`@ripl/react`](../react) and `@ripl/charts` arrive as dependencies. `react` (18.3 or later) is a peer dependency.

## Quick start

```tsx
import {
    RiplBarChart,
} from '@ripl/react-charts';

export function Revenue({ data, series, onBarClick }) {
    return (
        <RiplBarChart
            style={{ width: 640, height: 360 }}
            data={data}
            series={series}
            keyBy="month"
            title="Monthly breakdown"
            legend
            onBarclick={onBarClick}
        />
    );
}
```

## Props are options

Every prop maps to a top-level chart option, the furniture included: `axis`, `grid`, `legend`, `tooltip`, `crosshair`, `annotations`, `navigator`, `title`, `animation`, `theme` and `padding`.

- An unbound prop is never written, so the chart keeps its own default.
- A bound object replaces the whole option. The merge is shallow and top-level, so `axis` must be passed complete rather than partially.
- Props are compared by identity, so hoist object and array bindings to a `useMemo` or a module constant.

### `keyBy`, not `key`

React reserves `key` as the element key, so a chart's `key` option is bound as **`keyBy`** and renamed on the way in.

## Events

Listener props come from the events each chart declares, so they match the imperative API exactly: `onBarclick`, `onSegmententer`, `onNodeclick`. A chart subscribes only to an event you actually bind, and passing a new inline handler does not resubscribe.

## Sharing a context

A chart builds its own scene and renderer, so it is a peer of `<RiplContext>` rather than something nested in a `<RiplScene>`. Given one, it draws into it:

```tsx
<RiplContext style={{ width: 640, height: 360 }}>
    <RiplBarChart data={data} series={series} keyBy="month" />
</RiplContext>
```

Unmounting then leaves the context alone; a standalone chart destroys the surface it made.

## Hooks

```tsx
import {
    useRiplChart,
} from '@ripl/react-charts';

const chart = useRiplChart();
```

A `ref` on any chart component resolves to the chart itself, which is how you reach the imperative APIs with no declarative equivalent: `chart.navigator`, and `push()` / `clear()` on a realtime chart.

## Documentation

Full documentation lives at [ripl.run](https://www.ripl.run/docs/react/charts/).

## License

MIT
