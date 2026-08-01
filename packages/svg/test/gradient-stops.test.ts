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
    mockCanvasContext,
} from '@ripl/test-utils';

describe('SVG gradient stop reuse', () => {

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

    function renderPass(body: () => void) {
        ctx.save();
        ctx.markRenderStart();
        body();
        ctx.markRenderEnd();
        ctx.restore();
        ctx.export();
    }

    // The surface is 0x0 under jsdom, so gradient bounds only move if a render element supplies a box.
    function drawRect(id: string, fill: string, width = 10) {
        ctx.currentRenderElement = {
            id,
            abstract: true,
            getBoundingBox: () => ({
                top: 0,
                left: 0,
                width,
                height: 10,
            }),
        } as never;

        ctx.fill = fill;

        const path = ctx.createPath(id);

        path.rect(0, 0, width, 10);
        ctx.applyFill(path);
    }

    function getGradientElement() {
        return ctx.element.querySelector('defs > linearGradient, defs > radialGradient')!;
    }

    function getStops() {
        return Array.from(getGradientElement().children);
    }

    test('Should keep the same stop nodes across passes when nothing changes', () => {
        renderPass(() => drawRect('r1', 'linear-gradient(180deg, red, blue)'));

        const before = getStops();

        renderPass(() => drawRect('r1', 'linear-gradient(180deg, red, blue)'));

        const after = getStops();

        expect(before).toHaveLength(2);
        expect(after[0]).toBe(before[0]);
        expect(after[1]).toBe(before[1]);
    });

    test('Should rebuild the stop nodes when a stop color changes', () => {
        renderPass(() => drawRect('r1', 'linear-gradient(180deg, red, blue)'));

        const before = getStops();

        renderPass(() => drawRect('r1', 'linear-gradient(180deg, red, green)'));

        const after = getStops();

        expect(after[0]).not.toBe(before[0]);
        expect(after[1].getAttribute('stop-color')).toBe('green');
    });

    test('Should rebuild the stop nodes when a stop offset changes', () => {
        renderPass(() => drawRect('r1', 'linear-gradient(180deg, red 0%, blue 100%)'));

        const before = getStops();

        renderPass(() => drawRect('r1', 'linear-gradient(180deg, red 20%, blue 100%)'));

        expect(getStops()[0]).not.toBe(before[0]);
        expect(getStops()[0].getAttribute('offset')).toBe('20%');
    });

    // Coordinates move with the element; the stops they ramp between do not.
    test('Should rewrite coordinates without touching the stop nodes when the bounds move', () => {
        renderPass(() => drawRect('r1', 'linear-gradient(90deg, red, blue)', 10));

        const before = getStops();
        const beforeX2 = getGradientElement().getAttribute('x2');

        renderPass(() => drawRect('r1', 'linear-gradient(90deg, red, blue)', 80));

        expect(getStops()[0]).toBe(before[0]);
        expect(getGradientElement().getAttribute('x2')).not.toBe(beforeX2);
    });

    test('Should not rewrite coordinates when neither the paint nor the bounds change', () => {
        renderPass(() => drawRect('r1', 'linear-gradient(90deg, red, blue)'));

        const setAttribute = vi.spyOn(getGradientElement(), 'setAttribute');

        renderPass(() => drawRect('r1', 'linear-gradient(90deg, red, blue)'));

        expect(setAttribute).not.toHaveBeenCalled();
    });

    test('Should swap the defs primitive when the gradient type changes', () => {
        renderPass(() => drawRect('r1', 'linear-gradient(90deg, red, blue)'));

        expect(ctx.element.querySelectorAll('defs > linearGradient')).toHaveLength(1);

        renderPass(() => drawRect('r1', 'radial-gradient(circle at 50% 50%, red, blue)'));

        expect(ctx.element.querySelectorAll('defs > linearGradient')).toHaveLength(0);
        expect(ctx.element.querySelectorAll('defs > radialGradient')).toHaveLength(1);
    });

    test('Should drop spreadMethod when a repeating gradient becomes non-repeating', () => {
        renderPass(() => drawRect('r1', 'repeating-linear-gradient(90deg, red, blue)'));

        expect(getGradientElement().getAttribute('spreadMethod')).toBe('repeat');

        renderPass(() => drawRect('r1', 'linear-gradient(90deg, red, blue)'));

        expect(getGradientElement().getAttribute('spreadMethod')).toBeNull();
    });

});
