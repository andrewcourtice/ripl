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
    elementIsCircle,
    elementIsPolygon,
} from '@ripl/core';

import {
    createSymbol,
    positionSymbol,
    symbolRadius,
} from '../src/components/symbols';

import type {
    SymbolType,
} from '../src/components/symbols';

import {
    createLineChart,
    createScatterChart,
} from '../src';

function polygonArea(sides: number, radius: number): number {
    return (sides / 2) * radius * radius * Math.sin((2 * Math.PI) / sides);
}

describe('Marker symbols', () => {

    it('Should create a circle for the circle symbol', () => {
        const symbol = createSymbol('circle', {
            cx: 10,
            cy: 20,
            radius: 4,
        });

        expect(elementIsCircle(symbol)).toBe(true);
        expect(symbol.cx).toBe(10);
        expect(symbol.radius).toBe(4);
    });

    it('Should create regular polygons for the non-circle symbols', () => {
        const triangle = createSymbol('triangle', {
            cx: 0,
            cy: 0,
            radius: symbolRadius('triangle', 4),
        });

        const diamond = createSymbol('diamond', {
            cx: 0,
            cy: 0,
            radius: symbolRadius('diamond', 4),
        });

        expect(elementIsPolygon(triangle)).toBe(true);
        expect(elementIsPolygon(diamond)).toBe(true);
        expect((triangle as { sides: number }).sides).toBe(3);
        expect((diamond as { sides: number }).sides).toBe(4);
    });

    it('Should size non-circle symbols to the same visual area as the circle', () => {
        const circleArea = Math.PI * 4 * 4;

        const cases: [SymbolType, number][] = [
            ['triangle', 3],
            ['diamond', 4],
            ['square', 4],
        ];

        cases.forEach(([type, sides]) => {
            const radius = symbolRadius(type, 4);

            expect(polygonArea(sides, radius)).toBeCloseTo(circleArea, 6);
        });
    });

    it('Should rotate the square about its center', () => {
        const square = createSymbol('square', {
            cx: 30,
            cy: 40,
            radius: 5,
        });

        expect(square.rotation).toBeCloseTo(Math.PI / 4);
        expect(square.transformOriginX).toBe(30);
        expect(square.transformOriginY).toBe(40);
    });

    it('Should keep a rotated symbol origin locked to its center when repositioned', () => {
        const square = createSymbol('square', {
            cx: 0,
            cy: 0,
            radius: 5,
        });

        positionSymbol(square, 70, 80);

        expect(square.cx).toBe(70);
        expect(square.cy).toBe(80);
        expect(square.transformOriginX).toBe(70);
        expect(square.transformOriginY).toBe(80);
    });

    it('Should not touch transform origin when repositioning an unrotated symbol', () => {
        const circle = createSymbol('circle', {
            cx: 0,
            cy: 0,
            radius: 5,
        });

        positionSymbol(circle, 15, 25);

        expect(circle.cx).toBe(15);
        expect(circle.cy).toBe(25);
    });

});

describe('Line chart marker symbols', () => {

    function createChart(marker?: SymbolType) {
        polyfillPath2D();
        mockCanvasContext();

        return createLineChart(document.createElement('div'), {
            autoRender: false,
            animation: false,
            data: [
                {
                    m: 'a',
                    v: 1,
                },
                {
                    m: 'b',
                    v: 2,
                },
                {
                    m: 'c',
                    v: 3,
                },
            ],
            key: 'm',
            series: [{
                id: 's',
                label: 'S',
                value: 'v',
                marker,
            }],
        });
    }

    function markerElements(chart: unknown, type: string): unknown[] {
        const scene = (chart as { scene: { getElementById(id: string): { getElementsByType(type: string): unknown[] } | null } }).scene;
        const group = scene.getElementById('s');

        expect(group).toBeTruthy();

        return group ? group.getElementsByType(type) : [];
    }

    it('Should render circle markers by default', async () => {
        const chart = createChart();

        await chart.render();

        expect(markerElements(chart, 'circle')).toHaveLength(3);
        expect(markerElements(chart, 'polygon')).toHaveLength(0);
    });

    it('Should render polygon markers for a triangle series', async () => {
        const chart = createChart('triangle');

        await chart.render();

        expect(markerElements(chart, 'circle')).toHaveLength(0);
        expect(markerElements(chart, 'polygon')).toHaveLength(3);
    });

    it('Should render polygon bubbles for a scatter series with a symbol', async () => {
        polyfillPath2D();
        mockCanvasContext();

        const chart = createScatterChart(document.createElement('div'), {
            autoRender: false,
            animation: false,
            data: [
                {
                    id: 'p1',
                    x: 1,
                    y: 2,
                },
                {
                    id: 'p2',
                    x: 3,
                    y: 4,
                },
            ],
            key: 'id',
            series: [{
                id: 's',
                label: 'S',
                xBy: 'x',
                yBy: 'y',
                marker: 'diamond',
            }],
        });

        await chart.render();

        expect(markerElements(chart, 'polygon')).toHaveLength(2);
        expect(markerElements(chart, 'circle')).toHaveLength(0);
    });

    it('Should reconcile polygon markers across a data update', async () => {
        const chart = createChart('diamond');

        await chart.render();

        expect(markerElements(chart, 'polygon')).toHaveLength(3);

        chart.update({
            data: [
                {
                    m: 'a',
                    v: 2,
                },
                {
                    m: 'b',
                    v: 4,
                },
                {
                    m: 'c',
                    v: 6,
                },
                {
                    m: 'd',
                    v: 8,
                },
            ],
        });

        await chart.render();

        expect(markerElements(chart, 'polygon')).toHaveLength(4);
    });

});
