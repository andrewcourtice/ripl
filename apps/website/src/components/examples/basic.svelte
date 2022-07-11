<Example>
    <div slot="sidebar">
        <input type="range" min="0" max="1" step="0.001" bind:value={time}>
        <br>
        Tension
        <input type="range" min="0" max="1" step="0.001" bind:value={tension}>
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
    spline,
    continuous,
    scene,
    renderer,
    TAU,
    line,
    drawLinePoints,
    Point,
    group,
} from '@ripl/core';

let time = 1;
let tension = 0.5;
let render = (time: number) => {};

$: {
    tension = tension;
    render(time);
}


function mainDemo() {
    const {
        canvas,
        context,
        clear,
    } = getContext('.example__canvas');

    // RAND POINTS
    // const length = 10;
    // const xScale = continuous([0, length - 1], [50, canvas.width - 50]);
    // const yScale = continuous([-100, 100], [canvas.height - 50, 50]);
    // const rand = () => Math.random() * (Math.random() < 0.5 ? -1 : 1);
    
    // const getPoints = () => Array.from({ length }, (_, i) => [
    //     xScale(i),
    //     yScale(rand() * 50)
    // ] as Point);

    // const points = getPoints();

    // SINE DOMAIN 5 POINTS
    const xScale = continuous([1, 5], [0, canvas.width]);
    const yScale = continuous([0, 2], [canvas.height, 0]);

    const points = [
            [xScale(1), yScale(1)],
            [xScale(2), yScale(2)],
            [xScale(3), yScale(1)],
            [xScale(4), yScale(0)],
            [xScale(5), yScale(1)],
        ] as Point[];

    
    const spl = spline({
        strokeStyle: '#000000',
        lineWidth: 4,
        // points: () => drawLinePoints(points)(time),
        points,
        tension: () => tension,
    });

    const markers = points.map((point) => circle({
        fillStyle: '#000000',
        lineWidth: 4,
        x: point[0],
        y: point[1],
        radius: 10,
    }));

    const markerGroup = group();

    markerGroup.add(markers);

    const crc = circle({
        fillStyle: ['#AAAAAA', '#DDDDDD'],
        lineWidth: 4,
        x: canvas.width / 2,
        y: canvas.height / 2,
        radius: [canvas.width / 5, canvas.width / 3]
    });

    render = time => {
        clear();
        crc.render(context, time);
        markerGroup.render(context, time);
        spl.render(context, time);
    }
}

onMount(() => {
    mainDemo();
});
</script>