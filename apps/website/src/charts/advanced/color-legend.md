---
outline: "deep"
---

# Color Legend

`ColorLegend` is a continuous color legend: a gradient bar annotated with formatted value labels, driven by a `ColorScale` from `@ripl/core`. It shows readers how a chart maps numeric values to colors, and complements the item-based [`legend` option](/charts/shared-options) that series charts use for discrete series. The gradient is approximated by solid segments, so the legend renders identically on Canvas and SVG.

> [!NOTE]
> For the full API, see `ColorLegend` in the [Charts API Reference](/docs/api/@ripl/charts/).

## Built-in Usage

The [heatmap chart](/charts/heatmap) shows a color legend by default. Pass `legend: false` to hide it, or a `ColorLegendOptions` object to customize it:

```ts
import {
    createHeatmapChart,
} from '@ripl/charts';

const chart = createHeatmapChart('#container', {
    data,
    keyX: 'hour',
    keyY: 'day',
    value: 'value',
    xCategories: hours,
    yCategories: days,
    legend: {
        orientation: 'horizontal',
        thickness: 12,
        segments: 32,
    },
});
```

The heatmap wires everything up for you: it builds the color scale from the data extent, applies the chart's `format` option to the legend labels, reserves a band at the bottom of the layout, and re-renders the legend on every update. The [heatmap demo](/charts/heatmap) exposes the legend options interactively.

## Standalone Usage

The component is exported from `@ripl/charts` for use outside the built-in charts. Create it with a scene, a renderer, and a color scale, then render it into a region of your choosing:

```ts
import {
    createColorLegend,
} from '@ripl/charts';

import {
    COLOR_SCHEME_VIRIDIS,
    createRenderer,
    createScene,
    scaleSequential,
} from '@ripl/web';

const scene = createScene('.mount-element');
const renderer = createRenderer(scene);

const legend = createColorLegend({
    scene,
    renderer,
    scale: scaleSequential(COLOR_SCHEME_VIRIDIS, [0, 100]),
    options: {
        orientation: 'horizontal',
        tickCount: 5,
    },
});

legend.render({
    x: 24,
    y: 24,
    width: 320,
    height: legend.measure(),
});
```

The region is a plain rectangle (`{ x, y, width, height }`). Along its main axis the bar fills the region (the width when horizontal, the height when vertical); across it, `measure()` reports the thickness the legend needs: the padding inset plus the bar, the label gap, and the label allowance.

## In a Custom Chart

When building a [custom chart](/charts/advanced/custom-charts), reserve a band from the layout with `measure()` and render the legend into it. Keep the instance on the chart between renders and refresh it with `setScale` and `setOptions`:

<!-- eslint-skip -->
```ts
public async render() {
    return super.render(async () => {
        const colorScale = scaleSequential(COLOR_SCHEME_VIRIDIS, [min, max]);

        const layout = this.createLayout();
        this.reserveTitle(layout);

        if (this.legend) {
            this.legend.setScale(colorScale);
        } else {
            this.legend = createColorLegend({
                scene: this.scene,
                renderer: this.renderer,
                scale: colorScale,
            });
        }

        const region = layout.reserveBottom(this.legend.measure());

        // ...draw the chart into layout.area, then:
        this.legend.render(region);
    });
}
```

`render(region)` clears and redraws the legend's elements each time it is called, so re-rendering after a scale or options change is all that is needed. Call `destroy()` to remove the legend's elements from the scene when the chart is torn down.

## Options

All options are optional and merge over the defaults:

| Property | Type | Default | Description |
| --- | --- | --- | --- |
| `orientation` | `'horizontal' \| 'vertical'` | `'horizontal'` | Whether the color bar runs horizontally or vertically |
| `thickness` | `number` | `12` | Bar thickness in pixels (height when horizontal, width when vertical) |
| `segments` | `number` | `32` | Number of solid segments used to approximate the gradient |
| `tickCount` | `number` | `5` | Approximate number of value labels (tick generation snaps to round values) |
| `format` | `(value: number) => string` | number format, 2 dp | Formats a domain value into a label |
| `font` | `string` | `'12px sans-serif'` | CSS font shorthand for the value labels |
| `fontColor` | `string` | `'#333333'` | Color of the value labels |
| `labelGap` | `number` | `4` | Gap between the bar and its labels, in pixels |
| `padding` | `number` | `8` | Inset between the reserved band's leading edge and the bar, so the legend doesn't sit flush against the adjacent axis |

Lowering `segments` produces a visibly stepped ramp, which reads well when the underlying data is binned; raising it produces a smoother gradient.

## Orientation

- **Horizontal**: the bar spans the region's width with low values on the left and high values on the right. Labels sit below the bar, centered under their values.
- **Vertical**: the bar runs up the region with low values at the bottom and high values at the top. Labels sit to the right of the bar, vertically centered on their values.

## Color Scales

Any `ColorScale` works. Build one with `scaleSequential` from `@ripl/core`, passing either an array of color stops or one of the built-in `COLOR_SCHEME_*` palettes (Viridis, Plasma, Inferno, and others):

```ts
import {
    COLOR_SCHEME_PLASMA,
    scaleSequential,
} from '@ripl/core';

// Sequential: [min, max]
const sequential = scaleSequential(['#e0f2fe', '#0369a1'], [0, 100]);

// Diverging: [min, neutral, max] maps the neutral value to the palette midpoint
const diverging = scaleSequential(COLOR_SCHEME_PLASMA, [-50, 0, 50]);
```

The legend samples the scale evenly across its domain to paint the segments and calls `scale.ticks(tickCount)` to place the labels, so both always agree with the colors the chart itself draws.

## Behavior Notes

- **Context-independent rendering**: because the gradient is built from solid rectangles rather than a native gradient, the legend looks the same on Canvas and SVG and survives export.
- **Formatting is explicit**: the scale maps values to colors and nothing else; label formatting is supplied through the `format` option, keeping the scale and the formatter decoupled.
- **Draws above chart content**: the legend renders into its own group with a high z-index, so it is never hidden behind series elements.
