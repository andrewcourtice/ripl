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
} from '@ripl/core';

let transitionCircles = () => {};
let add = () => {};
let remove = () => {};
let removeOne = () => {};

onMount(() => {
    let x = 0;
    let y = 0;

    const scene = createScene('.example__canvas');
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
        fillStyle: '#000000',
        radius: [rScale(Math.random()), rScale(Math.random())],
        cx: [xScale(Math.random()), xScale(Math.random())],
        cy: [yScale(Math.random()), yScale(Math.random())],
    }, {
        class: index % 2 === 0 ? 'even' : 'odd'
    }));
    
    const circleGroup = createGroup({
        fillStyle: '#333333',
    });

    const crosshairHLine = createLine({
        x1: 0,
        y1: () => y,
        x2: scene.width,
        y2: () => y
    }, {
        pointerEvents: 'none'
    });

    const crosshairVLine = createLine({
        x1: () => x,
        y1: 0,
        x2: () => x,
        y2: scene.height
    }, {
        pointerEvents: 'none'
    });

    const crosshairGroup = createGroup({
        strokeStyle: '#CCCCCC'
    });
    
    circleGroup.add(circles);
    crosshairGroup.add([
        crosshairHLine,
        crosshairVLine,
    ]);

    scene.add([
        circleGroup,
        crosshairGroup
    ]);

    scene.on('scenemousemove', ({ data }) => {
        if (data) {
            x = data.x;
            y = data.y;
        }
    });

    circleGroup.on('elementclick', ({ element }) => {
        console.log(element);
        element.update({
            fillStyle: '#FF0000'
        });
    });
    
    transitionCircles = () => {
        circles.forEach(crc => crc.to({
            //fillStyle: getColor(),
            radius: rScale(Math.random()),
            cx: xScale(Math.random()),
            cy: yScale(Math.random()),
        }));

        renderer.transition(circles, {
            duration: 3000,
            ease: easeOutQuint,
            delay: index => index * (1000 / circles.length)
        });
    }
    
    add = () => scene.add(circleGroup);
    remove = () => scene.remove(circleGroup);
    removeOne = () => {
        const even = scene.findAll('.even');
        console.log(even);
        even.forEach(el => el.destroy());
    }

    renderer.start();
});
</script>