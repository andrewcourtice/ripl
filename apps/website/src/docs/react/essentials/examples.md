---
title: Examples
description: "Complete scenes built from the React components: a live, interactive bar chart with staggered enter transitions, animated updates, and click and hover events."
---

# Examples

Complete scenes assembled from the components in this section.

## Bar chart

This chart is built entirely from the built-in components, with no `@ripl/charts` and no imperative `createScene` or `createRenderer`. Scales come from `@ripl/core`, and the rest is JSX. For a bar chart that already has axes, legends and tooltips, reach for [`<RiplBarChart>`](/docs/react/charts/) instead.

Click a bar to select it, hover to highlight, and use the controls to drive the enter, update and leave transitions.

:::tabs
== Demo
<example-react-bar-chart />
== Code
```tsx
import {
    useCallback,
    useMemo,
    useState,
} from 'react';

import {
    easeOutCubic,
    scaleBand,
    scaleContinuous,
} from '@ripl/web';

import type {
    Context,
} from '@ripl/web';

import {
    RiplContext,
    RiplLine,
    RiplRect,
    RiplRenderer,
    RiplScene,
    RiplText,
    RiplTransition,
} from '@ripl/react';

const MARGIN = { top: 28, right: 16, bottom: 34, left: 44 };
const TICK_COUNT = 5;

const BAR_COLOR = '#3a86ff';
const HOVER_COLOR = '#5c9cff';
const SELECTED_COLOR = '#ff006e';
const TEXT_COLOR = '#8b93a1';
const GRID_COLOR = 'rgba(140, 150, 165, 0.35)';
const AXIS_COLOR = 'rgba(140, 150, 165, 0.55)';

const currency = new Intl.NumberFormat(undefined, {
    style: 'currency',
    currency: 'USD',
    currencyDisplay: 'narrowSymbol',
    notation: 'compact',
    maximumFractionDigits: 1,
});

export function BarChart({ data, animate }) {
    const [context, setContext] = useState<Context>();
    const [size, setSize] = useState({ width: 0, height: 0 });
    const [selected, setSelected] = useState<string>();
    const [hovered, setHovered] = useState<string>();

    const measure = useCallback((value?: Context) => setSize({
        width: value?.width ?? 0,
        height: value?.height ?? 0,
    }), []);

    const onReady = useCallback((value: Context) => {
        setContext(value);
        measure(value);
    }, [measure]);

    const layout = useMemo(() => {
        const plot = {
            x: MARGIN.left,
            y: MARGIN.top,
            width: Math.max(0, size.width - MARGIN.left - MARGIN.right),
            height: Math.max(0, size.height - MARGIN.top - MARGIN.bottom),
        };

        if (plot.width <= 0 || plot.height <= 0) {
            return undefined;
        }

        const max = Math.max(...data.map(datum => datum.value));

        const valueScale = scaleContinuous([0, max], [plot.y + plot.height, plot.y], {
            padToTicks: TICK_COUNT,
        });

        const categoryScale = scaleBand(data.map(datum => datum.month), [plot.x, plot.x + plot.width], {
            innerPadding: 0.28,
            outerPadding: 0.14,
        });

        const baseline = valueScale(0);

        return {
            plot,
            baseline,
            ticks: valueScale.ticks(TICK_COUNT).map(value => ({
                value,
                y: valueScale(value),
                label: currency.format(value),
            })),
            bars: data.map(datum => ({
                key: datum.month,
                x: categoryScale(datum.month),
                width: categoryScale.bandwidth,
                y: valueScale(datum.value),
                height: Math.max(0, baseline - valueScale(datum.value)),
                valueLabel: currency.format(datum.value),
            })),
        };
    }, [data, size]);

    const phases = useMemo(() => {
        if (!animate || !layout) {
            return {};
        }

        return {
            barEnter: (element, index, length) => ({
                duration: 1000,
                delay: (index / length) * 1000,
                ease: easeOutCubic,
                state: { y: layout.baseline, height: 0 },
            }),
            barUpdate: { duration: 1000, ease: easeOutCubic },
            barLeave: {
                duration: 450,
                ease: easeOutCubic,
                state: { y: layout.baseline, height: 0, opacity: 0 },
            },
            labelEnter: { duration: 1000, ease: easeOutCubic, state: { opacity: 0 } },
            labelLeave: { duration: 450, ease: easeOutCubic, state: { opacity: 0 } },
            axis: { duration: 500, ease: easeOutCubic },
        };
    }, [animate, layout]);

    const fillFor = (month: string) => {
        if (month === selected) {
            return SELECTED_COLOR;
        }

        return month === hovered ? HOVER_COLOR : BAR_COLOR;
    };

    return (
        <RiplContext onReady={onReady} onResize={() => measure(context)}>
            <RiplScene>
                <RiplRenderer>
                    {layout && (
                        <>
                            <RiplTransition update={phases.axis}>
                                {layout.ticks.map(tick => (
                                    <RiplLine
                                        key={`grid:${tick.value}`}
                                        x1={layout.plot.x}
                                        x2={layout.plot.x + layout.plot.width}
                                        y1={tick.y}
                                        y2={tick.y}
                                        stroke={tick.value === 0 ? AXIS_COLOR : GRID_COLOR}
                                        lineWidth={1}
                                    />
                                ))}
                                {layout.ticks.map(tick => (
                                    <RiplText
                                        key={`tick:${tick.value}`}
                                        x={layout.plot.x - 8}
                                        y={tick.y}
                                        content={tick.label}
                                        textAlign="right"
                                        textBaseline="middle"
                                        fill={TEXT_COLOR}
                                    />
                                ))}
                            </RiplTransition>

                            <RiplTransition
                                enter={phases.barEnter}
                                update={phases.barUpdate}
                                leave={phases.barLeave}
                            >
                                {layout.bars.map(bar => (
                                    <RiplRect
                                        key={bar.key}
                                        x={bar.x}
                                        y={bar.y}
                                        width={bar.width}
                                        height={bar.height}
                                        fill={fillFor(bar.key)}
                                        borderRadius={[4, 4, 0, 0]}
                                        onClick={() => setSelected(current => (current === bar.key ? undefined : bar.key))}
                                        onMouseenter={() => setHovered(bar.key)}
                                        onMouseleave={() => setHovered(undefined)}
                                    />
                                ))}
                            </RiplTransition>

                            <RiplTransition
                                enter={phases.labelEnter}
                                update={phases.barUpdate}
                                leave={phases.labelLeave}
                            >
                                {layout.bars.map(bar => (
                                    <RiplText
                                        key={`value:${bar.key}`}
                                        x={bar.x + bar.width / 2}
                                        y={bar.y - 8}
                                        content={bar.valueLabel}
                                        textAlign="center"
                                        textBaseline="bottom"
                                        fill={TEXT_COLOR}
                                    />
                                ))}
                                {layout.bars.map(bar => (
                                    <RiplText
                                        key={`month:${bar.key}`}
                                        x={bar.x + bar.width / 2}
                                        y={layout.plot.y + layout.plot.height + 10}
                                        content={bar.key}
                                        textAlign="center"
                                        textBaseline="top"
                                        fill={TEXT_COLOR}
                                    />
                                ))}
                            </RiplTransition>
                        </>
                    )}
                </RiplRenderer>
            </RiplScene>
        </RiplContext>
    );
}
```
:::

