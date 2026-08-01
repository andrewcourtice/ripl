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

const REFERENCING_PROPERTIES = ['clip-path', 'fill', 'stroke', 'filter'];

/**
 * Buffered rendering defers the DOM reconcile to a frame, so every test here drives the frame by
 * hand — `export()` would collapse the deferred work back into one task and hide what is being
 * measured.
 */
describe('SVG defs timing', () => {

    let el: HTMLDivElement;
    let ctx: SVGContext;
    let frames: FrameRequestCallback[];

    beforeEach(() => {
        mockCanvasContext();

        frames = [];

        vi.spyOn(window, 'requestAnimationFrame').mockImplementation(callback => {
            frames.push(callback);
            return frames.length;
        });

        vi.spyOn(window, 'cancelAnimationFrame').mockImplementation(handle => {
            frames[handle - 1] = () => undefined;
        });

        el = document.createElement('div');
        document.body.appendChild(el);
        ctx = createContext(el);
    });

    afterEach(() => {
        ctx.destroy();
        el.remove();
        vi.restoreAllMocks();
    });

    function flushFrames() {
        const pending = frames;

        frames = [];
        pending.forEach(callback => callback(0));
    }

    function renderPass(body: () => void) {
        ctx.save();
        ctx.markRenderStart();
        body();
        ctx.markRenderEnd();
        ctx.restore();
    }

    /** Every `url(#…)` a live node points at, that resolves to nothing inside `<defs>`. */
    function danglingReferences(): string[] {
        const defIds = new Set(Array.from(ctx.element.querySelectorAll('defs > *')).map(node => node.id).filter(Boolean));
        const dangling: string[] = [];

        Array.from(ctx.element.querySelectorAll('*')).forEach(node => {
            REFERENCING_PROPERTIES.forEach(property => {
                const value = node.getAttribute(property) ?? (node as SVGElement).style?.getPropertyValue(property) ?? '';
                // Styles serialize the reference quoted (`url("#id")`), attributes do not.
                const match = /url\(\s*["']?#([^"')]+)["']?\s*\)/.exec(value);

                if (match && !defIds.has(match[1])) {
                    dangling.push(`${property}=${match[1]}`);
                }
            });
        });

        return dangling;
    }

    function drawClipped(pass: string) {
        const clip = ctx.createPath(`clip-${pass}`);

        clip.rect(0, 0, 5, 5);
        ctx.applyClip(clip);

        const shape = ctx.createPath(`shape-${pass}`);

        shape.rect(0, 0, 10, 10);
        ctx.applyFill(shape);
    }

    function drawGradient(pass: string) {
        ctx.fill = 'linear-gradient(180deg, red, blue)';

        const shape = ctx.createPath(`gradient-${pass}`);

        shape.rect(0, 0, 10, 10);
        ctx.applyFill(shape);
    }

    // The demos mint a fresh element id per redraw, so every def is created and swept every frame.
    test('Should never leave a live node pointing at a swept clip def', () => {
        renderPass(() => drawClipped('a'));
        flushFrames();

        expect(ctx.element.querySelector('[clip-path]')).not.toBeNull();
        expect(danglingReferences()).toEqual([]);

        renderPass(() => drawClipped('b'));

        // The DOM still holds pass "a" until the deferred reconcile, so "a" must still resolve.
        expect(danglingReferences()).toEqual([]);

        flushFrames();
        expect(danglingReferences()).toEqual([]);
    });

    test('Should never leave a live node pointing at a swept gradient def', () => {
        renderPass(() => drawGradient('a'));
        flushFrames();

        expect(danglingReferences()).toEqual([]);

        renderPass(() => drawGradient('b'));
        expect(danglingReferences()).toEqual([]);

        flushFrames();
        expect(danglingReferences()).toEqual([]);
    });

    test('Should hold no dangling reference across a long run of fresh ids', () => {
        const observed: number[] = [];

        for (let pass = 0; pass < 20; pass++) {
            renderPass(() => drawClipped(`p${pass}`));
            observed.push(danglingReferences().length);
            flushFrames();
            observed.push(danglingReferences().length);
        }

        expect(observed.filter(count => count > 0)).toEqual([]);
    });

    test('Should still collect defs an element stopped using', () => {
        renderPass(() => drawGradient('a'));
        flushFrames();

        expect(ctx.element.querySelectorAll('defs > *')).toHaveLength(1);

        renderPass(() => undefined);
        flushFrames();

        expect(ctx.element.querySelectorAll('defs > *')).toHaveLength(0);
    });

    test('Should keep defs bounded while ids churn', () => {
        for (let pass = 0; pass < 20; pass++) {
            renderPass(() => drawClipped(`p${pass}`));
            flushFrames();
        }

        expect(ctx.element.querySelectorAll('defs > *').length).toBeLessThanOrEqual(1);
    });

});
