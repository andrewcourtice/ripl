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
    createAreaChart,
    createBarChart,
    createLineChart,
    createScatterChart,
} from '../src';

interface AxisBox {
    left: number;
    right: number;
    top: number;
    bottom: number;
    width: number;
}

interface AxisInternals {
    alignment: string;
    scale: {
        (value: number): number;
        domain: number[];
    };
    getBoundingBox(): AxisBox;
}

interface SceneElementInternals {
    cy: number;
    height: number;
    emit(event: string, payload?: unknown): void;
}

function yAxes(chart: unknown): AxisInternals[] {
    return (chart as { yAxes: AxisInternals[] }).yAxes;
}

// Every series (across all axes) renders through the single collapsed `_series` renderer, so its
// group ids are the set of currently-drawn series.
function seriesGroupIds(chart: unknown): string[] {
    return (chart as { _series: { groups: { id: string }[] } })._series.groups.map(group => group.id);
}

function bubbleGroups(chart: unknown): unknown[] {
    return (chart as { _bubbleGroups: unknown[] })._bubbleGroups;
}

function bubbleGroupIds(chart: unknown): string[] {
    return (chart as { _bubbleGroups: { id: string }[] })._bubbleGroups.map(group => group.id);
}

// jsdom provides no layout, so the scene starts 0×0 and axis bands have no real pixel width — size
// the context directly so the packed multi-axis layout can be asserted in pixel space.
function rescaleContext(chart: unknown): void {
    (chart as { scene: { context: { rescale(width: number, height: number): void } } }).scene.context.rescale(600, 400);
}

function sceneElement(chart: unknown, id: string): SceneElementInternals | null {
    return (chart as { scene: { getElementById(id: string): SceneElementInternals | null } }).scene.getElementById(id);
}

function clickLegendItem(chart: unknown, id: string) {
    const swatch = sceneElement(chart, `legend-swatch-${id}`);

    expect(swatch).toBeTruthy();
    swatch?.emit('click');
}

function createDualAxisAreaChart(stacked = false) {
    polyfillPath2D();
    mockCanvasContext();

    return createAreaChart(document.createElement('div'), {
        autoRender: false,
        animation: false,
        stacked,
        data: [
            {
                m: 'a',
                small: 10,
                large: 1000,
            },
            {
                m: 'b',
                small: 20,
                large: 3000,
            },
        ],
        key: 'm',
        series: [
            {
                id: 'left',
                label: 'Left',
                value: 'small',
            },
            {
                id: 'right',
                label: 'Right',
                value: 'large',
                axis: 1,
            },
        ],
        axis: {
            y: [
                { title: 'Left' },
                {
                    position: 'right',
                    title: 'Right',
                },
            ],
        },
    });
}

function createDualAxisScatterChart() {
    polyfillPath2D();
    mockCanvasContext();

    return createScatterChart(document.createElement('div'), {
        autoRender: false,
        animation: false,
        data: [
            {
                id: 'p1',
                x: 1,
                small: 10,
                large: 1000,
            },
            {
                id: 'p2',
                x: 2,
                small: 20,
                large: 3000,
            },
        ],
        key: 'id',
        series: [
            {
                id: 'left',
                label: 'Left',
                xBy: 'x',
                yBy: 'small',
            },
            {
                id: 'right',
                label: 'Right',
                xBy: 'x',
                yBy: 'large',
                axis: 1,
            },
        ],
        axis: {
            y: [
                { title: 'Left' },
                {
                    position: 'right',
                    title: 'Right',
                },
            ],
        },
    });
}

