import {
    describe,
    expect,
    it,
} from 'vitest';

import {
    createTimeAxisScale,
    isTimeAxis,
} from '../src/core/scales';

import {
    formatTimeLabel,
    normalizeAxisItem,
} from '../src/core/options';

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

    it('Should honour explicit min/max overrides in epoch milliseconds', () => {
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
