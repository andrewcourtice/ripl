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
    createPieChart,
} from '../src';

interface ChartInternals {
    _series: {
        groups: unknown[];
    };
    scene: {
        getElementById(id: string): {
            emit(event: string, payload?: unknown): void;
        } | null;
    };
    yAxis: {
        scale: {
            domain: number[];
        };
    };
}

interface DualAxisLineInternals {
    _series: {
        groups: { id: string }[];
    };
    yAxes: {
        scale: {
            domain: number[];
        };
    }[];
}

interface PieInternals {
    _groups: {
        id: string;
        query(selector: string): {
            startAngle: number;
            endAngle: number;
        } | null;
    }[];
}

function internals(chart: unknown): ChartInternals {
    return chart as ChartInternals;
}

function dualAxisInternals(chart: unknown): DualAxisLineInternals {
    return chart as DualAxisLineInternals;
}

function pieInternals(chart: unknown): PieInternals {
    return chart as PieInternals;
}

function createChart() {
    polyfillPath2D();
    mockCanvasContext();

    return createBarChart(document.createElement('div'), {
        autoRender: false,
        animation: false,
        data: [
            {
                m: 'a',
                small: 8,
                large: 100,
            },
            {
                m: 'b',
                small: 12,
                large: 140,
            },
        ],
        key: 'm',
        series: [
            {
                id: 'small',
                label: 'Small',
                value: 'small',
            },
            {
                id: 'large',
                label: 'Large',
                value: 'large',
            },
        ],
    });
}

function createDualAxisLineChart() {
    polyfillPath2D();
    mockCanvasContext();

    return createLineChart(document.createElement('div'), {
        autoRender: false,
        animation: false,
        data: [
            {
                m: 'a',
                small: 8,
                large: 100,
            },
            {
                m: 'b',
                small: 12,
                large: 140,
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
                id: 'large',
                label: 'Large',
                value: 'large',
                axis: 1,
            },
        ],
    });
}

function createStackedAreaChart() {
    polyfillPath2D();
    mockCanvasContext();

    return createAreaChart(document.createElement('div'), {
        autoRender: false,
        animation: false,
        stacked: true,
        data: [
            {
                m: 'a',
                small: 8,
                large: 100,
            },
            {
                m: 'b',
                small: 12,
                large: 140,
            },
        ],
        key: 'm',
        series: [
            {
                id: 'small',
                label: 'Small',
                value: 'small',
            },
            {
                id: 'large',
                label: 'Large',
                value: 'large',
            },
        ],
    });
}

function createPie() {
    polyfillPath2D();
    mockCanvasContext();

    return createPieChart(document.createElement('div'), {
        autoRender: false,
        animation: false,
        data: [
            {
                name: 'a',
                share: 50,
            },
            {
                name: 'b',
                share: 30,
            },
            {
                name: 'c',
                share: 20,
            },
        ],
        key: 'name',
        value: 'share',
        label: 'name',
    });
}

function clickLegendItem(chart: unknown, id: string) {
    const swatch = internals(chart).scene.getElementById(`legend-swatch-${id}`);

    expect(swatch).toBeTruthy();
    swatch?.emit('click');
}

function pieSegmentAngle(chart: unknown, id: string): number {
    const group = pieInternals(chart)._groups.find(candidate => candidate.id === id);
    const arc = group?.query('arc');

    expect(arc).toBeTruthy();

    return arc ? arc.endAngle - arc.startAngle : 0;
}

describe('legend series toggling', () => {

    it('hides a series on legend click and rescales the value axis', async () => {
        const chart = createChart();

        await chart.render();

        expect(internals(chart)._series.groups.length).toBe(2);
        expect(internals(chart).yAxis.scale.domain.at(-1)).toBeGreaterThanOrEqual(140);

        clickLegendItem(chart, 'large');
        await chart.render();

        expect(internals(chart)._series.groups.length).toBe(1);
        expect(internals(chart).yAxis.scale.domain.at(-1)).toBeLessThan(140);
    });

    it('restores a hidden series on a second legend click', async () => {
        const chart = createChart();

        await chart.render();

        clickLegendItem(chart, 'large');
        await chart.render();

        expect(internals(chart)._series.groups.length).toBe(1);

        clickLegendItem(chart, 'large');
        await chart.render();

        expect(internals(chart)._series.groups.length).toBe(2);
        expect(internals(chart).yAxis.scale.domain.at(-1)).toBeGreaterThanOrEqual(140);
    });

    it('renders cleanly with every series hidden', async () => {
        const chart = createChart();

        await chart.render();

        clickLegendItem(chart, 'small');
        await chart.render();

        clickLegendItem(chart, 'large');
        await chart.render();

        expect(internals(chart)._series.groups.length).toBe(0);

        const domain = internals(chart).yAxis.scale.domain;

        expect(domain.every(Number.isFinite)).toBe(true);
    });

    it('keeps hidden series hidden across a data update', async () => {
        const chart = createChart();

        await chart.render();

        clickLegendItem(chart, 'large');
        await chart.render();

        chart.update({
            data: [
                {
                    m: 'a',
                    small: 10,
                    large: 90,
                },
                {
                    m: 'b',
                    small: 14,
                    large: 120,
                },
            ],
        });

        await chart.render();

        expect(internals(chart)._series.groups.length).toBe(1);
    });

});

