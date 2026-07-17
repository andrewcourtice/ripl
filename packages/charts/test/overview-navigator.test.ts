import {
    afterEach,
    describe,
    expect,
    test,
    vi,
} from 'vitest';

import {
    mockCanvasContext,
    polyfillPath2D,
} from '@ripl/test-utils';

import {
    createAreaChart,
    createBarChart,
    createLineChart,
    createTrendChart,
} from '../src';

import type {
    Group,
} from '@ripl/core';

polyfillPath2D();

/**
 * jsdom measures every element as 0×0, which collapses the plot rect. Give the canvas a real size so
 * the layout produces a meaningful plot/strip geometry to assert against.
 */
function mockCanvasSize(width: number, height: number): void {
    vi.spyOn(HTMLCanvasElement.prototype, 'getBoundingClientRect').mockReturnValue({
        width,
        height,
        top: 0,
        left: 0,
        right: width,
        bottom: height,
        x: 0,
        y: 0,
        toJSON: () => ({}),
    } as DOMRect);
}

afterEach(() => {
    vi.restoreAllMocks();
});

/** Reaches into a chart's scene to inspect the rendered element graph. */
function sceneOf(chart: unknown): Group {
    return (chart as { scene: Group }).scene;
}

/** The plot rectangle the chart last rendered into (used to bound pan/zoom). */
function plotOf(chart: unknown): { x: number;
    y: number;
    width: number;
    height: number; } {
    return (chart as { _navPlot: { x: number;
        y: number;
        width: number;
        height: number; }; })._navPlot;
}

/** The geometry of a rendered rect element. */
interface RectBox {
    x: number;
    y: number;
    width: number;
    height: number;
}

/** Reads a rect element's geometry by id (asserting it exists). */
function rectOf(chart: unknown, id: string): RectBox {
    const rect = sceneOf(chart).getElementById(id) as unknown as RectBox | undefined;
    expect(rect).toBeDefined();
    return rect!;
}

/** Reads a polyline element's points by id (asserting it exists). */
function pointsOf(chart: unknown, id: string): [number, number][] {
    const element = sceneOf(chart).getElementById(id) as unknown as { points: [number, number][] } | undefined;
    expect(element).toBeDefined();
    return element!.points;
}

interface Row {
    month: string;
    a: number;
    b: number;
}

const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May'];
const DATA: Row[] = MONTHS.map((month, index) => ({
    month,
    a: (index + 1) * 100,
    b: (index + 1) * 40,
}));

