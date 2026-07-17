/**
 * Chart theming.
 *
 * A {@link Theme} bundles the palette and furniture colours a chart draws with. The active theme is
 * resolved per chart from the `theme` option, falling back to the module-level default set via
 * {@link setDefaultTheme}. Option normalizers read {@link getDefaultTheme} for their colour defaults,
 * so `setDefaultTheme('dark')` restyles every chart with no per-chart wiring; the light theme's
 * values match Ripl's historical hardcoded colours, so the default appearance is unchanged.
 */

import {
    COLOURS,
} from '../constants/colors';

/** The palette and furniture colours a chart renders with. */
export interface Theme {
    /** Categorical series/segment palette, cycled for unassigned series. */
    palette: string[];
    /** Two-or-more colour stops (low→high) used as the default sequential colour scale (e.g. heatmap). */
    sequentialScheme: string[];
    /** Base CSS font shorthand for chart text. */
    font: string;
    /** Colour of titles, data labels, and segment labels. */
    textColor: string;
    /** Colour of axis tick labels. */
    axisColor: string;
    /** Colour of grid lines. */
    gridColor: string;
    /** Colour of crosshair lines. */
    crosshairColor: string;
    /** Legend label colour. */
    legendColor: string;
    /** Tooltip background colour. */
    tooltipBackground: string;
    /** Tooltip text colour. */
    tooltipColor: string;
}

/** The built-in light theme. Its colours match Ripl's historical defaults. */
export const lightTheme: Theme = {
    palette: Object.values(COLOURS),
    sequentialScheme: ['#e0f2fe', '#0369a1'],
    font: '12px sans-serif',
    textColor: '#333333',
    axisColor: '#777777',
    gridColor: '#e5e7eb',
    crosshairColor: '#94a3b8',
    legendColor: '#333333',
    tooltipBackground: '#1a1a1a',
    tooltipColor: '#ffffff',
};

/** The built-in dark theme, tuned for a dark canvas background. */
export const darkTheme: Theme = {
    palette: [
        '#8ab4ff',
        '#5fe3b6',
        '#c4a7ff',
        '#ffd27a',
        '#ff9db4',
        '#6fd3e6',
        '#ffb27a',
        '#a9b6ff',
        '#bfe88f',
        '#e6a7f2',
        '#7ee0f5',
        '#b7c2d6',
    ],
    sequentialScheme: ['#0c4a6e', '#7dd3fc'],
    font: '12px sans-serif',
    textColor: '#e5e7eb',
    axisColor: '#94a3b8',
    gridColor: '#1f2937',
    crosshairColor: '#64748b',
    legendColor: '#e5e7eb',
    tooltipBackground: '#e5e7eb',
    tooltipColor: '#0b0f1a',
};

/**
 * A colourblind-safe theme using the Okabe–Ito qualitative palette and a CVD-friendly sequential
 * scale, for accessible categorical encoding. Pair with data labels for the strongest accessibility.
 */
export const colorBlindTheme: Theme = {
    ...lightTheme,
    palette: [
        '#e69f00',
        '#56b4e9',
        '#009e73',
        '#f0e442',
        '#0072b2',
        '#d55e00',
        '#cc79a7',
        '#999999',
    ],
    sequentialScheme: ['#00204d', '#ffe945'],
};

const THEME_REGISTRY = new Map<string, Theme>([
    ['light', lightTheme],
    ['dark', darkTheme],
    ['colorblind', colorBlindTheme],
]);

let defaultTheme: Theme = lightTheme;

/** Registers a named theme so it can be selected by name via the `theme` option or {@link resolveTheme}. */
export function registerTheme(name: string, theme: Theme): void {
    THEME_REGISTRY.set(name, theme);
}

/** The current module-level default theme (initially {@link lightTheme}). */
export function getDefaultTheme(): Theme {
    return defaultTheme;
}

/**
 * Sets the module-level default theme applied to charts that do not specify their own `theme`.
 *
 * @param theme - A registered theme name (`'light'`, `'dark'`, `'auto'`, or a custom name) or a {@link Theme}.
 */
export function setDefaultTheme(theme: string | Theme): void {
    defaultTheme = resolveTheme(theme);
}

/**
 * Resolves a theme input into a concrete {@link Theme}.
 *
 * A {@link Theme} object is returned as-is; a registered name is looked up; `'auto'` follows the OS
 * `prefers-color-scheme`; and an unknown name or `undefined` falls back to the current
 * {@link getDefaultTheme}.
 *
 * @param theme - A theme name, `'auto'`, a {@link Theme}, or `undefined`.
 * @returns The resolved theme.
 */
export function resolveTheme(theme?: string | Theme): Theme {
    if (theme && typeof theme !== 'string') {
        return theme;
    }

    if (theme === 'auto') {
        const prefersDark = typeof globalThis !== 'undefined'
            && typeof globalThis.matchMedia === 'function'
            && globalThis.matchMedia('(prefers-color-scheme: dark)').matches;

        return prefersDark ? darkTheme : lightTheme;
    }

    if (typeof theme === 'string') {
        return THEME_REGISTRY.get(theme) ?? defaultTheme;
    }

    return defaultTheme;
}
