---
title: Programmatic Interaction
description: Drive a chart's hover treatment from code — highlight a mark, a row of cells or a whole series, with its tooltip and crosshair, then clear it again.
outline: "deep"
---

# Programmatic Interaction

Every chart already knows how to highlight one of its marks: hover a bar and it lights up, the rest of the chart dims, and the bar's tooltip opens. That treatment is a pointer away, and otherwise out of reach.

The `highlightX` methods replay it from code. They run the same path the pointer does — the same highlight state, the same chart-wide dim, the same tooltip — so a chart can be driven by something other than the mouse: a hovered row in a table beside it, a search result, keyboard navigation, a second chart showing the same records, a guided tour, or an export that needs one mark called out.

## Quick Start

```ts
import {
    createBarChart,
} from '@ripl/charts';

const chart = createBarChart('#container', {
    data,
    key: 'month',
    series: [
        { id: 'revenue', value: 'revenue', label: 'Revenue' },
    ],
});

// Light the March bar, dim everything else, open its tooltip.
chart.highlightBar('mar', { tooltip: true });

// Put the chart back.
chart.clearHighlight();
```

Every method returns a `boolean`: `true` when at least one live mark matched and the chart changed, `false` when nothing did — an unknown key, a mark that is mid-exit, a marker on a series drawn with `markers: false`.

## The Naming Convention

A chart's highlight methods mirror its events. The mark family in the event name is the mark family in the method name, so if you know what to subscribe to you already know what to call:

| Event | Method | Charts |
| --- | --- | --- |
| `barenter` / `barleave` / `barclick` | `highlightBar` | Bar, Trend, Radial Bar |
| `markerenter` / … | `highlightMarker` | Line, Area, Trend, Scatter, Radar, Polar Scatter |
| `segmententer` / … | `highlightSegment` | Pie, Polar Area, Funnel, Chord |
| `nodeenter` / … | `highlightNode` | Treemap, Sunburst, Packed Circle, Sankey, Arc Diagram, Force-Directed |
| `linkenter` / … | `highlightLink` | Sankey, Chord, Arc Diagram, Force-Directed |
| `cellenter` / … | `highlightCell` | Heatmap |
| `boxenter` / … | `highlightBox` | Box Plot |
| `binenter` / … | `highlightBin` | Histogram |
| `candleenter` / … | `highlightCandle` | Stock |
| `taskenter` / … | `highlightTask` | Gantt |
| `valueenter` / … | `highlightValue` | Gauge |

The pairing goes further than the name: **the key you pass is the key the event reports**. A bar event carries the category as `xValue`, and that is exactly what `highlightBar` takes, so a key read off an event can be handed straight back:

```ts
const chart = createBarChart('#container', {
    data,
    key: 'month',
    series: [
        { id: 'revenue', value: 'revenue', label: 'Revenue' },
    ],
});

chart.on('barclick', event => {
    // `xValue` is the same key `highlightBar` selects by.
    chart.highlightBar(event.data.xValue, { tooltip: true });
});
```

Each chart's page lists the events it emits and their payloads; the [Method Reference](#method-reference) below lists what every chart's methods select.

## Selecting a Mark

A selector takes three forms, and every chart accepts all three.

### By Key

The bare key selects the mark at that key. On a multi-series chart it selects that key in *every* series, so one call lights the whole category:

```ts
const chart = createLineChart('#container', {
    data,
    key: 'month',
    series: [
        { id: 'revenue', value: 'revenue', label: 'Revenue' },
        { id: 'costs', value: 'costs', label: 'Costs' },
    ],
});

// The March point on both series.
chart.highlightMarker('mar');
```

### Narrowed to a Series

Pass a `{ key, series }` ref to select one of them. The `series` is the series `id` — the same `seriesId` the mark's events report:

```ts
const chart = createLineChart('#container', {
    data,
    key: 'month',
    series: [
        { id: 'revenue', value: 'revenue', label: 'Revenue' },
        { id: 'costs', value: 'costs', label: 'Costs' },
    ],
});

chart.highlightMarker({ key: 'mar', series: 'revenue' });
```

### By Position in the Data

An accessor receives the chart's own dataset and returns a key or a ref, so a mark can be addressed by where it sits in the data without tracking keys at all:

