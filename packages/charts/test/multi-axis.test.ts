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
    createLineChart,
} from '../src';

interface AxisInternals {
    scale: {
        domain: number[];
    };
}

function yAxes(chart: unknown): AxisInternals[] {
    return (chart as { yAxes: AxisInternals[] }).yAxes;
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
