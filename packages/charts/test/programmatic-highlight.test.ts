import {
    afterEach,
    beforeEach,
    describe,
    expect,
    test,
    vi,
} from 'vitest';

import {
    mockCanvasContext,
    polyfillPath2D,
} from '@ripl/test-utils';

import type {
    Circle,
    Element,
    Group,
    Scene,
    Text,
} from '@ripl/core';

import {
    createHeatmapChart,
    createLineChart,
    createPieChart,
} from '../src';

interface ChartInternals {
    scene: Scene;
}

interface RejectionHost {
    on(event: 'unhandledRejection', listener: (reason: unknown) => void): void;
    off(event: 'unhandledRejection', listener: (reason: unknown) => void): void;
}

const PIE_DATA = [
    {
        label: 'a',
        value: 3,
    },
    {
        label: 'b',
        value: 2,
    },
    {
        label: 'c',
        value: 1,
    },
];

const LINE_DATA = [
    {
        m: 'a',
        shown: 10,
        hidden: 40,
    },
    {
        m: 'b',
        shown: 20,
        hidden: 60,
    },
    {
        m: 'c',
        shown: 30,
        hidden: 80,
    },
];

const HOURS = [
    '9am',
    '10am',
];

const DAYS = [
    'Mon',
    'Tue',
];

const HEATMAP_DATA = DAYS.flatMap((day, dayIndex) => HOURS.map((hour, hourIndex) => ({
    day,
    hour,
    load: dayIndex * 10 + hourIndex,
})));

polyfillPath2D();

/** jsdom measures every element as 0×0; give the canvas a real size so the charts get a plot to draw in. */
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

function sceneOf(chart: unknown): Scene {
    return (chart as unknown as ChartInternals).scene;
}

function elementById(chart: unknown, id: string): Element {
    const element = sceneOf(chart).getElementById(id) as Element | null;

    expect(element).toBeTruthy();

    return element!;
}

function segmentArc(chart: unknown, key: string): Element {
    const group = sceneOf(chart).getElementById(key) as Group | null;

    expect(group).toBeTruthy();

    return group!.query('arc') as unknown as Element;
}

function tooltipGroup(chart: unknown): Group {
    const group = sceneOf(chart).getElementById('tooltip') as Group | null;

    expect(group).toBeTruthy();

    return group!;
}

function tooltipLines(chart: unknown): string[] {
    const group = sceneOf(chart).getElementById('tooltip') as Group | null;

    return group ? group.getElementsByType<Text>('text').map(text => String(text.content)) : [];
}

function hover(element: Element, event: 'mouseenter' | 'mouseleave') {
    element.emit(event, null);
}

function createPie() {
    return createPieChart<typeof PIE_DATA[number]>(document.createElement('div'), {
        autoRender: false,
        data: PIE_DATA,
        key: 'label',
        value: 'value',
        label: 'label',
    });
}

function createLine() {
    return createLineChart<typeof LINE_DATA[number]>(document.createElement('div'), {
        autoRender: false,
        data: LINE_DATA,
        key: 'm',
        series: [
            {
                id: 'shown',
                label: 'Shown',
                value: 'shown',
            },
            {
                id: 'hidden',
                label: 'Hidden',
                value: 'hidden',
                markers: false,
            },
        ],
    });
}

function createHeatmap() {
    return createHeatmapChart<typeof HEATMAP_DATA[number]>(document.createElement('div'), {
        autoRender: false,
        data: HEATMAP_DATA,
        keyX: 'hour',
        keyY: 'day',
        value: 'load',
        xCategories: HOURS,
        yCategories: DAYS,
    });
}

