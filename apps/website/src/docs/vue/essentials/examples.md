---
title: Examples
description: "Complete scenes built from the Vue components: a live, interactive bar chart with staggered enter transitions, animated updates, and click and hover events."
---

# Examples

Complete scenes assembled from the components in this section.

## Bar chart

This chart is built entirely from the built-in components, with no `@ripl/charts` and no imperative `createScene` or `createRenderer`. Scales come from `@ripl/core`, and the rest is template. For a bar chart that already has axes, legends and tooltips, reach for [`<ripl-bar-chart>`](/docs/vue/charts/) instead.

Click a bar to select it, hover to highlight, and use the controls to drive the enter, update and leave transitions.

:::tabs
== Demo
<example-vue-bar-chart />
== Code
```vue
<template>
    <ripl-context @ready="onReady" @resize="syncSize">
        <ripl-scene>
            <ripl-renderer>
                <template v-if="layout">
                    <ripl-transition :update="axisPhase">
                        <ripl-line
                            v-for="tick in layout.ticks"
                            :key="`grid-${tick.value}`"
                            :x1="layout.plot.x"
                            :y1="tick.y"
                            :x2="layout.plot.x + layout.plot.width"
                            :y2="tick.y"
                            :stroke="tick.value === 0 ? AXIS_COLOR : GRID_COLOR"
                            :line-width="1"
                        />
                        <ripl-text
                            v-for="tick in layout.ticks"
                            :key="`axis-${tick.value}`"
                            :x="layout.plot.x - 8"
                            :y="tick.y"
                            :content="tick.label"
                            :fill="TEXT_COLOR"
                            text-align="right"
                            text-baseline="middle"
                        />
                    </ripl-transition>

                    <ripl-transition
                        :enter="barEnter"
                        :update="barUpdate"
                        :leave="barLeave"
                    >
                        <ripl-rect
                            v-for="bar in layout.bars"
                            :key="bar.key"
                            :x="bar.x"
                            :y="bar.y"
                            :width="bar.width"
                            :height="bar.height"
                            :fill="fillFor(bar.key)"
                            :border-radius="[4, 4, 0, 0]"
                            @click="toggle(bar.key)"
                            @mouseenter="hovered = bar.key"
                            @mouseleave="hovered = undefined"
                        />
                    </ripl-transition>

                    <ripl-transition
                        :enter="labelEnter"
                        :update="barUpdate"
                        :leave="labelLeave"
                    >
                        <ripl-text
                            v-for="bar in layout.bars"
                            :key="`value-${bar.key}`"
                            :x="bar.x + bar.width / 2"
                            :y="bar.y - 8"
                            :content="bar.valueLabel"
                            :fill="TEXT_COLOR"
                            text-align="center"
                            text-baseline="bottom"
                        />
                        <ripl-text
                            v-for="bar in layout.bars"
                            :key="`month-${bar.key}`"
                            :x="bar.x + bar.width / 2"
                            :y="layout.plot.y + layout.plot.height + 10"
                            :content="bar.key"
                            :fill="TEXT_COLOR"
                            text-align="center"
                            text-baseline="top"
                        />
                    </ripl-transition>
                </template>
            </ripl-renderer>
        </ripl-scene>
    </ripl-context>
</template>

<script lang="ts" setup>
import {
    computed,
    reactive,
    ref,
    shallowRef,
} from 'vue';

import {
    easeOutCubic,
    scaleBand,
    scaleContinuous,
} from '@ripl/web';

import type {
    Context,
} from '@ripl/web';

const MARGIN = {
    top: 28,
    right: 16,
    bottom: 34,
    left: 44,
};
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

const data = ref([
    {
        month: 'Jan',
        value: 8200,
    },
    {
        month: 'Feb',
        value: 14000,
    },
]);

const context = shallowRef<Context>();
const hovered = ref<string>();
const selected = ref<string>();

const size = reactive({
    width: 0,
    height: 0,
});

function syncSize() {
    size.width = context.value?.width ?? 0;
    size.height = context.value?.height ?? 0;
}

function onReady(value: Context) {
    context.value = value;
    syncSize();
}

const layout = computed(() => {
    const plot = {
        x: MARGIN.left,
        y: MARGIN.top,
        width: Math.max(0, size.width - MARGIN.left - MARGIN.right),
        height: Math.max(0, size.height - MARGIN.top - MARGIN.bottom),
    };

    if (plot.width <= 0 || plot.height <= 0) {
        return undefined;
    }

    const valueScale = scaleContinuous(
        [0, Math.max(...data.value.map(item => item.value))],
        [plot.y + plot.height, plot.y],
        { padToTicks: TICK_COUNT }
    );

    const categoryScale = scaleBand(
        data.value.map(item => item.month),
        [plot.x, plot.x + plot.width],
        {
            innerPadding: 0.28,
            outerPadding: 0.14,
        }
    );

    const baseline = valueScale(0);

    return {
        plot,
        baseline,
        ticks: valueScale.ticks(TICK_COUNT).map(value => ({
            value,
            y: valueScale(value),
            label: currency.format(value),
        })),
        bars: data.value.map(item => ({
            key: item.month,
            x: categoryScale(item.month),
            width: categoryScale.bandwidth,
            y: valueScale(item.value),
            height: Math.max(0, baseline - valueScale(item.value)),
            valueLabel: currency.format(item.value),
        })),
    };
});

const baseline = computed(() => layout.value?.baseline ?? 0);

function fillFor(month: string) {
    if (month === selected.value) {
        return SELECTED_COLOR;
    }

    return month === hovered.value ? HOVER_COLOR : BAR_COLOR;
}

const barEnter = computed(() => (element, index, length) => ({
    duration: 1000,
    delay: (index / length) * 1000,
    ease: easeOutCubic,
    state: {
        y: baseline.value,
        height: 0,
    },
}));

const barUpdate = {
    duration: 1000,
    ease: easeOutCubic,
};

const barLeave = computed(() => ({
    duration: 450,
    ease: easeOutCubic,
    state: {
        y: baseline.value,
        height: 0,
        opacity: 0,
    },
}));

const labelEnter = {
    duration: 1000,
    ease: easeOutCubic,
    state: {
        opacity: 0,
    },
};

const labelLeave = {
    duration: 450,
    ease: easeOutCubic,
    state: {
        opacity: 0,
    },
};

const axisPhase = {
    duration: 500,
    ease: easeOutCubic,
};

function toggle(month: string) {
    selected.value = selected.value === month ? undefined : month;
}
</script>
```
:::

