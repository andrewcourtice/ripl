import {
    describe,
    expect,
    test,
    vi,
} from 'vitest';

import {
    createElement,
    createGroup,
    isGroup,
} from '../../src';

describe('Group', () => {

    test('Should create a group with type "group"', () => {
        const group = createGroup();
        expect(group.type).toBe('group');
        expect(group.abstract).toBe(true);
    });

    test('Should start with no children', () => {
        const group = createGroup();
        expect(group.children).toHaveLength(0);
    });

    test('Should add children', () => {
        const group = createGroup();
        const el = createElement('rect', {});

        group.add(el);
        expect(group.children).toHaveLength(1);
        expect(group.children[0]).toBe(el);
        expect(el.parent).toBe(group);
    });

    test('Should add multiple children', () => {
        const group = createGroup();
        const el1 = createElement('rect', { id: 'r1' });
        const el2 = createElement('rect', { id: 'r2' });

        group.add([el1, el2]);
        expect(group.children).toHaveLength(2);
    });

    test('Should accept children in constructor', () => {
        const el = createElement('rect', {});
        const group = createGroup({ children: el });
        expect(group.children).toHaveLength(1);
    });

    test('Should remove children', () => {
        const group = createGroup();
        const el = createElement('rect', {});

        group.add(el);
        group.remove(el);
        expect(group.children).toHaveLength(0);
        expect(el.parent).toBeUndefined();
    });

    test('Should clear all children', () => {
        const group = createGroup();
        group.add([
            createElement('rect', { id: 'r1' }),
            createElement('rect', { id: 'r2' }),
        ]);

        group.clear();
        expect(group.children).toHaveLength(0);
    });

    test('Should set children (replace all)', () => {
        const group = createGroup();
        const el1 = createElement('rect', { id: 'r1' });
        const el2 = createElement('rect', { id: 'r2' });

        group.add(el1);
        group.set([el2]);
        expect(group.children).toHaveLength(1);
        expect(group.children[0]).toBe(el2);
    });

    test('Should move element from one group to another', () => {
        const group1 = createGroup();
        const group2 = createGroup();
        const el = createElement('rect', {});

        group1.add(el);
        expect(group1.children).toHaveLength(1);

        group2.add(el);
        expect(group1.children).toHaveLength(0);
        expect(group2.children).toHaveLength(1);
        expect(el.parent).toBe(group2);
    });

    test('Should flatten graph', () => {
        const inner = createGroup();
        const outer = createGroup();
        const el1 = createElement('rect', { id: 'r1' });
        const el2 = createElement('rect', { id: 'r2' });

        inner.add(el1);
        outer.add([inner, el2]);

        const flat = outer.graph();
        expect(flat).toHaveLength(2);
        expect(flat).toContain(el1);
        expect(flat).toContain(el2);
    });

    test('Should include groups in graph when requested', () => {
        const inner = createGroup();
        const outer = createGroup();
        const el = createElement('rect', {});

        inner.add(el);
        outer.add(inner);

        const flat = outer.graph(true);
        expect(flat).toContain(inner);
        expect(flat).toContain(el);
    });

    test('Should find element by ID', () => {
        const group = createGroup();
        const el = createElement('rect', { id: 'target' });
        group.add(el);

        expect(group.getElementByID('target')).toBe(el);
        expect(group.getElementByID('missing')).toBeUndefined();
    });

    test('Should find elements by type', () => {
        const group = createGroup();
        group.add([
            createElement('rect', { id: 'r1' }),
            createElement('circle', { id: 'c1' }),
            createElement('rect', { id: 'r2' }),
        ]);

        const rects = group.getElementsByType('rect');
        expect(rects).toHaveLength(2);
    });

    test('Should find elements by class', () => {
        const group = createGroup();
        const el1 = createElement('rect', {
            id: 'r1',
            class: ['highlight'],
        });
        const el2 = createElement('rect', { id: 'r2' });
        group.add([el1, el2]);

        const highlighted = group.getElementsByClass('highlight');
        expect(highlighted).toHaveLength(1);
        expect(highlighted[0]).toBe(el1);
    });

    test('Should emit graph event on add/remove', () => {
        const group = createGroup();
        const handler = vi.fn();
        group.on('graph', handler);

        const el = createElement('rect', {});
        group.add(el);
        expect(handler).toHaveBeenCalledTimes(1);

        group.remove(el);
        expect(handler).toHaveBeenCalledTimes(2);
    });

    test('isGroup should identify groups', () => {
        const group = createGroup();
        const el = createElement('rect', {});

        expect(isGroup(group)).toBe(true);
        expect(isGroup(el)).toBe(false);
        expect(isGroup(null)).toBe(false);
    });

});