describe('secondary y-axis (line)', () => {

    it('builds two independent y-axes and binds series by axis, secondary on the right', async () => {
        polyfillPath2D();
        mockCanvasContext();

        const chart = createLineChart(document.createElement('div'), {
            autoRender: false,
            animation: false,
            data: [
                {
                    m: 'a',
                    small: 10,
                    large: 1000,
                },
                {
                    m: 'b',
                    small: 20,
                    large: 3000,
                },
            ],
            key: 'm',
            series: [
                {
                    id: 'left',
                    label: 'Left',
                    value: 'small',
                },
                {
                    id: 'right',
                    label: 'Right',
                    value: 'large',
                    axis: 1,
                },
            ],
            axis: {
                y: [
                    { title: 'Left' },
                    {
                        position: 'right',
                        title: 'Right',
                    },
                ],
            },
        });

        await chart.render();

        const axes = yAxes(chart);

        expect(axes.length).toBe(2);

        // Each axis scales to its own series' extent — the secondary domain is an order larger
        // (visual positioning of the right-hand axis is covered by the visual gallery).
        expect(axes[1].scale.domain[1]).toBeGreaterThan(axes[0].scale.domain[1] * 10);
    });

    it('keeps a single y-axis when no secondary axis is configured', async () => {
        polyfillPath2D();
        mockCanvasContext();

        const chart = createLineChart(document.createElement('div'), {
            autoRender: false,
            animation: false,
            data: [{
                m: 'a',
                v: 10,
            }],
            key: 'm',
            series: [{
                id: 'v',
                label: 'V',
                value: 'v',
            }],
        });

        await chart.render();

        expect(yAxes(chart).length).toBe(1);
    });

});

describe('secondary y-axis (area)', () => {

    it('builds two independent y-axes and binds series by axis, secondary on the right', async () => {
        const chart = createDualAxisAreaChart();

        await chart.render();

        const axes = yAxes(chart);

        expect(axes.length).toBe(2);
        expect(axes[1].alignment).toBe('right');

        // Each axis scales to its own series' extent — the secondary domain is an order larger
        // (visual positioning of the right-hand axis is covered by the visual gallery).
        expect(axes[1].scale.domain[1]).toBeGreaterThan(axes[0].scale.domain[1] * 10);
    });

    it('stacks series per axis group', async () => {
        polyfillPath2D();
        mockCanvasContext();

        const chart = createAreaChart(document.createElement('div'), {
            autoRender: false,
            animation: false,
            stacked: true,
            data: [
                {
                    m: 'a',
                    s1: 10,
                    s2: 20,
                    other: 1000,
                },
                {
                    m: 'b',
                    s1: 20,
                    s2: 30,
                    other: 3000,
                },
            ],
            key: 'm',
            series: [
                {
                    id: 's1',
                    label: 'S1',
                    value: 's1',
                },
                {
                    id: 's2',
                    label: 'S2',
                    value: 's2',
                },
                {
                    id: 'other',
                    label: 'Other',
                    value: 'other',
                    axis: 1,
                },
            ],
            axis: {
                y: [
                    {},
                    {},
                ],
            },
        });

        await chart.render();

        const axes = yAxes(chart);

        // The primary axis covers only its own group's cumulative total (s1 + s2), untouched by
        // the secondary series; the secondary covers its lone series without the primary stack.
        expect(axes[0].scale.domain.at(-1)).toBeGreaterThanOrEqual(50);
        expect(axes[0].scale.domain.at(-1)).toBeLessThan(1000);
        expect(axes[1].scale.domain.at(-1)).toBeGreaterThanOrEqual(3000);

        // Geometry: s2 stacks on s1 within the primary group (cumulative 50 at item b), while the
        // secondary series sits at its raw value against its own axis scale.
        expect(sceneElement(chart, 's2-marker-b')?.cy).toBeCloseTo(axes[0].scale(50));
        expect(sceneElement(chart, 'other-marker-b')?.cy).toBeCloseTo(axes[1].scale(3000));
    });

    it('rescales only the bound axis when a series is toggled via the legend', async () => {
        const chart = createDualAxisAreaChart();

        await chart.render();

        expect(seriesGroupIds(chart).sort()).toEqual(['left', 'right']);
        expect(yAxes(chart)[1].scale.domain.at(-1)).toBeGreaterThanOrEqual(3000);

        const primaryMax = yAxes(chart)[0].scale.domain.at(-1);

        clickLegendItem(chart, 'right');
        await chart.render();

        // Hiding the axis-1 series drops its group from the single renderer's set.
        expect(seriesGroupIds(chart)).toEqual(['left']);
        expect(yAxes(chart)[1].scale.domain.at(-1)).toBeLessThan(3000);
        expect(yAxes(chart)[0].scale.domain.at(-1)).toBe(primaryMax);

        const domains = yAxes(chart).flatMap(axis => axis.scale.domain);

        expect(domains.every(Number.isFinite)).toBe(true);

        clickLegendItem(chart, 'right');
        await chart.render();

        expect(seriesGroupIds(chart).sort()).toEqual(['left', 'right']);
        expect(yAxes(chart)[1].scale.domain.at(-1)).toBeGreaterThanOrEqual(3000);
    });

    it('keeps a single y-axis when no secondary axis is configured', async () => {
        polyfillPath2D();
        mockCanvasContext();

        const chart = createAreaChart(document.createElement('div'), {
            autoRender: false,
            animation: false,
            data: [{
                m: 'a',
                v: 10,
            }],
            key: 'm',
            series: [{
                id: 'v',
                label: 'V',
                value: 'v',
            }],
        });

        await chart.render();

        expect(yAxes(chart).length).toBe(1);
    });

});

