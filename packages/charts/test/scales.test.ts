import {
    describe,
    expect,
    it,
} from 'vitest';

import {
    mockCanvasContext,
    polyfillPath2D,
} from '@ripl/test-utils';

import type {
    ChartAxisItemOptions,
} from '../src/core/options';

import {
    axisTickCount,
    createValueScale,
} from '../src/core/scales';

import {
    createBarChart,
} from '../src';

function axis(overrides: Partial<ChartAxisItemOptions> = {}): ChartAxisItemOptions {
    return {
        visible: true,
        font: '12px sans-serif',
        fontColor: '#000000',
        ...overrides,
    };
}

describe('axisTickCount', () => {

    it('defaults to 10', () => {
        expect(axisTickCount(axis())).toBe(10);
    });

    it('uses the ticks option when provided', () => {
        expect(axisTickCount(axis({ ticks: 5 }))).toBe(5);
    });

});

describe('createValueScale', () => {

    it('builds a linear scale by default', () => {
        const scale = createValueScale(axis(), [0, 100], [0, 200]);

        expect(scale(0)).toBeCloseTo(0);
        expect(scale(100)).toBeCloseTo(200);
    });

    it('respects an explicit min/max domain override', () => {
        const scale = createValueScale(axis({
            min: 0,
            max: 50,
        }), [10, 40], [0, 100]);

        expect(scale(0)).toBeCloseTo(0);
        expect(scale(50)).toBeCloseTo(100);
    });

    it('builds a logarithmic scale', () => {
        const scale = createValueScale(axis({
            scale: 'log',
            min: 1,
            max: 1000,
        }), [1, 1000], [0, 300]);

        // 10 is one decade above 1 → one third of the way across three decades.
        expect(scale(1)).toBeCloseTo(0);
        expect(scale(1000)).toBeCloseTo(300);
        expect(scale(10)).toBeCloseTo(100);
    });

    it('builds a power scale with a configurable exponent', () => {
        const scale = createValueScale(axis({
            scale: 'pow',
            exponent: 2,
            min: 0,
            max: 10,
        }), [0, 10], [0, 100]);

        // exponent 2: 5 maps to (5/10)^2 = 0.25 of the range.
        expect(scale(0)).toBeCloseTo(0);
        expect(scale(10)).toBeCloseTo(100);
        expect(scale(5)).toBeCloseTo(25);
    });

});

describe('configurable axes (integration)', () => {

    it('captures the axis scale type and tick count on a cartesian chart', () => {
        polyfillPath2D();
        mockCanvasContext();

        const chart = createBarChart(document.createElement('div'), {
            autoRender: false,
            animation: false,
            data: [
                {
                    m: 'a',
                    v: 10,
                },
                {
                    m: 'b',
                    v: 1000,
                },
            ],
            key: 'm',
            series: [{
                id: 'v',
                label: 'V',
                value: 'v',
            }],
            axis: {
                y: {
                    scale: 'log',
                    ticks: 4,
                    min: 1,
                    max: 1000,
                },
            },
        });

        // The resolved options are captured in setupCartesian and drive the value scale.
        expect((chart as unknown as { yAxisOptions: ChartAxisItemOptions }).yAxisOptions.scale).toBe('log');
        expect((chart as unknown as { yAxis: { tickCount: number } }).yAxis.tickCount).toBe(4);
    });

});