### Layout and scales

The chart needs its own size, and `<ripl-context>` has none of its own: it fills whatever element you give it. Capture the context from `@ready` and re-read its dimensions on `@resize`. The resize event carries no payload, so you need the context itself:

```ts
function syncSize() {
    size.width = context.value?.width ?? 0;
    size.height = context.value?.height ?? 0;
}
```

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

Deriving the whole layout in a `computed` and iterating it with one `v-for` per visual layer keeps the geometry out of the template. Note `bandwidth` is a property, not a method.

Guard the plot on `plot.width > 0`. The surface genuinely has no size until its host element lands in the document, and the first real measurement arrives with the first resize.

### Transitions

Bars grow out of the baseline, which is the enter phase's `state`: the state an element animates *from*.

```ts
const barEnter = computed(() => (element, index, length) => ({
    duration: 1000,
    delay: (index / length) * 1000,
    ease: easeOutCubic,
    state: {
        y: baseline.value,
        height: 0,
    },
}));
```

Expressing the phase as a factory produces the staggered sweep. Each element gets its index and the total, so the delay fans out across the set. Leaving reverses it, collapsing the bars back to the baseline and fading them before they are destroyed.

The phases are `computed` so `baseline` stays current after a resize. They are also plain reactive props, so the **Animate** toggle switches them off by binding `undefined`, after which unanimated changes apply instantly.

The value and category labels sit in their own `<ripl-transition>` fading on `{ opacity: 0 }`. A scope applies its phases to every descendant, and `height` means nothing to a [text component](/docs/vue/essentials/components), so the labels need a phase of their own. The gridlines get a third scope with only an `update` phase, so a tick that survives a domain change slides rather than jumping.

See [Transitions](/docs/vue/essentials/transitions) for the full phase API.

### Interaction

Selection and hover are ordinary Vue listeners on the rect:

```vue
<template>
    <ripl-rect
        v-for="bar in layout.bars"
        :key="bar.key"
        :fill="fillFor(bar.key)"
        @click="toggle(bar.key)"
        @mouseenter="hovered = bar.key"
        @mouseleave="hovered = undefined"
    />
</template>
```

Both feed back into the bar's `fill`, so the highlight tweens through the `update` phase like any other change.

Only the events you bind are subscribed, which matters here: binding a pointer listener is what makes an element a hit-test target. The text labels bind nothing, so they never steal a click from the bar behind them. See [Events](/docs/vue/essentials/events) for the full list and their payloads.
