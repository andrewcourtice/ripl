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
    resolveLineStyle,
} from '../src';

interface SeriesInternals {
    _series: {
        groups: {
            id: string;
            getElementsByType(type: string): Polyline[];
        }[];
    };
}

function lineOf(chart: unknown, seriesId: string): Polyline {
    const group = (chart as SeriesInternals)._series.groups.find(g => g.id === seriesId);

    expect(group).toBeTruthy();

    const polylines = group!.getElementsByType('polyline');

    return polylines[polylines.length - 1];
}

interface Datum {
    month: string;
    revenue: number;
}

const DATA: Datum[] = [
    {
        month: 'january',
        revenue: 10,
    },
    {
        month: 'february',
        revenue: 30,
    },
    {
        month: 'march',
        revenue: 20,
    },
    {
        month: 'april',
        revenue: 40,
    },
    {
        month: 'may',
        revenue: 25,
    },
];

const DASHED = [6, 4];
const DOTTED = [2, 3];

const getKey = (item: Datum) => item.month;

describe('resolveLineStyle', () => {

    it('resolves the scalar forms exactly as before', () => {
        expect(resolveLineStyle(undefined, DATA, getKey)).toEqual({ lineDash: [] });
        expect(resolveLineStyle('solid', DATA, getKey)).toEqual({ lineDash: [] });
        expect(resolveLineStyle('dashed', DATA, getKey)).toEqual({ lineDash: DASHED });
        expect(resolveLineStyle([8, 2], DATA, getKey)).toEqual({ lineDash: [8, 2] });
    });

    // An empty array is a dash array, not an empty segment list, so it keeps meaning "solid".
    it('reads an empty array as a solid dash array', () => {
        expect(resolveLineStyle([], DATA, getKey)).toEqual({ lineDash: [] });
    });

    it('resolves a segment array against the data keys', () => {
        expect(resolveLineStyle([{
            from: 'february',
            to: 'april',
            style: 'dashed',
        }], DATA, getKey)).toEqual({
            lineDash: [],
            segments: [{
                from: 1,
                to: 3,
                lineDash: DASHED,
            }],
        });
    });

    it('runs a segment without a `to` to the end of the line', () => {
        const { segments } = resolveLineStyle([{
            from: 'march',
            style: 'dotted',
        }], DATA, getKey);

        expect(segments).toEqual([{
            from: 2,
            to: 4,
            lineDash: DOTTED,
        }]);
    });

    it('starts a segment without a `from` at the start of the line', () => {
        const { segments } = resolveLineStyle([{
            to: 'march',
            style: 'dotted',
        }], DATA, getKey);

        expect(segments).toEqual([{
            from: 0,
            to: 2,
            lineDash: DOTTED,
        }]);
    });

    it('resolves a function bound against the whole dataset', () => {
        const { segments } = resolveLineStyle([{
            from: data => data.find(item => item.revenue === 40)!.month,
            style: 'dashed',
        }], DATA, getKey);

        expect(segments).toEqual([{
            from: 3,
            to: 4,
            lineDash: DASHED,
        }]);
    });

    it('honours the default of the object form', () => {
        expect(resolveLineStyle({
            default: 'dotted',
            segments: [{
                from: 'february',
                to: 'april',
                style: 'dashed',
            }],
        }, DATA, getKey)).toEqual({
            lineDash: DOTTED,
            segments: [{
                from: 1,
                to: 3,
                lineDash: DASHED,
            }],
        });
    });

    it('drops a segment whose key is not in the data', () => {
        expect(resolveLineStyle([{
            from: 'smarch',
            to: 'april',
            style: 'dashed',
        }], DATA, getKey)).toEqual({
            lineDash: [],
            segments: undefined,
        });
    });

    it('drops a degenerate segment', () => {
        expect(resolveLineStyle([{
            from: 'april',
            to: 'february',
            style: 'dashed',
        }], DATA, getKey).segments).toBeUndefined();
    });

    it('keeps overlapping segments in declaration order', () => {
        const { segments } = resolveLineStyle([
            {
                from: 'january',
                to: 'april',
                style: 'dashed',
            },
            {
                from: 'march',
                to: 'may',
                style: 'dotted',
            },
        ], DATA, getKey);

        expect(segments).toEqual([
            {
                from: 0,
                to: 3,
                lineDash: DASHED,
            },
            {
                from: 2,
                to: 4,
                lineDash: DOTTED,
            },
        ]);
    });

});

describe('segmented lineStyle on a chart', () => {

    function chart(lineStyle: Parameters<typeof createLineChart<Datum>>[1]['series'][number]['lineStyle']) {
        polyfillPath2D();
        mockCanvasContext();

        return createLineChart(document.createElement('div'), {
            autoRender: false,
            animation: false,
            data: DATA,
            key: 'month',
            series: [{
                id: 's',
                label: 'S',
                value: 'revenue',
                lineStyle,
            }],
        });
    }

    it('puts the resolved segments on the single series polyline', async () => {
        const instance = chart([{
            from: 'february',
            to: 'april',
            style: 'dashed',
        }]);

        await instance.render();

        const group = (instance as unknown as SeriesInternals)._series.groups[0];

        expect(group.getElementsByType('polyline')).toHaveLength(1);
        expect(lineOf(instance, 's').segments).toEqual([{
            from: 1,
            to: 3,
            lineDash: DASHED,
        }]);

        instance.destroy();
    });

    it('leaves a scalar style unsegmented', async () => {
        const instance = chart('dashed');

        await instance.render();

        expect(lineOf(instance, 's').lineDash).toEqual(DASHED);
        expect(lineOf(instance, 's').segments).toBeUndefined();

        instance.destroy();
    });

    it('re-resolves segments against new data on update', async () => {
        const instance = chart([{
            from: 'february',
            to: 'april',
            style: 'dashed',
        }]);

        await instance.render();
        expect(lineOf(instance, 's').segments).toEqual([{
            from: 1,
            to: 3,
            lineDash: DASHED,
        }]);

        // Dropping a point shifts every later index, so a stale resolution would dash the wrong span.
        instance.update({ data: DATA.slice(1) });
        await instance.render();

        expect(lineOf(instance, 's').segments).toEqual([{
            from: 0,
            to: 2,
            lineDash: DASHED,
        }]);

        instance.destroy();
    });

    it('drops the segments when a boundary key leaves the data', async () => {
        const instance = chart([{
            from: 'april',
            style: 'dashed',
        }]);

        await instance.render();
        expect(lineOf(instance, 's').segments).toBeTruthy();

        instance.update({ data: DATA.slice(0, 2) });
        await instance.render();

        expect(lineOf(instance, 's').segments).toBeUndefined();

        instance.destroy();
    });

    it('segments an area series line without touching its fill', async () => {
        polyfillPath2D();
        mockCanvasContext();

        const instance = createAreaChart(document.createElement('div'), {
            autoRender: false,
            animation: false,
            data: DATA,
            key: 'month',
            series: [{
                id: 's',
                label: 'S',
                value: 'revenue',
                lineStyle: {
                    default: 'solid',
                    segments: [{
                        from: 'february',
                        to: 'april',
                        style: 'dotted',
                    }],
                },
            }],
        });

        await instance.render();

        const polylines = (instance as unknown as SeriesInternals)._series.groups[0].getElementsByType('polyline');

        expect(polylines).toHaveLength(2);
        expect(polylines[0].segments).toBeUndefined();
        expect(polylines[1].segments).toEqual([{
            from: 1,
            to: 3,
            lineDash: DOTTED,
        }]);

        instance.destroy();
    });

});
