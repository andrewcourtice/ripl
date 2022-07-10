<Example>
    <div slot="sidebar">
        <input type="range" min="0" max="1" step="0.001" bind:value={time}>
    </div>
</Example>

<script lang="ts">
import Example from './base/example.svelte';

import {
    onMount
} from 'svelte';

import {
    getContext,
    circle,
} from '@ripl/core';

let time = 0;
let render = (time: number) => {};

$: {
    render(time);
}

onMount(() => {
    const {
        canvas,
        context,
        clear
    } = getContext('.example__canvas');

    const crc = circle({
        fillStyle: ['#000000', '#CCCCCC'],
        lineWidth: 4,
        x: canvas.width / 2,
        y: canvas.height / 2,
        radius: [canvas.width / 5, canvas.width / 3]
    });

    render = time => {
        clear();
        crc.render(context, time);
    }
});
</script>