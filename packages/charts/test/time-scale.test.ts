import {
    describe,
    expect,
    it,
} from 'vitest';

import {
    mockCanvasContext,
    polyfillPath2D,
} from '@ripl/test-utils';

import {
    createTimeAxisScale,
    isTimeAxis,
} from '../src/core/scales';

import {
    formatTimeLabel,
    normalizeAxisItem,
} from '../src/core/options';

import {
    createLineChart,
} from '../src';

interface TimeChartInternals {
    _xScale: (value: string) => number;
}

function timeInternals(chart: unknown): TimeChartInternals {
    return chart as TimeChartInternals;
}

function createTimeLineChart(scale?: 'time') {
    polyfillPath2D();
    mockCanvasContext();

    return createLineChart(document.createElement('div'), {
        autoRender: false,
        animation: false,
        axis: scale
            ? {
                x: {
                    scale,
                },
            }
            : undefined,
        data: [
            {
                d: '2024-01-01',
                v: 1,
            },
            {
                d: '2024-01-02',
                v: 2,
            },
            {
                d: '2024-01-11',
                v: 3,
            },
        ],
        key: 'd',
        series: [{
            id: 's',
            label: 'S',
            value: 'v',
        }],
    });
}

const DAY = 24 * 60 * 60 * 1000;

describe('Time axis scale', () => {

    it('Should identify a time axis from its resolved options', () => {
        expect(isTimeAxis(normalizeAxisItem({ scale: 'time' }))).toBe(true);
        expect(isTimeAxis(normalizeAxisItem())).toBe(false);
        expect(isTimeAxis(normalizeAxisItem({ scale: 'log' }))).toBe(false);
    });

    it('Should position unevenly spaced dates proportionally to their timestamps', () => {
        const start = Date.UTC(2024, 0, 1);
        const scale = createTimeAxisScale(normalizeAxisItem({ scale: 'time' }), [start, start + 10 * DAY], [0, 100]);

        expect(scale(new Date(start))).toBe(0);
        expect(scale(new Date(start + 10 * DAY))).toBe(100);
        expect(scale(new Date(start + DAY))).toBeCloseTo(10);
        expect(scale(new Date(start + 7 * DAY))).toBeCloseTo(70);
    });

    it('Should honor explicit min/max overrides in epoch milliseconds', () => {
        const start = Date.UTC(2024, 0, 1);
        const scale = createTimeAxisScale(normalizeAxisItem({
            scale: 'time',
            min: start,
            max: start + 4 * DAY,
        }), [start + DAY, start + 2 * DAY], [0, 100]);

        expect(scale(new Date(start))).toBe(0);
        expect(scale(new Date(start + 4 * DAY))).toBe(100);
        expect(scale(new Date(start + 2 * DAY))).toBeCloseTo(50);
    });

    it('Should produce calendar-aligned Date ticks', () => {
        const start = Date.UTC(2024, 0, 1);
        const scale = createTimeAxisScale(normalizeAxisItem({ scale: 'time' }), [start, start + 10 * DAY], [0, 100]);
        const ticks = scale.ticks(5);

        expect(ticks.length).toBeGreaterThan(1);
        ticks.forEach(tick => expect(tick).toBeInstanceOf(Date));
    });

});

describe('Line chart time axis', () => {

    it('Should position unevenly spaced dates proportionally with scale: time', async () => {
        const chart = createTimeLineChart('time');

        await chart.render();

        const xScale = timeInternals(chart)._xScale;
        const first = xScale('2024-01-01');
        const second = xScale('2024-01-02');
        const last = xScale('2024-01-11');

        expect((second - first) / (last - first)).toBeCloseTo(0.1, 2);
    });

    it('Should keep even point spacing without scale: time', async () => {
        const chart = createTimeLineChart();

        await chart.render();

        const xScale = timeInternals(chart)._xScale;
        const first = xScale('2024-01-01');
        const second = xScale('2024-01-02');
        const last = xScale('2024-01-11');

        expect((second - first) / (last - first)).toBeCloseTo(0.5, 2);
    });

});

describe('formatTimeLabel', () => {

    it('Should show the year for multi-year spans', () => {
        expect(formatTimeLabel(new Date(Date.UTC(2024, 5, 15)), 4 * 365 * DAY)).toContain('2024');
        expect(formatTimeLabel(new Date(Date.UTC(2024, 5, 15)), 4 * 365 * DAY)).not.toMatch(/[a-zA-Z]/);
    });

    it('Should show month and year for month-scale spans', () => {
        const label = formatTimeLabel(new Date(2024, 5, 15), 90 * DAY);

        expect(label).toContain('2024');
        expect(label).toMatch(/[a-zA-Z]/);
    });

    it('Should show a date for day-scale spans', () => {
        const date = new Date(2024, 5, 15);

        expect(formatTimeLabel(date, 10 * DAY)).toBe(date.toLocaleDateString());
    });

    it('Should show a time for sub-day spans', () => {
        const date = new Date(2024, 5, 15, 14, 30);

        expect(formatTimeLabel(date, 6 * 60 * 60 * 1000)).toBe(date.toLocaleTimeString());
    });

});
