import {
    describe,
    expect,
    test,
    vi,
} from 'vitest';

import {
    createElement,
    createGroup,
    typeIsElement,
} from '../../src';

describe('Element', () => {

    test('Should create an element with a type', () => {
        const el = createElement('rect', {});
        expect(el.type).toBe('rect');
        expect(el.id).toMatch(/^rect:/);
    });

    test('Should accept a custom id', () => {
        const el = createElement('rect', { id: 'my-rect' });
        expect(el.id).toBe('my-rect');
    });

    test('Should accept classes', () => {
        const el = createElement('rect', { class: ['foo', 'bar'] });
        expect(el.classList.has('foo')).toBe(true);
        expect(el.classList.has('bar')).toBe(true);
        expect(el.classList.has('baz')).toBe(false);
    });

    test('Should store data', () => {
        const data = {
            value: 42,
        };
        const el = createElement('rect', { data });
        expect(el.data).toBe(data);
    });

    test('Should default pointerEvents to all', () => {
        const el = createElement('rect', {});
        expect(el.pointerEvents).toBe('all');
    });

    test('Should set pointerEvents', () => {
        const el = createElement('rect', { pointerEvents: 'none' });
        expect(el.pointerEvents).toBe('none');
    });

    test('Should set and get state values via property accessors', () => {
        const el = createElement('rect', { fillStyle: '#ff0000' });
        expect(el.fillStyle).toBe('#ff0000');

        el.fillStyle = '#00ff00';
        expect(el.fillStyle).toBe('#00ff00');
    });

    test('Should emit updated event on state change', () => {
        const el = createElement('rect', {});
        const handler = vi.fn();
        el.on('updated', handler);

        el.fillStyle = '#ff0000';
        expect(handler).toHaveBeenCalledTimes(1);
    });

    test('Should clone an element', () => {
        const el = createElement('rect', {
            id: 'original',
            class: ['test'],
            fillStyle: '#ff0000',
        });

        const clone = el.clone();
        expect(clone.id).toBe('original');
        expect(clone.type).toBe('rect');
        expect(clone.classList.has('test')).toBe(true);
        expect(clone.fillStyle).toBe('#ff0000');
        expect(clone).not.toBe(el);
    });

    test('Should return a zero bounding box by default', () => {
        const el = createElement('rect', {});
        const box = el.getBoundingBox();
        expect(box.top).toBe(0);
        expect(box.left).toBe(0);
        expect(box.bottom).toBe(0);
        expect(box.right).toBe(0);
    });

    test('typeIsElement should identify elements', () => {
        const el = createElement('rect', {});
        expect(typeIsElement(el)).toBe(true);
        expect(typeIsElement({})).toBe(false);
        expect(typeIsElement(null)).toBe(false);
    });

    test('Should track and untrack events', () => {
        const el = createElement('rect', {});
        const trackHandler = vi.fn();
        const untrackHandler = vi.fn();

        el.on('track', trackHandler);
        el.on('untrack', untrackHandler);

        const { dispose } = el.on('click', () => {});
        expect(trackHandler).toHaveBeenCalledTimes(1);

        dispose();
        expect(untrackHandler).toHaveBeenCalledTimes(1);
    });

    test('Should remove from parent on destroy', () => {
        const el = createElement('rect', {});
        const group = createGroup();
        group.add(el);

        expect(group.children).toHaveLength(1);
        el.destroy();
        expect(group.children).toHaveLength(0);
    });

});
