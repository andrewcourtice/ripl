---
outline: "deep"
---

# Custom Charts

Every built-in chart is a thin class over the same public machinery: the `Chart` base class (scene, renderer, animation, colors, title/legend layout), a layout pass that carves the drawable area into bands, and a data join that reconciles elements against new data so entries, updates, and exits each animate correctly. All of it is exported from `@ripl/charts`, so you can build your own chart type the same way.

This page walks through the pattern. The built-in pie chart (`packages/charts/src/charts/pie.ts`) is a compact real-world exemplar of everything described here.

> [!NOTE]
> Charts that need x/y axes, a grid, and a crosshair should extend `CartesianChart` instead, which wires those components up from the shared options. The lifecycle below is identical.

## Anatomy

A chart is a class extending `Chart<TOptions, TEventMap>` plus a `createXChart` factory. Consumers always use the factory, never `new`:

```ts
import type {
    BaseChartOptions,
} from '@ripl/charts';

import {
    Chart,
} from '@ripl/charts';

import type {
    Context,
} from '@ripl/core';

export interface LollipopChartOptions<TData = unknown> extends BaseChartOptions {
    data: TData[];
    key: keyof TData | ((item: TData) => string);
    value: keyof TData | ((item: TData) => number);
    label: keyof TData | ((item: TData) => string);
}

export class LollipopChart<TData = unknown> extends Chart<LollipopChartOptions<TData>> {

    constructor(target: string | HTMLElement | Context, options: LollipopChartOptions<TData>) {
        super(target, options);

        // Set up components here (tooltips, hover state, ...).

        this.init(); // MUST be called last; it triggers the first render
    }

}

export function createLollipopChart<TData = unknown>(target: string | HTMLElement | Context, options: LollipopChartOptions<TData>) {
    return new LollipopChart<TData>(target, options);
}
```

Extending `BaseChartOptions` gives your chart `padding`, `title`, `animation`, `theme`, `description`, and `autoRender` for free; the base class normalizes and applies them. The base class also builds the `scene` and `renderer` from the target (selector, element, or any `Context`), and provides `update(options)` (merge + re-render) and `destroy()` without further work.

## The Layout Pass

Start every render by creating a `ChartLayout`, a shrinking rectangle model of the drawable canvas. Components reserve bands from its edges in order (first reserved sits outermost), and whatever remains is your plot area:

<!-- eslint-skip -->
```ts
public async render() {
    return super.render(async (scene, renderer) => {
        const layout = this.createLayout();     // canvas size minus padding

        this.reserveTitle(layout);              // reserves a top band if a title is configured
        this.reserveLegend(layout, legendItems, this.options.legend);

        const area = layout.area;               // { x, y, width, height }, the plot rect
        // ...draw into `area`
    });
}
```

`reserveTitle` and `reserveLegend` measure and render the shared title/legend components into the bands they reserve; you only supply the legend items (`{ id, label, color, active }`). For custom bands (an axis gutter, a toolbar strip), call `layout.reserve(side, thickness)` / `reserveTop` / `reserveBottom` / `reserveLeft` / `reserveRight` yourself. Radial charts can convert the remaining area to a center point and inscribed size with `areaCenter(area)`.

Wrapping the body in `super.render(async () => { ... })` matters: it catches errors (clearing the context rather than leaving a half-drawn chart) and marks the chart as rendered so context resizes trigger re-renders.

## Scales

Map data to pixels with the scale library from `@ripl/core`, the same scales the built-in charts use:

```ts
import {
    scaleBand,
    scaleContinuous,
} from '@ripl/core';

const xScale = scaleBand(keys, [area.x, area.x + area.width], {
    innerPadding: 0.2,
});

const yScale = scaleContinuous([0, maxValue], [area.y + area.height, area.y]);
```

Accessor options (`key`, `value`, `label`) should accept a field name or a function; normalize them once per render with `resolveAccessor`:

```ts
import {
    resolveAccessor,
} from '@ripl/charts';

const getKey = resolveAccessor<TData, string>(this.options.key);
const getValue = resolveAccessor<TData, number>(this.options.value);
```

## Colors

Register series/segments with the shared color map once per render, then look colors up per id. This respects explicit per-series colors, the theme palette, and keeps colors stable across updates:

```ts
this.resolveSeriesColors(data.map(item => ({
    id: getKey(item),
})));

const color = this.getSeriesColor(getKey(item));
```