describe('secondary y-axis (scatter)', () => {

    it('builds two independent y-axes and binds series by axis, secondary on the right', async () => {
        const chart = createDualAxisScatterChart();

        await chart.render();

        const axes = yAxes(chart);

        expect(axes.length).toBe(2);
        expect(axes[1].alignment).toBe('right');

        // Each axis scales to its own series' y extent — the secondary domain is an order larger
        // (visual positioning of the right-hand axis is covered by the visual gallery).
        expect(axes[1].scale.domain.at(-1)!).toBeGreaterThan(axes[0].scale.domain.at(-1)! * 10);
    });

    it('positions bubbles against their series\' bound axis scale', async () => {
        const chart = createDualAxisScatterChart();

        await chart.render();

        const axes = yAxes(chart);
        const bubble = sceneElement(chart, 'right-p2');

        expect(bubble).toBeTruthy();
        expect(bubble?.cy).toBeCloseTo(axes[1].scale(3000));

        // The primary scale would place the same value far outside its own range.
        expect(Math.abs((bubble?.cy ?? 0) - axes[0].scale(3000))).toBeGreaterThan(1);
    });

    it('rescales only the bound axis when a series is toggled via the legend', async () => {
        const chart = createDualAxisScatterChart();

        await chart.render();

        expect(bubbleGroups(chart).length).toBe(2);
        expect(yAxes(chart)[1].scale.domain.at(-1)).toBeGreaterThanOrEqual(3000);

        const primaryMax = yAxes(chart)[0].scale.domain.at(-1);

        clickLegendItem(chart, 'right');
        await chart.render();

        expect(bubbleGroups(chart).length).toBe(1);
        expect(yAxes(chart)[1].scale.domain.at(-1)).toBeLessThan(3000);
        expect(yAxes(chart)[0].scale.domain.at(-1)).toBe(primaryMax);

        const domains = yAxes(chart).flatMap(axis => axis.scale.domain);

        expect(domains.every(Number.isFinite)).toBe(true);

        clickLegendItem(chart, 'right');
        await chart.render();

        expect(bubbleGroups(chart).length).toBe(2);
        expect(yAxes(chart)[1].scale.domain.at(-1)).toBeGreaterThanOrEqual(3000);
    });

    it('keeps a single y-axis when no secondary axis is configured', async () => {
        polyfillPath2D();
        mockCanvasContext();

        const chart = createScatterChart(document.createElement('div'), {
            autoRender: false,
            animation: false,
            data: [{
                id: 'p1',
                x: 1,
                y: 10,
            }],
            key: 'id',
            series: [{
                id: 'points',
                label: 'Points',
                xBy: 'x',
                yBy: 'y',
            }],
        });

        await chart.render();

        expect(yAxes(chart).length).toBe(1);
    });

});

