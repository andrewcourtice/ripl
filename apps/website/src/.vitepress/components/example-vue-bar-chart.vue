<template>
    <div class="ripl-example">
        <div class="ripl-example__root">
            <ClientOnly>
                <ripl-context
                    class="ripl-example__mount"
                    @ready="onReady"
                    @resize="syncSize"
                >
                    <ripl-scene>
                        <ripl-renderer>
                            <template v-if="plot.width > 0">
                                <ripl-transition :update="axisPhase">
                                    <ripl-line
                                        v-for="tick in axisTicks"
                                        :key="`grid-${tick.value}`"
                                        :x1="plot.x"
                                        :y1="tick.y"
                                        :x2="plot.x + plot.width"
                                        :y2="tick.y"
                                        :stroke="tick.value === 0 ? AXIS_COLOR : GRID_COLOR"
                                        :line-width="1"
                                    />
                                    <ripl-text
                                        v-for="tick in axisTicks"
                                        :key="`axis-${tick.value}`"
                                        :x="plot.x - 8"
                                        :y="tick.y"
                                        :content="tick.label"
                                        :fill="TEXT_COLOR"
                                        :font="AXIS_FONT"
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
                                        v-for="bar in bars"
                                        :key="bar.key"
                                        :x="bar.x"
                                        :y="bar.y"
                                        :width="bar.width"
                                        :height="bar.height"
                                        :fill="bar.fill"
                                        :border-radius="BAR_RADIUS"
                                        @click="toggle(bar.key)"
                                        @mouseenter="hovered = bar.key"
                                        @mouseleave="hovered = undefined"
                                    />
                                </ripl-transition>

                                <ripl-transition
                                    :enter="labelFade"
                                    :update="barUpdate"
                                    :leave="labelFade"
                                >
                                    <ripl-text
                                        v-for="bar in bars"
                                        :key="`value-${bar.key}`"
                                        :x="bar.x + bar.width / 2"
                                        :y="bar.y - 8"
                                        :content="bar.valueLabel"
                                        :fill="TEXT_COLOR"
                                        :font="VALUE_FONT"
                                        text-align="center"
                                        text-baseline="bottom"
                                    />
                                    <ripl-text
                                        v-for="bar in bars"
                                        :key="`month-${bar.key}`"
                                        :x="bar.x + bar.width / 2"
                                        :y="plot.y + plot.height + 10"
                                        :content="bar.key"
                                        :fill="TEXT_COLOR"
                                        :font="AXIS_FONT"
                                        text-align="center"
                                        text-baseline="top"
                                    />
                                </ripl-transition>
                            </template>
                        </ripl-renderer>
                    </ripl-scene>
                </ripl-context>
            </ClientOnly>
        </div>
        <div class="ripl-example__footer">
            <RiplControlGroup>
                <RiplButton @click="randomise">Randomise</RiplButton>
                <RiplButton @click="addMonth">Add month</RiplButton>
                <RiplButton @click="removeMonth">Remove month</RiplButton>
                <RiplSwitch v-model="animate" label="Animate" />
                <span class="vue-bar-chart__readout">{{ readout }}</span>
            </RiplControlGroup>
        </div>
    </div>
</template>

<script lang="ts" setup>
import {
    computed,
    reactive,
    ref,
    shallowRef,
} from 'vue';

import RiplButton from './ripl-button.vue';
import RiplControlGroup from './ripl-control-group.vue';
import RiplSwitch from './ripl-switch.vue';

import {
    easeOutCubic,
    scaleBand,
    scaleContinuous,
    setColorAlpha,
} from '@ripl/web';

import type {
    Context,
} from '@ripl/web';

import {
    numberFormat,
    numberMaxOf,
} from '@ripl/utilities';

const MONTHS = [
    'Jan',
    'Feb',
    'Mar',
    'Apr',
    'May',
    'Jun',
    'Jul',
    'Aug',
    'Sep',
    'Oct',
    'Nov',
    'Dec',
];

const MARGIN = {
    top: 28,
    right: 16,
    bottom: 34,
    left: 44,
};

const TICK_COUNT = 5;
const BAR_RADIUS = [4, 4, 0, 0];
const MIN_BARS = 3;
const BAR_COLOR = '#3a86ff';
const SELECTED_COLOR = '#ff006e';

// Mid-tones rather than the `#666` the older demos use: these hold contrast on both the light and
// the dark page background, which canvas colours do not get from the theme for free.
const TEXT_COLOR = '#8b93a1';
const GRID_COLOR = 'rgba(140, 150, 165, 0.35)';
const AXIS_COLOR = 'rgba(140, 150, 165, 0.55)';

