import {
    createText,
} from '@ripl/web';

const text = createText({
    x: scene.context.width / 2,
    y: scene.context.height / 2,
    content: 'Hello Ripl!',
    fill: '#6366f1',
    font: 'bold 48px system-ui, sans-serif',
    textAlign: 'center',
    textBaseline: 'middle',
});

scene.add(text);