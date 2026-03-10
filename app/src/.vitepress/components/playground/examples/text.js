import {
    createText,
} from '@ripl/core';

const text = createText({
    x: scene.context.width / 2,
    y: scene.context.height / 2,
    content: 'Hello Ripl!',
    font: 'bold 48px system-ui, sans-serif',
    fill: '#6366f1',
    textAlign: 'center',
    textBaseline: 'middle',
});

scene.add(text);