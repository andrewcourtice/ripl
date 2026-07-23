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
    easeOutCubic,
} from '@ripl/core';

import {
    createLineChart,
    resolveEase,
} from '../src';

interface ScaleInternals {
    (value: number): number;
    domain: number[];
}

function yScale(chart: unknown): ScaleInternals {
    return (chart as { yAxes: { scale: ScaleInternals }[] }).yAxes[0].scale;
}

describe('symlog axis', () => {

    it('maps zero to the vertical midpoint for data spanning negative to positive', async () => {
        polyfillPath2D();
        mockCanvasContext();

        const chart = createLineChart(document.createElement('div'), {
            autoRender: false,
            animation: false,
            data: [
                {
                    m: 'a',
                    v: -100,
                },
                {
                    m: 'b',
                    v: -10,
                },
                {
                    m: 'c',
                    v: 0,
                },
                {
                    m: 'd',
                    v: 10,
                },
                {
                    m: 'e',
                    v: 100,
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
                    scale: 'symlog',
                },
            },
        });

        await chart.render();

        const scale = yScale(chart);
        const domainMin = scale.domain[0];
        const domainMax = scale.domain[scale.domain.length - 1];

        // A domain symmetric about zero places zero at the transformed midpoint.
        expect(domainMin).toBe(-domainMax);

        const midpoint = (scale(domainMin) + scale(domainMax)) / 2;

        expect(scale(0)).toBeCloseTo(midpoint, 6);
    });

    it('expands the near-zero region rather than mapping linearly', async () => {
        polyfillPath2D();
        mockCanvasContext();

        const chart = createLineChart(document.createElement('div'), {
            autoRender: false,
            animation: false,
            data: [
                {
                    m: 'a',
                    v: -100,
                },
                {
                    m: 'b',
                    v: 100,
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
                    scale: 'symlog',
                },
            },
        });

        await chart.render();

        const scale = yScale(chart);

        // A linear scale would place 10 one-tenth of the way from the midpoint to the max (ratio 0.1);
        // symlog compresses large magnitudes, so 10 sits much further out.
        const ratio = (scale(10) - scale(0)) / (scale(100) - scale(0));

        expect(ratio).toBeGreaterThan(0.3);
    });

});

describe('resolveEase (expanded eases)', () => {

    it('resolves the new ease names to real functions, not the fallback', () => {
        const sine = resolveEase('easeInOutSine');
        const bounce = resolveEase('easeOutBounce');

        expect(typeof sine).toBe('function');
        expect(typeof bounce).toBe('function');
        expect(sine).not.toBe(easeOutCubic);
        expect(bounce).not.toBe(easeOutCubic);
        expect(sine(1)).toBeCloseTo(1, 5);
        expect(bounce(1)).toBeCloseTo(1, 5);
    });

});
