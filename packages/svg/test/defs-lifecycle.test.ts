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

interface ContextInternals {
    _gradientCache: Map<string, unknown>;
    _clipCache: Map<string, unknown>;
    _textPathCache: Map<string, unknown>;
    _shadowCache: Map<string, unknown>;
}

describe('SVG defs lifecycle', () => {

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

    function getInternals() {
        return ctx as unknown as ContextInternals;
    }

    function getDefs() {
        return ctx.element.querySelector('defs')!;
    }

    function renderPass(body: () => void) {
        ctx.save();
        ctx.markRenderStart();
        body();
        ctx.markRenderEnd();
        ctx.restore();
        ctx.export();
    }

    function drawRect(id: string) {
        const path = ctx.createPath(id);
        path.rect(0, 0, 10, 10);
        ctx.applyFill(path);
    }

    test('Should sweep gradient defs when the element is no longer rendered', () => {
        renderPass(() => {
            ctx.fill = 'linear-gradient(180deg, red, blue)';
            drawRect('g1');
        });

        expect(getDefs().childElementCount).toBe(1);
        expect(getInternals()._gradientCache.size).toBe(1);

        renderPass(() => {
            // g1 destroyed: not rendered this pass
        });

        expect(getDefs().childElementCount).toBe(0);
        expect(getInternals()._gradientCache.size).toBe(0);
    });

    test('Should sweep a gradient def when the fill becomes a solid color', () => {
        renderPass(() => {
            ctx.fill = 'linear-gradient(180deg, red, blue)';
            drawRect('g1');
        });

        expect(getDefs().childElementCount).toBe(1);

        renderPass(() => {
            ctx.fill = 'red';
            drawRect('g1');
        });

        expect(getDefs().childElementCount).toBe(0);
        expect(getInternals()._gradientCache.size).toBe(0);
    });

    test('Should keep defs bounded while toggling a clip across many passes', () => {
        for (let i = 0; i < 50; i++) {
            const clipped = i % 2 === 0;

            renderPass(() => {
                if (clipped) {
                    const clipPath = ctx.createPath('clip');
                    clipPath.rect(0, 0, 5, 5);
                    ctx.applyClip(clipPath);
                }

                drawRect('content');
            });

            expect(getDefs().childElementCount).toBeLessThanOrEqual(1);
        }

        renderPass(() => drawRect('content'));

        expect(getDefs().childElementCount).toBe(0);
        expect(getInternals()._clipCache.size).toBe(0);
    });

    test('Should sweep the clip def when the clipped element is destroyed', () => {
        renderPass(() => {
            const clipPath = ctx.createPath('clip');
            clipPath.rect(0, 0, 5, 5);
            ctx.applyClip(clipPath);

            drawRect('content');
        });

        expect(getDefs().querySelector('clipPath')).not.toBeNull();

        renderPass(() => {
            // content destroyed: nothing rendered this pass
        });

        expect(getDefs().childElementCount).toBe(0);
        expect(getInternals()._clipCache.size).toBe(0);
    });

    test('Should sweep the textpath def when path data is dropped', () => {
        renderPass(() => ctx.createText({
            id: 'label',
            x: 0,
            y: 0,
            content: 'Hello',
            pathData: 'M0,0 L100,100',
        }));

        expect(getDefs().querySelectorAll('path')).toHaveLength(1);

        renderPass(() => ctx.createText({
            id: 'label',
            x: 0,
            y: 0,
            content: 'Hello',
        }));

        expect(getDefs().childElementCount).toBe(0);
        expect(getInternals()._textPathCache.size).toBe(0);
    });

    test('Should sweep the textpath def when the text element is destroyed', () => {
        renderPass(() => ctx.createText({
            id: 'label',
            x: 0,
            y: 0,
            content: 'Hello',
            pathData: 'M0,0 L100,100',
        }));

        expect(getDefs().querySelectorAll('path')).toHaveLength(1);

        renderPass(() => {
            // label destroyed: nothing rendered this pass
        });

        expect(getDefs().childElementCount).toBe(0);
        expect(getInternals()._textPathCache.size).toBe(0);
    });

    test('Should create a shadow filter def and sweep it when the element is removed', () => {
        renderPass(() => {
            ctx.shadowColor = 'rgba(0, 0, 0, 0.5)';
            ctx.shadowBlur = 8;
            ctx.shadowOffsetX = 2;
            ctx.shadowOffsetY = 3;
            drawRect('shadowed');
        });

        const filter = getDefs().querySelector('filter');
        const dropShadow = filter?.querySelector('feDropShadow');

        expect(filter).not.toBeNull();
        expect(dropShadow).not.toBeNull();
        expect(dropShadow!.getAttribute('dx')).toBe('2');
        expect(dropShadow!.getAttribute('dy')).toBe('3');
        expect(dropShadow!.getAttribute('stdDeviation')).toBe('4');

        renderPass(() => {
            // shadowed destroyed: nothing rendered this pass
        });

        expect(getDefs().childElementCount).toBe(0);
        expect(getInternals()._shadowCache.size).toBe(0);
    });

    test('Should not create a shadow filter for a fully transparent shadow color', () => {
        renderPass(() => {
            ctx.shadowColor = 'rgba(0, 0, 0, 0)';
            ctx.shadowBlur = 8;
            drawRect('shape');
        });

        expect(getDefs().childElementCount).toBe(0);
        expect(ctx.element.querySelector('#shape')!.getAttribute('filter')).toBeNull();
    });

    test('Should degrade a conic gradient fill to a solid mid-stop color', () => {
        renderPass(() => {
            ctx.fill = 'conic-gradient(from 0deg, rgb(255, 0, 0), rgb(0, 255, 0), rgb(0, 0, 255))';
            drawRect('conic');
        });

        const domNode = ctx.element.querySelector('#conic') as SVGElement;

        expect(getDefs().childElementCount).toBe(0);
        expect(domNode.style.fill).not.toContain('conic-gradient');
        expect(domNode.style.fill).toContain('rgb');
    });

});
