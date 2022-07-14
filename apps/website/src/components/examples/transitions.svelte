<Example>
    <div slot="sidebar">
        <button on:click={transitionCircles}>Transition</button>
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
    scaleContinuous,
    transition,
    easeOutQuint,
} from '@ripl/core';

let transitionCircles = () => {};

onMount(() => {
    const {
        canvas,
        context,
        clear
    } = getContext('.example__canvas');

    const rScale = scaleContinuous([0, 1], [5, 15]);
    const xScale = scaleContinuous([0, 1], [10, canvas.width - 10]);
    const yScale = scaleContinuous([0, 1], [10, canvas.height - 10]);

    const circles = Array.from({ length: 1000 }, (_, index) => circle({
        radius: [rScale(Math.random()), rScale(Math.random())],
        x: [xScale(Math.random()), xScale(Math.random())],
        y: [yScale(Math.random()), yScale(Math.random())],
    }));
    
    const grp = group({
        fillStyle: '#000000',
    });
    
    grp.add(circles);
    
    transitionCircles = () => {
        circles.forEach(crc => crc.to({
            radius: rScale(Math.random()),
            x: xScale(Math.random()),
            y: yScale(Math.random()),
        }));

        transition(time => {
            clear();
            grp.render(context, time);
        }, {
            duration: 3000,
            ease: easeOutQuint
        })
    };
    
    grp.render(context);
});
</script>