function createDualAxisBarChart() {
    polyfillPath2D();
    mockCanvasContext();

    return createBarChart(document.createElement('div'), {
        autoRender: false,
        animation: false,
        data: [
            {
                m: 'a',
                small: 10,
                big: 3000,
            },
            {
                m: 'b',
                small: 20,
                big: 5000,
            },
        ],
        key: 'm',
        axis: {
            y: [
                {},
                {},
            ],
        },
        series: [
            {
                id: 'small',
                label: 'Small',
                value: 'small',
            },
            {
                id: 'big',
                label: 'Big',
                value: 'big',
                axis: 1,
            },
        ],
    });
}

describe('secondary y-axis (bar)', () => {

    it('binds independent extents per axis with the secondary on the right', async () => {
        const chart = createDualAxisBarChart();

        await chart.render();

        expect(yAxes(chart).length).toBe(2);
        expect(yAxes(chart)[1].alignment).toBe('right');
        expect(yAxes(chart)[0].scale.domain.at(-1)).toBeLessThan(3000);
        expect(yAxes(chart)[1].scale.domain.at(-1)).toBeGreaterThanOrEqual(5000);
    });

    it('sizes each bar against its bound axis scale', async () => {
        const chart = createDualAxisBarChart();

        await chart.render();

        const bar = sceneElement(chart, 'big-a') as unknown as {
            height: number;
        } | null;

        expect(bar).toBeTruthy();

        const scale = yAxes(chart)[1].scale;
        const expected = Math.abs(scale(3000) - scale(0));

        expect(bar?.height).toBeCloseTo(expected, 5);
    });

    it('rescales only the bound axis when a series is hidden via the legend', async () => {
        const chart = createDualAxisBarChart();

        await chart.render();

        const primaryDomain = [...yAxes(chart)[0].scale.domain];

        clickLegendItem(chart, 'big');
        await chart.render();

        expect(yAxes(chart)[1].scale.domain.at(-1)).toBeLessThan(5000);
        expect(yAxes(chart)[0].scale.domain).toEqual(primaryDomain);

        const domains = yAxes(chart).flatMap(axis => axis.scale.domain);

        expect(domains.every(Number.isFinite)).toBe(true);
    });

    it('keeps single-axis bar charts on one axis', async () => {
        polyfillPath2D();
        mockCanvasContext();

        const chart = createBarChart(document.createElement('div'), {
            autoRender: false,
            animation: false,
            data: [{
                m: 'a',
                v: 1,
            }],
            key: 'm',
            series: [{
                id: 's',
                label: 'S',
                value: 'v',
            }],
        });

        await chart.render();

        expect(yAxes(chart).length).toBe(1);
    });

});

// The 8px gap `layoutYAxes` inserts between two same-side axis bands.
const AXIS_GAP = 8;

// Three series with order-of-magnitude-different values, each bound to its own axis; the axes
// alternate left/right/left so both the left-stacking and the right side are exercised.
const TRIPLE_DATA = [
    {
        m: 'a',
        a: 10,
        b: 1000,
        c: 100000,
    },
    {
        m: 'b',
        a: 20,
        b: 3000,
        c: 300000,
    },
];

const TRIPLE_AXES = {
    y: [
        {},
        { position: 'right' as const },
        { position: 'left' as const },
    ],
};

