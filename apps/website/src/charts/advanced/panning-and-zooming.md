---
outline: "deep"
---

# Panning & Zooming

Cartesian charts support interactive pan/zoom through two complementary options:

- **`navigator`** — enables in-plot gestures: wheel/pinch zoom, click-drag pan, and optionally a rectangular brush. The chart rescales its axis domains as the view changes; no data rebuild happens.
- **`overview`** — adds an overview "scrub bar" strip beside the plot with a draggable, resizable window that selects the visible range of the category axis (like the range selector on a stock chart).

> [!NOTE]
> The underlying pan/zoom controller is Ripl core's `Navigator` — see the [Navigator core docs](/docs/core/advanced/navigator) for the full controller API.

## In-Plot Pan & Zoom

Pass `navigator: true` to enable wheel-zoom and drag-pan, or an object to configure each interaction individually:

```ts
import {
    createScatterChart,
} from '@ripl/charts';

// Wheel zoom + drag pan
const chart = createScatterChart('#container', {
    data,
    series,
    navigator: true,
});
```

<!-- eslint-skip -->
```ts
// Configure interactions individually
navigator: {
    zoom: { sensitivity: 1.5 },
    pan: true,
    brush: false,
}
```

Each interaction accepts `true`/`false` or `{ enabled, sensitivity }`. Zooming is bounded: you can zoom in up to 50× but only out to the full-data view — never past the extent of the dataset, and panning is clamped so the visible window stays within the data.

Which axes the view affects depends on the chart:

| Charts | Navigation |
| --- | --- |
| Line, Area, Trend, Stock | Window the **x** (category/time) axis; the value axis stays fixed |
| Bar | Window the category axis — x for vertical bars, y for horizontal bars |
| Scatter and other 2-D charts | Zoom and pan **both** axes uniformly |

While a gesture is in flight the chart suppresses transition animations, so marks snap to the new view each frame instead of tweening behind the pointer. Marks are clipped to the plot rectangle so panning never smears them over the axes, title, or legend.

## The Overview Strip

`overview: true` renders a miniature of the full dataset beside the plot — below it for category-on-x charts, to the right for a horizontal bar chart — with a draggable window over it:

```ts
import {
    createLineChart,
} from '@ripl/charts';

const chart = createLineChart('#container', {
    data,
    key: 'date',
    series,
    overview: true,
});
```

- Drag the window to pan; drag its edges to resize (zoom).
- The strip and the in-plot gestures stay in sync — zooming with the wheel moves the window, and vice versa.
- Enabling `overview` implies `navigator: true` unless you explicitly pass `navigator: false`, in which case the strip still works but in-plot gestures are off.
- Only category-axis charts (line, area, bar, trend) render the strip; on 2-D charts the option is ignored.

Configure the strip size with an options object:

<!-- eslint-skip -->
```ts
overview: {
    size: 64, // height of a bottom strip / width of a side strip, in pixels (default 48)
}
```

## Toggling at Runtime

Both options participate in `chart.update()` — the controller is created, destroyed, or rebuilt to match:

```ts
chart.update({ navigator: true });
chart.update({ overview: true });

// Turn everything off (the view resets to the full extent)
chart.update({
    navigator: false,
    overview: false,
});
```

## Imperative Control

When the `navigator` option is on, `chart.navigator` exposes the underlying controller (`DOMNavigator`) for imperative framing and brush-and-link:

```ts
const nav = chart.navigator;

// Zoom to 4x around a point
nav?.zoomTo(4, [200, 150]);

// Center the view on a point
nav?.centerOn([420, 180]);

// Fit a rectangular region (two corners) into the viewport
nav?.fitBounds({
    x0: 100,
    y0: 50,
    x1: 400,
    y1: 250,
}, { padding: 12 });

// Back to the identity view
nav?.reset();
```

With `brush` enabled, subscribe to selections:

```ts
nav?.on('brush', event => {
    // live selection while dragging: { x0, y0, x1, y1 }
    console.log(event.data);
});

nav?.on('brushend', event => {
    // final selection, or null when the brush is cleared
    console.log(event.data);
});
```

`chart.navigator` is `undefined` when the `navigator` option is off, so guard access accordingly.
