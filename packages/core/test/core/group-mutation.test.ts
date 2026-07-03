import {
    describe,
    expect,
    test,
    vi,
} from 'vitest';

import {
    createElement,
    createGroup,
} from '../../src';

describe('Group mutation', () => {

    test('set() detaches previous children (no stale parent)', () => {
        const a = createElement('rect', {});
        const b = createElement('rect', {});
        const c = createElement('rect', {});
        const group = createGroup({ children: [a, b] });

        group.set([c]);

        expect(group.children).toEqual([c]);
        expect(a.parent).toBeUndefined();
        expect(b.parent).toBeUndefined();
        expect(c.parent).toBe(group);
    });

    test('set([]) detaches all children and emits a graph event', () => {
        const a = createElement('rect', {});
        const group = createGroup({ children: [a] });
        const onGraph = vi.fn();

        group.on('graph', onGraph);
        group.set([]);

        expect(group.children).toHaveLength(0);
        expect(a.parent).toBeUndefined();
        expect(onGraph).toHaveBeenCalled();
    });

    test('destroy() detaches children so they are not orphaned', () => {
        const a = createElement('rect', {});
        const b = createElement('rect', {});
        const group = createGroup({ children: [a, b] });

        group.destroy();

        expect(group.children).toHaveLength(0);
        expect(a.parent).toBeUndefined();
        expect(b.parent).toBeUndefined();
    });

});
