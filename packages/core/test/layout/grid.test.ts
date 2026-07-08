import {
    describe,
    expect,
    test,
} from 'vitest';

import {
    createGrid,
    createRect,
    elementIsGrid,
} from '../../src';

function rects(count: number, width = 20, height = 20) {
    return Array.from({ length: count }, () => createRect({
        x: 0,
        y: 0,
        width,
        height,
    }));
}

describe('Grid', () => {

    test('Should create a grid with type "grid" and be abstract', () => {
        const grid = createGrid();

        expect(grid.type).toBe('grid');
        expect(grid.abstract).toBe(true);
        expect(elementIsGrid(grid)).toBe(true);
    });

    test('Should place children row-major across auto tracks', () => {
        const children = rects(4);
        const grid = createGrid({
            x: 0,
            y: 0,
            columns: 2,
            children,
        });

        grid.reflow();

        expect(children.map(child => child.layoutX)).toEqual([0, 20, 0, 20]);
        expect(children.map(child => child.layoutY)).toEqual([0, 0, 20, 20]);
    });

    test('Should honour column and row gaps', () => {
        const children = rects(4);
        const grid = createGrid({
            x: 0,
            y: 0,
            columns: 2,
            columnGap: 10,
            rowGap: 5,
            children,
        });

        grid.reflow();

        expect(children.map(child => child.layoutX)).toEqual([0, 30, 0, 30]);
        expect(children.map(child => child.layoutY)).toEqual([0, 0, 25, 25]);
    });

    test('Should use explicit column track widths', () => {
        const children = rects(2);
        const grid = createGrid({
            x: 0,
            y: 0,
            columns: [100, 50],
            children,
        });

        grid.reflow();

        expect(children.map(child => child.layoutX)).toEqual([0, 100]);
    });

    test('Should divide a fixed width into equal fractions', () => {
        const children = rects(2);
        const grid = createGrid({
            x: 0,
            y: 0,
            columns: 2,
            width: 220,
            columnGap: 20,
            children,
        });

        grid.reflow();

        expect(children.map(child => child.layoutX)).toEqual([0, 120]);
    });

    test('Should align items within their cell', () => {
        const children = rects(1);
        const grid = createGrid({
            x: 0,
            y: 0,
            columns: [100],
            justifyItems: 'center',
            children,
        });

        grid.reflow();

        expect(children[0].layoutX).toBe(40);
    });

    test('Should report a resolved content bounding box', () => {
        const grid = createGrid({
            x: 0,
            y: 0,
            columns: [100, 50],
            children: rects(2),
        });

        grid.reflow();

        const box = grid.getBoundingBox();

        expect(box.width).toBe(150);
        expect(box.height).toBe(20);
    });

    test('Should stack into a single column by default', () => {
        const children = rects(3);
        const grid = createGrid({
            x: 0,
            y: 0,
            rowGap: 5,
            children,
        });

        grid.reflow();

        expect(children.map(child => child.layoutX)).toEqual([0, 0, 0]);
        expect(children.map(child => child.layoutY)).toEqual([0, 25, 50]);
    });

});
