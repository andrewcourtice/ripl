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
    circle,
    clamp,
    scaleContinuous,
    easeOutQuint,
    group,
    line,
    renderer,
    scene,
    serialiseRGB,
} from '@ripl/core';

let transitionCircles = () => {};

onMount(() => {
    let x = 0;
    let y = 0;

    const mainScene = scene('.example__canvas');
    const mainRenderer = renderer(mainScene, {
        autoStart: false
    });

    const rScale = scaleContinuous([0, 1], [5, 15]);
    const xScale = scaleContinuous([0, 1], [10, mainScene.canvas.width - 10]);
    const yScale = scaleContinuous([0, 1], [10, mainScene.canvas.height - 10]);

    const getColor = () => serialiseRGB(
        clamp(Math.random() * 255, 80, 230),
        clamp(Math.random() * 255, 80, 230),
        clamp(Math.random() * 255, 80, 230),
        1
    );

    const circles = Array.from({ length: 1000 }, (_, index) => circle({
        fillStyle: getColor(),
        radius: [rScale(Math.random()), rScale(Math.random())],
        x: [xScale(Math.random()), xScale(Math.random())],
        y: [yScale(Math.random()), yScale(Math.random())],
    }));
    
    const circleGroup = group({
        fillStyle: '#333333',
    });

    const crosshairHLine = line({
        points: () => [
            [x, 0],
            [x, mainScene.canvas.height]
        ]
    });

    const crosshairVLine = line({
        points: () => [
            [0, y],
            [mainScene.canvas.width, y]
        ]
    });

    const crosshairGroup = group({
        strokeStyle: '#CCCCCC'
    });
    
    circleGroup.add(circles);
    crosshairGroup.add([
        crosshairHLine,
        crosshairVLine,
    ]);

    mainScene.add([
        circleGroup,
        crosshairGroup
    ]);

    mainScene.on('scenemousemove', (sx, sy) => {
        x = sx;
        y = sy;
    });
    
    transitionCircles = () => {
        circles.forEach(crc => crc.to({
            fillStyle: getColor(),
            radius: rScale(Math.random()),
            x: xScale(Math.random()),
            y: yScale(Math.random()),
        }));

        mainRenderer.transition(circles, {
            duration: 3000,
            ease: easeOutQuint,
            delay: index => index * (1000 / circles.length)
        });
    }

    mainRenderer.start();
});
</script>