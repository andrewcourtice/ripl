<template>
    <div class="ripl-example">
        <div class="ripl-example__root">
            <div ref="mount" class="ripl-example__mount"></div>
        </div>
        <div class="ripl-example__footer">
            <RiplControlGroup>
                <RiplButton @click="randomise">Randomise</RiplButton>
                <RiplButton @click="add">Add month</RiplButton>
                <RiplButton @click="remove">Remove month</RiplButton>
                <RiplSwitch v-model="animate" label="Animate" />
                <span class="react-bar-chart__readout">{{ readout }}</span>
            </RiplControlGroup>
        </div>
    </div>
</template>

<script lang="ts" setup>
import {
    computed,
    ref,
    useTemplateRef,
} from 'vue';

import {
    useReactRoot,
} from '../compositions/react-root';

import {
    addMonth,
    createData,
    formatFull,
    randomiseData,
    removeMonth,
} from './bar-chart-demo';

import {
    BarChartDemo,
} from './react/bar-chart';

import RiplButton from './ripl-button.vue';
import RiplControlGroup from './ripl-control-group.vue';
import RiplSwitch from './ripl-switch.vue';

const mount = useTemplateRef<HTMLElement>('mount');
const data = ref(createData(7));
const selected = ref<string>();
const animate = ref(true);

const readout = computed(() => {
    const item = data.value.find(entry => entry.month === selected.value);

    return item
        ? `${item.month}: ${formatFull(item.value)}`
        : 'Click a bar to select it';
});

function onSelect(month: string) {
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

useReactRoot(mount, BarChartDemo, () => ({
    data: data.value,
    animate: animate.value,
    selected: selected.value,
    onSelect,
}));
</script>

<style scoped>
.react-bar-chart__readout {
    margin-left: auto;
    font-size: 0.8125rem;
    color: var(--vp-c-text-2);
    font-variant-numeric: tabular-nums;
}
</style>