### Layout and scales

The chart needs its own size, and `<RiplContext>` has none of its own: it fills whatever element you give it. Capture the context from `onReady` and re-read its dimensions on `onResize`. The resize event carries no payload, so you need the context itself:

```ts
const measure = useCallback((value?: Context) => setSize({
    width: value?.width ?? 0,
    height: value?.height ?? 0,
}), []);
```

Measure on `onReady` as well as on `onResize`, or a surface that is already sized when the chart mounts will never be measured at all.

Ripl's [scales](/docs/core/advanced/scales) do the rest. A band scale spaces the categories and reports a `bandwidth` for the bar width, and a continuous scale maps values to pixels:

```ts
const categoryScale = scaleBand(months, [plot.x, plot.x + plot.width], {
    innerPadding: 0.28,
    outerPadding: 0.14,
});

const valueScale = scaleContinuous([0, max], [plot.y + plot.height, plot.y], {
    padToTicks: 5,
});
```

The value scale's range runs **bottom to top**, because pixel `y` grows downward. That also puts `valueScale(0)` on the axis, which gives you the baseline with no special-casing. `padToTicks` expands the domain to a round tick boundary, so the gridlines land on sensible numbers.

Each bar is then four numbers:

```ts
const bar = {
    x: categoryScale(month),
    width: categoryScale.bandwidth,
    y: valueScale(value),
    height: baseline - valueScale(value),
};
```

Deriving the whole layout in a `useMemo` and mapping it once per visual layer keeps the geometry out of the markup. Note `bandwidth` is a property, not a method.

Guard on `plot.width > 0` all the same. A surface inside a collapsed container has no size until it is laid out, and its first real measurement arrives with the first resize.

### Transitions

Bars grow out of the baseline, which is the enter phase's `state`: the state an element animates *from*.

```ts
const enter = (element, index, length) => ({
    duration: 1000,
    delay: (index / length) * 1000,
    ease: easeOutCubic,
    state: {
        y: baseline,
        height: 0,
    },
});
```

Expressing the phase as a factory produces the staggered sweep. Each element gets its index and the total, so the delay fans out across the set. Leaving reverses it, collapsing the bars back to the baseline and fading them before they are destroyed.

Memoise the phases against the layout so they stay current after a resize. They are also plain props, so an **Animate** toggle switches them off by passing `undefined`, after which unanimated changes apply instantly.

The gridlines and the labels each sit in a scope of their own. A scope applies its phases to every descendant, and `height` means nothing to a [text component](/docs/react/essentials/components), so labels fade where bars grow.

See [Transitions](/docs/react/essentials/transitions) for the full phase API.

### Interaction

Selection and hover are ordinary listener props on the rect:

```tsx
<RiplRect
    key={bar.key}
    fill={fillFor(bar.key)}
    onClick={() => toggle(bar.key)}
    onMouseenter={() => setHovered(bar.key)}
    onMouseleave={() => setHovered(undefined)}
/>
```

Both feed back into the bar's `fill`, so the highlight tweens through the `update` phase like any other change. Inline arrows are fine here.

Only the events you bind are subscribed, and binding a pointer listener makes an element a hit-test target. The text labels bind nothing, so they never steal a click from the bar behind them. See [Events](/docs/react/essentials/events) for the full list and their payloads.
