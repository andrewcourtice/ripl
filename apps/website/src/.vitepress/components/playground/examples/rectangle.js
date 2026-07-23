import {
    createRect,
} from '@ripl/web';

const rect = createRect({
    x: scene.context.width / 2 - 60,
    y: scene.context.height / 2 - 40,
    width: 120,
    height: 80,
    fill: '#6366f1',
    cornerRadius: 8,
});

scene.add(rect);