```ts
const chart = createLineChart('#container', {
    data,
    key: 'month',
    series: [
        { id: 'revenue', value: 'revenue', label: 'Revenue' },
    ],
});

// The third datum, whatever its key happens to be.
chart.highlightMarker(data => data[2].month);

// The most recent one.
chart.highlightMarker(data => data[data.length - 1].month);
```

The accessor is called with whichever array the chart's marks are built from: `data` on most charts, `nodes` or `links` on the network charts. It runs at call time, against the data the chart currently holds.

### The Other Ref Shapes

Marks that are not addressed by a single key take a ref shaped to what they are, and the same three forms apply to it:

```ts
const chart = createSankeyChart('#container', {
    nodes,
    links,
});

// A link is named by the nodes it joins.
chart.highlightLink({ source: 'coal', target: 'grid' });
chart.highlightLink(links => ({ source: links[0].source, target: links[0].target }));
```

- **Links** (Sankey, Chord, Arc Diagram, Force-Directed) take `{ source, target }` — the node ids at each end — or the `"source->target"` string it flattens to.
- **Heatmap cells** take `{ x, y }`, the pair of axis labels the chart reports as `xLabel`/`yLabel`.
- **Histogram bins** are derived from the data rather than carrying a key, so `highlightBin` takes a numeric index (or an accessor returning one), counting up in the order the bars are drawn.
- **The gauge** has a single arc, so `highlightValue` takes no selector — only options.

### Matching More Than One Mark

Some selectors deliberately match several marks, and all of them light together:

```ts
const chart = createHeatmapChart('#container', {
    data,
    keyX: 'hour',
    keyY: 'day',
    value: 'value',
    xCategories: ['9am', '10am', '11am'],
    yCategories: ['Mon', 'Tue', 'Wed'],
});

// One cell.
chart.highlightCell({ x: '9am', y: 'Mon' }, { tooltip: true });

// A bare label lights that whole row (or column).
chart.highlightCell('Mon', { tooltip: true });
```

When a selector matches several marks and `tooltip` is on, they share a single tooltip anchored at the first match, with each mark's content on its own line.

## Tooltips and Crosshairs

A highlight is only the mark's highlight state unless you ask for more. Both options default to `false`:

```ts
const chart = createLineChart('#container', {
    data,
    key: 'month',
    series: [
        { id: 'revenue', value: 'revenue', label: 'Revenue' },
    ],
    crosshair: true,
});

chart.highlightMarker('mar', {
    tooltip: true,
    crosshair: true,
});
```

| Option | Type | Default | Description |
| --- | --- | --- | --- |
| `tooltip` | `boolean` | `false` | Opens the mark's tooltip, anchored where hovering it would place it |
| `crosshair` | `boolean` | `false` | Places the crosshair on the mark |

`tooltip` follows the chart's own `tooltip` configuration: with the default `trigger: 'item'` it is the mark's own tooltip, and on a cartesian chart configured with `trigger: 'axis'` it is the shared axis tooltip listing every series at that position — exactly what hovering there would show. A chart with tooltips turned off shows nothing.

`crosshair` only means something on the charts that draw one: **line, area, trend, scatter, stock, box plot and histogram**. Only the axes the chart's `crosshair` option was configured for are drawn, and on every other chart the flag is ignored rather than an error, so the same call is safe across chart types. See [Crosshair](/charts/shared-options#crosshair) in Shared Options for the configuration itself.

## A Command, Not a Mode

A programmatic highlight is one-shot. It survives until something replaces it:

- **A render clears it.** `render()` drops the highlight before it redraws, so a resize, an `update()`, a legend toggle, or a pan/zoom gesture leaves the chart in its rest state. Marks are addressed by key, and a render is free to have destroyed the mark at that key, so the highlight cannot meaningfully outlive it.
- **The pointer takes it over.** Hovering any mark releases the programmatic highlight first, then applies its own, so a hover never has to fight it. Only that chart's highlight is released — two charts on the same page never clear each other.
- **A second call replaces the first.** Each chart holds at most one programmatic highlight; calling again clears the previous one before applying the new.
- **`clearHighlight()` ends it.**

If a highlight should persist across data updates, hold the selection in your own state and re-apply it once the render has settled:

```ts
const chart = createBarChart('#container', {
    data: months,
    key: 'month',
    series: [
        { id: 'revenue', value: 'revenue', label: 'Revenue' },
    ],
    autoRender: false,
});

let selected: string | null = null;

async function setData(next: typeof months) {
    chart.update({ data: next });

    // `render()` resolves once the entry/update transitions have settled.
    await chart.render();

    if (selected) {
        chart.highlightBar(selected, { tooltip: true });
    }
}
```

`autoRender: false` is what makes this tidy: `update()` then renders only when you ask, so there is one render to wait on and one place to re-apply.

## No Events Are Emitted

A programmatic highlight is silent. It emits no `*enter`, `*leave` or `*click` event, and `highlightSeries` emits nothing either.

That is deliberate, because the most common thing to do with these methods is call them from inside an event handler — linking two charts on a shared key:

```ts
const overview = createLineChart('#overview', {
    data,
    key: 'month',
    series: [
        { id: 'revenue', value: 'revenue', label: 'Revenue' },
    ],
});

const detail = createBarChart('#detail', {
    data,
    key: 'month',
    series: [
        { id: 'revenue', value: 'revenue', label: 'Revenue' },
    ],
});

overview.on('markerenter', event => detail.highlightBar(event.data.xValue, { tooltip: true }));
overview.on('markerleave', () => detail.clearHighlight());
```

If the highlight emitted a `barenter` of its own, the mirrored subscription in the other direction would bounce the two charts off each other forever. Staying silent also keeps `chart.on(...)` honest: an interaction event means a user did something, which is what makes those events worth logging as analytics. You never need the echo anyway — you know when you called `highlightBar`.

## Highlighting a Series

`highlightSeries(id)` dims everything except one series, exactly as hovering its legend entry does:

```ts
const chart = createLineChart('#container', {
    data,
    key: 'month',
    series: [
        { id: 'revenue', value: 'revenue', label: 'Revenue' },
        { id: 'costs', value: 'costs', label: 'Costs' },
    ],
});

chart.highlightSeries('revenue');
```

The id is whatever the chart puts in its legend: a series `id` on the multi-series charts, and the segment key on the charts whose legend lists segments — pie, polar area, radial bar, funnel, treemap, packed circle, sunburst — where it isolates that segment.

**The legend follows.** The matching legend entry stays lit while every other entry — swatch and label alike — dims with the plot, so a highlight driven from your own UI reads in the legend too. An entry toggled off stays visibly inactive underneath the dim.

It takes no `tooltip` or `crosshair` options: a whole series has no single point to anchor them to. It returns `true` when the id matched, and `false` on a chart with no highlightable series (box plot, histogram, heatmap, stock, gantt and gauge each highlight marks only).

The same one-shot rules apply — the next render restores the chart — with one exception worth knowing: `clearHighlight()` only clears highlights *you* asked for. A legend hover in progress is left alone.

## Clearing a Highlight

`clearHighlight()` restores everything a programmatic highlight changed: the highlighted marks, the chart-wide dim, the legend, and any tooltip or crosshair it opened. The marks are written back immediately rather than transitioned, so the chart is at rest the moment the call returns — useful when the next thing you do is export it.

```ts
const chart = createPieChart('#container', {
    data,
    key: 'browser',
    value: 'share',
    label: 'browser',
});

chart.highlightSegment('Chrome', { tooltip: true });
chart.clearHighlight();

// Safe to call at any time; a no-op when nothing is highlighted.
chart.clearHighlight();
```

## Method Reference

Every chart, and what its methods select. Selectors also accept an accessor returning the same value, and the multi-series charts additionally accept `{ key, series }`.

### Cartesian

| Chart | Method | Selects |
| --- | --- | --- |
| [Line](/charts/line) | `highlightMarker(selector, options?)` | The category key (`xValue`), in every series or one |
| [Bar](/charts/bar) | `highlightBar(selector, options?)` | The category key (`xValue`), in every series or one |
| [Area](/charts/area) | `highlightMarker(selector, options?)` | The category key (`xValue`), in every series or one |
| [Trend](/charts/trend) | `highlightBar(selector, options?)` | The category key, across the bar series only |
| [Trend](/charts/trend) | `highlightMarker(selector, options?)` | The category key, across the line and area series |
| [Scatter](/charts/scatter) | `highlightMarker(selector, options?)` | The item's key, in every series or one |
| [Stock](/charts/stock) | `highlightCandle(selector, options?)` | The candle's key |
| [Box Plot](/charts/box-plot) | `highlightBox(selector, options?)` | The box's category |
| [Histogram](/charts/histogram) | `highlightBin(index, options?)` | The bin's index, left to right |

