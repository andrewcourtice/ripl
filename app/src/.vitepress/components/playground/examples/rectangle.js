import {
    createRect,
} from '@ripl/core';

const rect = createRect({
    x: scene.context.width / 2 - 60,
    y: scene.context.height / 2 - 40,
    width: 120,
    height: 80,
    fillStyle: '#6366f1',
    cornerRadius: 8,
});

scene.add(rect);