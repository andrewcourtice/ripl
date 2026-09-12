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
                                        :x="layout.plot.x - TICK_LABEL_OFFSET"
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
                                        v-for="bar in layout.bars"
                                        :key="bar.key"
                                        :x="bar.x"
                                        :y="bar.y"
                                        :width="bar.width"
                                        :height="bar.height"
                                        :fill="fillFor(bar.key, hovered, selected)"
                                        :border-radius="BAR_RADIUS"
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
                                        :y="bar.y - VALUE_LABEL_OFFSET"
                                        :content="bar.valueLabel"
                                        :fill="TEXT_COLOR"
                                        :font="VALUE_FONT"
                                        text-align="center"
                                        text-baseline="bottom"
                                    />
                                    <ripl-text
                                        v-for="bar in layout.bars"
                                        :key="`month-${bar.key}`"
                                        :x="bar.x + bar.width / 2"
                                        :y="layout.plot.y + layout.plot.height + MONTH_LABEL_OFFSET"
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
                <RiplButton @click="add">Add month</RiplButton>
                <RiplButton @click="remove">Remove month</RiplButton>
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
    addMonth,
    AXIS_COLOR,
    AXIS_DURATION,
    AXIS_FONT,
    BAR_RADIUS,
    createBarLayout,
    createData,
    ENTER_DURATION,
    EXIT_DURATION,
    fillFor,
    formatFull,
    GRID_COLOR,
    MONTH_LABEL_OFFSET,
    randomiseData,
    removeMonth,
    TEXT_COLOR,
    TICK_LABEL_OFFSET,
    UPDATE_DURATION,
    VALUE_FONT,
    VALUE_LABEL_OFFSET,
} from './bar-chart-demo';

import {
    easeOutCubic,
} from '@ripl/web';

import type {
    Context,
} from '@ripl/web';

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

const layout = computed(() => createBarLayout(data.value, size));
const baseline = computed(() => layout.value?.baseline ?? 0);

const barEnter = computed(() => animate.value
    ? (element: unknown, index: number, length: number) => ({
        duration: ENTER_DURATION,
        delay: (index / length) * ENTER_DURATION,
        ease: easeOutCubic,
        state: {
            y: baseline.value,
            height: 0,
        },
    })
    : undefined);

const barUpdate = computed(() => animate.value
    ? {
        duration: UPDATE_DURATION,
        ease: easeOutCubic,
    }
    : undefined);

const barLeave = computed(() => animate.value
    ? {
        duration: EXIT_DURATION,
        ease: easeOutCubic,
        state: {
            y: baseline.value,
            height: 0,
            opacity: 0,
        },
    }
    : undefined);

const labelEnter = computed(() => animate.value
    ? {
        duration: ENTER_DURATION,
        ease: easeOutCubic,
        state: {
            opacity: 0,
        },
    }
    : undefined);

const labelLeave = computed(() => animate.value
    ? {
        duration: EXIT_DURATION,
        ease: easeOutCubic,
        state: {
            opacity: 0,
        },
    }
    : undefined);

const axisPhase = computed(() => animate.value
    ? {
        duration: AXIS_DURATION,
        ease: easeOutCubic,
    }
    : undefined);

const readout = computed(() => {
    const item = data.value.find(entry => entry.month === selected.value);

    return item
        ? `${item.month}: ${formatFull(item.value)}`
        : 'Click a bar to select it';
});

function toggle(month: string) {
    selected.value = selected.value === month ? undefined : month;
}

function randomise() {
    data.value = randomiseData(data.value);
}

function add() {
    data.value = addMonth(data.value);
}

function remove() {
    const next = removeMonth(data.value);

    if (selected.value && !next.some(item => item.month === selected.value)) {
        selected.value = undefined;
    }

    data.value = next;
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
