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
    createHeatmapChart,
} from '../src';

interface HeatmapInternals {
    scene: {
        getElementById(id: string): {
            getElementsByType(type: string): {
                content?: string;
                fill?: string;
            }[];
        } | null;
    };
}

function cellLabels(chart: unknown, cellId: string) {
    const group = (chart as HeatmapInternals).scene.getElementById(cellId);

    expect(group).toBeTruthy();

    return group ? group.getElementsByType('text') : [];
}

function createChart(labels?: boolean) {
    polyfillPath2D();
    mockCanvasContext();

    return createHeatmapChart(document.createElement('div'), {
        autoRender: false,
        animation: false,
        labels,
        colors: ['#ffffff', '#000000'],
        data: [
            {
                day: 'Mon',
                hour: '9am',
                load: 0,
            },
            {
                day: 'Mon',
                hour: '10am',
                load: 100,
            },
        ],
        keyX: 'day',
        keyY: 'hour',
        value: 'load',
        xCategories: ['Mon'],
        yCategories: [
            '9am',
            '10am',
        ],
    });
}

describe('Heatmap cell labels', () => {

    it('renders no labels by default', async () => {
        const chart = createChart();

        await chart.render();

        expect(cellLabels(chart, 'cell-Mon-9am')).toHaveLength(0);
    });

    it('renders a contrast-aware value label per cell when enabled', async () => {
        const chart = createChart(true);

        await chart.render();

        const lowLabels = cellLabels(chart, 'cell-Mon-9am');
        const highLabels = cellLabels(chart, 'cell-Mon-10am');

        expect(lowLabels).toHaveLength(1);
        expect(highLabels).toHaveLength(1);

        // The low cell is white → dark label; the high cell is black → white label.
        expect(lowLabels[0].fill).toBe('#1a1a1a');
        expect(highLabels[0].fill).toBe('#ffffff');
        expect(lowLabels[0].content).toBe('0');
        expect(highLabels[0].content).toBe('100');
    });

    it('toggles labels at runtime through update()', async () => {
        const chart = createChart();

        await chart.render();

        expect(cellLabels(chart, 'cell-Mon-9am')).toHaveLength(0);

        chart.update({
            labels: true,
        });

        await chart.render();

        expect(cellLabels(chart, 'cell-Mon-9am')).toHaveLength(1);

        chart.update({
            labels: false,
        });

        await chart.render();

        expect(cellLabels(chart, 'cell-Mon-9am')).toHaveLength(0);
    });

});
