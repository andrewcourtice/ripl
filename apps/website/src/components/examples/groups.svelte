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
    group,
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

    const circle1 = circle({
        lineWidth: 4,
        x: canvas.width * 0.25,
        y: canvas.height * 0.25,
        radius: [canvas.width * 0.10, canvas.width * 0.15]
    });

    const circle2 = circle1.clone();
    
    circle2.update({
        fillStyle: ['#FF0000', '#00FF00'],
        x: canvas.width * 0.75,
        y: canvas.height * 0.75,
    });

    const group1 = group({
        fillStyle: ['#000000', '#CCCCCC'],
    });

    group1.add([
        circle1,
        circle2
    ]);

    render = time => {
        clear();
        group1.render(context, time);
    }
});
</script>