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

    test('Should place a leaf child via its layout offset, leaving translate free', () => {
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

        expect(rect.layoutX).toBe(100);
        expect(rect.layoutY).toBe(50);
        expect(rect.translateX).toBe(0);
        expect(rect.translateY).toBe(0);
    });

    test('Should place a nested layout by its origin, not its offset', () => {
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
        expect(inner.layoutX).toBe(0);

        inner.reflow();

        expect(inner.children.map(child => child.layoutX)).toEqual([100, 120]);
        expect(inner.children.map(child => child.layoutY)).toEqual([50, 50]);
    });

    test('Should place a plain group by offsetting its leaf descendants (idempotently)', () => {
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
        outer.reflow();

        expect(leaves.map(leaf => leaf.layoutX)).toEqual([100, 100]);
        expect(leaves.map(leaf => leaf.layoutY)).toEqual([50, 50]);
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
        expect(inner.children.map(child => child.layoutX)).toEqual([5, 35]);
    });

    test('Should clear a child layout offset when it is removed', () => {
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

        expect(rect.layoutX).toBe(100);

        flex.remove(rect);

        expect(rect.layoutX).toBe(0);
        expect(rect.layoutY).toBe(0);
    });

});