// Asserts the three axes are laid out on the expected sides, packed without overlap, and each scaled
// to its own series' magnitude. Shared by every chart's 3-axis test.
function expectTripleAxisLayout(chart: unknown) {
    const axes = yAxes(chart);

    expect(axes.length).toBe(3);
    expect(axes.map(axis => axis.alignment)).toEqual(['left', 'right', 'left']);

    expect(axes[0].scale.domain.at(-1)!).toBeLessThan(100);
    expect(axes[1].scale.domain.at(-1)!).toBeGreaterThanOrEqual(3000);
    expect(axes[2].scale.domain.at(-1)!).toBeGreaterThanOrEqual(300000);

    const [box0, box1, box2] = axes.map(axis => axis.getBoundingBox());

    // Axis 0 is the innermost left band (adjacent to the plot); axis 2 stacks outward beyond it with
    // an 8px gap and no overlap; the right axis sits past the plot's right edge.
    expect(box0.right).toBeGreaterThan(box2.right);
    expect(box0.left - box2.right).toBeCloseTo(AXIS_GAP);
    expect(box1.left).toBeGreaterThan(box0.right);

    // Plot spans between the innermost bands; the packed left band == both widths + one gap.
    expect(box0.right - box2.left).toBeCloseTo(box0.width + box2.width + AXIS_GAP);
}

describe('N y-axes (line)', () => {

    function createTripleAxisLineChart() {
        polyfillPath2D();
        mockCanvasContext();

        const chart = createLineChart(document.createElement('div'), {
            autoRender: false,
            animation: false,
            data: TRIPLE_DATA,
            key: 'm',
            axis: TRIPLE_AXES,
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
                    axis: 1,
                },
                {
                    id: 'c',
                    label: 'C',
                    value: 'c',
                    axis: 2,
                },
            ],
        });

        rescaleContext(chart);

        return chart;
    }

    it('lays out three axes and derives each series from its bound axis', async () => {
        const chart = createTripleAxisLineChart();

        await chart.render();

        expectTripleAxisLayout(chart);

        const axes = yAxes(chart);
        const marker = sceneElement(chart, 'c-b');

        // The axis-2 marker sits at axis 2's scale, not the primary's.
        expect(marker?.cy).toBeCloseTo(axes[2].scale(300000));
        expect(Math.abs((marker?.cy ?? 0) - axes[0].scale(300000))).toBeGreaterThan(1);
    });

    it('rescales only the bound axis on legend toggle', async () => {
        const chart = createTripleAxisLineChart();

        await chart.render();

        const axis0Max = yAxes(chart)[0].scale.domain.at(-1);
        const axis1Max = yAxes(chart)[1].scale.domain.at(-1);

        clickLegendItem(chart, 'c');
        await chart.render();

        expect(seriesGroupIds(chart).sort()).toEqual(['a', 'b']);
        expect(yAxes(chart)[2].scale.domain.at(-1)!).toBeLessThan(300000);
        expect(yAxes(chart)[0].scale.domain.at(-1)).toBe(axis0Max);
        expect(yAxes(chart)[1].scale.domain.at(-1)).toBe(axis1Max);
    });

});

describe('N y-axes (area)', () => {

    function createTripleAxisAreaChart() {
        polyfillPath2D();
        mockCanvasContext();

        const chart = createAreaChart(document.createElement('div'), {
            autoRender: false,
            animation: false,
            data: TRIPLE_DATA,
            key: 'm',
            axis: TRIPLE_AXES,
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
                    axis: 1,
                },
                {
                    id: 'c',
                    label: 'C',
                    value: 'c',
                    axis: 2,
                },
            ],
        });

        rescaleContext(chart);

        return chart;
    }

    it('lays out three axes and derives each series from its bound axis', async () => {
        const chart = createTripleAxisAreaChart();

        await chart.render();

        expectTripleAxisLayout(chart);

        const axes = yAxes(chart);
        const marker = sceneElement(chart, 'c-marker-b');

        expect(marker?.cy).toBeCloseTo(axes[2].scale(300000));
        expect(Math.abs((marker?.cy ?? 0) - axes[0].scale(300000))).toBeGreaterThan(1);
    });

    it('rescales only the bound axis on legend toggle', async () => {
        const chart = createTripleAxisAreaChart();

        await chart.render();

        const axis0Max = yAxes(chart)[0].scale.domain.at(-1);
        const axis1Max = yAxes(chart)[1].scale.domain.at(-1);

        clickLegendItem(chart, 'c');
        await chart.render();

        expect(seriesGroupIds(chart).sort()).toEqual(['a', 'b']);
        expect(yAxes(chart)[2].scale.domain.at(-1)!).toBeLessThan(300000);
        expect(yAxes(chart)[0].scale.domain.at(-1)).toBe(axis0Max);
        expect(yAxes(chart)[1].scale.domain.at(-1)).toBe(axis1Max);
    });

});

