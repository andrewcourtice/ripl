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
    Group,
    Scene,
} from '@ripl/core';

import {
    createLineChart,
} from '../src';

function annotationGroup(chart: unknown): Group | undefined {
    const scene = (chart as { scene: Scene }).scene;
    return scene.getElementById('chart-annotations') as Group | undefined;
}

describe('cartesian annotations', () => {

    it('renders reference lines and bands over the plot', async () => {
        polyfillPath2D();
        mockCanvasContext();

        const chart = createLineChart(document.createElement('div'), {
            autoRender: false,
            animation: false,
            data: [
                {
                    m: 'a',
                    v: 10,
                },
                {
                    m: 'b',
                    v: 90,
                },
            ],
            key: 'm',
            series: [{
                id: 's',
                label: 'S',
                value: 'v',
            }],
            annotations: [
                {
                    axis: 'y',
                    value: 50,
                    label: 'target',
                },
                {
                    type: 'band',
                    axis: 'y',
                    from: 20,
                    to: 40,
                },
            ],
        });

        await chart.render();

        const group = annotationGroup(chart);

        expect(group).toBeDefined();
        expect(group!.getElementsByType('line').length).toBeGreaterThanOrEqual(1);
        expect(group!.getElementsByType('rect').length).toBe(1);
        expect(group!.getElementsByType('text').length).toBe(1);
    });

    it('draws no annotation layer when none are configured', async () => {
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
                id: 's',
                label: 'S',
                value: 'v',
            }],
        });

        await chart.render();

        expect(annotationGroup(chart)).toBeUndefined();
    });

});