describe('legend series toggling (line, secondary axis)', () => {

    // Both axes' series now render through the single collapsed `_series` renderer; hiding an
    // axis-1 series drops its group from that one group set.
    const groupIds = (chart: unknown) => dualAxisInternals(chart)._series.groups.map(group => group.id);

    it('rescales each axis over the active series bound to it', async () => {
        const chart = createDualAxisLineChart();

        await chart.render();

        expect(groupIds(chart).sort()).toEqual(['large', 'small']);
        expect(dualAxisInternals(chart).yAxes[1].scale.domain.at(-1)).toBeGreaterThanOrEqual(140);

        clickLegendItem(chart, 'large');
        await chart.render();

        expect(groupIds(chart)).toEqual(['small']);
        expect(dualAxisInternals(chart).yAxes[1].scale.domain.at(-1)).toBeLessThan(140);
        expect(dualAxisInternals(chart).yAxes[0].scale.domain.at(-1)).toBeGreaterThanOrEqual(12);

        const domains = dualAxisInternals(chart).yAxes.flatMap(axis => axis.scale.domain);

        expect(domains.every(Number.isFinite)).toBe(true);
    });

    it('restores the secondary-axis series on a second legend click', async () => {
        const chart = createDualAxisLineChart();

        await chart.render();

        clickLegendItem(chart, 'large');
        await chart.render();

        expect(groupIds(chart)).toEqual(['small']);

        clickLegendItem(chart, 'large');
        await chart.render();

        expect(groupIds(chart).sort()).toEqual(['large', 'small']);
        expect(dualAxisInternals(chart).yAxes[1].scale.domain.at(-1)).toBeGreaterThanOrEqual(140);
    });

});

describe('legend segment toggling (pie)', () => {

    it('removes a hidden segment and expands the remaining angles', async () => {
        const chart = createPie();

        await chart.render();

        expect(pieInternals(chart)._groups.length).toBe(3);

        const angleBefore = pieSegmentAngle(chart, 'a');

        clickLegendItem(chart, 'c');
        await chart.render();

        expect(pieInternals(chart)._groups.length).toBe(2);

        const angleAfter = pieSegmentAngle(chart, 'a');

        expect(angleAfter).toBeGreaterThan(angleBefore);
    });

    it('restores a hidden segment on a second legend click', async () => {
        const chart = createPie();

        await chart.render();

        const angleBefore = pieSegmentAngle(chart, 'a');

        clickLegendItem(chart, 'c');
        await chart.render();

        clickLegendItem(chart, 'c');
        await chart.render();

        expect(pieInternals(chart)._groups.length).toBe(3);
        expect(pieSegmentAngle(chart, 'a')).toBeCloseTo(angleBefore);
    });

    it('renders cleanly with every segment hidden', async () => {
        const chart = createPie();

        await chart.render();

        clickLegendItem(chart, 'a');
        await chart.render();

        clickLegendItem(chart, 'b');
        await chart.render();

        clickLegendItem(chart, 'c');
        await chart.render();

        expect(pieInternals(chart)._groups.length).toBe(0);
    });

});

describe('legend series toggling (stacked area)', () => {

    it('recomputes the stack over the active series and rescales the value axis', async () => {
        const chart = createStackedAreaChart();

        await chart.render();

        expect(internals(chart)._series.groups.length).toBe(2);
        expect(internals(chart).yAxis.scale.domain.at(-1)).toBeGreaterThanOrEqual(152);

        clickLegendItem(chart, 'large');
        await chart.render();

        expect(internals(chart)._series.groups.length).toBe(1);
        expect(internals(chart).yAxis.scale.domain.at(-1)).toBeGreaterThanOrEqual(12);
        expect(internals(chart).yAxis.scale.domain.at(-1)).toBeLessThan(140);
    });

    it('renders cleanly with every series hidden', async () => {
        const chart = createStackedAreaChart();

        await chart.render();

        clickLegendItem(chart, 'small');
        await chart.render();

        clickLegendItem(chart, 'large');
        await chart.render();

        expect(internals(chart)._series.groups.length).toBe(0);

        const domain = internals(chart).yAxis.scale.domain;

        expect(domain.every(Number.isFinite)).toBe(true);
    });

});
