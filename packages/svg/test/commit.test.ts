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

describe('SVG commit', () => {

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
        vi.unstubAllGlobals();
        vi.restoreAllMocks();
    });

    function renderPass(body: () => void) {
        ctx.save();
        ctx.markRenderStart();
        body();
        ctx.markRenderEnd();
        ctx.restore();
    }

    function drawRect(id: string) {
        ctx.fill = '#ff0000';

        const path = ctx.createPath(id);

        path.rect(0, 0, 10, 10);
        ctx.applyFill(path);
    }

    // Rendering used to defer to an animation frame, so nothing downstream could read the DOM it just drew.
    test('Should commit to the DOM by the time the render pass ends', () => {
        renderPass(() => drawRect('r1'));

        expect(ctx.element.querySelector('#r1')).not.toBeNull();
    });

    test('Should reflect the latest pass in the exported markup', () => {
        renderPass(() => drawRect('r1'));
        renderPass(() => drawRect('r2'));

        const markup = ctx.export().toString();

        expect(markup).toContain('id="r2"');
        expect(markup).not.toContain('id="r1"');
    });

    test('Should commit once per outermost pass, not per nested depth', () => {
        renderPass(() => {
            ctx.markRenderStart();
            drawRect('inner');
            ctx.markRenderEnd();

            expect(ctx.element.querySelector('#inner')).toBeNull();
        });

        expect(ctx.element.querySelector('#inner')).not.toBeNull();
    });

    // jsdom implements neither `SVGGeometryElement` nor the geometry methods the real hit test calls.
    function makeHitTestable(id: string) {
        const node = ctx.element.querySelector(`#${id}`)!;
        const isPointInFill = vi.fn(() => true);

        vi.stubGlobal('SVGGeometryElement', node.constructor);
        Object.assign(node, {
            isPointInFill,
        });

        ctx.element.createSVGPoint = vi.fn(() => ({
            x: 0,
            y: 0,
            matrixTransform: (matrix: unknown) => `mapped:${matrix}`,
        })) as never;

        return isPointInFill;
    }

    function stubCTM(id: string) {
        const getCTM = vi.fn(() => ({
            inverse: () => 'inverse-ctm',
        }));

        Object.assign(ctx.element.querySelector(`#${id}`)!, {
            getCTM,
        });

        return getCTM;
    }

    test('Should hit test against the node committed in the same pass', () => {
        renderPass(() => drawRect('hit'));

        const isPointInFill = makeHitTestable('hit');

        expect(ctx.isPointInPath(ctx.createPath('hit'), 5, 5)).toBe(true);
        expect(isPointInFill).toHaveBeenCalled();
    });

    // The reconciler already holds the node, so the hover path shouldn't re-search the document for it.
    test('Should resolve the hit node from the reconciler cache', () => {
        renderPass(() => drawRect('hit'));

        makeHitTestable('hit');

        const getElementById = vi.spyOn(ctx.element, 'getElementById');

        ctx.isPointInPath(ctx.createPath('hit'), 5, 5);

        expect(getElementById).not.toHaveBeenCalled();
    });

    test('Should fall back to a document lookup for a node the reconciler never created', () => {
        renderPass(() => drawRect('hit'));

        makeHitTestable('hit');

        const getElementById = vi.spyOn(ctx.element, 'getElementById').mockReturnValue(null);

        expect(ctx.isPointInPath(ctx.createPath('unknown'), 5, 5)).toBe(false);
        expect(getElementById).toHaveBeenCalledWith('unknown');
    });

    // S-19: the point arrives in the root's space, but SVG 2 reads it in the element's own.
    test('Should map the hit point into the element space through the inverse CTM', () => {
        renderPass(() => drawRect('hit'));

        const isPointInFill = makeHitTestable('hit');

        stubCTM('hit');

        ctx.isPointInPath(ctx.createPath('hit'), 5, 5);

        expect(isPointInFill).toHaveBeenCalledWith('mapped:inverse-ctm');
    });

    // jsdom declares no `getCTM`, and neither does any other partial DOM this could run under.
    test('Should hit test against the raw point when the DOM declares no getCTM', () => {
        renderPass(() => drawRect('hit'));

        const isPointInFill = makeHitTestable('hit');

        expect(ctx.isPointInPath(ctx.createPath('hit'), 5, 5)).toBe(true);
        expect(isPointInFill).toHaveBeenCalledWith(expect.objectContaining({
            x: 5,
            y: 5,
        }));
    });

    test('Should re-read the CTM after a commit rather than reusing the previous frame’s', () => {
        renderPass(() => drawRect('hit'));

        makeHitTestable('hit');

        const getCTM = stubCTM('hit');

        ctx.isPointInPath(ctx.createPath('hit'), 5, 5);
        ctx.isPointInPath(ctx.createPath('hit'), 5, 5);

        expect(getCTM).toHaveBeenCalledTimes(1);

        renderPass(() => drawRect('hit'));
        ctx.isPointInPath(ctx.createPath('hit'), 5, 5);

        expect(getCTM).toHaveBeenCalledTimes(2);
    });

});
