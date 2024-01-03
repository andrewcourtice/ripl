<Example>
    <div slot="sidebar">
        <button on:click={transitionCircles}>Transition</button>
        <button on:click={add}>Add</button>
        <button on:click={remove}>Remove</button>
        <button on:click={removeOne}>Remove One</button>
    </div>
</Example>

<script lang="ts">
import Example from './base/example.svelte';

import {
    onMount
} from 'svelte';

import {
    clamp,
    scaleContinuous,
    easeOutQuint,
    serialiseRGB,
    createScene,
    createRenderer,
    createCircle,
    createGroup,
    createLine,
    typeIsElement,
} from '@ripl/core';

let transitionCircles = () => {};
let add = () => {};
let remove = () => {};
let removeOne = () => {};

onMount(() => {
    let x = 0;
    let y = 0;

    const scene = createScene('.example__root');
    const renderer = createRenderer(scene, {
        autoStart: false
    });

    const rScale = scaleContinuous([0, 1], [5, 10]);
    const xScale = scaleContinuous([0, 1], [10, scene.width - 10]);
    const yScale = scaleContinuous([0, 1], [10, scene.height - 10]);

    const getColor = () => serialiseRGB(
        clamp(Math.random() * 255, 80, 230),
        clamp(Math.random() * 255, 80, 230),
        clamp(Math.random() * 255, 80, 230),
        1
    );

    const circles = Array.from({ length: 1000 }, (_, index) => createCircle({
        class: index % 2 === 0 ? 'even' : 'odd',
        fillStyle: getColor(),
        radius: rScale(Math.random()),
        cx: xScale(Math.random()),
        cy: yScale(Math.random()),
    }));
    
    const circleGroup = createGroup({
        fillStyle: '#333333',
        children: circles
    });

    const crosshairHLine = createLine({
        x1: 0,
        y1: y,
        x2: scene.width,
        y2: y,
        pointerEvents: 'none',
    });

    const crosshairVLine = createLine({
        x1: x,
        y1: 0,
        x2: x,
        y2: scene.height,
        pointerEvents: 'none',
    });

    const crosshairGroup = createGroup({
        strokeStyle: '#CCCCCC',
        children: [
            crosshairHLine,
            crosshairVLine
        ]
    });

    scene.add([
        circleGroup,
        crosshairGroup
    ]);

    scene.on('scene:mousemove', ({ data }) => {
        crosshairHLine.y1 = data.y;
        crosshairHLine.y2 = data.y;
        crosshairVLine.x1 = data.x;
        crosshairVLine.x2 = data.x;
    });

    circleGroup.on('element:click', ({ target }) => {
        if (typeIsElement(target)) {
            target.fillStyle = '#FF0000';
        }
    });
    
    transitionCircles = () => {      
        renderer.transition(circles, (element, index, length) => ({
            duration: 3000,
            ease: easeOutQuint,
            delay: index * (1000 / length),
            state: {
                radius: rScale(Math.random()),
                cx: xScale(Math.random()),
                cy: yScale(Math.random()),
            }
        }));
    }
    
    // add = () => scene.add(circleGroup);
    // remove = () => scene.remove(circleGroup);
    // removeOne = () => {
    //     const even = scene.findAll('.even');
    //     console.log(even);
    //     even.forEach(el => el.destroy());
    // }

    renderer.start();
});
</script>