## The Data Join

The heart of the render pipeline is diffing new data against the elements from the previous render with `arrayJoin` from `@ripl/utilities`. Persist your element groups on the instance between renders:

<!-- eslint-skip -->
```ts
import {
    arrayJoin,
} from '@ripl/utilities';

private _groups: Group[] = [];

// inside render():
const {
    left: entries,    // new data with no matching element: create at their start state
    inner: updates,   // [datum, element] pairs: transition to the new state
    right: exits,     // elements with no matching datum: animate out, then destroy
} = arrayJoin(calculations, this._groups, (item, group) => item.key === group.id);
```

The three arms drive three different animations:

- **Entries** are created at their *start* state (e.g. `radius: 0`, `opacity: 0`) with the *target* state stashed on `element.data`, then transitioned toward it.
- **Updates** get their new target stashed on `element.data` and tween from wherever they currently are. Non-tweenable properties (`stroke`, `lineDash`, `lineCap`, text `content`) must be set directly on the element, not put in the transition state.
- **Exits** are transitioned to a collapse state (zero radius, zero opacity) and destroyed when the transition completes.

Persist the survivors back for the next render:

```ts
this._groups = [
    ...entryGroups,
    ...updates.map(([, group]) => group),
];
```

Group each datum's elements (its mark, label, connector) under one `Group` keyed by the datum's id. That keeps the join one-level and lets a whole segment enter/exit as a unit.

## Transitions

Resolve durations and easing through the chart's animation options so `animation: false` and custom durations are honored, then drive the elements to their stashed targets via `renderer.transition`:

<!-- eslint-skip -->
```ts
import {
    ANIMATION_REFERENCE,
    stagger,
} from '@ripl/charts';

const enter = this.resolveAnimation(ANIMATION_REFERENCE.enter);
const update = this.resolveAnimation(ANIMATION_REFERENCE.update);
const exit = this.resolveAnimation(ANIMATION_REFERENCE.exit);

return Promise.all([
    renderer.transition(entryMarks, (element, index, length) => ({
        duration: enter.duration,
        ease: enter.ease,
        delay: stagger(index, length, enter.duration), // sequence the entry
        state: element.data as Partial<CircleState>,
    })),
    renderer.transition(updateMarks, element => ({
        duration: update.duration,
        ease: update.ease,
        state: element.data as Partial<CircleState>,
    })),
    exitTransition(),
]);
```

`ANIMATION_REFERENCE` provides the reference durations for `enter`, `update`, `exit`, `hover`, and `axis` phases; `resolveAnimation` scales them by the consumer's `animation.duration` and returns `{ duration, ease, enabled }`. `stagger(index, length, duration)` spreads per-element delays across the entry.

Return the combined transition promise from the render callback so that `render()` resolves when the chart has settled. That is what makes deterministic exports and tests possible.

## Interaction

`applyHoverHighlight` wires hover state, tooltip display, and click events onto an element in one call:

```ts
import {
    ANIMATION_REFERENCE,
    applyHoverHighlight,
} from '@ripl/charts';

applyHoverHighlight(mark, {
    renderer: this.renderer,
    animation: () => this.resolveAnimation(ANIMATION_REFERENCE.hover),
    highlight: { fill: color },
    restore: { fill: restColor },
    onEnter: point => this.emit('markenter', payload(point)),
    onLeave: point => this.emit('markleave', payload(point)),
    onClick: point => this.emit('markclick', payload(point)),
});
```

Highlight the property that actually carries the color: `fill` for filled shapes, `stroke` for stroked ones. Type your chart's events by passing an `EventMap` as the second generic parameter of `Chart`, and emit them from the interaction callbacks so consumers can subscribe via `chart.on('markclick', ...)`.

For legend-driven highlighting (hovering a legend item dims the other series), register your groups each render:

```ts
this.registerHighlightGroups(this._groups);
```

## Checklist

- Factory function exported; consumers never call `new`.
- `this.init()` is the **last** statement in the constructor; it triggers the first render.
- Every render: layout pass first (`createLayout` → `reserveTitle` → `reserveLegend`), then scales, then the join.
- Entries start at their entry state; targets stashed on `element.data`; exits destroyed after their transition.
- All durations resolved via `resolveAnimation(ANIMATION_REFERENCE.x)`; never hardcode.
- Options interface extends `BaseChartOptions` and every public option carries a JSDoc comment.
