// Side-effect import: `@ripl/web` registers the browser factory (canvas context, text
// measurement, rAF). `@ripl/charts` is context-agnostic and installs no backend of its own.
import '@ripl/web';

import {
    afterEach,
    beforeEach,
    describe,
    expect,
    test,
    vi,
} from 'vitest';

import {
    mockCanvasContext,
} from '@ripl/test-utils';

import type {
    Point,
} from '@ripl/core';

import {
    createArcDiagramChart,
} from '../src';

const WIDTH = 640;
const HEIGHT = 320;

const NODES = [
    { id: 'a' },
    { id: 'b' },
    { id: 'c' },
    { id: 'd' },
    { id: 'e' },
    { id: 'f' },
];

// The large link is declared last so it is drawn on top, where an unfixed fill test resolves the hover to it.
const LINKS = [
    {
        source: 'c',
        target: 'd',
        value: 1,
    },
    {
        source: 'a',
        target: 'f',
        value: 10,
    },
];

/**
 * A `Path2D` that keeps the vertices traced through it, so the stubs below can answer fill and
 * stroke hit tests from real geometry instead of a constant `false`.
 */
class RecordingPath2D {

    public vertices: Point[] = [];

    public moveTo(x: number, y: number) {
        this.vertices.push([x, y]);
    }

    public lineTo(x: number, y: number) {
        this.vertices.push([x, y]);
    }

    public arc() {}
    public arcTo() {}
    public addPath() {}
    public bezierCurveTo() {}
    public closePath() {}
    public ellipse() {}
    public quadraticCurveTo() {}
    public rect() {}
    public roundRect() {}

}

/** Even-odd containment against the traced vertices, implicitly closed the way a native fill test closes an open path. */
function isPointInPolygon(vertices: Point[], x: number, y: number): boolean {
    let inside = false;

    for (let i = 0, j = vertices.length - 1; i < vertices.length; j = i++) {
        const [xi, yi] = vertices[i];
        const [xj, yj] = vertices[j];

        if ((yi > y) !== (yj > y) && x < ((xj - xi) * (y - yi)) / (yj - yi) + xi) {
            inside = !inside;
        }
    }

    return inside;
}

function distanceToSegment(from: Point, to: Point, x: number, y: number): number {
    const dx = to[0] - from[0];
    const dy = to[1] - from[1];
    const lengthSquared = dx * dx + dy * dy;
    const t = lengthSquared === 0
        ? 0
        : Math.max(0, Math.min(1, ((x - from[0]) * dx + (y - from[1]) * dy) / lengthSquared));

    return Math.hypot(x - (from[0] + t * dx), y - (from[1] + t * dy));
}

function isPointOnStroke(vertices: Point[], x: number, y: number, lineWidth: number): boolean {
    for (let i = 1; i < vertices.length; i++) {
        if (distanceToSegment(vertices[i - 1], vertices[i], x, y) <= lineWidth / 2) {
            return true;
        }
    }

    return false;
}

describe('arc diagram hit testing', () => {

    let host: HTMLDivElement;
    let previousPath2D: typeof globalThis.Path2D;

    beforeEach(() => {
        previousPath2D = globalThis.Path2D;
        (globalThis as { Path2D: unknown }).Path2D = RecordingPath2D;

        const stub = mockCanvasContext();

        stub.isPointInPath.mockImplementation(((path: RecordingPath2D, x: number, y: number) => {
            return isPointInPolygon(path.vertices, x, y);
        }) as never);

        stub.isPointInStroke.mockImplementation(((path: RecordingPath2D, x: number, y: number) => {
            return isPointOnStroke(path.vertices, x, y, stub.lineWidth);
        }) as never);

        host = document.createElement('div');
        document.body.appendChild(host);
    });

    afterEach(() => {
        globalThis.Path2D = previousPath2D;
        host.remove();
        vi.restoreAllMocks();
    });

    async function createChart() {
        const chart = createArcDiagramChart(host, {
            autoRender: false,
            animation: false,
            nodes: NODES,
            links: LINKS,
        });

        const scene = (chart as unknown as { scene: {
            context: { rescale(width: number, height: number): void };
            getElementById(id: string): unknown;
            render(): void;
        }; }).scene;

        scene.context.rescale(WIDTH, HEIGHT);

        await chart.render();
        scene.render();

        return {
            chart,
            scene,
        };
    }

    // The small link's apex sits inside the large link's chord fill, where the large link used to swallow every hover.
    test('Should resolve a hover on a small link that overlaps a large one to the small link', async () => {
        const { scene } = await createChart();

        const large = scene.getElementById('arc-a~f') as { points: Point[] };
        const small = scene.getElementById('arc-c~d') as { points: Point[] };

        expect(large).toBeTruthy();
        expect(small).toBeTruthy();

        const [x, y] = small.points[Math.floor(small.points.length / 2)];

        const hits = (scene as unknown as {
            context: { hitTest(events: string[], x: number, y: number): { id: string }[] };
        }).context.hitTest(['mousemove', 'mouseenter', 'mouseleave'], x, y);

        // The DOM context dispatches to the first hit, so the large link topping the list is the user-visible failure.
        expect(hits[0]?.id).toBe('arc-c~d');
        expect(hits.map(hit => hit.id)).toEqual(['arc-c~d']);
    });

});
