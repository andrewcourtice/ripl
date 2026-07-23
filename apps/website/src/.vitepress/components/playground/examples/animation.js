import {
    createCircle,
    easeInOutCubic,
} from '@ripl/web';

const cx = scene.context.width / 2;
const cy = scene.context.height / 2;

const circle = createCircle({
    cx,
    cy,
    radius: 20,
    fill: '#6366f1',
});

scene.add(circle);

renderer.transition(circle, {
    duration: 1200,
    ease: easeInOutCubic,
    state: { radius: 80 },
});