// @vitest-environment node

/**
 * The charts suite otherwise runs under jsdom with `@ripl/web`, which would pass even if the package
 * reached for the DOM. This file is the guard: no `window`, no `document`, `@ripl/node` for the
 * platform bindings, and a terminal surface to draw onto.
 */

import {
    afterEach,
    beforeEach,
    describe,
    expect,
    test,
    vi,
} from 'vitest';

// Side-effect import: registers the node factory bindings (terminal context, text measurement, rAF).
import '@ripl/node';

import {
    Navigator,
} from '@ripl/core';

import {
    createContext,
} from '@ripl/terminal';

import type {
    TerminalOutput,
} from '@ripl/terminal';

import {
    createBarChart,
    createLineChart,
    createPieChart,
} from '../src';

interface Row {
    month: string;
    a: number;
    b: number;
}

const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May'];
const DATA: Row[] = MONTHS.map((month, index) => ({
    month,
    a: (index + 1) * 100,
    b: (index + 1) * 40,
}));

const SERIES = [
    {
        id: 'a',
        label: 'A',
        value: 'a' as const,
    },
    {
        id: 'b',
        label: 'B',
        value: 'b' as const,
    },
];

/** A terminal surface that captures everything written to it. */
function capturingOutput() {
    const frames: string[] = [];

    return {
        frames,
        output: {
            write: (data: string) => void frames.push(data),
            columns: 120,
            rows: 40,
        } as TerminalOutput,
    };
}

describe('Charts outside a DOM', () => {

    // `Chart.render` catches and logs, so without this a broken render would still pass every assertion.
    beforeEach(() => {
        vi.spyOn(console, 'error').mockImplementation(() => undefined);
    });

    afterEach(() => {
        expect(console.error).not.toHaveBeenCalled();
        vi.restoreAllMocks();
    });

    test('Should be running without a document or a window', () => {
        expect(typeof window).toBe('undefined');
        expect(typeof document).toBe('undefined');
    });

    test('Should render a bar chart to a terminal surface', async () => {
        const { frames, output } = capturingOutput();

        const chart = createBarChart<Row>(createContext(output), {
            autoRender: false,
            animation: false,
            title: 'Sales',
            data: DATA,
            key: 'month',
            series: SERIES,
        });

        await chart.render();

        expect(frames.join('')).not.toBe('');

        chart.destroy();
    });

    test('Should render a pie chart to a terminal surface', async () => {
        const { frames, output } = capturingOutput();

        const chart = createPieChart<Row>(createContext(output), {
            autoRender: false,
            animation: false,
            data: DATA,
            key: 'month',
            label: 'month',
            value: 'a',
        });

        await chart.render();

        expect(frames.join('')).not.toBe('');

        chart.destroy();
    });

    test('Should render a chart with a navigator and an overview strip', async () => {
        const { frames, output } = capturingOutput();

        const chart = createLineChart<Row>(createContext(output), {
            autoRender: false,
            animation: false,
            data: DATA,
            key: 'month',
            navigator: true,
            overview: true,
            series: SERIES,
        });

        await chart.render();

        expect(frames.join('')).not.toBe('');
        expect(chart.navigator).toBeInstanceOf(Navigator);

        chart.destroy();
    });

    test('Should drive the view from code where there is no pointer to drive it', async () => {
        const { output } = capturingOutput();

        const chart = createLineChart<Row>(createContext(output), {
            autoRender: false,
            animation: false,
            data: DATA,
            key: 'month',
            navigator: true,
            series: SERIES,
        });

        await chart.render();

        chart.navigator?.zoomTo(2, [10, 10]);

        expect(chart.navigator?.transform.k).toBe(2);

        chart.destroy();
    });

    // A target that is neither a `Context` nor a DOM element still resolves, via `factory.createContext`.
    test('Should resolve a chart target through the factory', async () => {
        const { frames, output } = capturingOutput();

        const chart = createBarChart<Row>(output as unknown as string, {
            autoRender: false,
            animation: false,
            data: DATA,
            key: 'month',
            series: SERIES,
        });

        await chart.render();

        expect(chart.context.type).toBe('terminal');
        expect(frames.join('')).not.toBe('');

        chart.destroy();
    });

});
