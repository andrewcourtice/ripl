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

describe('SVG attribute/style removal', () => {

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

        // Rendering is buffered to rAF; export forces a synchronous reconcile.
        ctx.export();
    }

    function drawRect(id: string) {
        const path = ctx.createPath(id);
        path.rect(0, 0, 10, 10);
        ctx.applyFill(path);

        return path;
    }

    test('Should remove a stale transform attribute when the element is no longer rotated', () => {
        renderPass(() => {
            ctx.rotate(Math.PI / 4);
            drawRect('shape');
        });

        const domNode = ctx.element.querySelector('#shape');

        expect(domNode).not.toBeNull();
        expect(domNode!.getAttribute('transform')).toContain('rotate(');

        renderPass(() => drawRect('shape'));

        expect(ctx.element.querySelector('#shape')).toBe(domNode);
        expect(domNode!.getAttribute('transform')).toBeNull();
    });

    test('Should remove a stale clip-path attribute when the clip is dropped', () => {
        renderPass(() => {
            const clipPath = ctx.createPath('clip');
            clipPath.rect(0, 0, 5, 5);
            ctx.applyClip(clipPath);

            drawRect('content');
        });

        const domNode = ctx.element.querySelector('#content');

        expect(domNode).not.toBeNull();
        expect(domNode!.getAttribute('clip-path')).toMatch(/^url\(#clip-/);

        renderPass(() => drawRect('content'));

        expect(ctx.element.querySelector('#content')).toBe(domNode);
        expect(domNode!.getAttribute('clip-path')).toBeNull();
    });

    test('Should clear stale stroke styles when the element is no longer stroked', () => {
        renderPass(() => {
            ctx.lineDash = [5, 10];
            const path = drawRect('shape');
            ctx.applyStroke(path);
        });

        const domNode = ctx.element.querySelector('#shape') as SVGElement;

        expect(domNode.style.strokeDasharray).toBe('5 10');

        renderPass(() => drawRect('shape'));

        expect(ctx.element.querySelector('#shape')).toBe(domNode);
        expect(domNode.style.strokeDasharray).toBe('');
    });

    test('Should update text content when it changes between passes', () => {
        renderPass(() => ctx.createText({
            id: 'label',
            x: 0,
            y: 0,
            content: 'Hello',
        }));

        const domNode = ctx.element.querySelector('#label');

        expect(domNode!.textContent).toBe('Hello');

        renderPass(() => ctx.createText({
            id: 'label',
            x: 0,
            y: 0,
            content: 'World',
        }));

        expect(ctx.element.querySelector('#label')).toBe(domNode);
        expect(domNode!.textContent).toBe('World');
    });

    test('Should clear direct text content when the text switches to a text path', () => {
        renderPass(() => ctx.createText({
            id: 'label',
            x: 0,
            y: 0,
            content: 'Hello',
        }));

        const domNode = ctx.element.querySelector('#label');

        expect(domNode!.textContent).toBe('Hello');

        renderPass(() => ctx.createText({
            id: 'label',
            x: 0,
            y: 0,
            content: 'Hello',
            pathData: 'M0,0 L100,100',
        }));

        const directTextNodes = Array.from(domNode!.childNodes).filter(node => node.nodeType === Node.TEXT_NODE);

        expect(ctx.element.querySelector('#label')).toBe(domNode);
        expect(directTextNodes).toHaveLength(0);
        expect(domNode!.querySelector('textPath')).not.toBeNull();
    });

    test('Should remove the filter attribute when the shadow is cleared', () => {
        renderPass(() => {
            ctx.shadowColor = '#000000';
            ctx.shadowBlur = 4;
            drawRect('shape');
        });

        const domNode = ctx.element.querySelector('#shape');

        expect(domNode!.getAttribute('filter')).toMatch(/^url\(#shadow-/);

        renderPass(() => drawRect('shape'));

        expect(ctx.element.querySelector('#shape')).toBe(domNode);
        expect(domNode!.getAttribute('filter')).toBeNull();
    });

});
