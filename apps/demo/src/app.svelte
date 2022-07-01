<div class="app">
    <canvas class="my-canvas" width="500" height="500" bind:this="{canvas}"></canvas>
    <input type="range" min="0" max="1" step="0.01" bind:value="{time}">
</div>

<script lang="ts">
import {
    onMount
} from 'svelte';

import {
    arc,
    circle,
    continuous,
    drawLinePoints,
    getPolygonPoints,
    line,
    polygon,
    rect,
    rgbToHex,
    type LinePoint,
    type ShapeRenderer
} from '@thingy/core';

let time = 1;
let canvas: HTMLCanvasElement;
let stack: ShapeRenderer<any>[] = [];

$: if (canvas) {
    const ctx = canvas.getContext('2d');
    
    if (ctx) {
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        stack.forEach(({ render }) => render(ctx, time));
    }
}

onMount(() => {
    const length = 50;
    const xScale = continuous([0, length - 1], [10, canvas.width - 10]);
    const yScale = continuous([-100, 100], [canvas.height - 10, 10]);
    const rand = () => Math.random() * (Math.random() < 0.5 ? -1 : 1);

    const getPoints = () => Array.from({ length }, (_, i) => [
        xScale(i),
        yScale(rand() * 50)
    ] as LinePoint);

    const lines = Array.from({ length: 4 }, (_, i) => line({
        strokeStyle: '#000000',
        lineJoin: 'round',
        lineCap: 'round',
        lineWidth: 2,
        points: !(i % 2) ? drawLinePoints(getPoints()) : [getPoints(), getPoints()]
    }));

    const circles = Array.from({ length: 100 }, (_, i) => circle({
        strokeStyle: '#000000',
        x: [Math.random() * canvas.width, Math.random() * canvas.width],
        y: [Math.random() * canvas.height, Math.random() * canvas.height],
        radius: [Math.random() * 10, Math.random() * 10]
    }));

    const polygons = [
        polygon({
            points: drawLinePoints(
                getPolygonPoints(6, canvas.width / 2, canvas.height / 2, 100)
            ),
            strokeStyle: '#000000'
        }),
        polygon({
            points: [
                getPolygonPoints(10, canvas.width / 2, canvas.height / 2, 40),
                getPolygonPoints(10, canvas.width / 2, canvas.height / 2, 80)
            ],
            strokeStyle: '#000000'
        })
    ];

    stack = [].concat(lines, circles, polygons);
});
</script>

<style>

    .my-canvas {
        width: 500px;
        height: 500px;
    }

</style>