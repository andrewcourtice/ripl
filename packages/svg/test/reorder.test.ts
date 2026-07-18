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

describe('SVG element reordering', () => {

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

    function renderPass(order: string[]) {
        ctx.save();
        ctx.markRenderStart();

        // Elements are emitted in paint order (the scene sorts its buffer by zIndex before
        // rendering), so a z-index permutation manifests as a different emission order.
        order.forEach(id => {
            const path = ctx.createPath(id);
            path.rect(0, 0, 10, 10);
            ctx.applyFill(path);
        });

        ctx.markRenderEnd();
        ctx.restore();
        ctx.export();
    }

    function getPathNodes() {
        return Array.from(ctx.element.children).filter(child => child.tagName === 'path');
    }

    test('Should match DOM order to paint order and preserve node identity across a z-index permutation', () => {
        renderPass(['a', 'b', 'c']);

        const [nodeA, nodeB, nodeC] = getPathNodes();

        expect(nodeA.getAttribute('id')).toBe('a');
        expect(nodeB.getAttribute('id')).toBe('b');
        expect(nodeC.getAttribute('id')).toBe('c');

        renderPass(['c', 'a', 'b']);

        const reordered = getPathNodes();

        expect(reordered.map(node => node.getAttribute('id'))).toEqual(['c', 'a', 'b']);
        expect(reordered[0]).toBe(nodeC);
        expect(reordered[1]).toBe(nodeA);
        expect(reordered[2]).toBe(nodeB);
    });

    test('Should preserve identity across repeated permutations', () => {
        renderPass(['a', 'b', 'c']);

        const initial = getPathNodes();

        renderPass(['b', 'c', 'a']);
        renderPass(['c', 'b', 'a']);
        renderPass(['a', 'b', 'c']);

        const final = getPathNodes();

        expect(final.map(node => node.getAttribute('id'))).toEqual(['a', 'b', 'c']);
        expect(final[0]).toBe(initial[0]);
        expect(final[1]).toBe(initial[1]);
        expect(final[2]).toBe(initial[2]);
    });

    test('Should keep the defs element intact while reordering', () => {
        renderPass(['a', 'b']);
        renderPass(['b', 'a']);

        expect(ctx.element.querySelectorAll('defs')).toHaveLength(1);
    });

});
