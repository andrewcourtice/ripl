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

import type {
    Text,
} from '@ripl/core';

import {
    createLineChart,
    SPACING,
} from '../src';

interface ChartInternals {
    scene: {
        context: { rescale(width: number, height: number): void };
        queryAll(selector: string): unknown[];
        getElementById(id: string): unknown;
    };
}

function internals(chart: unknown): ChartInternals {
    return chart as ChartInternals;
}

function createChart(axis: Record<string, unknown>) {
    polyfillPath2D();
    mockTextMetrics(mockCanvasContext());

    const chart = createLineChart(document.createElement('div'), {
        autoRender: false,
        animation: false,
        axis,
        data: [{
            k: 'alpha',
            v: 1000,
        }, {
            k: 'beta',
            v: 2000,
        }, {
            k: 'gamma',
            v: 3000,
        }],
        key: 'k',
        series: [{
            id: 's',
            label: 'S',
            value: 'v',
        }],
    });

    internals(chart).scene.context.rescale(600, 400);

    return chart;
}

function tickLabels(chart: unknown, prefix: 'x' | 'y'): Text[] {
    return internals(chart).scene
        .queryAll('.chart-axis__tick-group')
        .flatMap(group => (group as { getElementsByType(type: string): Text[] }).getElementsByType('text'))
        .filter(text => {
            const parent = (text as unknown as { parent?: { id?: string } }).parent;

            return !!parent?.id?.startsWith(`${prefix}-tick:`);
        });
}

function axisTitle(chart: unknown, axis: 'x' | 'y'): Text {
    const found = internals(chart).scene.queryAll('text')
        .filter(text => (text as { id: string }).id.includes(`chart-axis__${axis}-title`)) as Text[];

    expect(found.length).toBe(1);
    return found[0];
}

describe('Axis title spacing', () => {

    it('Should clear the widest y-axis label by one element gap (left-aligned)', async () => {
        const chart = createChart({
            y: {
                title: 'Revenue',
            },
        });

        await chart.render();

        const labels = tickLabels(chart, 'y');

        expect(labels.length).toBeGreaterThan(0);

        // A left-aligned y-axis right-aligns its labels, so the widest label's outer edge is the smallest `left`.
        const labelOuterEdge = Math.min(...labels.map(label => label.getBoundingBox().left));
        const titleBox = axisTitle(chart, 'y').getBoundingBox();

        expect(labelOuterEdge - titleBox.right).toBeCloseTo(SPACING.md, 5);
    });

    it('Should clear the widest y-axis label by one element gap (right-aligned)', async () => {
        const chart = createChart({
            y: {
                title: 'Revenue',
                position: 'right',
            },
        });

        await chart.render();

        const labels = tickLabels(chart, 'y');
        const labelOuterEdge = Math.max(...labels.map(label => label.getBoundingBox().right));
        const titleBox = axisTitle(chart, 'y').getBoundingBox();

        expect(titleBox.left - labelOuterEdge).toBeCloseTo(SPACING.md, 5);
    });

    it('Should clear the lowest x-axis label by one element gap (bottom-aligned)', async () => {
        const chart = createChart({
            x: {
                title: 'Quarter',
            },
        });

        await chart.render();

        const labels = tickLabels(chart, 'x');

        expect(labels.length).toBeGreaterThan(0);

        const labelBottom = Math.max(...labels.map(label => label.getBoundingBox().bottom));
        const titleBox = axisTitle(chart, 'x').getBoundingBox();

        expect(titleBox.top - labelBottom).toBeCloseTo(SPACING.md, 5);
    });

    it('Should rotate the y-axis title so its world box is taller than it is wide', async () => {
        const chart = createChart({
            y: {
                title: 'A reasonably long axis title',
            },
        });

        await chart.render();

        const titleBox = axisTitle(chart, 'y').getBoundingBox();

        // The rotated title is tall and narrow only if the world box composes the element's rotation.
        expect(titleBox.height).toBeGreaterThan(titleBox.width);
    });

});
