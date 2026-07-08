import {
    describe,
    expect,
    test,
} from 'vitest';

import {
    createElement,
    createFlex,
    createGroup,
    createRect,
} from '../../src';

describe('Style inheritance', () => {

    test('style props inherit from an ancestor group', () => {
        const child = createElement('rect', {});
        createGroup({
            fill: '#ff0000',
            opacity: 0.5,
            children: [child],
        });

        expect(child.fill).toBe('#ff0000');
        expect(child.opacity).toBe(0.5);
    });

    test('opacity inherits group -> leaf (tooltip show/hide contract)', () => {
        const bg = createElement('rect', {});
        const group = createGroup({
            opacity: 0,
            children: [bg],
        });

        expect(bg.opacity).toBe(0);

        group.opacity = 1;

        expect(bg.opacity).toBe(1);
    });

    test('zIndex remains additive through the parent chain', () => {
        const child = createElement('rect', { zIndex: 5 });
        createGroup({
            zIndex: 10,
            children: [child],
        });

        expect(child.zIndex).toBe(15);
    });

    test('fontKerning is a real, inheritable accessor', () => {
        const child = createElement('rect', {});
        const group = createGroup({
            font: '12px sans-serif',
            fontKerning: 'none',
            children: [child],
        });

        expect(child.fontKerning).toBe('none');

        group.fontKerning = 'normal';

        expect(child.fontKerning).toBe('normal');
    });

    test('geometry does not leak from a layout parent to a child', () => {
        const flex = createFlex({
            x: 0,
            y: 0,
            width: 300,
        });
        const child = createRect({
            x: 0,
            y: 0,
            width: 10,
            height: 10,
        });

        flex.add(child);
        child.width = undefined as unknown as number;

        expect(child.width).toBeUndefined();
        expect(flex.width).toBe(300);
    });

});
