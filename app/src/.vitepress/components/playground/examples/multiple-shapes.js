import {
    createCircle,
    createRect,
    createGroup
} from '@ripl/core';

const cx = scene.context.width / 2;
const cy = scene.context.height / 2;

const group = createGroup({
    children: [
        createRect({
            x: cx - 100,
            y: cy - 40,
            width: 80,
            height: 80,
            fillStyle: '#6366f1',
            cornerRadius: 8,
        }),
        createCircle({
            cx: cx,
            cy: cy,
            radius: 40,
            fillStyle: '#f59e0b',
        }),
        createRect({
            x: cx + 20,
            y: cy - 40,
            width: 80,
            height: 80,
            fillStyle: '#10b981',
            cornerRadius: 8,
        }),
    ],
});

scene.add(group);
