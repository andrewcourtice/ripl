import {
    createCircle,
    easeInOutCubic,
} from '@ripl/core';

const cx = scene.context.width / 2;
const cy = scene.context.height / 2;

const circle = createCircle({
    cx,
    cy,
    radius: 20,
    fillStyle: '#6366f1',
});

scene.add(circle);

renderer.transition(circle, {
    state: { radius: 80 },
    duration: 1200,
    ease: easeInOutCubic,
});