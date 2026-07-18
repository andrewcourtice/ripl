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
    createPolarScatterChart,
    createRadarChart,
    createRadialBarChart,
} from '../src';

interface ChartInternals {
    scene: {
        getElementById(id: string): {
            getElementsByType(type: string): {
                content?: string;
            }[];
        } | null;
    };
}

function groupLabels(chart: unknown, groupId: string) {
    const group = (chart as ChartInternals).scene.getElementById(groupId);

    expect(group).toBeTruthy();

    return group ? group.getElementsByType('text') : [];
}

function labelContents(chart: unknown, groupId: string) {
    return groupLabels(chart, groupId).map(label => label.content);
}

function mockContext() {
    polyfillPath2D();
    mockCanvasContext();
}

function createRadar(labels?: boolean) {
    mockContext();

    return createRadarChart(document.createElement('div'), {
        autoRender: false,
        animation: false,
        labels,
        format: value => `${value}pts`,
        categories: [
            'Speed',
            'Power',
            'Range',
        ],
        data: [
            { score: 10 },
            { score: 20 },
            { score: 30 },
        ],
        series: [
            {
                id: 'alpha',
                label: 'Alpha',
                value: 'score',
            },
        ],
    });
}

function createRadialBar(labels?: boolean) {
    mockContext();

    return createRadialBarChart(document.createElement('div'), {
        autoRender: false,
        animation: false,
        labels,
        format: value => `${value}%`,
        data: [
            {
                team: 'Design',
                progress: 82,
            },
            {
                team: 'Engineering',
                progress: 64,
            },
        ],
        key: 'team',
        value: 'progress',
        maxValue: 100,
    });
}

function createPolarScatter(labels?: boolean) {
    mockContext();

    return createPolarScatterChart(document.createElement('div'), {
        autoRender: false,
        animation: false,
        labels,
        format: value => `${value}km`,
        data: [
            {
                bearing: 30,
                distance: 12,
            },
            {
                bearing: 120,
                distance: 26,
            },
        ],
        series: [
            {
                id: 'readings',
                label: 'Readings',
                angle: 'bearing',
                radius: 'distance',
            },
        ],
    });
}

describe('Radar value labels', () => {

    it('renders no labels by default', async () => {
        const chart = createRadar();

        await chart.render();

        expect(groupLabels(chart, 'alpha')).toHaveLength(0);
    });

    it('renders a formatted label per vertex when enabled', async () => {
        const chart = createRadar(true);

        await chart.render();

        expect(labelContents(chart, 'alpha')).toEqual([
            '10pts',
            '20pts',
            '30pts',
        ]);
    });

    it('toggles labels at runtime through update()', async () => {
        const chart = createRadar();

        await chart.render();

        expect(groupLabels(chart, 'alpha')).toHaveLength(0);

        chart.update({
            labels: true,
        });

        await chart.render();

        expect(groupLabels(chart, 'alpha')).toHaveLength(3);

        chart.update({
            labels: false,
        });

        await chart.render();

        expect(groupLabels(chart, 'alpha')).toHaveLength(0);
    });

    it('updates label content when data changes', async () => {
        const chart = createRadar(true);

        await chart.render();

        chart.update({
            data: [
                { score: 15 },
                { score: 25 },
                { score: 35 },
            ],
        });

        await chart.render();

        expect(labelContents(chart, 'alpha')).toEqual([
            '15pts',
            '25pts',
            '35pts',
        ]);
    });

});

describe('Radial bar value labels', () => {

    it('renders no labels by default', async () => {
        const chart = createRadialBar();

        await chart.render();

        expect(groupLabels(chart, 'Design')).toHaveLength(0);
        expect(groupLabels(chart, 'Engineering')).toHaveLength(0);
    });

    it('renders a formatted label per ring when enabled', async () => {
        const chart = createRadialBar(true);

        await chart.render();

        expect(labelContents(chart, 'Design')).toEqual(['82%']);
        expect(labelContents(chart, 'Engineering')).toEqual(['64%']);
    });

    it('toggles labels at runtime through update()', async () => {
        const chart = createRadialBar();

        await chart.render();

        expect(groupLabels(chart, 'Design')).toHaveLength(0);

        chart.update({
            labels: true,
        });

        await chart.render();

        expect(groupLabels(chart, 'Design')).toHaveLength(1);
        expect(groupLabels(chart, 'Engineering')).toHaveLength(1);

        chart.update({
            labels: false,
        });

        await chart.render();

        expect(groupLabels(chart, 'Design')).toHaveLength(0);
        expect(groupLabels(chart, 'Engineering')).toHaveLength(0);
    });

    it('updates label content when data changes', async () => {
        const chart = createRadialBar(true);

        await chart.render();

        chart.update({
            data: [
                {
                    team: 'Design',
                    progress: 90,
                },
                {
                    team: 'Engineering',
                    progress: 55,
                },
            ],
        });

        await chart.render();

        expect(labelContents(chart, 'Design')).toEqual(['90%']);
        expect(labelContents(chart, 'Engineering')).toEqual(['55%']);
    });

});

describe('Polar scatter value labels', () => {

    it('renders no labels by default', async () => {
        const chart = createPolarScatter();

        await chart.render();

        expect(groupLabels(chart, 'readings')).toHaveLength(0);
    });

    it('renders a formatted radial value label per marker when enabled', async () => {
        const chart = createPolarScatter(true);

        await chart.render();

        expect(labelContents(chart, 'readings')).toEqual([
            '12km',
            '26km',
        ]);
    });

    it('toggles labels at runtime through update()', async () => {
        const chart = createPolarScatter();

        await chart.render();

        expect(groupLabels(chart, 'readings')).toHaveLength(0);

        chart.update({
            labels: true,
        });

        await chart.render();

        expect(groupLabels(chart, 'readings')).toHaveLength(2);

        chart.update({
            labels: false,
        });

        await chart.render();

        expect(groupLabels(chart, 'readings')).toHaveLength(0);
    });

    it('updates surviving labels and removes exiting ones when data changes', async () => {
        const chart = createPolarScatter(true);

        await chart.render();

        expect(groupLabels(chart, 'readings')).toHaveLength(2);

        chart.update({
            data: [
                {
                    bearing: 60,
                    distance: 18,
                },
            ],
        });

        await chart.render();

        expect(labelContents(chart, 'readings')).toEqual(['18km']);
    });

});
