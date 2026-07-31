import {
    describe,
    expect,
    it,
} from 'vitest';

import {
    mockCanvasContext,
    mockTextMetrics,
    polyfillPath2D,
} from '@ripl/test-utils';

import {
    DEFAULT_CHART_PADDING,
} from '../src/constants/layout';

import {
    createSankeyChart,
} from '../src';

const WIDTH = 600;
const HEIGHT = 400;

const NODES = [
    {
        id: 'budget',
        label: 'Budget',
    },
    {
        id: 'engineering',
        label: 'Engineering',
    },
    {
        id: 'marketing',
        label: 'Marketing',
    },
    // Deliberately long, so its label is the one that would run off the edge.
    {
        id: 'infrastructure',
        label: 'Infrastructure and Tooling',
    },
    {
        id: 'content',
        label: 'Content',
    },
];

const LINKS = [
    {
        source: 'budget',
        target: 'engineering',
        value: 60,
    },
    {
        source: 'budget',
        target: 'marketing',
        value: 40,
    },
    {
        source: 'engineering',
        target: 'infrastructure',
        value: 35,
    },
    {
        source: 'marketing',
        target: 'content',
        value: 25,
    },
];

function createChart(nodes = NODES) {
    polyfillPath2D();
    mockTextMetrics(mockCanvasContext());

    const chart = createSankeyChart(document.createElement('div'), {
        autoRender: false,
        animation: false,
        nodes,
        links: LINKS,
    });

    (chart as unknown as { scene: { context: { rescale(w: number, h: number): void } } })
        .scene.context.rescale(WIDTH, HEIGHT);

    return chart;
}

interface SceneInternals {
    scene: {
        getElementById(id: string): { x: number;
            width: number;
            getBoundingBox(): { right: number }; } | null;
    };
}

function byId(chart: unknown, id: string) {
    const element = (chart as SceneInternals).scene.getElementById(id);

    expect(element, `missing element ${id}`).toBeTruthy();

    return element!;
}

describe('sankey label layout', () => {

    it('Should keep every node label inside the chart', async () => {
        const chart = createChart();

        await chart.render();

        const right = WIDTH - DEFAULT_CHART_PADDING;

        // Labels are left-anchored beside their node, so the box runs rightward from `x`. The last
        // column used to start exactly on the plot's right edge, putting all of its label outside.
        NODES.forEach(node => {
            const box = byId(chart, `${node.id}-label`).getBoundingBox();

            expect(box.right, `${node.label} overflows`).toBeLessThanOrEqual(right);
        });
    });

    it('Should size the reserved band to the labels it actually holds', async () => {
        const long = createChart();
        const short = createChart(NODES.map(node => (node.id === 'infrastructure'
            ? {
                ...node,
                label: 'Infra',
            }
            : node)));

        await long.render();
        await short.render();

        const rightEdge = (chart: unknown) => {
            const rect = byId(chart, 'infrastructure-rect');

            return rect.x + rect.width;
        };

        // A shorter last-column label needs less room, so the flow reaches further right. If the band
        // were a fixed inset rather than a measurement, both would land in the same place.
        expect(rightEdge(short)).toBeGreaterThan(rightEdge(long));
        expect(rightEdge(long)).toBeLessThan(WIDTH - DEFAULT_CHART_PADDING);
    });

});
