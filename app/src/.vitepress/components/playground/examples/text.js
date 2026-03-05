import {
    createText
} from '@ripl/core';

const text = createText({
    x: scene.context.width / 2,
    y: scene.context.height / 2,
    body: 'Hello Ripl!',
    fontSize: 48,
    fontFamily: 'system-ui, sans-serif',
    fontWeight: 'bold',
    fillStyle: '#6366f1',
    textAlign: 'center',
    textBaseline: 'middle',
});

scene.add(text);
renderer.start();
