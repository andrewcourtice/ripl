---
outline: "deep"
---

# Theming

Every chart resolves a **theme** — the series palette plus the "furniture" colors (text, axes, grid, crosshair, legend, tooltip) it draws with. Themes come from the `theme` chart option, falling back to a module-level default, so restyling a single chart, or every chart in an app, is one line.

> [!NOTE]
> For the full API, see `Theme` in the [Charts API Reference](/docs/api/@ripl/charts/).

## Built-in Themes

Three themes ship with `@ripl/charts`, registered under these names:

| Name | Export | Description |
| --- | --- | --- |
| `'light'` | `lightTheme` | The default. Its colors match Ripl's historical defaults. |
| `'dark'` | `darkTheme` | Palette and furniture tuned for a dark canvas background. |
| `'colorblind'` | `colorBlindTheme` | The Okabe–Ito qualitative palette and a CVD-friendly sequential scale. |

Plus the special name `'auto'`, which resolves to `'dark'` or `'light'` by following the OS `prefers-color-scheme` media query.

## Per-Chart Theme

Pass a registered name (or a `Theme` object) as the `theme` option:

```ts
import {
    createLineChart,
} from '@ripl/charts';

createLineChart('#container', {
    data,
    key: 'month',
    series,
    theme: 'dark',
});
```

The theme drives the defaults for the series palette, axis labels, grid lines, crosshair, legend text, and tooltip colors. Options you set explicitly (say, `grid: { lineColor: '#333' }`) always win over the theme.

## Global Default

`setDefaultTheme` sets the module-level default applied to every chart that doesn't specify its own `theme`:

```ts
import {
    setDefaultTheme,
} from '@ripl/charts';

setDefaultTheme('dark');
```

Charts created after the call pick up the new default; pair it with a re-render (or recreation) of existing charts when the user flips your app's theme toggle. `getDefaultTheme()` returns the currently active default.

## Custom Themes

A `Theme` is a plain object:

| Property | Description |
| --- | --- |
| `palette` | Categorical series/segment colors, cycled for unassigned series |
| `sequentialScheme` | Two-or-more color stops (low → high) for sequential color scales (e.g. heatmap) |
| `font` | Base CSS font shorthand for chart text |
| `textColor` | Titles, data labels, and segment labels |
| `axisColor` | Axis tick labels |
| `gridColor` | Grid lines |
| `crosshairColor` | Crosshair lines |
| `legendColor` | Legend labels |
| `tooltipBackground` / `tooltipColor` | Tooltip background and text |

Spread a built-in theme and override what you need:

```ts
import type {
    Theme,
} from '@ripl/charts';

import {
    lightTheme,
} from '@ripl/charts';

const brandTheme: Theme = {
    ...lightTheme,
    palette: [
        '#0e7490',
        '#7c3aed',
        '#db2777',
        '#ea580c',
        '#65a30d',
    ],
    sequentialScheme: ['#ecfeff', '#0e7490'],
};
```

Use it directly as the `theme` option, or register it under a name so it can be selected by string anywhere (including as the global default):

```ts
import {
    registerTheme,
    setDefaultTheme,
} from '@ripl/charts';

registerTheme('brand', brandTheme);

setDefaultTheme('brand');
```

An unknown theme name falls back to the current default rather than throwing.

## The Palette and Series Colors

Series and segment colors resolve in this order:

1. An explicit color on the series/segment (e.g. a series `color` option or a `colorBy` accessor) always wins.
2. Otherwise the chart draws the next color from the theme's `palette`, cycling when there are more series than palette entries.

Color assignments are sticky for the lifetime of a chart — a series keeps its palette color across data updates, so colors never shuffle when data enters or leaves.

## Accessibility

The `'colorblind'` theme uses the Okabe–Ito palette, a widely used set of eight colors distinguishable under the common forms of color-vision deficiency:

```ts
createBarChart('#container', {
    data,
    key: 'category',
    series,
    theme: 'colorblind',
    description: 'Quarterly revenue by region',
});
```

Color alone is still the weakest channel — pair the theme with data labels or direct labeling where accuracy matters, and set `description` so screen readers announce the chart meaningfully.
