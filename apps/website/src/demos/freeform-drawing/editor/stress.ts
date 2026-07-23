import {
    PALETTE,
} from './constants';

import {
    createShapeId,
} from './model';

import type {
    Shape,
} from './model';

import type {
    Point,
} from '@ripl/web';

const FIELD = 6000;

function randomColor(): string {
    return PALETTE[Math.floor(Math.random() * (PALETTE.length - 1))];
}

function randomPoint(): Point {
    return [Math.random() * FIELD - FIELD / 2, Math.random() * FIELD - FIELD / 2];
}

/**
 * Generates a large field of assorted shapes used to demonstrate that pan/zoom stays a single
 * transform update over a big retained scene. Colours and positions vary by index so no runtime
 * randomness is required for reproducibility of counts.
 */
export function generateStressShapes(count: number): Shape[] {
    const shapes: Shape[] = [];

    for (let index = 0; index < count; index++) {
        const kind = index % 4;
        const [x, y] = randomPoint();
        const stroke = randomColor();
        const base = {
            id: createShapeId(),
            stroke,
            strokeWidth: 2 + Math.random() * 4,
            opacity: 0.9,
            dash: false,
            zIndex: 0,
        };

        if (kind === 0) {
            shapes.push({
                ...base,
                type: 'rect',
                fill: Math.random() > 0.5 ? stroke : null,
                x,
                y,
                width: 30 + Math.random() * 120,
                height: 30 + Math.random() * 120,
                radius: Math.random() > 0.5 ? 8 : 0,
            });
            continue;
        }

        if (kind === 1) {
            shapes.push({
                ...base,
                type: 'ellipse',
                fill: Math.random() > 0.5 ? stroke : null,
                x,
                y,
                width: 24 + Math.random() * 90,
                height: 24 + Math.random() * 90,
            });
            continue;
        }

        if (kind === 2) {
            shapes.push({
                ...base,
                type: 'line',
                fill: null,
                x1: x,
                y1: y,
                x2: x + (Math.random() - 0.5) * 200,
                y2: y + (Math.random() - 0.5) * 200,
            });
            continue;
        }

        const points: Point[] = Array.from({ length: 6 }, (_, step): Point => [
            x + Math.cos(step) * step * 8 + Math.random() * 20,
            y + Math.sin(step) * step * 8 + Math.random() * 20,
        ]);

        shapes.push({
            ...base,
            type: 'freehand',
            fill: null,
            highlighter: false,
            points,
        });
    }

    return shapes;
}
