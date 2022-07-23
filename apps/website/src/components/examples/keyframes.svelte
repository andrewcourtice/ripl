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
    createCircle,
    createRect,
    createPolygon,
    interpolateCirclePoint,
    interpolatePolygonPoint,
    createPolyline,
    createArc,
TAU,
createText,
getArcCentroid,
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
        clear,
        width,
        height
    } = getContext('.example__canvas');

    const path = interpolateCirclePoint(width / 2, height / 2, width / 4);

    // const circle1 = createCircle({
    //     fillStyle: [
    //         {
    //             offset: 0,
    //             value: '#FF0000'
    //         },
    //         {
    //             offset: 0.5,
    //             value: '#00FF00'
    //         },
    //         {
    //             offset: 1,
    //             value: '#0000FF'
    //         }
    //     ],
    //     lineWidth: 4,
    //     x: t => path(t)[0],
    //     y: t => path(t)[1],
    //     radius: [width / 5, width / 3]
    // });

    const circle1 = createArc({
        strokeStyle: 'rgba(0, 0, 0, 0.3)',
        fillStyle: 'rgba(0, 0, 0, 0.25)',
        lineWidth: 4,
        lineJoin: 'round',
        cx: width / 2,
        cy: height / 2,
        radius: height / 3,
        innerRadius: height / 5,
        startAngle: 0,
        endAngle: [0, TAU]
    });

    const text = createText({
        fillStyle: '#000000',
        font: '32px Helvetica',
        textAlign: 'center',
        textBaseline: 'middle',
        x: () => getArcCentroid(circle1.state())[0],
        y: () => getArcCentroid(circle1.state())[1],
        content: 'A Donut'
    });

    render = time => {
        clear();
        circle1.render(context, time);
        text.render(context, time);
    }
});
</script>