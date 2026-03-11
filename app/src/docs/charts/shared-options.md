---
outline: "deep"
---

# Shared Options

All Ripl charts extend `BaseChartOptions` and support a common set of feature options for axes, grids, legends, tooltips, crosshairs, and animation. Each option follows the same pattern: pass `true`/`false` to toggle with defaults, or pass a partial options object to customise.

> [!NOTE]
> For the full API, see the [Chart Base & Options API Reference](/docs/api/@ripl/charts/).

## Padding

Controls the inner padding around the chart drawing area.

```ts
const chart = createBarChart('#container', {
    padding: {
        top: 30,
        right: 20,
        bottom: 40,
        left: 50,
    },
    // ...
});
```

| Property | Type | Default |
| --- | --- | --- |
| `top` | `number` | `10` |
| `right` | `number` | `10` |
| `bottom` | `number` | `10` |
| `left` | `number` | `10` |

## Animation

Controls entry, update, and exit animations. Pass `false` to disable all animation, or customise duration and easing.

```ts
// Disable animation
chart.update({ animation: false });

// Custom duration and easing
chart.update({
    animation: {
        duration: 500,
        ease: 'easeOutQuart',
    },
});
```

| Property | Type | Default | Description |
| --- | --- | --- | --- |
| `enabled` | `boolean` | `true` | Toggle animations on/off |
| `duration` | `number` | `1000` | Base duration in milliseconds |
| `ease` | `string \| Ease` | `'easeOutCubic'` | Easing function name or function |

The `duration` acts as a base value — individual chart animations scale relative to it. Setting `duration: 500` makes all animations twice as fast.

## Title

Display a title above the chart area. Pass a string for simple text, or an options object for customisation.

```ts
// Simple string
createBarChart('#container', {
    title: 'Monthly Revenue',
    // ...
});

// Custom options
createBarChart('#container', {
    title: {
        text: 'Monthly Revenue',
        font: 'bold 16px sans-serif',
        fontColor: '#333',
        padding: 12,
    },
    // ...
});
```

## Axis

Configure the x and y axes. Pass `false` to hide all axes, or configure each axis individually.

```ts
createLineChart('#container', {
    axis: {
        x: {
            visible: true,
            title: 'Month',
            font: '12px sans-serif',
            fontColor: '#666',
            format: 'string',
        },
        y: {
            visible: true,
            title: 'Revenue ($)',
            position: 'left',
            format: 'number',
        },
    },
    // ...
});
```

### X-Axis Options

| Property | Type | Default | Description |
| --- | --- | --- | --- |
| `visible` | `boolean` | `true` | Show/hide the axis |
| `font` | `string` | `'12px sans-serif'` | Label font |
| `fontColor` | `string` | `'#777777'` | Label color |
| `title` | `string` | — | Axis title text |
| `value` | `keyof TData \| (item: TData) => any` | — | Custom value accessor |
| `format` | `'number' \| 'percentage' \| 'date' \| 'string' \| (value) => string` | — | Label formatter |

### Y-Axis Options

Extends x-axis options with:

| Property | Type | Default | Description |
| --- | --- | --- | --- |
| `position` | `'left' \| 'right'` | `'left'` | Axis position |

Multiple y-axes are supported by passing an array:

```ts
axis: {
    y: [
        { position: 'left', title: 'Revenue', format: 'number' },
        { position: 'right', title: 'Growth %', format: 'percentage' },
    ],
}
```

### Format Types

| Format | Description | Example |
| --- | --- | --- |
| `'number'` | Locale-formatted number | `1,234` |
| `'percentage'` | Decimal to percentage | `0.5` → `50.0%` |
| `'date'` | Date to locale string | `Jan 1, 2024` |
| `'string'` | String conversion | `toString()` |
| `(value) => string` | Custom formatter | `v => '$' + v` |

## Grid

Background grid lines drawn behind the chart data.

```ts
// Toggle
createBarChart('#container', { grid: true });

// Custom
createBarChart('#container', {
    grid: {
        visible: true,
        lineColor: '#f0f0f0',
        lineWidth: 1,
        lineDash: [2, 2],
    },
});
```

| Property | Type | Default | Description |
| --- | --- | --- | --- |
| `visible` | `boolean` | `true` | Show/hide grid |
| `lineColor` | `string` | `'#e5e7eb'` | Grid line color |
| `lineWidth` | `number` | `1` | Grid line width |
| `lineDash` | `number[]` | `[4, 4]` | Dash pattern |

## Tooltip

Hover tooltips displaying data values.

```ts
// Toggle
createBarChart('#container', { tooltip: false });

// Custom
createBarChart('#container', {
    tooltip: {
        visible: true,
        font: '13px monospace',
        fontColor: '#fff',
        backgroundColor: '#333',
        borderRadius: 8,
        padding: 12,
        maxWidth: 250,
        wrap: true,
    },
});
```

| Property | Type | Default | Description |
| --- | --- | --- | --- |
| `visible` | `boolean` | `true` | Show/hide tooltips |
| `padding` | `number \| Partial<Padding>` | `8` | Inner padding |
| `font` | `string` | `'12px sans-serif'` | Text font |
| `fontColor` | `string` | `'#FFFFFF'` | Text color |
| `backgroundColor` | `string` | `'#1a1a1a'` | Background color |
| `borderRadius` | `number \| [tl, tr, br, bl]` | `6` | Corner radius |
| `maxWidth` | `number` | `200` | Maximum width |
| `wrap` | `boolean` | `false` | Wrap long text |

## Legend

Series legend with interactive highlighting.

```ts
// Toggle
createLineChart('#container', { legend: true });

// Position shorthand
createLineChart('#container', { legend: 'bottom' });

// Custom
createLineChart('#container', {
    legend: {
        visible: true,
        position: 'top',
        padding: 16,
        font: '12px sans-serif',
        fontColor: '#333',
        highlight: true,
    },
});
```

| Property | Type | Default | Description |
| --- | --- | --- | --- |
| `visible` | `boolean` | `false` | Show/hide legend (hidden by default) |
| `position` | `'top' \| 'bottom' \| 'left' \| 'right'` | `'top'` | Legend position |
| `padding` | `number \| Partial<Padding>` | `16` | Outer padding |
| `font` | `string` | `'11px sans-serif'` | Label font |
| `fontColor` | `string` | `'#333333'` | Label color |
| `highlight` | `boolean` | `true` | Highlight series on hover |

## Crosshair

Tracking crosshair that follows the pointer.

```ts
// Toggle
createLineChart('#container', { crosshair: true });

// Custom
createLineChart('#container', {
    crosshair: {
        visible: true,
        axis: 'both',
        lineColor: '#666',
        lineWidth: 1,
    },
});
```

| Property | Type | Default | Description |
| --- | --- | --- | --- |
| `visible` | `boolean` | `true` | Show/hide crosshair |
| `axis` | `'x' \| 'y' \| 'both'` | `'x'` | Which axis to track |
| `lineColor` | `string` | `'#94a3b8'` | Line color |
| `lineWidth` | `number` | `1` | Line width |

## Input Shorthand

Every feature option accepts three input forms:

```ts
// 1. Boolean — toggle with defaults
{ grid: true }
{ tooltip: false }

// 2. String (legend only) — position shorthand
{ legend: 'bottom' }

// 3. Partial object — merge with defaults
{ grid: { lineColor: '#ccc', lineDash: [] } }
```

Internally, each input is normalized into a fully resolved options object using the defaults listed above. Unspecified properties always fall back to their defaults.