const AXIS_FONT = '11px sans-serif';
const VALUE_FONT = '600 11px sans-serif';

const COMPACT_CURRENCY = {
    style: 'currency',
    currency: 'USD',
    notation: 'compact',
    maximumFractionDigits: 1,
} as const;

const FULL_CURRENCY = {
    style: 'currency',
    currency: 'USD',
    maximumFractionDigits: 0,
} as const;

function randomValue(): number {
    return Math.round((2 + Math.random() * 14) * 1000);
}

function createData(count: number) {
    return MONTHS.slice(0, count).map(month => ({
        month,
        value: randomValue(),
    }));
}

const data = ref(createData(7));
const selected = ref<string>();
const hovered = ref<string>();
const animate = ref(true);
const context = shallowRef<Context>();

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
    x: MARGIN.left,
    y: MARGIN.top,
    width: Math.max(0, size.width - MARGIN.left - MARGIN.right),
    height: Math.max(0, size.height - MARGIN.top - MARGIN.bottom),
}));

// The value range runs bottom-to-top because pixel y grows downward, which also puts `valueScale(0)`
// on the axis without any special-casing.
const valueScale = computed(() => scaleContinuous(
    [0, numberMaxOf(data.value, item => item.value)],
    [plot.value.y + plot.value.height, plot.value.y],
    { padToTicks: TICK_COUNT }
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

const axisTicks = computed(() => valueScale.value.ticks(TICK_COUNT).map(value => ({
    value,
    y: valueScale.value(value),
    label: numberFormat(value, COMPACT_CURRENCY),
})));

function fillFor(month: string): string {
    if (month === selected.value) {
        return SELECTED_COLOR;
    }

    return month === hovered.value
        ? BAR_COLOR
        : setColorAlpha(BAR_COLOR, 0.62);
}

const bars = computed(() => {
    const category = categoryScale.value;
    const value = valueScale.value;
    const base = baseline.value;

    return data.value.map(item => ({
        key: item.month,
        valueLabel: numberFormat(item.value, COMPACT_CURRENCY),
        x: category(item.month),
        width: category.bandwidth,
        y: value(item.value),
        height: Math.max(0, base - value(item.value)),
        fill: fillFor(item.month),
    }));
});

const barEnter = computed(() => animate.value
    ? (element: unknown, index: number, length: number) => ({
        duration: 700,
        delay: (index / length) * 400,
        ease: easeOutCubic,
        state: {
            y: baseline.value,
            height: 0,
        },
    })
    : undefined);

const barUpdate = computed(() => animate.value
    ? {
        duration: 400,
        ease: easeOutCubic,
    }
    : undefined);

const barLeave = computed(() => animate.value
    ? {
        duration: 300,
        ease: easeOutCubic,
        state: {
            y: baseline.value,
            height: 0,
            opacity: 0,
        },
    }
    : undefined);

const labelFade = computed(() => animate.value
    ? {
        duration: 300,
        ease: easeOutCubic,
        state: {
            opacity: 0,
        },
    }
    : undefined);

const axisPhase = computed(() => animate.value
    ? {
        duration: 400,
        ease: easeOutCubic,
    }
    : undefined);

const readout = computed(() => {
    const item = data.value.find(entry => entry.month === selected.value);

    return item
        ? `${item.month}: ${numberFormat(item.value, FULL_CURRENCY)}`
        : 'Click a bar to select it';
});

function toggle(month: string) {
    selected.value = selected.value === month ? undefined : month;
}

function randomise() {
    data.value = data.value.map(item => ({
        ...item,
        value: randomValue(),
    }));
}

function addMonth() {
    if (data.value.length >= MONTHS.length) {
        return;
    }

    data.value = [
        ...data.value,
        {
            month: MONTHS[data.value.length],
            value: randomValue(),
        },
    ];
}

function removeMonth() {
    if (data.value.length <= MIN_BARS) {
        return;
    }

    const removed = data.value[data.value.length - 1];

    data.value = data.value.slice(0, -1);

    if (selected.value === removed.month) {
        selected.value = undefined;
    }
}
</script>

<style scoped>
.vue-bar-chart__readout {
    margin-left: auto;
    font-size: 0.8125rem;
    color: var(--vp-c-text-2);
    font-variant-numeric: tabular-nums;
}
</style>
