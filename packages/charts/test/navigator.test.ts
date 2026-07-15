import {
    describe,
    expect,
    test,
} from 'vitest';

import {
    mockCanvasContext,
    polyfillPath2D,
} from '@ripl/test-utils';

import {
    createLineChart,
    createScatterChart,
} from '../src';

polyfillPath2D();

interface Point {
    id: string;
    x: number;
    y: number;
}

const DATA: Point[] = [
    {
        id: 'a',
        x: 1,
        y: 2,
    },
    {
        id: 'b',
        x: 5,
        y: 8,
    },
    {
        id: 'c',
        x: 9,
        y: 3,
    },
];

function createChart(navigator: boolean) {
    return createScatterChart<Point>(document.createElement('div'), {
        autoRender: false,
        navigator,
        data: DATA,
        key: 'id',
        series: [
            {
                id: 'series',
                xBy: 'x',
                yBy: 'y',
                label: 'Series',
            },
        ],
    });
}

describe('CartesianChart navigator integration', () => {

    test('Should not create a navigator by default', () => {
        mockCanvasContext();

        const chart = createChart(false);

        expect(chart.navigator).toBeUndefined();

        chart.destroy();
    });

    test('Should create a navigator when opted in', () => {
        mockCanvasContext();

        const chart = createChart(true);

        expect(chart.navigator).toBeDefined();
        expect(chart.navigator?.transform).toEqual({
            k: 1,
            x: 0,
            y: 0,
        });

        chart.destroy();
    });

    test('Should react to imperative pan without throwing', () => {
        mockCanvasContext();

        const chart = createChart(true);

        expect(() => chart.navigator?.panBy(40, -20)).not.toThrow();
        expect(chart.navigator?.transform.x).toBe(40);

        chart.destroy();
    });

    test('Should stop driving the chart once destroyed', () => {
        mockCanvasContext();

        const chart = createChart(true);
        const navigator = chart.navigator!;

        chart.destroy();

        // The navigator is torn down with the chart, so further gestures are inert.
        expect(() => navigator.panBy(10, 10)).not.toThrow();
    });

    test('Should create the navigator when toggled on via update', () => {
        mockCanvasContext();

        const chart = createChart(false);

        expect(chart.navigator).toBeUndefined();

        chart.update({
            navigator: true,
        });

        expect(chart.navigator).toBeDefined();

        chart.destroy();
    });

    test('Should pan a categorical (line) chart without throwing', async () => {
        mockCanvasContext();

        const chart = createLineChart<{ month: string;
            value: number; }>(document.createElement('div'), {
            autoRender: false,
            navigator: true,
            data: [
                {
                    month: 'a',
                    value: 1,
                },
                {
                    month: 'b',
                    value: 2,
                },
                {
                    month: 'c',
                    value: 3,
                },
            ],
            key: 'month',
            series: [
                {
                    id: 'series',
                    label: 'Series',
                    value: 'value',
                },
            ],
        });

        // A non-identity view exercises applyView (continuous y) + applyViewToScale (categorical x).
        chart.navigator!.panBy(30, -10);

        await expect(chart.render()).resolves.not.toThrow();
        expect(chart.navigator!.transform.x).toBe(30);

        chart.destroy();
    });

    test('Should clip plotted marks to the plot area only while a navigator is active', async () => {
        mockCanvasContext();

        const withNav = createChart(true);
        await withNav.render();

        const scene = (withNav as any).scene;
        const plotContent = scene.children.find((child: { id: string }) => child.id === '__plot-content');

        expect(plotContent).toBeDefined();

        const clip = plotContent.children.find((child: { clip?: boolean }) => child.clip !== undefined);

        // The bubbles are parented under the clipped container, and the clip is engaged.
        expect(plotContent.getElementsByType('circle').length).toBeGreaterThan(0);
        expect(clip.clip).toBe(true);

        // The clip rect must stay pointer-transparent so it can't swallow marker hovers/clicks.
        expect(clip.pointerEvents).toBe('none');

        withNav.destroy();

        const withoutNav = createChart(false);
        await withoutNav.render();

        const plainScene = (withoutNav as any).scene;
        const plainPlot = plainScene.children.find((child: { id: string }) => child.id === '__plot-content');
        const plainClip = plainPlot.children.find((child: { clip?: boolean }) => child.clip !== undefined);

        // Without a navigator the clip rect is inert, so rendering is unchanged.
        expect(plainClip.clip).toBe(false);

        withoutNav.destroy();
    });

    test('Should clip axis ticks/labels to the plot area only while a navigator is active', async () => {
        mockCanvasContext();

        const withNav = createChart(true);
        await withNav.render();

        const scene = (withNav as any).scene;
        const axisGroups = scene.queryAll('.chart-axis');
        expect(axisGroups.length).toBeGreaterThan(0);

        // The clip rect is the pointer-transparent mask (distinct from the axis line, which also
        // carries a `clip` flag). It's engaged while navigating.
        const findClip = (group: { children: { clip?: boolean;
            pointerEvents?: string; }[]; }) =>
            group.children.find(child => child.clip !== undefined && child.pointerEvents === 'none');

        for (const axisGroup of axisGroups) {
            expect(findClip(axisGroup)?.clip).toBe(true);
        }

        withNav.destroy();

        const withoutNav = createChart(false);
        await withoutNav.render();

        const plainScene = (withoutNav as any).scene;

        // Without a navigator the axis clips stay inert, so tick labels overhang as before.
        for (const axisGroup of plainScene.queryAll('.chart-axis')) {
            expect(findClip(axisGroup)?.clip).toBe(false);
        }

        withoutNav.destroy();
    });

    test('Should destroy the navigator (and reset the view) when toggled off via update', () => {
        mockCanvasContext();

        const chart = createChart(true);

        chart.navigator?.panBy(40, -20);
        expect(chart.navigator?.transform.x).toBe(40);

        chart.update({
            navigator: false,
        });

        expect(chart.navigator).toBeUndefined();

        // Toggling back on starts from a fresh, identity view rather than the stale pan.
        chart.update({
            navigator: true,
        });

        expect(chart.navigator?.transform).toEqual({
            k: 1,
            x: 0,
            y: 0,
        });

        chart.destroy();
    });

});
