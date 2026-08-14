---
title: Bar chart
description: "A live, interactive bar chart built from ripl-rect, ripl-text and ripl-line — with staggered enter transitions, animated updates, and click and hover events."
---

# Bar chart

Everything below is built from the built-in elements — no `@ripl/charts`, no imperative
`createScene` or `createRenderer`. Scales come from `@ripl/core`, and the rest is template.

That is the point of this page: it shows what the primitives can do. For a bar chart with axes,
legends and tooltips already built, reach for [`<ripl-bar-chart>`](/docs/vue/charts/) instead.

Click a bar to select it, hover to highlight, and use the controls to drive the enter, update and
leave transitions.

:::tabs
== Demo
<example-vue-bar-chart />
== Code
```vue
<template>
    <ripl-context @ready="onReady" @resize="syncSize">
        <ripl-scene>
            <ripl-renderer>
                <template v-if="plot.width > 0">
                    <ripl-transition
                        :enter="barEnter"
                        :update="barUpdate"
                        :leave="barLeave"
                    >
                        <ripl-rect
                            v-for="bar in bars"
                            :key="bar.key"
                            :x="bar.x"
                            :y="bar.y"
                            :width="bar.width"
                            :height="bar.height"
                            :fill="bar.fill"
                            :border-radius="[4, 4, 0, 0]"
                            @click="toggle(bar.key)"
                            @mouseenter="hovered = bar.key"
                            @mouseleave="hovered = undefined"
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

const data = ref([
    {
        month: 'Jan',
        value: 82,
    },
    {
        month: 'Feb',
        value: 140,
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

const plot = computed(() => ({
    x: 44,
    y: 28,
    width: Math.max(0, size.width - 60),
    height: Math.max(0, size.height - 62),
}));

const valueScale = computed(() => scaleContinuous(
    [0, Math.max(...data.value.map(item => item.value))],
    [plot.value.y + plot.value.height, plot.value.y],
    { padToTicks: 5 }
));

const categoryScale = computed(() => scaleBand(
    data.value.map(item => item.month),
    [plot.value.x, plot.value.x + plot.value.width],
    {
        innerPadding: 0.28,
        outerPadding: 0.14,
    }
));

const baseline = computed(() => valueScale.value(0));

const bars = computed(() => data.value.map(item => ({
    key: item.month,
    x: categoryScale.value(item.month),
    width: categoryScale.value.bandwidth,
    y: valueScale.value(item.value),
    height: baseline.value - valueScale.value(item.value),
    fill: item.month === selected.value ? '#ff006e' : '#3a86ff',
})));

const barEnter = computed(() => (element, index, length) => ({
    duration: 700,
    delay: (index / length) * 400,
    ease: easeOutCubic,
    state: {
        y: baseline.value,
        height: 0,
    },
}));

const barUpdate = {
    duration: 400,
    ease: easeOutCubic,
};

const barLeave = computed(() => ({
    duration: 300,
    ease: easeOutCubic,
    state: {
        y: baseline.value,
        height: 0,
        opacity: 0,
    },
}));

function toggle(month: string) {
    selected.value = selected.value === month ? undefined : month;
}
</script>
```
:::

## Layout and scales

The chart needs its own size, and `<ripl-context>` has none — it fills whatever element you give it.
Capture the context from `@ready` and re-read its dimensions on `@resize`; the resize event carries
no payload, so you need the context itself:

```ts
function syncSize() {
    size.width = context.value?.width ?? 0;
    size.height = context.value?.height ?? 0;
}
```

Ripl's [scales](/docs/core/advanced/scales) do the rest. A band scale spaces the categories and
reports a `bandwidth` for the bar width, and a continuous scale maps values to pixels:

```ts
const categoryScale = scaleBand(months, [plot.x, plot.x + plot.width], {
    innerPadding: 0.28,
    outerPadding: 0.14,
});

const valueScale = scaleContinuous([0, max], [plot.y + plot.height, plot.y], {
    padToTicks: 5,
});
```

Two details are worth copying. The value scale's range runs **bottom to top**, because pixel `y`
grows downward — which also means `valueScale(0)` lands on the axis, giving you the baseline with no
special-casing. And `padToTicks` expands the domain to a round tick boundary, so the gridlines land
on sensible numbers.

Each bar is then four numbers:

```ts
const bar = {
    x: categoryScale(month),
    width: categoryScale.bandwidth,
    y: valueScale(value),
    height: baseline - valueScale(value),
};
```

Deriving the whole layout in a `computed` and iterating it with one `v-for` per visual layer keeps
the geometry out of the template. Note `bandwidth` is a property, not a method.

Guard the plot on `plot.width > 0`: the surface genuinely has no size until its host element lands
in the document, and the first real measurement arrives with the first resize.

## Transitions

Bars grow out of the baseline, which is exactly the enter phase's `state` — the state an element
animates *from*:

```ts
const barEnter = computed(() => (element, index, length) => ({
    duration: 700,
    delay: (index / length) * 400,
    ease: easeOutCubic,
    state: {
        y: baseline.value,
        height: 0,
    },
}));
```

Expressing the phase as a factory is what produces the staggered sweep: each element gets its index
and the total, so the delay fans out across the set. Leaving reverses it — bars collapse back to the
baseline and fade before being destroyed.

The phases are `computed` so `baseline` stays current after a resize. They are also plain reactive
props, which means switching them off is just binding `undefined` — that is what the **Animate**
toggle does, and unanimated changes then apply instantly.

The value and category labels sit in their own `<ripl-transition>` fading on `{ opacity: 0 }`. A
scope applies its phases to every descendant, and `height` means nothing to a
[text element](/docs/vue/essentials/elements), so they need a phase of their own. The gridlines get
a third scope with only an `update` phase, so a tick that survives a domain change slides rather
than jumping.

See [Transitions](/docs/vue/essentials/transitions) for the full phase API.

## Interaction

Selection and hover are ordinary Vue listeners on the rect:

```vue
<ripl-rect
    v-for="bar in bars"
    :key="bar.key"
    :fill="bar.fill"
    @click="toggle(bar.key)"
    @mouseenter="hovered = bar.key"
    @mouseleave="hovered = undefined"
/>
```

Both feed back into `bar.fill`, so the highlight is not a separate code path — it is the same
reactive prop the rest of the chart uses, and it tweens through the `update` phase for free.

Only the events you bind are subscribed, which matters here: binding a pointer listener is what
makes an element a hit-test target. The text labels bind nothing, so they never steal a click from
the bar behind them. See [Events](/docs/vue/essentials/events) for the full list and their payloads.
