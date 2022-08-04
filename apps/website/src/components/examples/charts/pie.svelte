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
    serialiseRGB
} from '@ripl/core';

import {
    createPieChart
} from '@ripl/charts';

import {
    stringUniqueId
} from '@ripl/utilities';

let chart: ReturnType<typeof createPieChart>;

const getColor = () => serialiseRGB(
    clamp(Math.random() * 255, 80, 230),
    clamp(Math.random() * 255, 80, 230),
    clamp(Math.random() * 255, 80, 230),
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
    chart = createPieChart<typeof data>('.example__canvas', {
        data,
        key: 'id',
        value: 'value',
        color: 'color',
        label: 'label',
    });
});
</script>