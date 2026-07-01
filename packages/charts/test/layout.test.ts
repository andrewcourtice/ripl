import {
    describe,
    expect,
    it,
} from 'vitest';

import {
    ChartLayout,
} from '../src/core/layout';

const PADDING = {
    top: 10,
    right: 10,
    bottom: 10,
    left: 10,
};

describe('ChartLayout', () => {
    it('starts as the padded area', () => {
        const layout = new ChartLayout(200, 100, PADDING);

        expect(layout.area).toEqual({
            x: 10,
            y: 10,
            width: 180,
            height: 80,
        });
    });

    it('reserves a top band and shrinks the remaining area', () => {
        const layout = new ChartLayout(200, 100, PADDING);
        const band = layout.reserveTop(20);

        expect(band).toEqual({
            x: 10,
            y: 10,
            width: 180,
            height: 20,
        });
        expect(layout.area).toEqual({
            x: 10,
            y: 30,
            width: 180,
            height: 60,
        });
    });

    it('reserves a bottom band from the bottom edge', () => {
        const layout = new ChartLayout(200, 100, PADDING);
        const band = layout.reserveBottom(20);

        expect(band).toEqual({
            x: 10,
            y: 70,
            width: 180,
            height: 20,
        });
        expect(layout.area).toEqual({
            x: 10,
            y: 10,
            width: 180,
            height: 60,
        });
    });

    it('reserves a left band from the left edge', () => {
        const layout = new ChartLayout(200, 100, PADDING);
        const band = layout.reserveLeft(40);

        expect(band).toEqual({
            x: 10,
            y: 10,
            width: 40,
            height: 80,
        });
        expect(layout.area).toEqual({
            x: 50,
            y: 10,
            width: 140,
            height: 80,
        });
    });

    it('reserves a right band from the right edge', () => {
        const layout = new ChartLayout(200, 100, PADDING);
        const band = layout.reserveRight(40);

        expect(band).toEqual({
            x: 150,
            y: 10,
            width: 40,
            height: 80,
        });
        expect(layout.area).toEqual({
            x: 10,
            y: 10,
            width: 140,
            height: 80,
        });
    });

    it('stacks reservations: title (top), legend (bottom), axes (left)', () => {
        const layout = new ChartLayout(300, 200, PADDING);

        layout.reserveTop(24); // title
        layout.reserveBottom(30); // legend
        layout.reserveLeft(50); // y-axis
        layout.reserveBottom(40); // x-axis

        const plot = layout.area;

        expect(plot.x).toBe(60);
        expect(plot.y).toBe(34);
        expect(plot.width).toBe(230);
        expect(plot.height).toBe(86);
    });

    it('reserve() dispatches to the correct side', () => {
        const top = new ChartLayout(100, 100, PADDING);
        expect(top.reserve('top', 10)).toEqual({
            x: 10,
            y: 10,
            width: 80,
            height: 10,
        });

        const right = new ChartLayout(100, 100, PADDING);
        expect(right.reserve('right', 10).x).toBe(80);
    });

    it('never produces negative dimensions when over-reserved', () => {
        const layout = new ChartLayout(100, 100, PADDING);
        layout.reserveLeft(200);

        expect(layout.area.width).toBe(0);
        expect(layout.area.height).toBeGreaterThanOrEqual(0);
    });
});
