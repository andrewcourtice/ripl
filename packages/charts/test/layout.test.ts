import {
    describe,
    expect,
    it,
} from 'vitest';

import {
    ChartLayout,
    DEFAULT_CHART_PADDING,
    resolveChartPadding,
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

describe('resolveChartPadding', () => {
    it('defaults every edge to 16 when no input is given', () => {
        expect(resolveChartPadding()).toEqual({
            top: DEFAULT_CHART_PADDING,
            right: DEFAULT_CHART_PADDING,
            bottom: DEFAULT_CHART_PADDING,
            left: DEFAULT_CHART_PADDING,
        });
        expect(DEFAULT_CHART_PADDING).toBe(16);
    });

    it('applies a single number to all four edges', () => {
        expect(resolveChartPadding(24)).toEqual({
            top: 24,
            right: 24,
            bottom: 24,
            left: 24,
        });
    });

    it('fills unspecified edges of a partial object with the default', () => {
        expect(resolveChartPadding({ right: 80 })).toEqual({
            top: 16,
            right: 80,
            bottom: 16,
            left: 16,
        });
    });

    it('preserves an explicit 0 rather than falling back to the default', () => {
        expect(resolveChartPadding(0)).toEqual({
            top: 0,
            right: 0,
            bottom: 0,
            left: 0,
        });
        expect(resolveChartPadding({ top: 0 })).toEqual({
            top: 0,
            right: 16,
            bottom: 16,
            left: 16,
        });
    });

    it('honours a custom fallback for unspecified edges', () => {
        expect(resolveChartPadding({ left: 40 }, 8)).toEqual({
            top: 8,
            right: 8,
            bottom: 8,
            left: 40,
        });
    });
});
