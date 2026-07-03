import {
    describe,
    expect,
    test,
} from 'vitest';

import {
    createCircle,
    createGroup,
    createRect,
    queryAll,
} from '../../src';

function rect(id?: string, extra: Record<string, unknown> = {}) {
    return createRect({
        id,
        x: 0,
        y: 0,
        width: 10,
        height: 20,
        ...extra,
    });
}

describe('Group querying', () => {

    test('getElementById finds by id and returns undefined when missing', () => {
        const target = rect('target');
        const group = createGroup({ children: [target, rect()] });

        expect(group.getElementById('target')).toBe(target);
        expect(group.getElementById('missing')).toBeUndefined();
        // deprecated alias still works
        expect(group.getElementByID('target')).toBe(target);
    });

    test('id and type matching is case-sensitive', () => {
        const target = createRect({
            id: 'Item',
            x: 0,
            y: 0,
            width: 10,
            height: 10,
        });
        const group = createGroup({ children: [target] });

        expect(group.query('#Item')).toBe(target);
        expect(group.query('#item')).toBeUndefined();
        expect(group.query('rect')).toBe(target);
        expect(group.query('Rect')).toBeUndefined();
    });

    test('attribute selectors support single and multiple constraints', () => {
        const target = rect(undefined, {
            width: 10,
            height: 20,
        });
        const group = createGroup({ children: [target] });

        expect(group.query('rect[width="10"]')).toBe(target);
        expect(group.query('rect[width="10"][height="20"]')).toBe(target);
        expect(group.query('rect[width="10"][height="99"]')).toBeUndefined();
    });

    test('collapses and trims extra whitespace instead of truncating', () => {
        const inner = createGroup({ children: [rect('deep')] });
        const group = createGroup({ children: [inner] });

        expect(group.query('group  rect')?.id).toBe('deep');
        expect(group.query('  group rect  ')?.id).toBe('deep');
    });

    test('child combinator selects direct children only', () => {
        const inner = createGroup({ children: [rect('inner-rect')] });
        const group = createGroup({ children: [rect('outer-rect'), inner] });

        const result = group.queryAll('group > rect');

        expect(result).toHaveLength(1);
        expect(result[0].id).toBe('inner-rect');
    });

    test('next-sibling combinator selects the following sibling', () => {
        const circle = createCircle({
            id: 'sib',
            cx: 0,
            cy: 0,
            radius: 5,
        });
        const group = createGroup({ children: [rect(), circle] });

        const result = group.queryAll('rect + circle');

        expect(result).toHaveLength(1);
        expect(result[0].id).toBe('sib');
    });

    test('next-sibling combinator does not crash on a parentless element', () => {
        const standalone = rect();

        expect(() => queryAll(standalone, 'rect + rect')).not.toThrow();
        expect(queryAll(standalone, 'rect + rect')).toEqual([]);
    });

});
