// Side-effect import: `@ripl/web` registers the browser factory (canvas context, text
// measurement, rAF). `@ripl/charts` is context-agnostic and installs no backend of its own.
import '@ripl/web';

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
    Element,
    Group,
    Scene,
} from '@ripl/core';

import {
    createChordChart,
    createPieChart,
    createSunburstChart,
} from '../src';

polyfillPath2D();

interface ChartInternals {
    scene: Scene;
    highlightSeries(id: string | null): void;
}

function sceneOf(chart: unknown) {
    return (chart as unknown as ChartInternals).scene;
}

function elementById(chart: unknown, id: string) {
    const element = sceneOf(chart).getElementById(id) as Element | null;

    expect(element).toBeTruthy();

    return element!;
}

function segmentArc(chart: unknown, groupId: string) {
    const group = sceneOf(chart).getElementById(groupId) as Group | null;

    expect(group).toBeTruthy();

    return group!.query('arc') as unknown as Element;
}

function hover(element: Element, event: 'mouseenter' | 'mouseleave') {
    element.emit(event, null);
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

function createPie() {
    return createPieChart<typeof PIE_DATA[number]>(document.createElement('div'), {
        autoRender: false,
        data: PIE_DATA,
        key: 'label',
        value: 'value',
        label: 'label',
        labels: true,
    });
}

describe('hover highlight rest opacity', () => {

    beforeEach(() => {
        vi.useFakeTimers();
        mockCanvasContext();
    });

    afterEach(() => {
        vi.restoreAllMocks();
        vi.useRealTimers();
    });

    test('a chord arc hovered mid-entry leaves the ribbons at full opacity', async () => {
        const chart = createChordChart(document.createElement('div'), {
            autoRender: false,
            groups: [
                'A',
                'B',
            ],
            matrix: [
                [0, 4],
                [4, 0],
            ],
        });

        chart.render();
        await vi.advanceTimersByTimeAsync(100);

        const ribbon = elementById(chart, 'ribbon-A-B-ribbon');

        expect(ribbon.opacity).toBe(0);

        hover(elementById(chart, 'arc-A-segment'), 'mouseenter');
        await vi.advanceTimersByTimeAsync(5000);

        hover(elementById(chart, 'arc-A-segment'), 'mouseleave');
        await vi.advanceTimersByTimeAsync(5000);

        expect(ribbon.opacity).toBe(1);

        chart.destroy();
    });

    test('a pie slice hovered mid-entry leaves the segment labels at full opacity', async () => {
        const chart = createPie();

        chart.render();
        await vi.advanceTimersByTimeAsync(100);

        const label = (sceneOf(chart).getElementById('a') as Group).query('text') as unknown as Element;

        expect(label.opacity).toBe(0);

        hover(segmentArc(chart, 'a'), 'mouseenter');
        await vi.advanceTimersByTimeAsync(5000);

        hover(segmentArc(chart, 'a'), 'mouseleave');
        await vi.advanceTimersByTimeAsync(5000);

        expect(label.opacity).toBe(1);

        chart.destroy();
    });

    test('removing the hovered slice restores the slices that remain', async () => {
        const chart = createPie();

        chart.render();
        await vi.advanceTimersByTimeAsync(5000);

        hover(segmentArc(chart, 'c'), 'mouseenter');
        await vi.advanceTimersByTimeAsync(5000);

        expect(segmentArc(chart, 'a').opacity).toBeLessThan(1);

        chart.update({ data: PIE_DATA.slice(0, 2) });
        chart.render();
        await vi.advanceTimersByTimeAsync(5000);

        expect(segmentArc(chart, 'a').opacity).toBe(1);
        expect(segmentArc(chart, 'b').opacity).toBe(1);

        chart.destroy();
    });

});

describe('sunburst hover owners', () => {

    beforeEach(() => {
        vi.useFakeTimers();
        mockCanvasContext();
    });

    afterEach(() => {
        vi.restoreAllMocks();
        vi.useRealTimers();
    });

    async function createSunburst() {
        const chart = createSunburstChart(document.createElement('div'), {
            autoRender: false,
            data: [
                {
                    id: 'T',
                    label: 'T',
                    value: 6,
                    children: [
                        {
                            id: 'T1',
                            label: 'T1',
                            value: 4,
                            children: [
                                {
                                    id: 'T1a',
                                    label: 'T1a',
                                    value: 2,
                                },
                                {
                                    id: 'T1b',
                                    label: 'T1b',
                                    value: 2,
                                },
                            ],
                        },
                        {
                            id: 'T2',
                            label: 'T2',
                            value: 2,
                        },
                    ],
                },
                {
                    id: 'U',
                    label: 'U',
                    value: 3,
                },
            ],
        });

        chart.render();
        await vi.advanceTimersByTimeAsync(5000);

        return chart;
    }

    function litNodes(chart: unknown, ids: string[]) {
        return ids.filter(id => elementById(chart, `${id}-arc`).opacity === 1);
    }

    const ALL = [
        'T',
        'T1',
        'T1a',
        'T1b',
        'T2',
        'U',
    ];

    test.each([
        ['T', ['T']],
        ['T1', ['T1']],
        ['T1a', ['T1a']],
    ])('hovering segment %s isolates that ring', async (id, expected) => {
        const chart = await createSunburst();

        hover(elementById(chart, `${id}-arc`), 'mouseenter');
        await vi.advanceTimersByTimeAsync(5000);

        expect(litNodes(chart, ALL)).toEqual(expected);

        hover(elementById(chart, `${id}-arc`), 'mouseleave');
        await vi.advanceTimersByTimeAsync(5000);

        expect(litNodes(chart, ALL)).toEqual(ALL);

        chart.destroy();
    });

    test('hovering a legend item lights the whole branch', async () => {
        const chart = await createSunburst();

        (chart as unknown as ChartInternals).highlightSeries('T');
        await vi.advanceTimersByTimeAsync(5000);

        expect(litNodes(chart, ALL)).toEqual([
            'T',
            'T1',
            'T1a',
            'T1b',
            'T2',
        ]);

        chart.destroy();
    });

});
