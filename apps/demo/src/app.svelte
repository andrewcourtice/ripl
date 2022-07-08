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
        <button on:click="{demo.tween}">Tween</button>
        <button on:click="{demo.add}">Add circles</button>
        <button on:click="{demo.remove}">Remove circles</button>
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
    interpolateString,
    type Point,
    type Element,
    group,
    renderer,
    scene,
    type Scene,
TAU,
} from '@ripl/core';

let time = 1;
let canvas: HTMLCanvasElement;
let demo: ReturnType<typeof createDemo>;

// $: if (demo) {   
//     demo.render(time);
// }

function createSineDemo() {
    const scn = scene(canvas);
    const rnd = renderer(scn, {
        autoStart: false
    });

    let frequency = 3;
    let amplitude = 2;
    let start = 0;
    let lowerBound = canvas.height * 0.75;
    let upperBound = canvas.height * 0.25;

    let scaleX = continuous([0, TAU], [0, canvas.width]);
    let scaleY = continuous([-amplitude, amplitude], [lowerBound, upperBound]);
    let inScaleX = continuous([0, canvas.width], [0, TAU]);

    let mouseX = 0;
    let mouseY = 0;

    const getWave = (func: keyof Pick<Math, 'sin' | 'cos'>, color: string) => spline({
        strokeStyle: color,
        lineWidth: 4,
        points: () => Array.from({ length: 5 }, (_, i) => {
            const x = i * (TAU / 4);
            const y = amplitude * Math[func]((start + x) * frequency);

            return [
                scaleX(x), 
                scaleY(y)
            ];
        })
    });

    const xAxisLine = line({
        strokeStyle: '#CCCCCC',
        lineWidth: 2,
        points: () => [
            [0, lowerBound + 10],
            [canvas.width, lowerBound + 10]
        ]
    });

    const highlightMarker = circle({
        fillStyle: '#000000',
        strokeStyle: '#FFFFFF',
        lineWidth: 4,
        radius: 10,
        x: () => mouseX,
        y: () => scaleY(amplitude * Math.sin(((start + inScaleX(mouseX)) * frequency)))
    });

    scn.on('scenemousemove', (x, y) => {
        mouseX = x;
        mouseY = y;
    });
    
    rnd.on('tick', (currentTime, startTime) => {
        const elapsedSeconds = (currentTime - startTime) / 1000;
        start = (TAU / 8) * elapsedSeconds;
    });

    scn.add([
        getWave('sin', '#FF0000'),
        getWave('cos', '#0000FF'),
        highlightMarker,
        xAxisLine
    ]);

    //scn.context.clearRect(0, 0, scn.canvas.width, scn.canvas.height)
    //scn.render();
    //xAxisLine.render(canvas.getContext('2d'));

    rnd.start();

    return {
        render: t => scn.render(t)
    }
}

function createDemo() {
    const scn = scene(canvas);
    const rnd = renderer(scn, {
        autoStart: false
    });
    
    const length = 20;
    const xScale = continuous([0, length - 1], [10, canvas.width - 10]);
    const yScale = continuous([-100, 100], [canvas.height - 10, 10]);
    const rand = () => Math.random() * (Math.random() < 0.5 ? -1 : 1);
    
    const getPoints = () => Array.from({ length }, (_, i) => [
        xScale(i),
        yScale(rand() * 50)
    ] as Point);

    const getColor = () => rgbToHex(
        Math.round(Math.random() * 255),
        Math.round(Math.random() * 255),
        Math.round(Math.random() * 255)
    )
    
    const circles = Array.from({ length: 1000 }, (_, i) => circle({
        // fillStyle: ['#00FF00', '#0000FF'],
        fillStyle: ['#000000', '#FF0000'],
        x: [Math.random() * canvas.width, Math.random() * canvas.width],
        y: [Math.random() * canvas.height, Math.random() * canvas.height],
        radius: [Math.random() * 5, Math.random() * 5]
    }));

    const points = getPoints();
    
    const splines = Array.from({ length: 2 }, (_, i) => line({
        strokeStyle: '#000000',
        //fillStyle: '#000000',
        lineJoin: 'round',
        lineCap: 'round',
        lineWidth: 8,
        //lineDash: () => [2, 8],
        points: () => drawLinePoints(points)(time)
    }));

    // const lines = Array.from({ length: 2 }, (_, i) => line({
    //     strokeStyle: '#CCCCCC',
    //     fillStyle: null,
    //     lineJoin: 'round',
    //     lineCap: 'round',
    //     lineWidth: 8,
    //     //lineDash: () => [2, 8],
    //     points: () => drawLinePoints(points)(time)
    // }));

    const thing = line({
        strokeStyle: '#000000',
        points: getPolygonPoints(6, canvas.width / 2, canvas.height / 2, 300)
    });
    
    //scn.add(circles);
    // scn.add(splines);
    // scn.add(lines);
    // scn.add(thing);

    const grp1 = group();
    const grp2 = group();
    const grp3 = group();

    const add = () => {
        grp3.add(circles);
    };
    const remove = () => grp3.remove(circles);

    scn.add(splines);
    grp1.add([
        //...lines,
        grp2
    ]);

    grp2.add([
        thing,
        grp3,
    ]);

    scn.add(grp1);

    let x = 0;
    let y = 0;
    let cursorStroke = '#000000';
    let showCursor = false;

    const cursor = circle({
        strokeStyle: () => showCursor ? cursorStroke : undefined,
        lineWidth: 4,
        radius: 20,
        x: () => x,
        y: () => y,
    }, {
        pointerEvents: 'none'
    });

    scn.add(cursor);

    scn.on('scenemouseenter', () => showCursor = true);
    scn.on('scenemouseleave', () => showCursor = false);
    scn.on('scenemousemove', (mx, my) => {
        x = mx;
        y = my;
    });

    scn.on('elementmouseenter', element => {
        if (element.name === 'arc') {
            cursorStroke = element.state().fillStyle;
        }
    });

    scn.on('elementmouseleave', element => {
        cursorStroke = '#000000';
    });

    async function tween() {
        circles.forEach(({ to }) => to({
            fillStyle: getColor(),
            x: Math.random() * canvas.width,
            y: Math.random() * canvas.height,
            radius: Math.random() * 10
        }));

        //lines.forEach()

        await rnd.transition(circles, {
            duration: 2000,
            ease: easeOutQuad,
            delay: i => i * (2000 / circles.length),
        });
    }

    rnd.start();
    //scn.render();

    return {
        tween,
        add,
        remove
    }
}

onMount(() => {
    demo = createDemo();

    // let lowerBound = canvas.height * 0.75;
    // let upperBound = canvas.height * 0.25;

    // const xAxisLine = line({
    //     strokeStyle: '#CCCCCC',
    //     lineWidth: 2,
    //     points: () => [
    //         [0, lowerBound + 10],
    //         [canvas.width, lowerBound + 10]
    //     ]
    // });

    // xAxisLine.render(canvas.getContext('2d'));
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