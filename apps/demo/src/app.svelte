<div class="app" layout="row stretch-justify">
    <div class="app__body" self="size-x1">
        <canvas class="app__canvas" width="500" height="500" bind:this="{canvas}"></canvas>
    </div>
    <div class="app__sidebar">
        <div>
            <div>
                <strong>State</strong> (0 &lt;= t &lt;= 1)
            </div>
            <input class="app__time-range" type="range" min="0" max="1" step="0.001" bind:value="{time}">
        </div>
        <button on:click="{runTween}">Tween</button>
    </div>
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
    spline,
    text,
    transition,
    easeOutQuad,
    getContext,
    interpolateString,
    type Point,
    type ShapeRenderer,
group
} from '@thingy/core';

let time = 1;
let canvas: HTMLCanvasElement;
let ctx: CanvasRenderingContext2D;
let stack: ShapeRenderer<any>[] = [];

$: if (canvas) {   
    if (ctx) {
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        stack.forEach(({ render }) => render(ctx, time));
    }
}

function runTween() {
    transition(t => time = t, {
        duration: 3000,
        ease: easeOutQuad,
        //loop: true
    });
}

onMount(() => {
    ctx = getContext(canvas);

    const length = 20;
    const xScale = continuous([0, length - 1], [10, canvas.width - 10]);
    const yScale = continuous([-100, 100], [canvas.height - 10, 10]);
    const rand = () => Math.random() * (Math.random() < 0.5 ? -1 : 1);

    const getPoints = () => Array.from({ length }, (_, i) => [
        xScale(i),
        yScale(rand() * 50)
    ] as Point);

    const lines = Array.from({ length: 2 }, (_, i) => line({
        strokeStyle: '#000000',
        lineJoin: 'round',
        lineCap: 'round',
        lineWidth: 2,
        points: !(i % 2) ? drawLinePoints(getPoints()) : [getPoints(), getPoints()]
    }));

    const circles = Array.from({ length: 3000 }, (_, i) => circle({
        //strokeStyle: ['#000000', '#FF0000'],
        x: [Math.random() * canvas.width, Math.random() * canvas.width],
        y: [Math.random() * canvas.height, Math.random() * canvas.height],
        radius: [Math.random() * 5, Math.random() * 5]
    }));

    const circleGroup = group(circles, {
        fillStyle: ['#000000', '#FF0000'],
    })

    const polygons = [
        polygon({
            points: drawLinePoints(
                getPolygonPoints(8, canvas.width / 2, canvas.height / 2, 200)
            ),
            strokeStyle: '#000000',
            lineWidth: 2,
        }),
        // polygon({
        //     strokeStyle: '#000000',
        //     points: [
        //         {
        //             value: getPolygonPoints(4, canvas.width / 2, canvas.height / 2, 100)
        //         },
        //         {
        //             value: getPolygonPoints(8, 110, 110, 100)
        //         },
        //         {
        //             value: getPolygonPoints(5, canvas.width - 110, 110, 100)
        //         },
        //         {
        //             value: getPolygonPoints(10, canvas.width - 110, canvas.height - 110, 100)
        //         },
        //         {
        //             value: getPolygonPoints(3, 110, canvas.height - 110, 100)
        //         },
        //         {
        //             value: getPolygonPoints(6, 110, 110, 100)
        //         },
        //         // {
        //         //     value: getPolygonPoints(12, canvas.width / 2, canvas.height / 2, 100)
        //         // },
        //         // {
        //         //     value: getPolygonPoints(3, canvas.width / 2, canvas.height / 2, 100)
        //         // },
        //     ],
        // }),
        // polygon({
        //     points: [
        //         getPolygonPoints(6, canvas.width / 2, canvas.height / 2, 200),
        //         getPolygonPoints(10, canvas.width / 2, canvas.height / 2, 200)
        //     ],
        //     strokeStyle: '#000000',
        //     lineWidth: 2,
        // })
    ];

    const texts = [
        text({
            strokeStyle: '#000000',
            x: canvas.width / 2,
            y: canvas.height / 2,
            content: t => interpolateString(tag => [
                tag`rgb(${255}, ${255}, ${255})`,
                tag`rgb(${0}, ${0}, ${0})`
            ], t, v => Math.round(v))
        })
    ]

    stack = [].concat(
        //lines,
        //polygons,
        //circles,
        circleGroup,
        //texts
    );
});
</script>

<style lang="scss">

    .app {
        width: 100%;
        height: 100%;
        overflow: hidden;
    }

    .app__canvas {
        width: 100%;
        height: 100%;
    }

    .app__sidebar {
        width: 350px;
        padding: 1rem;
        overflow-y: auto;
        border-left: 1px solid var(--border__colour);
    }

    .app__time-range {
        display: block;
        width: 100%;
    }

</style>