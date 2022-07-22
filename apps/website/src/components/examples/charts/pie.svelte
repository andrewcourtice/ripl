<Example>
    <div slot="sidebar">
        <button on:click={render}>Render</button>
        <button on:click={chart.clear}>Clear</button>
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

let chart: ReturnType<typeof createPieChart>;

const getColor = () => serialiseRGB(
    clamp(Math.random() * 255, 80, 230),
    clamp(Math.random() * 255, 80, 230),
    clamp(Math.random() * 255, 80, 230),
    1
);

const data = [
    {
        id: 1,
        label: 'Australia',
        value: 55,
        color: getColor()
    },
    {
        id: 1,
        label: 'Poland',
        value: 21,
        color: getColor()
    },
    {
        id: 1,
        label: 'South Africa',
        value: 185,
        color: getColor()
    },
    {
        id: 1,
        label: 'New Zealand',
        value: 18,
        color: getColor()
    },
    {
        id: 1,
        label: 'USA',
        value: 129,
        color: getColor()
    },
    {
        id: 1,
        label: 'Sweden',
        value: 15,
        color: getColor()
    },
];

function render() {
    chart.update({});
    chart.render();
}

onMount(() => {
    chart = createPieChart<typeof data>('.example__canvas', {
        data,
        value: 'value',
        color: 'color',
        label: 'label',
    });
});
</script>