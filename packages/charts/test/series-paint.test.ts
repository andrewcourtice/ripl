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
    Polyline,
} from '@ripl/core';

import {
    createAreaChart,
    createLineChart,
} from '../src';

interface SeriesInternals {
    _series: {
        groups: {
            id: string;
            getElementsByType(type: string): Polyline[];
        }[];
    };
}

function polylines(chart: unknown, seriesId: string): Polyline[] {
    const group = (chart as SeriesInternals)._series.groups.find(g => g.id === seriesId);

    expect(group).toBeTruthy();

    return group!.getElementsByType('polyline');
}

const DATA = [
    {
        k: 'a',
        v: 10,
    },
    {
        k: 'b',
        v: 30,
    },
    {
        k: 'c',
        v: 20,
    },
];

describe('per-series paint reconciles on update', () => {

    // Stroke, line width and fill opacity were applied only when a series was first built. On an
    // update the existing polyline was reused and only its points were transitioned, so changing any
    // of them did nothing until the series was recreated — a live control that silently no-ops.

    it('re-applies a line series\' stroke and width', async () => {
        polyfillPath2D();
        mockCanvasContext();

        const chart = createLineChart(document.createElement('div'), {
            autoRender: false,
            animation: false,
            data: DATA,
            key: 'k',
            series: [{
                id: 's',
                label: 'S',
                value: 'v',
                color: '#111111',
                lineWidth: 2,
            }],
        });

        await chart.render();

        expect(polylines(chart, 's')[0].lineWidth).toBe(2);

        chart.update({
            series: [{
                id: 's',
                label: 'S',
                value: 'v',
                color: '#ff0000',
                lineWidth: 5,
            }],
        });

        await chart.render();

        const line = polylines(chart, 's')[0];

        expect(line.lineWidth).toBe(5);
        // The color interpolator normalizes to rgba, so assert the channels rather than the notation.
        expect(line.stroke).toMatch(/^rgba\(255,\s*0,\s*0/);
    });

    it('re-applies an area series\' fill opacity and line paint', async () => {
        polyfillPath2D();
        mockCanvasContext();

        const chart = createAreaChart(document.createElement('div'), {
            autoRender: false,
            animation: false,
            data: DATA,
            key: 'k',
            series: [{
                id: 's',
                label: 'S',
                value: 'v',
                color: '#111111',
                lineWidth: 2,
                fillOpacity: 0.2,
            }],
        });

        await chart.render();

        const [firstFill] = polylines(chart, 's');
        const before = firstFill.fill;

        chart.update({
            series: [{
                id: 's',
                label: 'S',
                value: 'v',
                color: '#111111',
                lineWidth: 4,
                fillOpacity: 0.9,
            }],
        });

        await chart.render();

        const [areaFill, line] = polylines(chart, 's');

        expect(areaFill.fill).not.toBe(before);
        expect(line.lineWidth).toBe(4);
    });

});
