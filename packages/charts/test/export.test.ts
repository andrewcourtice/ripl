import {
    describe,
    expect,
    test,
    vi,
} from 'vitest';

import {
    CanvasContext,
} from '@ripl/canvas';

import {
    mockCanvasContext,
    polyfillPath2D,
} from '@ripl/test-utils';

import type {
    ContextExport,
} from '@ripl/core';

import {
    createBarChart,
} from '../src';

polyfillPath2D();

describe('Chart.export', () => {

    test('Should forward the export call to the underlying context', () => {
        mockCanvasContext();

        const snapshot: ContextExport = {
            toString: () => 'markup',
            toURL: () => 'blob:url',
            toImage: () => Promise.resolve({} as ImageData),
        };

        const spy = vi.spyOn(CanvasContext.prototype, 'export').mockReturnValue(snapshot);

        const chart = createBarChart(document.createElement('div'), {
            autoRender: false,
            data: [
                {
                    category: 'A',
                    value: 1,
                },
            ],
            keyBy: 'category',
            series: [
                {
                    valueBy: item => item.value,
                },
            ],
        });

        expect(chart.export()).toBe(snapshot);
        expect(spy).toHaveBeenCalledTimes(1);

        spy.mockRestore();
    });

});
