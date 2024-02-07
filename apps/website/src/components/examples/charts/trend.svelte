<Example>
    <div slot="sidebar">
        <button on:click={update}>Update</button>
        <button on:click={addValue}>Add</button>
        <button on:click={removeValue}>Remove</button>
    </div>
</Example>

<script lang="ts">
import Example from '../base/example.svelte';

import {
    onMount
} from 'svelte';

import {
    clamp,
    scaleContinuous,
    serialiseRGB,
    serialiseRGBA
} from '@ripl/core';

import {
    PieChart,
    TrendChart,
    createTrendChart
} from '@ripl/charts';

import {
    stringUniqueId
} from '@ripl/utilities';

let chart: TrendChart<typeof data[number]>;

const getColor = () => serialiseRGBA(
    clamp(Math.round(Math.random()) * 255, 80, 230),
    clamp(Math.round(Math.random()) * 255, 80, 230),
    clamp(Math.round(Math.random()) * 255, 80, 230),
    1
);

const dataScale = scaleContinuous([0, 1], [-500, 1200]);

let data = Array.from({ length: 10 }, getDataItem);

function getDataItem() {
    return {
        id: stringUniqueId(),
        australia: getValue(),
        newZealand: getValue(),
        sweden: getValue(),
        unitedStates: getValue()
    }
}

function getValue() {
    return Math.round(dataScale(Math.random()));
}

function addValue() {
    const index = Math.floor(Math.random() * data.length - 1);
    data.splice(index, 0, getDataItem());
    chart.update({ data });
}

function removeValue() {
    const index = Math.floor(Math.random() * data.length - 1);
    data.splice(index, 1);
    chart.update({ data });
}

function update() {
    data = data.map(item => ({
        ...getDataItem(),
        id: item.id
    }));

    chart.update({
        data
    });
}

onMount(() => {
    try {
        chart = createTrendChart<typeof data[number]>('.example__root', {
            type: 'canvas',
            data,
            keyBy: 'id',
            labelBy: 'id',
            series: [
                {
                    type: 'line',
                    id: 'Australia',
                    labelBy: 'Australia',
                    valueBy: 'australia',
                    // colorBy: getColor(),
                },
                {
                    type: 'bar',
                    id: 'New Zealand',
                    labelBy: 'New Zealand',
                    valueBy: 'newZealand',
                    // colorBy: getColor(),
                },
                {
                    type: 'bar',
                    id: 'Sweden',
                    labelBy: 'Sweden',
                    valueBy: 'sweden',
                    // colorBy: getColor(),
                },
                {
                    type: 'bar',
                    id: 'United States',
                    labelBy: 'United States',
                    valueBy: 'unitedStates',
                    // colorBy: getColor(),
                }
            ]
        });
    } catch (e) {
        console.error(e);
    }
});
</script>