### Radial & Polar

| Chart | Method | Selects |
| --- | --- | --- |
| [Pie/Donut](/charts/pie) | `highlightSegment(selector, options?)` | The segment's key |
| [Polar Area](/charts/polar-area) | `highlightSegment(selector, options?)` | The segment's key |
| [Radial Bar](/charts/radial-bar) | `highlightBar(selector, options?)` | The ring's key |
| [Radar](/charts/radar) | `highlightMarker(selector, options?)` | The point's axis label (`axisLabel`), in every series or one |
| [Polar Scatter](/charts/polar-scatter) | `highlightMarker(selector, options?)` | The item's `index` as a string, in every series or one |
| [Gauge](/charts/gauge) | `highlightValue(options?)` | The value arc — no selector |

### Hierarchical

| Chart | Method | Selects |
| --- | --- | --- |
| [Treemap](/charts/treemap) | `highlightNode(selector, options?)` | The cell's key |
| [Sunburst](/charts/sunburst) | `highlightNode(selector, options?)` | The node's id |
| [Packed Circle](/charts/packed-circle) | `highlightNode(selector, options?)` | The circle's key |

### Network & Flow

| Chart | Method | Selects |
| --- | --- | --- |
| [Funnel](/charts/funnel) | `highlightSegment(selector, options?)` | The segment's key |
| [Sankey](/charts/sankey) | `highlightNode(selector, options?)` | The node's id |
| [Sankey](/charts/sankey) | `highlightLink(selector, options?)` | `{ source, target }` node ids, or the link's id |
| [Chord](/charts/chord) | `highlightSegment(selector, options?)` | The group's label |
| [Chord](/charts/chord) | `highlightLink(selector, options?)` | `{ source, target }` group labels, or the ribbon's id |
| [Arc Diagram](/charts/arc-diagram) | `highlightNode(selector, options?)` | The node's id |
| [Arc Diagram](/charts/arc-diagram) | `highlightLink(selector, options?)` | `{ source, target }` node ids |
| [Force-Directed](/charts/force-directed) | `highlightNode(selector, options?)` | The node's id |
| [Force-Directed](/charts/force-directed) | `highlightLink(selector, options?)` | `{ source, target }` node ids |

### Specialized

| Chart | Method | Selects |
| --- | --- | --- |
| [Heatmap](/charts/heatmap) | `highlightCell(selector, options?)` | `{ x, y }` axis labels, or one label for its whole row/column |
| [Gantt](/charts/gantt) | `highlightTask(selector, options?)` | The task's id |
| [Realtime](/charts/realtime) | — | Series only, via `highlightSeries(id)` |

`highlightSeries(id)` and `clearHighlight()` are on the `Chart` base class, so every chart in the table has them as well.

## Types

The selector and option types are exported from `@ripl/charts` for typing your own helpers around these calls:

<!-- eslint-skip -->
```ts
import type {
    BarChart,
    CellRef,
    HighlightOptions,
    LinkRef,
    MarkRef,
    MarkSelector,
} from '@ripl/charts';

// A key, a ref, or an accessor over the chart's data. The second parameter is the ref shape.
type MarkTarget = MarkSelector<MyDatum, MarkRef>; // { key, series? } — the default
type LinkTarget = MarkSelector<MyLink, LinkRef>;  // { source, target }
type CellTarget = MarkSelector<MyDatum, CellRef>; // { x, y }

function focus(chart: BarChart<MyDatum>, target: MarkTarget, options?: HighlightOptions) {
    return chart.highlightBar(target, options);
}
```

## Custom Charts

A chart you build yourself gets the same treatment by registering its marks as it renders them. See [Interaction](/charts/advanced/custom-charts#interaction) in Custom Charts for `registerMark` and the typed method to expose beside it.
