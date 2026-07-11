import {
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
} from '../../src';

/** Minimal context that records the save/render bracketing without a real backend. */
function fakeContext() {
    return {
        save: vi.fn(),
        restore: vi.fn(),
        markRenderStart: vi.fn(),
        markRenderEnd: vi.fn(),
    } as unknown as Context;
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

    test('brackets the render pass in save/markRenderStart/markRenderEnd/restore', () => {
        const context = fakeContext();
        const child = createElement('rect', {});

        vi.spyOn(child, 'render').mockImplementation(() => undefined);

        const group = createGroup({ children: [child] });

        group.render(context);

        expect(context.save).toHaveBeenCalledTimes(1);
        expect(context.restore).toHaveBeenCalledTimes(1);
        expect(context.markRenderStart).toHaveBeenCalledTimes(1);
        expect(context.markRenderEnd).toHaveBeenCalledTimes(1);
    });

});
