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
    serialiseRGB,
    serialiseRGBA
} from '@ripl/core';

import {
    PieChart,
    createPieChart
} from '@ripl/charts';

import {
    stringUniqueId
} from '@ripl/utilities';

let chart: PieChart<typeof data[number]>;

const getColor = () => serialiseRGBA(
    clamp(Math.round(Math.random()) * 255, 80, 230),
    clamp(Math.round(Math.random()) * 255, 80, 230),
    clamp(Math.round(Math.random()) * 255, 80, 230),
    1
);

let data = [
    {
        id: stringUniqueId(),
        label: 'Australia',
        value: 55,
        color: getColor()
    },
    {
        id: stringUniqueId(),
        label: 'Poland',
        value: 21,
        color: getColor()
    },
    {
        id: stringUniqueId(),
        label: 'South Africa',
        value: 185,
        color: getColor()
    },
    {
        id: stringUniqueId(),
        label: 'New Zealand',
        value: 18,
        color: getColor()
    },
    {
        id: stringUniqueId(),
        label: 'USA',
        value: 129,
        color: getColor()
    },
    {
        id: stringUniqueId(),
        label: 'Sweden',
        value: 15,
        color: getColor()
    },
];

function getNewValue() {
    return {
        id: stringUniqueId(),
        label: stringUniqueId(10),
        value: Math.round(Math.random() * 180),
        color: getColor()
    }
}

function addValue() {
    const index = Math.floor(Math.random() * data.length - 1);
    data.splice(index, 0, getNewValue());
    chart.update({ data });
}

function removeValue() {
    const index = Math.floor(Math.random() * data.length - 1);
    data.splice(index, 1);
    chart.update({ data });
}

function update() {
    data = data.map(item => ({
        ...item,
        value: Math.round(Math.random() * 180)
    }));

    chart.update({
        data
    });
}

onMount(() => {
    try {
    
        chart = createPieChart<typeof data[number]>('.example__root', {
            type: 'svg',
            data,
            key: 'id',
            value: 'value',
            color: 'color',
            label: 'label',
        });
    } catch (e) {
        console.error(e);
    }
});
</script>