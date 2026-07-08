import {
    describe,
    expect,
    test,
} from 'vitest';

import {
    createFlex,
    createGrid,
    createRect,
} from '../../src';

import type {
    LayoutItem,
} from '../../src';

function rect(width: number, height: number, layout?: LayoutItem) {
    return createRect({
        x: 0,
        y: 0,
        width,
        height,
        ...layout ? { layout } : {},
    });
}

describe('Layout per-child options', () => {

    describe('order', () => {

        test('reorders flex children by order, ties keep insertion order', () => {
            const a = rect(20, 20, { order: 2 });
            const b = rect(20, 20, { order: 0 });
            const c = rect(20, 20, { order: 1 });
            const d = rect(20, 20); // order defaults to 0, tie with b -> after b

            const flex = createFlex({
                x: 0,
                y: 0,
                gap: 0,
                children: [a, b, c, d],
            });
            flex.reflow();

            // visual order: b(0), d(0), c(1), a(2) at 0,20,40,60
            expect(b.layoutX).toBe(0);
            expect(d.layoutX).toBe(20);
            expect(c.layoutX).toBe(40);
            expect(a.layoutX).toBe(60);
        });

        test('reorders grid children by order', () => {
            const a = rect(20, 20, { order: 1 });
            const b = rect(20, 20, { order: 0 });

            const grid = createGrid({
                x: 0,
                y: 0,
                columns: 2,
                columnGap: 0,
                rowGap: 0,
                children: [a, b],
            });
            grid.reflow();

            // b first -> column 0, a second -> column 1
            expect(b.layoutX).toBe(0);
            expect(a.layoutX).toBe(20);
        });

    });

    describe('alignSelf', () => {

        test('overrides the flex container cross-axis alignment', () => {
            const a = rect(10, 10, { alignSelf: 'center' });
            const b = rect(10, 30); // tallest -> lineCross 30, default align start

            const flex = createFlex({
                x: 0,
                y: 0,
                gap: 0,
                align: 'start',
                children: [a, b],
            });
            flex.reflow();

            expect(a.layoutY).toBe(10); // (30 - 10) / 2
            expect(b.layoutY).toBe(0);
        });

        test('overrides the grid alignItems for a single cell', () => {
            const a = rect(20, 10, { alignSelf: 'end' });
            const b = rect(20, 20);

            const grid = createGrid({
                x: 0,
                y: 0,
                columns: 2,
                rows: [20],
                columnGap: 0,
                alignItems: 'start',
                children: [a, b],
            });
            grid.reflow();

            expect(a.layoutY).toBe(10); // row height 20, item 10, end -> 10
            expect(b.layoutY).toBe(0);
        });

    });

    describe('justifySelf (grid)', () => {

        test('overrides the grid justifyItems for a single cell', () => {
            const a = rect(10, 20, { justifySelf: 'end' });
            const b = rect(10, 20);

            const grid = createGrid({
                x: 0,
                y: 0,
                columns: [20, 20],
                columnGap: 0,
                justifyItems: 'start',
                children: [a, b],
            });
            grid.reflow();

            expect(a.layoutX).toBe(10); // column 0 width 20, item 10, end -> 10
            expect(b.layoutX).toBe(20); // column 1 origin, start -> 20
        });

    });

    describe('grow / shrink / basis', () => {

        test('grow distributes leftover main space by weight and resizes children', () => {
            const a = rect(20, 20, { grow: 1 });
            const b = rect(20, 20, { grow: 2 });

            const flex = createFlex({
                x: 0,
                y: 0,
                width: 100,
                gap: 0,
                children: [a, b],
            });
            flex.reflow();

            // free = 100 - 40 = 60 -> a += 20 (40 wide), b += 40 (60 wide)
            expect(a.width).toBe(40);
            expect(b.width).toBe(60);
            expect(a.layoutX).toBe(0);
            expect(b.layoutX).toBe(40);
        });

        test('shrink absorbs overflow by weight and resizes children', () => {
            const a = rect(40, 20, { shrink: 1 });
            const b = rect(40, 20, { shrink: 1 });

            const flex = createFlex({
                x: 0,
                y: 0,
                width: 40,
                gap: 0,
                children: [a, b],
            });
            flex.reflow();

            // free = 40 - 80 = -40 -> each -20 => 20 wide
            expect(a.width).toBe(20);
            expect(b.width).toBe(20);
            expect(a.layoutX).toBe(0);
            expect(b.layoutX).toBe(20);
        });

        test('basis overrides the measured main size and resizes the child', () => {
            const a = rect(20, 20, { basis: 50 });
            const b = rect(20, 20);

            const flex = createFlex({
                x: 0,
                y: 0,
                gap: 0,
                children: [a, b],
            });
            flex.reflow();

            expect(a.width).toBe(50);
            expect(b.layoutX).toBe(50);
        });

        test('children without hints are unaffected (no grow/shrink)', () => {
            const a = rect(20, 20);
            const b = rect(20, 20);

            const flex = createFlex({
                x: 0,
                y: 0,
                width: 100,
                gap: 0,
                children: [a, b],
            });
            flex.reflow();

            expect(a.width).toBe(20);
            expect(b.width).toBe(20);
            expect(a.layoutX).toBe(0);
            expect(b.layoutX).toBe(20);
        });

    });

});
