import {
    afterEach,
    describe,
    expect,
    test,
} from 'vitest';

import {
    DEFAULT_GRAPH_THEME,
    GRAPH_SERIES_PALETTE,
    resolveGraphTheme,
} from './theme';

const PROPERTIES = [
    '--vp-c-bg',
    '--vp-c-divider',
    '--vp-c-text-2',
    '--vp-c-text-3',
];

function applyProperties(values: Record<string, string>): void {
    Object.entries(values).forEach(([name, value]) => document.documentElement.style.setProperty(name, value));
}

describe('Graph theme', () => {

    afterEach(() => {
        PROPERTIES.forEach(name => document.documentElement.style.removeProperty(name));
    });

    test('Should read its colors from the site custom properties', () => {
        applyProperties({
            '--vp-c-bg': '#1b1b1f',
            '--vp-c-divider': '#2e2e32',
            '--vp-c-text-2': '#98989f',
            '--vp-c-text-3': '#6a6a71',
        });

        const theme = resolveGraphTheme();

        expect(theme.background).toBe('#1b1b1f');
        expect(theme.gridMajor).toBe('#2e2e32');
        expect(theme.label).toBe('#98989f');
        expect(theme.axis).toBe('#6a6a71');
    });

    test('Should derive the minor gridline from the major one at a lower alpha', () => {
        applyProperties({
            '--vp-c-divider': '#2e2e32',
        });

        const theme = resolveGraphTheme();

        expect(theme.gridMinor).not.toBe(theme.gridMajor);
        expect(theme.gridMinor).toContain('rgba');
    });

    test('Should scale an already translucent token rather than replacing its alpha', () => {
        applyProperties({
            '--vp-c-divider': 'rgba(142, 150, 170, 0.14)',
        });

        const theme = resolveGraphTheme();

        expect(theme.gridMinor).toBe('rgba(142, 150, 170, 0.063)');
    });

    test('Should back labels with a translucent page background', () => {
        applyProperties({
            '--vp-c-bg': '#ffffff',
        });

        const theme = resolveGraphTheme();

        expect(theme.labelBacking).toBe('rgba(255, 255, 255, 0.76)');
    });

    test('Should fall back per property when a custom property is unset', () => {
        const theme = resolveGraphTheme();

        expect(theme.background).toBe(DEFAULT_GRAPH_THEME.background);
        expect(theme.axis).toBe(DEFAULT_GRAPH_THEME.axis);
        expect(theme.label).toBe(DEFAULT_GRAPH_THEME.label);
    });

    test('Should expose the fixed series palette by default', () => {
        expect(resolveGraphTheme().series).toEqual(GRAPH_SERIES_PALETTE);
    });

    test('Should take a caller-supplied palette without sharing the array', () => {
        const series = ['#111111'];
        const theme = resolveGraphTheme({ series });

        theme.series.push('#222222');

        expect(series).toHaveLength(1);
    });

});