describe('Overview navigator strip', () => {

    test('Line chart draws a per-series polyline in the strip when overview is on', async () => {
        mockCanvasContext();
        mockCanvasSize(640, 400);

        const chart = createLineChart<Row>(document.createElement('div'), {
            autoRender: false,
            animation: false,
            data: DATA,
            key: 'month',
            overview: true,
            series: [
                {
                    id: 'a',
                    label: 'A',
                    value: 'a',
                },
            ],
        });

        await chart.render();

        const scene = sceneOf(chart);

        expect(scene.getElementById('__navigator-strip')).toBeDefined();
        expect(scene.getElementById('navigator-overview-a')?.type).toBe('polyline');

        chart.destroy();
    });

    test('Area chart draws a filled band plus a top line per series', async () => {
        mockCanvasContext();
        mockCanvasSize(640, 400);

        const chart = createAreaChart<Row>(document.createElement('div'), {
            autoRender: false,
            animation: false,
            data: DATA,
            key: 'month',
            overview: true,
            series: [
                {
                    id: 'a',
                    label: 'A',
                    value: 'a',
                },
            ],
        });

        await chart.render();

        const scene = sceneOf(chart);
        const fill = scene.getElementById('navigator-overview-a-fill');
        const line = scene.getElementById('navigator-overview-a-line');

        expect(fill?.type).toBe('polyline');
        expect(line?.type).toBe('polyline');
        // The band is a filled polygon, not an auto-stroked line.
        expect((fill as unknown as { autoStroke: boolean }).autoStroke).toBe(false);

        chart.destroy();
    });

    test('Bar chart draws one silhouette rect per datum', async () => {
        mockCanvasContext();
        mockCanvasSize(640, 400);

        const chart = createBarChart<Row>(document.createElement('div'), {
            autoRender: false,
            animation: false,
            data: DATA,
            key: 'month',
            overview: true,
            series: [
                {
                    id: 'a',
                    label: 'A',
                    value: 'a',
                },
            ],
        });

        await chart.render();

        const scene = sceneOf(chart);

        for (let index = 0; index < DATA.length; index++) {
            expect(scene.getElementById(`navigator-overview-a-bar-${index}`)?.type).toBe('rect');
        }

        // Exactly one rect per datum — no extras.
        expect(scene.getElementById(`navigator-overview-a-bar-${DATA.length}`)).toBeUndefined();

        chart.destroy();
    });

    test('Mixed trend strip renders each series by its own type', async () => {
        mockCanvasContext();
        mockCanvasSize(640, 400);

        const chart = createTrendChart<Row>(document.createElement('div'), {
            autoRender: false,
            animation: false,
            data: DATA,
            key: 'month',
            overview: true,
            series: [
                {
                    id: 'area',
                    type: 'area',
                    label: 'Area',
                    value: 'a',
                },
                {
                    id: 'bar',
                    type: 'bar',
                    label: 'Bar',
                    value: 'b',
                },
                {
                    id: 'line',
                    type: 'line',
                    label: 'Line',
                    value: 'a',
                },
            ],
        });

        await chart.render();

        const scene = sceneOf(chart);

        // Area → filled band + line; bar → one rect per datum; line → a single polyline.
        expect(scene.getElementById('navigator-overview-area-fill')?.type).toBe('polyline');
        expect(scene.getElementById('navigator-overview-area-line')?.type).toBe('polyline');
        expect(scene.getElementById('navigator-overview-bar-bar-0')?.type).toBe('rect');
        expect(scene.getElementById(`navigator-overview-bar-bar-${DATA.length - 1}`)?.type).toBe('rect');
        expect(scene.getElementById('navigator-overview-line')?.type).toBe('polyline');

        chart.destroy();
    });

    test('Vertical bar gets a wide bottom strip; horizontal bar gets a tall side strip', async () => {
        mockCanvasContext();
        mockCanvasSize(640, 400);

        const vertical = createBarChart<Row>(document.createElement('div'), {
            autoRender: false,
            animation: false,
            data: DATA,
            key: 'month',
            overview: true,
            orientation: 'vertical',
            series: [
                {
                    id: 'a',
                    label: 'A',
                    value: 'a',
                },
            ],
        });

        await vertical.render();

        const verticalStrip = sceneOf(vertical).getElementById('navigator-strip') as unknown as { width: number;
            height: number; };

        // Category on x → a bottom bar spanning the plot width.
        expect(verticalStrip.width).toBeGreaterThan(verticalStrip.height);

        vertical.destroy();

        const horizontal = createBarChart<Row>(document.createElement('div'), {
            autoRender: false,
            animation: false,
            data: DATA,
            key: 'month',
            overview: true,
            orientation: 'horizontal',
            series: [
                {
                    id: 'a',
                    label: 'A',
                    value: 'a',
                },
            ],
        });

        await horizontal.render();

        const horizontalStrip = sceneOf(horizontal).getElementById('navigator-strip') as unknown as { width: number;
            height: number; };

        // Category on y → a side bar spanning the plot height.
        expect(horizontalStrip.height).toBeGreaterThan(horizontalStrip.width);

        horizontal.destroy();
    });

    test('Windowing clips the category (x) axis but never the value (y) axis', async () => {
        mockCanvasContext();
        mockCanvasSize(640, 400);

        const chart = createLineChart<Row>(document.createElement('div'), {
            autoRender: false,
            animation: false,
            data: DATA,
            key: 'month',
            overview: true,
            series: [
                {
                    id: 'a',
                    label: 'A',
                    value: 'a',
                },
            ],
        });

        await chart.render();

        const findClip = (group: { children: { clip?: boolean;
            pointerEvents?: string; }[]; }) =>
            group.children.find(child => child.clip !== undefined && child.pointerEvents === 'none');

        const axisGroups = sceneOf(chart).queryAll<Group>('.chart-axis');
        const clipped = axisGroups.filter(group => findClip(group)?.clip === true);

        // Both axes exist, but only the sliding category (x) axis is masked — the value axis is held at
        // the full extent, so its min/max labels are never bisected.
        expect(axisGroups.length).toBe(2);
        expect(clipped.length).toBe(1);

        chart.destroy();
    });

    test('Zoom is clamped so you cannot zoom out past the full data extent (k >= 1)', async () => {
        mockCanvasContext();
        mockCanvasSize(640, 400);

        const chart = createLineChart<Row>(document.createElement('div'), {
            autoRender: false,
            animation: false,
            data: DATA,
            key: 'month',
            overview: true,
            series: [
                {
                    id: 'a',
                    label: 'A',
                    value: 'a',
                },
            ],
        });

        await chart.render();

        chart.navigator!.setTransform({
            k: 0.25,
            x: 0,
            y: 0,
        });

        // Clamped up to the identity view — the full dataset is the furthest-out you can go.
        expect(chart.navigator!.transform.k).toBe(1);

        chart.destroy();
    });

    test('Pan is clamped to the data edges along the category axis', async () => {
        mockCanvasContext();
        mockCanvasSize(640, 400);

        const chart = createLineChart<Row>(document.createElement('div'), {
            autoRender: false,
            animation: false,
            data: DATA,
            key: 'month',
            overview: true,
            series: [
                {
                    id: 'a',
                    label: 'A',
                    value: 'a',
                },
            ],
        });

        await chart.render();

        const plot = plotOf(chart);
        const k = 2;

        // Scroll hard past the right edge — clamps to the lower translate bound (origin+size)(1-k).
        chart.navigator!.setTransform({
            k,
            x: -100000,
            y: 0,
        });

        expect(chart.navigator!.transform.x).toBeCloseTo((plot.x + plot.width) * (1 - k), 4);

        // Scroll hard past the left edge — clamps to the upper translate bound origin(1-k).
        chart.navigator!.setTransform({
            k,
            x: 100000,
            y: 0,
        });

        expect(chart.navigator!.transform.x).toBeCloseTo(plot.x * (1 - k), 4);

        chart.destroy();
    });

    test('No strip is drawn unless the overview is opted in, and it appears when toggled on', async () => {
        mockCanvasContext();
        mockCanvasSize(640, 400);

        const chart = createLineChart<Row>(document.createElement('div'), {
            autoRender: false,
            animation: false,
            data: DATA,
            key: 'month',
            series: [
                {
                    id: 'a',
                    label: 'A',
                    value: 'a',
                },
            ],
        });

        await chart.render();

        // Off by default: no strip, no navigator.
        expect(sceneOf(chart).getElementById('__navigator-strip')).toBeUndefined();
        expect(chart.navigator).toBeUndefined();

        chart.update({
            overview: true,
        } as Partial<Parameters<typeof createLineChart<Row>>[1]>);

        await chart.render();

        // Toggled on: the strip is drawn and the shared navigator exists to drive it.
        expect(sceneOf(chart).getElementById('__navigator-strip')).toBeDefined();
        expect(chart.navigator).toBeDefined();

        chart.destroy();
    });

    test('Grouped bars stay inside the strip and sit side by side', async () => {
        mockCanvasContext();
        mockCanvasSize(640, 400);

        const chart = createBarChart<Row>(document.createElement('div'), {
            autoRender: false,
            animation: false,
            data: DATA,
            key: 'month',
            overview: true,
            series: [
                {
                    id: 'a',
                    label: 'A',
                    value: 'a',
                },
                {
                    id: 'b',
                    label: 'B',
                    value: 'b',
                },
            ],
        });

        await chart.render();

        const strip = rectOf(chart, 'navigator-strip');
        const last = DATA.length - 1;

        // No bleed: the leftmost sub-bar of the first category and the rightmost of the last category
        // both sit inside the strip rectangle.
        const first = rectOf(chart, 'navigator-overview-a-bar-0');
        const lastBar = rectOf(chart, `navigator-overview-b-bar-${last}`);

        expect(first.x).toBeGreaterThanOrEqual(strip.x - 1e-6);
        expect(lastBar.x + lastBar.width).toBeLessThanOrEqual(strip.x + strip.width + 1e-6);

        // Grouped: the two series sit side by side in category 0 — disjoint, equal width, not overlapping.
        const aBar = rectOf(chart, 'navigator-overview-a-bar-0');
        const bBar = rectOf(chart, 'navigator-overview-b-bar-0');

        expect(aBar.x).not.toBe(bBar.x);
        expect(aBar.x + aBar.width).toBeLessThanOrEqual(bBar.x + 1e-6);
        expect(Math.abs(aBar.width - bBar.width)).toBeLessThan(1e-6);

        chart.destroy();
    });

    test('Stacked bars share a column and stack rather than group', async () => {
        mockCanvasContext();
        mockCanvasSize(640, 400);

        const chart = createBarChart<Row>(document.createElement('div'), {
            autoRender: false,
            animation: false,
            data: DATA,
            key: 'month',
            overview: true,
            mode: 'stacked',
            series: [
                {
                    id: 'a',
                    label: 'A',
                    value: 'a',
                },
                {
                    id: 'b',
                    label: 'B',
                    value: 'b',
                },
            ],
        });

        await chart.render();

        const aBar = rectOf(chart, 'navigator-overview-a-bar-0');
        const bBar = rectOf(chart, 'navigator-overview-b-bar-0');

        // Same main position and full band width — one stacked column, not side-by-side.
        expect(aBar.x).toBeCloseTo(bBar.x, 6);
        expect(aBar.width).toBeCloseTo(bBar.width, 6);

        // Bottom strip: values grow upward, so `b` sits on top of `a` — b's lower edge meets a's upper
        // edge, and `a` (anchored at the baseline) extends lower than `b`.
        expect(Math.abs((bBar.y + bBar.height) - aBar.y)).toBeLessThan(1e-6);
        expect(aBar.y + aBar.height).toBeGreaterThan(bBar.y + bBar.height);

        chart.destroy();
    });

    test('Trend line marks are centred over the bars in the band layout', async () => {
        mockCanvasContext();
        mockCanvasSize(640, 400);

        const trend = createTrendChart<Row>(document.createElement('div'), {
            autoRender: false,
            animation: false,
            data: DATA,
            key: 'month',
            overview: true,
            series: [
                {
                    id: 'bar',
                    type: 'bar',
                    label: 'Bar',
                    value: 'a',
                },
                {
                    id: 'line',
                    type: 'line',
                    label: 'Line',
                    value: 'b',
                },
            ],
        });

        await trend.render();

        const bar0 = rectOf(trend, 'navigator-overview-bar-bar-0');
        const linePoints = pointsOf(trend, 'navigator-overview-line');

        // The line's first vertex sits at the first category's band centre — directly over the bar.
        expect(linePoints[0][0]).toBeCloseTo(bar0.x + bar0.width / 2, 6);

        trend.destroy();

        // A standalone line chart keeps edge-to-edge marks: its first vertex is at the strip's start.
        const line = createLineChart<Row>(document.createElement('div'), {
            autoRender: false,
            animation: false,
            data: DATA,
            key: 'month',
            overview: true,
            series: [
                {
                    id: 'a',
                    label: 'A',
                    value: 'a',
                },
            ],
        });

        await line.render();

        const strip = rectOf(line, 'navigator-strip');

        expect(pointsOf(line, 'navigator-overview-a')[0][0]).toBeCloseTo(strip.x, 6);

        line.destroy();
    });

    test('Stacked area series accumulate; unstacked areas overlap', async () => {
        mockCanvasContext();
        mockCanvasSize(640, 400);

        // `b` < `a`, so a stacked `b` (a + b) sits ABOVE `a`, but an unstacked `b` sits below it.
        const data: Row[] = MONTHS.map(month => ({
            month,
            a: 100,
            b: 50,
        }));

        const stacked = createAreaChart<Row>(document.createElement('div'), {
            autoRender: false,
            animation: false,
            stacked: true,
            data,
            key: 'month',
            overview: true,
            series: [
                {
                    id: 'a',
                    label: 'A',
                    value: 'a',
                },
                {
                    id: 'b',
                    label: 'B',
                    value: 'b',
                },
            ],
        });

        await stacked.render();

        // Bottom strip: values grow upward (smaller y = higher). Stacked `b` (150) is above `a` (100).
        expect(pointsOf(stacked, 'navigator-overview-b-line')[0][1])
            .toBeLessThan(pointsOf(stacked, 'navigator-overview-a-line')[0][1]);

        stacked.destroy();

        const overlapping = createAreaChart<Row>(document.createElement('div'), {
            autoRender: false,
            animation: false,
            stacked: false,
            data,
            key: 'month',
            overview: true,
            series: [
                {
                    id: 'a',
                    label: 'A',
                    value: 'a',
                },
                {
                    id: 'b',
                    label: 'B',
                    value: 'b',
                },
            ],
        });

        await overlapping.render();

        // Unstacked: each area is drawn from the baseline, so `b` (50) is below `a` (100).
        expect(pointsOf(overlapping, 'navigator-overview-b-line')[0][1])
            .toBeGreaterThan(pointsOf(overlapping, 'navigator-overview-a-line')[0][1]);

        overlapping.destroy();
    });

});
