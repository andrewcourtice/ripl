import {
    afterEach,
    describe,
    expect,
    it,
} from 'vitest';

import {
    mockCanvasContext,
    polyfillPath2D,
} from '@ripl/test-utils';

import {
    darkTheme,
    getDefaultTheme,
    lightTheme,
    registerTheme,
    resolveTheme,
    setDefaultTheme,
} from '../src/core/theme';

import {
    normalizeAxisItem,
} from '../src/core/options';

import {
    createBarChart,
} from '../src';

afterEach(() => {
    // Reset the module-level default so ordering never leaks between tests.
    setDefaultTheme(lightTheme);
});

describe('resolveTheme', () => {

    it('returns a theme object as-is', () => {
        expect(resolveTheme(darkTheme)).toBe(darkTheme);
    });

    it('resolves built-in theme names', () => {
        expect(resolveTheme('dark')).toBe(darkTheme);
        expect(resolveTheme('light')).toBe(lightTheme);
    });

    it('falls back to the default theme for an unknown name', () => {
        expect(resolveTheme('does-not-exist')).toBe(getDefaultTheme());
    });

    it('resolves a registered custom theme by name', () => {
        const custom = {
            ...lightTheme,
            axisColor: '#abcdef',
        };

        registerTheme('custom-test-theme', custom);

        expect(resolveTheme('custom-test-theme')).toBe(custom);
    });

});

describe('setDefaultTheme', () => {

    it('drives furniture color defaults through the normalizers', () => {
        expect(normalizeAxisItem().fontColor).toBe(lightTheme.axisColor);

        setDefaultTheme('dark');

        expect(getDefaultTheme()).toBe(darkTheme);
        expect(normalizeAxisItem().fontColor).toBe(darkTheme.axisColor);
    });

});

describe('chart theme palette', () => {

    it('cycles the resolved theme palette for series colors', () => {
        polyfillPath2D();
        mockCanvasContext();

        const chart = createBarChart(document.createElement('div'), {
            autoRender: false,
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
            theme: 'dark',
        });

        const internals = chart as unknown as {
            theme: typeof darkTheme;
            resolveSeriesColors(series: { id: string }[]): void;
            getSeriesColor(id: string): string;
        };

        expect(internals.theme).toBe(darkTheme);

        // The color generator is seeded from the theme palette, so a generated series color
        // (one not overridden per-series) comes from that palette.
        internals.resolveSeriesColors([{ id: 's' }]);

        expect(darkTheme.palette).toContain(internals.getSeriesColor('s'));
    });

});