describe('N y-axes (scatter)', () => {

    function createTripleAxisScatterChart() {
        polyfillPath2D();
        mockCanvasContext();

        const chart = createScatterChart(document.createElement('div'), {
            autoRender: false,
            animation: false,
            data: [
                {
                    id: 'p1',
                    x: 1,
                    a: 10,
                    b: 1000,
                    c: 100000,
                },
                {
                    id: 'p2',
                    x: 2,
                    a: 20,
                    b: 3000,
                    c: 300000,
                },
            ],
            key: 'id',
            axis: TRIPLE_AXES,
            series: [
                {
                    id: 'a',
                    label: 'A',
                    xBy: 'x',
                    yBy: 'a',
                },
                {
                    id: 'b',
                    label: 'B',
                    xBy: 'x',
                    yBy: 'b',
                    axis: 1,
                },
                {
                    id: 'c',
                    label: 'C',
                    xBy: 'x',
                    yBy: 'c',
                    axis: 2,
                },
            ],
        });

        rescaleContext(chart);

        return chart;
    }

    it('lays out three axes and positions bubbles against their bound axis', async () => {
        const chart = createTripleAxisScatterChart();

        await chart.render();

        expectTripleAxisLayout(chart);

        const axes = yAxes(chart);
        const bubble = sceneElement(chart, 'c-p2');

        expect(bubble?.cy).toBeCloseTo(axes[2].scale(300000));
        expect(Math.abs((bubble?.cy ?? 0) - axes[0].scale(300000))).toBeGreaterThan(1);
    });

    it('rescales only the bound axis on legend toggle', async () => {
        const chart = createTripleAxisScatterChart();

        await chart.render();

        const axis0Max = yAxes(chart)[0].scale.domain.at(-1);
        const axis1Max = yAxes(chart)[1].scale.domain.at(-1);

        clickLegendItem(chart, 'c');
        await chart.render();

        expect(bubbleGroupIds(chart).sort()).toEqual(['a', 'b']);
        expect(yAxes(chart)[2].scale.domain.at(-1)!).toBeLessThan(300000);
        expect(yAxes(chart)[0].scale.domain.at(-1)).toBe(axis0Max);
        expect(yAxes(chart)[1].scale.domain.at(-1)).toBe(axis1Max);
    });

});

