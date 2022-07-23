<Example>
    <div slot="sidebar">
        <input type="range" min="0" max="1" step="0.001" bind:value={time}>
        <br>
        Tension
        <input type="range" min="0" max="1" step="0.001" bind:value={tension}>
        <br>
        <button name="showPoints" on:click="{() => showPoints = !showPoints}">Show Points</button>
    </div>
</Example>

<script lang="ts">
import Example from './base/example.svelte';

import {
    onMount
} from 'svelte';

import {
    getContext,
    createCircle,
    createGroup,
    createSpline,
    scaleContinuous,
    Point,
    interpolatePath
} from '@ripl/core';

let time = 1;
let tension = 0.5;
let showPoints = true;
let render = (time: number) => {};

$: {
    showPoints = showPoints;
    tension = tension;
    render(time);
}


function mainDemo() {
    const {
        canvas,
        context,
        clear,
        width,
        height
    } = getContext('.example__canvas');

    // RAND POINTS
    const length = 20;
    const xScale = scaleContinuous([0, length - 1], [50, width - 50]);
    const yScale = scaleContinuous([-100, 100], [height - 50, 50]);
    const rand = () => Math.random() * (Math.random() < 0.5 ? -1 : 1);
    
    const getPoints = () => Array.from({ length }, (_, i) => [
        xScale(i),
        yScale(rand() * 50)
    ] as Point);

    const points = getPoints();

    // SINE DOMAIN 5 POINTS
    // const xScale = scaleContinuous([1, 5], [50, width - 50]);
    // const yScale = scaleContinuous([0, 2], [height - 50, 50]);

    // const points = [
    //         [xScale(1), yScale(1)],
    //         [xScale(2), yScale(2)],
    //         [xScale(3), yScale(1)],
    //         [xScale(4), yScale(0)],
    //         [xScale(5), yScale(1)],
    //     ] as Point[];

    // SINE PROPER
    // let frequency = 3;
    // let amplitude = 2;
    // let start = 0;
    // let lowerBound = height * 0.75;
    // let upperBound = height * 0.25;

    // let scaleX = scaleContinuous([0, TAU], [0, width]);
    // let scaleY = scaleContinuous([-amplitude, amplitude], [lowerBound, upperBound]);
    // let inScaleX = scaleContinuous([0, width], [0, TAU]);

    // const points = Array.from({ length: 200 }, (_, i) => {
    //         const x = i * (TAU / 200);
    //         const y = amplitude * Math.cos((start + x) * frequency);

    //         return [
    //             scaleX(x), 
    //             scaleY(y)
    //         ];
    //     }) as Point[];


    const spl = createSpline({
        strokeStyle: '#000000',
        lineWidth: 2,
        points: interpolatePath(points),
        tension: () => tension,
    });

    const markers = points.map((point) => createCircle({
        fillStyle: '#000000',
        lineWidth: 4,
        cx: point[0],
        cy: point[1],
        radius: 10,
    }));

    const markerGroup = createGroup();

    markerGroup.add(markers);

    const crc = createCircle({
        fillStyle: ['rgb(30, 105, 120)', 'rgba(150, 105, 120, 0.2)'],
        lineWidth: 4,
        cx: width / 2,
        cy: height / 2,
        radius: [width / 5, width / 3]
    });

    render = time => {
        clear();
        crc.render(context, time);

        if(showPoints) {
            markerGroup.render(context, time);
        }
        spl.render(context, time);
    }
}

onMount(() => {
    mainDemo();
});
</script>