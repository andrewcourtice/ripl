import {
    createCircle
} from '@ripl/core';

const circle = createCircle({
    cx: scene.context.width / 2,
    cy: scene.context.height / 2,
    radius: 80,
    fillStyle: '#6366f1',
});

scene.add(circle);
