<template>
    <div class="ripl-example">
        <div class="ripl-example__root">
            <div ref="mount" class="ripl-example__mount"></div>
        </div>
        <div class="ripl-example__footer">
            <RiplControlGroup>
                <RiplButton @click="randomise">Randomise</RiplButton>
                <RiplButton @click="addMonth">Add month</RiplButton>
                <RiplButton @click="removeMonth">Remove month</RiplButton>
                <RiplSwitch v-model="stacked" label="Stacked" />
                <span class="react-charts__readout">{{ readout }}</span>
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
    ChartsDemo,
} from './react/charts';

import RiplButton from './ripl-button.vue';
import RiplControlGroup from './ripl-control-group.vue';
import RiplSwitch from './ripl-switch.vue';

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

const MIN_MONTHS = 3;

function generate(count: number) {
    return MONTHS.slice(0, count).map(month => ({
        month,
        revenue: Math.round(2000 + Math.random() * 14000),
        costs: Math.round(1000 + Math.random() * 8000),
    }));
}

const mount = useTemplateRef<HTMLElement>('mount');
const data = ref(generate(6));
const stacked = ref(false);
const selected = ref<string>();

const readout = computed(() => selected.value
    ? `Selected ${selected.value}`
    : 'Click a bar to select it');

function onSelect(month: string) {
    selected.value = selected.value === month ? undefined : month;
}

function randomise() {
    data.value = generate(data.value.length);
}

function addMonth() {
    if (data.value.length < MONTHS.length) {
        data.value = generate(data.value.length + 1);
    }
}

function removeMonth() {
    if (data.value.length > MIN_MONTHS) {
        data.value = generate(data.value.length - 1);
    }
}

useReactRoot(mount, ChartsDemo, () => ({
    data: data.value,
    stacked: stacked.value,
    onSelect,
}));
</script>

<style scoped>
.react-charts__readout {
    margin-left: auto;
    font-size: 0.8125rem;
    color: var(--vp-c-text-2);
    font-variant-numeric: tabular-nums;
}
</style>
