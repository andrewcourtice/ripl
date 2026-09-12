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
    RiplRect,
    RiplRenderer,
    RiplScene,
    RiplText,
    RiplTransition,
} from '@ripl/react';

const PADDING = 32;

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

    const plot = useMemo(() => ({
        x: PADDING,
        y: PADDING,
        width: Math.max(0, size.width - PADDING * 2),
        height: Math.max(0, size.height - PADDING * 2),
    }), [size]);

    const bars = useMemo(() => {
        if (plot.width <= 0) {
            return [];
        }

        const categories = data.map(datum => datum.month);
        const max = Math.max(...data.map(datum => datum.value));

        const categoryScale = scaleBand(categories, [plot.x, plot.x + plot.width], {
            innerPadding: 0.28,
            outerPadding: 0.14,
        });

        const valueScale = scaleContinuous([0, max], [plot.y + plot.height, plot.y], {
            padToTicks: 5,
        });

        const baseline = valueScale(0);

        return data.map(datum => ({
            key: datum.month,
            x: categoryScale(datum.month),
            width: categoryScale.bandwidth,
            y: valueScale(datum.value),
            height: baseline - valueScale(datum.value),
            fill: datum.month === (hovered ?? selected) ? '#ff006e' : '#3a86ff',
        }));
    }, [data, plot, hovered, selected]);

    const baseline = plot.y + plot.height;

    const enter = useMemo(() => animate
        ? (element, index, length) => ({
            duration: 700,
            delay: (index / length) * 400,
            ease: easeOutCubic,
            state: {
                y: baseline,
                height: 0,
            },
        })
        : undefined, [animate, baseline]);

    return (
        <RiplContext onReady={onReady} onResize={() => measure(context)}>
            <RiplScene>
                <RiplRenderer>
                    <RiplTransition
                        enter={enter}
                        update={animate ? { duration: 450, ease: easeOutCubic } : undefined}
                        leave={animate ? { duration: 300, state: { y: baseline, height: 0, opacity: 0 } } : undefined}
                    >
                        {bars.map(bar => (
                            <RiplRect
                                key={bar.key}
                                x={bar.x}
                                y={bar.y}
                                width={bar.width}
                                height={bar.height}
                                fill={bar.fill}
                                borderRadius={[4, 4, 0, 0]}
                                onClick={() => setSelected(current => (current === bar.key ? undefined : bar.key))}
                                onMouseenter={() => setHovered(bar.key)}
                                onMouseleave={() => setHovered(undefined)}
                            />
                        ))}
                    </RiplTransition>

                    <RiplTransition
                        enter={animate ? { duration: 400, state: { opacity: 0 } } : undefined}
                        update={animate ? { duration: 450 } : undefined}
                        leave={animate ? { duration: 200, state: { opacity: 0 } } : undefined}
                    >
                        {bars.map(bar => (
                            <RiplText
                                key={bar.key}
                                x={bar.x + bar.width / 2}
                                y={bar.y - 8}
                                content={bar.key}
                                textAlign="center"
                                fill="#8b949e"
                            />
                        ))}
                    </RiplTransition>
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

Measure on `onReady` as well as on `onResize`. React commits the host element before the context is built against it, so the surface can already have its size by the time you hear about it, and the resize that would have announced one never fires.

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

Guard the plot on `plot.width > 0` all the same: a surface laid out later, or one inside a collapsed container, genuinely has no size yet, and the first real measurement then arrives with the first resize.

### Transitions

Bars grow out of the baseline, which is the enter phase's `state`: the state an element animates *from*.

```ts
const enter = (element, index, length) => ({
    duration: 700,
    delay: (index / length) * 400,
    ease: easeOutCubic,
    state: {
        y: baseline,
        height: 0,
    },
});
```

Expressing the phase as a factory produces the staggered sweep. Each element gets its index and the total, so the delay fans out across the set. Leaving reverses it, collapsing the bars back to the baseline and fading them before they are destroyed.

Memoise the phases against `baseline` so they stay current after a resize. They are also plain props, so an **Animate** toggle switches them off by passing `undefined`, after which unanimated changes apply instantly.

The labels sit in their own `<RiplTransition>` fading on `{ opacity: 0 }`. A scope applies its phases to every descendant, and `height` means nothing to a [text component](/docs/react/essentials/components), so the labels need a phase of their own.

See [Transitions](/docs/react/essentials/transitions) for the full phase API.

### Interaction

Selection and hover are ordinary listener props on the rect:

```tsx
<RiplRect
    key={bar.key}
    fill={bar.fill}
    onClick={() => toggle(bar.key)}
    onMouseenter={() => setHovered(bar.key)}
    onMouseleave={() => setHovered(undefined)}
/>
```

Both feed back into `bar.fill`, so the highlight is the same prop the rest of the chart uses rather than a separate code path, and it tweens through the `update` phase without any extra work. Inline arrows are fine here: the subscription is keyed on which events are bound, not on handler identity.

Only the events you bind are subscribed, which matters: binding a pointer listener is what makes an element a hit-test target. The text labels bind nothing, so they never steal a click from the bar behind them. See [Events](/docs/react/essentials/events) for the full list and their payloads.
