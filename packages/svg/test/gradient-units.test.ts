import {
    afterEach,
    beforeEach,
    describe,
    expect,
    test,
    vi,
} from 'vitest';

import type {
    SVGContext,
} from '../src';

import {
    createContext,
} from '../src';

import {
    createPolyline,
    createRect,
} from '@ripl/core';

import type {
    Element,
    Point,
} from '@ripl/core';

import {
    mockCanvasContext,
} from '@ripl/test-utils';

const POINTS: Point[] = [
    [0, 0],
    [10, 20],
    [20, 10],
    [30, 30],
    [40, 5],
    [50, 25],
];

describe('SVG gradient units', () => {

    let el: HTMLDivElement;
    let ctx: SVGContext;

    beforeEach(() => {
        mockCanvasContext();
        el = document.createElement('div');
        document.body.appendChild(el);
        ctx = createContext(el);
    });

    afterEach(() => {
        ctx.destroy();
        el.remove();
        vi.restoreAllMocks();
    });

    function renderPass(element: Element) {
        ctx.save();
        ctx.markRenderStart();
        element.render(ctx);
        ctx.markRenderEnd();
        ctx.restore();

    }

    function gradients() {
        return Array.from(ctx.element.querySelectorAll('linearGradient, radialGradient'));
    }

    test('Should resolve a linear gradient in user space against the element box', () => {
        renderPass(createRect({
            id: 'box',
            x: 100,
            y: 50,
            width: 200,
            height: 80,
            fill: 'linear-gradient(90deg, red, blue)',
        }));

        const [gradient] = gradients();

        expect(gradient.getAttribute('gradientUnits')).toBe('userSpaceOnUse');
        expect(Number(gradient.getAttribute('x1'))).toBeCloseTo(100, 3);
        expect(Number(gradient.getAttribute('x2'))).toBeCloseTo(300, 3);
        expect(Number(gradient.getAttribute('y1'))).toBeCloseTo(90, 3);
        expect(Number(gradient.getAttribute('y2'))).toBeCloseTo(90, 3);
    });

    // A user-space radial gradient is a circle, so the ellipse has to be restored by transform.
    test('Should keep a radial gradient elliptical', () => {
        renderPass(createRect({
            id: 'box',
            x: 0,
            y: 0,
            width: 200,
            height: 50,
            fill: 'radial-gradient(circle at 50% 50%, red, blue)',
        }));

        const [gradient] = gradients();

        expect(gradient.getAttribute('gradientUnits')).toBe('userSpaceOnUse');
        expect(Number(gradient.getAttribute('r'))).toBeCloseTo(100, 3);
        expect(gradient.getAttribute('gradientTransform')).toBe('translate(100.0000,25.0000) scale(1,0.2500) translate(-100.0000,-25.0000)');
    });

    // Each run is its own <path>, so a per-node bounding box restarted the ramp on every run.
    test('Should ramp once across every run of a segmented polyline', () => {
        renderPass(createPolyline({
            id: 'line',
            stroke: 'linear-gradient(90deg, red, blue)',
            lineWidth: 3,
            points: POINTS,
            segments: [{
                from: 1,
                to: 3,
                lineDash: [6, 4],
            }],
        }));

        const spans = gradients().map(gradient => [
            Number(gradient.getAttribute('x1')),
            Number(gradient.getAttribute('x2')),
        ]);

        // Each run spans the whole line's x range, not the sub-range of its own <path>.
        expect(spans).toEqual([[0, 50], [0, 50], [0, 50]]);
    });

    test('Should follow the element when it moves', () => {
        const rect = createRect({
            id: 'box',
            x: 0,
            y: 0,
            width: 100,
            height: 100,
            fill: 'linear-gradient(90deg, red, blue)',
        });

        renderPass(rect);
        expect(Number(gradients()[0].getAttribute('x2'))).toBeCloseTo(100, 3);

        rect.x = 400;
        renderPass(rect);

        expect(gradients()).toHaveLength(1);
        expect(Number(gradients()[0].getAttribute('x1'))).toBeCloseTo(400, 3);
        expect(Number(gradients()[0].getAttribute('x2'))).toBeCloseTo(500, 3);
    });

    test('Should fall back to the surface when there is no render element', () => {
        ctx.save();
        ctx.markRenderStart();
        ctx.fill = 'linear-gradient(90deg, red, blue)';

        const path = ctx.createPath('bare');

        path.rect(0, 0, 10, 10);
        ctx.applyFill(path);
        ctx.markRenderEnd();
        ctx.restore();

        const [gradient] = gradients();

        expect(path.definition.styles.fill).toMatch(/^url\(#gradient-/);
        expect(gradient.getAttribute('gradientUnits')).toBe('userSpaceOnUse');
    });

});
