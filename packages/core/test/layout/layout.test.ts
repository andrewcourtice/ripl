import {
    describe,
    expect,
    test,
} from 'vitest';

import {
    createFlex,
    createGroup,
    createRect,
    isLayout,
} from '../../src';

describe('Layout', () => {

    test('isLayout should identify layout containers', () => {
        const flex = createFlex();
        const group = createGroup();

        expect(isLayout(flex)).toBe(true);
        expect(isLayout(group)).toBe(false);
        expect(isLayout(null)).toBe(false);
    });

    test('Should place a leaf child by absolute translate', () => {
        const rect = createRect({
            x: 0,
            y: 0,
            width: 20,
            height: 20,
        });
        const flex = createFlex({
            x: 100,
            y: 50,
            children: rect,
        });

        flex.reflow();

        expect(rect.translateX).toBe(100);
        expect(rect.translateY).toBe(50);
    });

    test('Should place a nested layout by its origin, not translate', () => {
        const inner = createFlex({
            x: 0,
            y: 0,
            gap: 0,
            children: [
                createRect({
                    x: 0,
                    y: 0,
                    width: 20,
                    height: 20,
                }),
                createRect({
                    x: 0,
                    y: 0,
                    width: 20,
                    height: 20,
                }),
            ],
        });

        const outer = createFlex({
            x: 100,
            y: 50,
            children: inner,
        });

        outer.reflow();

        expect(inner.x).toBe(100);
        expect(inner.y).toBe(50);
        expect(inner.translateX).toBe(0);

        inner.reflow();

        expect(inner.children.map(child => child.translateX)).toEqual([100, 120]);
        expect(inner.children.map(child => child.translateY)).toEqual([50, 50]);
    });

    test('Should place a plain group by offsetting its leaf descendants', () => {
        const leaves = [
            createRect({
                x: 0,
                y: 0,
                width: 20,
                height: 20,
            }),
            createRect({
                x: 0,
                y: 0,
                width: 20,
                height: 20,
            }),
        ];
        const group = createGroup({ children: leaves });
        const outer = createFlex({
            x: 100,
            y: 50,
            children: group,
        });

        outer.reflow();

        expect(leaves.map(leaf => leaf.translateX)).toEqual([100, 100]);
        expect(leaves.map(leaf => leaf.translateY)).toEqual([50, 50]);
    });

    test('Should compose nested flex layouts into absolute positions', () => {
        const inner = createFlex({
            x: 0,
            y: 0,
            gap: 10,
            children: [
                createRect({
                    x: 0,
                    y: 0,
                    width: 20,
                    height: 20,
                }),
                createRect({
                    x: 0,
                    y: 0,
                    width: 20,
                    height: 20,
                }),
            ],
        });

        const outer = createFlex({
            x: 0,
            y: 0,
            padding: 5,
            children: inner,
        });

        outer.reflow();
        inner.reflow();

        expect(inner.x).toBe(5);
        expect(inner.y).toBe(5);
        expect(inner.children.map(child => child.translateX)).toEqual([5, 35]);
    });

});