describe('N y-axes (bar)', () => {

    function createTripleAxisBarChart() {
        polyfillPath2D();
        mockCanvasContext();

        const chart = createBarChart(document.createElement('div'), {
            autoRender: false,
            animation: false,
            data: TRIPLE_DATA,
            key: 'm',
            axis: TRIPLE_AXES,
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
                    axis: 1,
                },
                {
                    id: 'c',
                    label: 'C',
                    value: 'c',
                    axis: 2,
                },
            ],
        });

        rescaleContext(chart);

        return chart;
    }

    it('lays out three axes and sizes each bar against its bound axis', async () => {
        const chart = createTripleAxisBarChart();

        await chart.render();

        expectTripleAxisLayout(chart);

        const axes = yAxes(chart);
        const bar = sceneElement(chart, 'c-b');

        // The axis-2 bar's height derives from axis 2's scale, distinct from the primary's.
        const expected = Math.abs(axes[2].scale(300000) - axes[2].scale(0));
        const primary = Math.abs(axes[0].scale(300000) - axes[0].scale(0));

        expect(bar?.height).toBeCloseTo(expected, 5);
        expect(Math.abs((bar?.height ?? 0) - primary)).toBeGreaterThan(1);
    });

    it('rescales only the bound axis on legend toggle', async () => {
        const chart = createTripleAxisBarChart();

        await chart.render();

        const axis0Max = yAxes(chart)[0].scale.domain.at(-1);
        const axis1Max = yAxes(chart)[1].scale.domain.at(-1);

        clickLegendItem(chart, 'c');
        await chart.render();

        expect(seriesGroupIds(chart).sort()).toEqual(['a', 'b']);
        expect(yAxes(chart)[2].scale.domain.at(-1)!).toBeLessThan(300000);
        expect(yAxes(chart)[0].scale.domain.at(-1)).toBe(axis0Max);
        expect(yAxes(chart)[1].scale.domain.at(-1)).toBe(axis1Max);
    });

});

// Titles on all three axes exercise the per-axis id namespacing (Fix 1a); the left/right/left
// arrangement exercises the right-axis geometry mirror (Fix 1b). Both are asserted on the element
// tree, so they hold regardless of the rendering backend.
const TITLED_TRIPLE_AXES = {
    y: [
        { title: 'Axis A' },
        {
            position: 'right' as const,
            title: 'Axis B',
        },
        {
            position: 'left' as const,
            title: 'Axis C',
        },
    ],
};

interface TickTextInternals {
    textAlign: string;
}

interface TitledAxisInternals {
    alignment: string;
    group: {
        id: string;
        queryAll(selector: string): {
            query(selector: string): TickTextInternals | null;
        }[];
    };
    _titleText?: {
        id: string;
    };
}

function titledYAxes(chart: unknown): TitledAxisInternals[] {
    return (chart as { yAxes: TitledAxisInternals[] }).yAxes;
}

// The text alignment of the first tick label on an axis (undefined when the axis has no ticks).
function firstTickTextAlign(axis: TitledAxisInternals): string | undefined {
    const [tickGroup] = axis.group.queryAll('.chart-axis__tick-group');
    return tickGroup?.query('text')?.textAlign;
}

describe('multi y-axis element ids and right-axis geometry', () => {

    function createTitledTripleAxisChart() {
        polyfillPath2D();
        mockCanvasContext();

        const chart = createLineChart(document.createElement('div'), {
            autoRender: false,
            animation: false,
            data: TRIPLE_DATA,
            key: 'm',
            axis: TITLED_TRIPLE_AXES,
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
                    axis: 1,
                },
                {
                    id: 'c',
                    label: 'C',
                    value: 'c',
                    axis: 2,
                },
            ],
        });

        rescaleContext(chart);

        return chart;
    }

    it('gives each y-axis title a distinct element id so the SVG cache cannot dedupe them to one node', async () => {
        const chart = createTitledTripleAxisChart();

        await chart.render();

        const titleIds = titledYAxes(chart).map(axis => axis._titleText?.id);

        expect(titleIds.every(id => typeof id === 'string' && id.length > 0)).toBe(true);
        expect(new Set(titleIds).size).toBe(3);
    });

    it('aligns tick labels toward the plot: left axes right-align, right axes left-align', async () => {
        const chart = createTitledTripleAxisChart();

        await chart.render();

        const axes = titledYAxes(chart);

        expect(axes.map(axis => axis.alignment)).toEqual(['left', 'right', 'left']);
        expect(firstTickTextAlign(axes[0])).toBe('right');
        expect(firstTickTextAlign(axes[1])).toBe('left');
        expect(firstTickTextAlign(axes[2])).toBe('right');
    });

});
