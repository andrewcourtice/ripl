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
    colorBlindTheme,
    resolveTheme,
} from '../src/core/theme';

import {
    createBarChart,
} from '../src';

function rootElement(chart: unknown): HTMLElement {
    return (chart as { scene: { context: { element: HTMLElement } } }).scene.context.element;
}

describe('accessibility', () => {

    it('sets an ARIA role and label from the description', () => {
        polyfillPath2D();
        mockCanvasContext();

        const chart = createBarChart(document.createElement('div'), {
            animation: false,
            data: [{
                m: 'a',
                v: 1,
            }],
            key: 'm',
            series: [{
                id: 's',
                label: 'S',
                value: 'v',
            }],
            description: 'Revenue by month',
        });

        const element = rootElement(chart);

        expect(element.getAttribute('role')).toBe('img');
        expect(element.getAttribute('aria-label')).toBe('Revenue by month');
    });

    it('falls back to the title text for the ARIA label', () => {
        polyfillPath2D();
        mockCanvasContext();

        const chart = createBarChart(document.createElement('div'), {
            animation: false,
            data: [{
                m: 'a',
                v: 1,
            }],
            key: 'm',
            series: [{
                id: 's',
                label: 'S',
                value: 'v',
            }],
            title: 'Quarterly sales',
        });

        expect(rootElement(chart).getAttribute('aria-label')).toBe('Quarterly sales');
    });

    it('exposes a colourblind-safe theme by name', () => {
        expect(resolveTheme('colorblind')).toBe(colorBlindTheme);
        expect(colorBlindTheme.palette.length).toBeGreaterThanOrEqual(8);
    });

});
