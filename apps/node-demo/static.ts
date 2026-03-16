import '@ripl/node';

import {
    createCircle,
    createContext,
    createLine,
    createRect,
    createTerminalOutput,
    createText,
} from '@ripl/node';

const output = createTerminalOutput();
const context = createContext(output);

const w = context.width;
const h = context.height;

context.batch(() => {
    // Blue filled circle
    createCircle({
        fill: '#3a86ff',
        cx: w / 4,
        cy: h / 2,
        radius: Math.min(w, h) / 6,
    }).render(context);

    // Red filled rectangle
    createRect({
        fill: '#ff006e',
        x: w / 2,
        y: h / 4,
        width: w / 4,
        height: h / 2,
    }).render(context);

    // Green diagonal line
    createLine({
        stroke: '#00ff00',
        x1: 10,
        y1: 10,
        x2: w / 3,
        y2: h / 3,
        lineWidth: 2,
    }).render(context);

    // Text label
    createText({
        fill: '#ffffff',
        x: 8,
        y: 0,
        content: 'Ripl Terminal Context — Static Demo',
    }).render(context);
});

// Move cursor below output
process.stdout.write(`\x1b[${output.rows + 1};1H\n`);
