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

import {
    elementIsArc,
} from '@ripl/core';

import type {
    Element,
    Group,
} from '@ripl/core';

import {
    createChordChart,
    createPieChart,
    createPolarAreaChart,
    createSunburstChart,
} from '../src';

polyfillPath2D();

/** The rest tint every radial segment carries, shared with the bar series. */
const SEGMENT_REST_ALPHA = 0.78;

interface Slice {
    label: string;
    value: number;
}

const INITIAL: Slice[] = [
    {
        label: 'a',
        value: 1,
    },
    {
        label: 'b',
        value: 2,
    },
    {
        label: 'c',
        value: 3,
    },
];

const UPDATED: Slice[] = [
    {
        label: 'a',
        value: 5,
    },
    {
        label: 'b',
        value: 1,
    },
    {
        label: 'd',
        value: 4,
    },
];

interface RadialChart {
    render(): Promise<unknown>;
    update(options: unknown): Promise<unknown>;
    destroy(): void;
    scene: Group;
}

function segmentArcs(chart: RadialChart) {
    const arcs: Element[] = [];

    chart.scene.graph({ deep: true }).forEach(element => {
        if (elementIsArc(element)) {
            arcs.push(element);
        }
    });

    return arcs;
}

/** The alpha an element's resolved fill carries, or `null` where the fill is not an `rgba` string. */
function fillAlpha(element: Element): number | null {
    const fill = (element as unknown as { fill: unknown }).fill;
    const match = typeof fill === 'string' ? /^rgba\(\s*\d+\s*,\s*\d+\s*,\s*\d+\s*,\s*([\d.]+)\s*\)$/.exec(fill) : null;

    return match ? Number(match[1]) : null;
}

describe('Radial segments carry the shared rest tint', () => {

    beforeEach(() => {
        vi.useFakeTimers();
        mockCanvasContext();
    });

    afterEach(() => {
        vi.restoreAllMocks();
        vi.useRealTimers();
    });

    async function settle(chart: RadialChart) {
        chart.render();
        await vi.advanceTimersByTimeAsync(5000);
    }

    const factories = {
        pie: () => createPieChart<Slice>(document.createElement('div'), {
            autoRender: false,
            data: INITIAL,
            key: 'label',
            value: 'value',
            label: 'label',
        }),
        'polar-area': () => createPolarAreaChart<Slice>(document.createElement('div'), {
            autoRender: false,
            data: INITIAL,
            key: 'label',
            value: 'value',
            label: 'label',
        }),
        sunburst: () => createSunburstChart(document.createElement('div'), {
            autoRender: false,
            data: INITIAL.map(({ label, value }) => ({
                id: label,
                label,
                value,
            })),
        }),
        chord: () => createChordChart(document.createElement('div'), {
            autoRender: false,
            groups: ['a', 'b', 'c'],
            matrix: [
                [0, 3, 1],
                [3, 0, 2],
                [1, 2, 0],
            ],
        }),
    };

    Object.entries(factories).forEach(([name, factory]) => {

        test(`${name} fills every segment at the rest alpha`, async () => {
            const chart = factory() as unknown as RadialChart;

            await settle(chart);

            const alphas = segmentArcs(chart).map(fillAlpha);

            expect(alphas.length).toBeGreaterThan(0);
            alphas.forEach(alpha => expect(alpha).toBe(SEGMENT_REST_ALPHA));

            chart.destroy();
        });

        test(`${name} never strokes a segment`, async () => {
            const chart = factory() as unknown as RadialChart;

            await settle(chart);

            segmentArcs(chart).forEach(arc => {
                expect((arc as unknown as { stroke: unknown }).stroke).toBeUndefined();
            });

            chart.destroy();
        });

    });

    // The update path once re-derived a segment's colour from its own fill, so a tint applied there compounded.
    test('pie holds the rest alpha across repeated updates without compounding', async () => {
        const chart = createPieChart<Slice>(document.createElement('div'), {
            autoRender: false,
            data: INITIAL,
            key: 'label',
            value: 'value',
            label: 'label',
        }) as unknown as RadialChart;

        await settle(chart);

        const before = segmentArcs(chart).map(arc => (arc as unknown as { fill: string }).fill);

        for (let pass = 0; pass < 3; pass++) {
            chart.update({ data: pass % 2 ? INITIAL : UPDATED });
            await settle(chart);
        }

        const survivors = segmentArcs(chart).filter(arc => before.includes((arc as unknown as { fill: string }).fill));

        expect(survivors.length).toBeGreaterThan(0);
        segmentArcs(chart).forEach(arc => expect(fillAlpha(arc)).toBe(SEGMENT_REST_ALPHA));

        chart.destroy();
    });

});
