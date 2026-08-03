import {
    afterEach,
    describe,
    expect,
    test,
    vi,
} from 'vitest';

import type {
    Context,
} from '../../src';

import {
    createElement,
    createGroup,
    createRect,
} from '../../src';

import {
    createContext,
} from '@ripl/canvas';

import {
    mockCanvasContext,
    mockCanvasState,
    polyfillPath2D,
} from '@ripl/test-utils';

polyfillPath2D();

/** Minimal context that records the group/render bracketing without a real backend. */
function fakeContext() {
    return {
        save: vi.fn(),
        restore: vi.fn(),
        pushGroup: vi.fn(),
        popGroup: vi.fn(),
        markRenderStart: vi.fn(),
        markRenderEnd: vi.fn(),
    } as unknown as Context;
}

/** A real canvas context over a stateful stub, so save/restore actually push and pop the paint. */
function statefulCanvasContext() {
    const stub = mockCanvasState(mockCanvasContext());
    const host = document.createElement('div');

    document.body.appendChild(host);

    return {
        stub,
        host,
        context: createContext(host),
    };
}

describe('Group.render (scene-less)', () => {

    test('draws children in ascending z-index order regardless of insertion order', () => {
        const high = createElement('rect', { zIndex: 3 });
        const low = createElement('rect', { zIndex: 1 });
        const mid = createElement('rect', { zIndex: 2 });
        const group = createGroup({ children: [high, low, mid] });

        const order: number[] = [];

        for (const element of [high, low, mid]) {
            vi.spyOn(element, 'render').mockImplementation(() => {
                order.push(element.zIndex);
            });
        }

        group.render(fakeContext());

        expect(order).toEqual([1, 2, 3]);
    });

    test('keeps insertion order for children sharing a z-index (stable sort)', () => {
        const first = createElement('rect', {
            id: 'first',
            zIndex: 1,
        });
        const second = createElement('rect', {
            id: 'second',
            zIndex: 1,
        });
        const third = createElement('rect', {
            id: 'third',
            zIndex: 1,
        });
        const group = createGroup({ children: [first, second, third] });

        const order: string[] = [];

        for (const element of [first, second, third]) {
            vi.spyOn(element, 'render').mockImplementation(() => {
                order.push(element.id);
            });
        }

        group.render(fakeContext());

        expect(order).toEqual(['first', 'second', 'third']);
    });

    test('brackets the render pass in markRenderStart/pushGroup/popGroup/markRenderEnd', () => {
        const context = fakeContext();
        const child = createElement('rect', {});

        vi.spyOn(child, 'render').mockImplementation(() => undefined);

        const group = createGroup({ children: [child] });

        group.render(context);

        expect(context.markRenderStart).toHaveBeenCalledTimes(1);
        expect(context.pushGroup).toHaveBeenCalledTimes(1);
        expect(context.pushGroup).toHaveBeenCalledWith(group);
        expect(context.popGroup).toHaveBeenCalledTimes(1);
        expect(context.markRenderEnd).toHaveBeenCalledTimes(1);
    });

    test('Should close the group boundary when a child render throws', () => {
        const context = fakeContext();
        const child = createElement('rect', {});

        vi.spyOn(child, 'render').mockImplementation(() => {
            throw new Error('render failed');
        });

        const group = createGroup({ children: [child] });

        expect(() => group.render(context)).toThrow('render failed');
        expect(context.popGroup).toHaveBeenCalledTimes(1);
        expect(context.markRenderEnd).toHaveBeenCalledTimes(1);
    });

});

describe('Group paint boundary', () => {

    afterEach(() => {
        document.body.innerHTML = '';
        vi.restoreAllMocks();
    });

    test('Should composite a leaf opacity under every ancestor group opacity', () => {
        const {
            stub,
            context,
        } = statefulCanvasContext();

        const alphas: number[] = [];

        stub.fill.mockImplementation(() => {
            alphas.push(stub.globalAlpha);
        });

        const leaf = createRect({
            x: 0,
            y: 0,
            width: 10,
            height: 10,
            fill: '#ff0000',
            opacity: 0.5,
        });

        const outer = createGroup({
            opacity: 0.5,
            children: [
                createGroup({
                    opacity: 0.5,
                    children: [leaf],
                }),
            ],
        });

        outer.render(context);

        expect(alphas).toEqual([0.125]);

        context.destroy();
    });

    test('Should restore the accumulated alpha for a sibling that sets no opacity', () => {
        const {
            stub,
            context,
        } = statefulCanvasContext();

        const alphas: number[] = [];

        stub.fill.mockImplementation(() => {
            alphas.push(stub.globalAlpha);
        });

        const group = createGroup({
            opacity: 0.5,
            children: [
                createRect({
                    id: 'own',
                    x: 0,
                    y: 0,
                    width: 10,
                    height: 10,
                    fill: '#ff0000',
                    opacity: 0.5,
                    zIndex: 0,
                }),
                createRect({
                    id: 'none',
                    x: 0,
                    y: 0,
                    width: 10,
                    height: 10,
                    fill: '#00ff00',
                    zIndex: 1,
                }),
            ],
        });

        group.render(context);

        expect(alphas).toEqual([0.25, 0.5]);

        context.destroy();
    });

});
