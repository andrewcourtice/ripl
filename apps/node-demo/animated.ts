import '@ripl/node';

import {
    createCircle,
    createContext,
    createRenderer,
    createScene,
    createTerminalOutput,
    createText,
} from '@ripl/node';

const output = createTerminalOutput();
const context = createContext(output);
const scene = createScene(context);
const renderer = createRenderer(scene, {
    autoStart: false,
    autoStop: false,
});

// Enter alternate screen buffer and hide cursor
//process.stdout.write('\x1b[?1049h\x1b[?25l');

const w = context.width;
const h = context.height;

const label = createText({
    fill: '#ffffff',
    x: 8,
    y: 0,
    content: 'Ripl Terminal Context — Animated Demo',
});

const circle = createCircle({
    fill: '#3a86ff',
    cx: w / 6,
    cy: h / 2,
    radius: Math.min(w, h) / 8,
});

scene.add(label);
scene.add(circle);

renderer.start();

// Animate circle across the screen
await renderer.transition(circle, {
    duration: 2000,
    state: {
        cx: w - w / 6,
    },
});

// Animate back and change color
await renderer.transition(circle, {
    duration: 2000,
    state: {
        cx: w / 6,
        fill: '#ff006e',
    },
});

// Animate to center and grow
await renderer.transition(circle, {
    duration: 1500,
    state: {
        cx: w / 2,
        cy: h / 2,
        radius: Math.min(w, h) / 4,
        fill: '#00ff00',
    },
});

renderer.stop();

// Show cursor and leave alternate screen buffer
// process.stdout.write('\x1b[?25h\x1b[?1049l');
// process.exit(0);
