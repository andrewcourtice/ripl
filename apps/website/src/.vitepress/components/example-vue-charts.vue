<template>
    <div class="ripl-example">
        <div class="ripl-example__root">
            <ClientOnly>
                <ripl-bar-chart
                    class="ripl-example__mount"
                    :data="data"
                    :series="series"
                    key-by="month"
                    :title="title"
                    :legend="true"
                    :stacked="stacked"
                    :border-radius="4"
                    :format="format"
                    @barclick="onBarClick"
                />
            </ClientOnly>
        </div>
        <div class="ripl-example__footer">
            <RiplControlGroup>
                <RiplButton @click="randomise">Randomise</RiplButton>
                <RiplButton @click="addMonth">Add month</RiplButton>
                <RiplButton @click="removeMonth">Remove month</RiplButton>
                <RiplSwitch v-model="stacked" label="Stacked" />
                <span class="vue-charts__readout">{{ readout }}</span>
            </RiplControlGroup>
        </div>
    </div>
</template>

<script lang="ts" setup>
import {
    computed,
    ref,
} from 'vue';

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

const series = [
    {
        id: 'revenue',
        label: 'Revenue',
        value: 'revenue',
    },
    {
        id: 'costs',
        label: 'Costs',
        value: 'costs',
    },
];

// `narrowSymbol`, or a non-US reader gets `US$7.4k`: the default currency display is locale-derived.
const format = {
    style: 'currency',
    currency: 'USD',
    currencyDisplay: 'narrowSymbol',
    notation: 'compact',
    maximumFractionDigits: 1,
} as const;

const title = 'Monthly breakdown';

function generate(count: number) {
    return MONTHS.slice(0, count).map(month => ({
        month,
        revenue: Math.round(2000 + Math.random() * 14000),
        costs: Math.round(1000 + Math.random() * 8000),
    }));
}

const data = ref(generate(6));
const stacked = ref(false);
const selected = ref<string>();

const readout = computed(() => selected.value
    ? `Selected ${selected.value}`
    : 'Click a bar to select it');

function onBarClick(payload: { xValue: string }) {
    selected.value = selected.value === payload.xValue ? undefined : payload.xValue;
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
</script>

<style scoped>
.vue-charts__readout {
    margin-left: auto;
    font-size: 0.8125rem;
    color: var(--vp-c-text-2);
    font-variant-numeric: tabular-nums;
}
</style>
