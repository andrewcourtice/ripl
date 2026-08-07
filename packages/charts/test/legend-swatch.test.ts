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
    createBarChart,
} from '../src';

/** The smallest a swatch may be, mirroring the legend's own floor. */
const MIN_SWATCH_SIZE = 10;

interface ChartInternals {
    scene: {
        getElementById(id: string): {
            width: number;
            height: number;
            borderRadius: number;
            y: number;
        } | null;
    };
}

interface LabelInternals {
    scene: {
        getElementById(id: string): {
            y: number;
        } | null;
    };
}

/** Builds a two-series bar chart whose legend reports the given font metrics. */
function createChart(metrics: {
    ascent: number;
    descent: number;
}) {
    polyfillPath2D();

    const stub = mockCanvasContext();

    mockTextMetrics(stub, metrics);

    const chart = createBarChart(document.createElement('div'), {
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
                value: 'small' as const,
            },
            {
                id: 'large',
                label: 'Large',
                value: 'large' as const,
            },
        ],
    });

    return {
        chart,
        stub,
        swatch: () => (chart as unknown as ChartInternals).scene.getElementById('legend-swatch-small')!,
        label: () => (chart as unknown as LabelInternals).scene.getElementById('legend-label-small')!,
    };
}

describe('Legend swatch sizing', () => {

    it('Should centre the swatch on the same point as its label', async () => {
        const { chart, swatch, label } = createChart({
            ascent: 18,
            descent: 6,
        });

        await chart.render();

        const block = swatch();

        expect(block.y + block.height / 2).toBeCloseTo(label().y, 5);
    });

    it('Should keep the swatch square', async () => {
        const { chart, swatch } = createChart({
            ascent: 18,
            descent: 6,
        });

        await chart.render();

        expect(swatch().width).toBe(swatch().height);
    });

    it('Should hold the swatch at its floor for a small font', async () => {
        const { chart, swatch } = createChart({
            ascent: 6,
            descent: 2,
        });

        await chart.render();

        expect(swatch().height).toBe(MIN_SWATCH_SIZE);
    });

    it('Should grow the swatch with the font', async () => {
        const { chart, swatch } = createChart({
            ascent: 18,
            descent: 6,
        });

        await chart.render();

        expect(swatch().height).toBe(24);
    });

    it('Should scale the corner radius with the swatch', async () => {
        const { chart, swatch } = createChart({
            ascent: 18,
            descent: 6,
        });

        await chart.render();

        expect(swatch().borderRadius / swatch().height).toBeCloseTo(0.2, 5);
    });

    // The update path repositioned an existing swatch without resizing it, which only became a
    // defect once the size tracked the row rather than being a constant.
    it('Should resize an existing swatch when the font metrics change', async () => {
        const { chart, stub, swatch } = createChart({
            ascent: 6,
            descent: 2,
        });

        await chart.render();

        expect(swatch().height).toBe(MIN_SWATCH_SIZE);

        mockTextMetrics(stub, {
            ascent: 18,
            descent: 6,
        });

        await chart.render();

        expect(swatch().height).toBe(24);
        expect(swatch().width).toBe(24);
        expect(swatch().borderRadius).toBeCloseTo(24 * 0.2, 5);
    });

});