describe('programmatic mark highlight', () => {

    beforeEach(() => {
        vi.useFakeTimers();
        mockCanvasContext();
        mockCanvasSize(600, 400);
    });

    afterEach(() => {
        vi.restoreAllMocks();
        vi.useRealTimers();
    });

    test('replays a segment hover without emitting the segment events', async () => {
        const chart = createPie();
        const enter = vi.fn();
        const leave = vi.fn();

        chart.on('segmententer', enter);
        chart.on('segmentleave', leave);

        chart.render();
        await vi.advanceTimersByTimeAsync(5000);

        expect(chart.highlightSegment('a')).toBe(true);
        await vi.advanceTimersByTimeAsync(5000);

        chart.clearHighlight();

        expect(enter).not.toHaveBeenCalled();
        expect(leave).not.toHaveBeenCalled();

        hover(segmentArc(chart, 'a'), 'mouseenter');

        expect(enter).toHaveBeenCalledTimes(1);

        chart.destroy();
    });

    test('dims the segments it excludes', async () => {
        const chart = createPie();

        chart.render();
        await vi.advanceTimersByTimeAsync(5000);

        chart.highlightSegment('a');
        await vi.advanceTimersByTimeAsync(5000);

        expect(segmentArc(chart, 'a').opacity).toBe(1);
        expect(segmentArc(chart, 'b').opacity).toBeLessThan(1);
        expect(segmentArc(chart, 'c').opacity).toBeLessThan(1);

        chart.destroy();
    });

    test('shows the tooltip content hovering the segment shows', async () => {
        const chart = createPie();

        chart.render();
        await vi.advanceTimersByTimeAsync(5000);

        hover(segmentArc(chart, 'a'), 'mouseenter');

        const hovered = tooltipLines(chart);

        hover(segmentArc(chart, 'a'), 'mouseleave');
        await vi.advanceTimersByTimeAsync(5000);

        expect(chart.highlightSegment('a', { tooltip: true })).toBe(true);
        await vi.advanceTimersByTimeAsync(5000);

        expect(hovered).not.toEqual([]);
        expect(tooltipLines(chart)).toEqual(hovered);
        expect(tooltipGroup(chart).opacity).toBe(1);

        chart.destroy();
    });

    test('returns false for a key no segment carries', async () => {
        const chart = createPie();

        chart.render();
        await vi.advanceTimersByTimeAsync(5000);

        expect(chart.highlightSegment('nope')).toBe(false);
        expect(chart.highlightSegment('a')).toBe(true);

        chart.destroy();
    });

    test('returns false for a series whose markers are hidden', async () => {
        const chart = createLine();

        chart.render();
        await vi.advanceTimersByTimeAsync(5000);

        expect(chart.highlightMarker({
            key: 'b',
            series: 'hidden',
        })).toBe(false);

        expect(chart.highlightMarker({
            key: 'b',
            series: 'shown',
        })).toBe(true);

        chart.destroy();
    });

    test('restores the chart and hides the tooltip on the next render', async () => {
        const chart = createPie();

        chart.render();
        await vi.advanceTimersByTimeAsync(5000);

        chart.highlightSegment('a', { tooltip: true });
        await vi.advanceTimersByTimeAsync(5000);

        expect(segmentArc(chart, 'b').opacity).toBeLessThan(1);
        expect(tooltipGroup(chart).opacity).toBe(1);

        chart.render();
        await vi.advanceTimersByTimeAsync(5000);

        expect(segmentArc(chart, 'b').opacity).toBe(1);
        expect(tooltipGroup(chart).opacity).toBe(0);

        chart.destroy();
    });

    test('restores the mark synchronously, without waiting a frame', async () => {
        const chart = createLine();

        chart.render();
        await vi.advanceTimersByTimeAsync(5000);

        const marker = elementById(chart, 'shown-b') as unknown as Circle;
        const rest = marker.radius;

        chart.highlightMarker({
            key: 'b',
            series: 'shown',
        });

        await vi.advanceTimersByTimeAsync(5000);

        expect(marker.radius).toBeGreaterThan(rest);

        chart.clearHighlight();

        // A zero-duration transition would only land the restore a frame later, so it is written outright.
        expect(marker.radius).toBe(rest);

        chart.destroy();
    });

    test('leaves no unhandled rejection when a highlight is replaced mid-transition', async () => {
        const rejections: unknown[] = [];
        const capture = (reason: unknown) => rejections.push(reason);
        const host = (globalThis as unknown as { process: RejectionHost }).process;

        host.on('unhandledRejection', capture);

        const chart = createLine();

        chart.render();
        await vi.advanceTimersByTimeAsync(5000);

        chart.highlightMarker({
            key: 'b',
            series: 'shown',
        });

        await vi.advanceTimersByTimeAsync(50);

        chart.highlightMarker({
            key: 'c',
            series: 'shown',
        });

        chart.clearHighlight();
        await vi.advanceTimersByTimeAsync(5000);

        host.off('unhandledRejection', capture);

        expect(rejections).toEqual([]);

        chart.destroy();
    });

});

describe('heatmap cell selectors', () => {

    beforeEach(() => {
        vi.useFakeTimers();
        mockCanvasContext();
        mockCanvasSize(600, 400);
    });

    afterEach(() => {
        vi.restoreAllMocks();
        vi.useRealTimers();
    });

    test('an { x, y } ref lights the one cell at that pair of labels', async () => {
        const chart = createHeatmap();

        chart.render();
        await vi.advanceTimersByTimeAsync(5000);

        expect(chart.highlightCell({
            x: '9am',
            y: 'Mon',
        }, { tooltip: true })).toBe(true);

        await vi.advanceTimersByTimeAsync(5000);

        expect(elementById(chart, 'cell-9am-Mon').opacity).toBe(0.8);
        expect(elementById(chart, 'cell-10am-Mon').opacity).not.toBe(0.8);
        expect(tooltipLines(chart)).toHaveLength(1);

        chart.destroy();
    });

    test('a bare label lights its whole row, joining their tooltip contents', async () => {
        const chart = createHeatmap();

        chart.render();
        await vi.advanceTimersByTimeAsync(5000);

        expect(chart.highlightCell('Mon', { tooltip: true })).toBe(true);
        await vi.advanceTimersByTimeAsync(5000);

        expect(elementById(chart, 'cell-9am-Mon').opacity).toBe(0.8);
        expect(elementById(chart, 'cell-10am-Mon').opacity).toBe(0.8);
        expect(elementById(chart, 'cell-9am-Tue').opacity).not.toBe(0.8);
        expect(tooltipLines(chart)).toHaveLength(HOURS.length);

        chart.destroy();
    });

});
