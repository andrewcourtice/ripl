import type {
    GraphTheme,
} from '../types';

import {
    parseColor,
    setColorAlpha,
} from '@ripl/web';

import {
    numberRoundTo,
} from '@ripl/utilities';

/** Options for {@link resolveGraphTheme}. */
export interface GraphThemeOptions {
    /** The element whose computed custom properties are read. Defaults to `document.documentElement`. */
    root?: Element;
    /** The stroke palette to expose as {@link GraphTheme.series}. Defaults to {@link GRAPH_SERIES_PALETTE}. */
    series?: string[];
}

const ALPHA_PRECISION = 3;
const GRID_MINOR_FADE = 0.45;
const LABEL_BACKING_ALPHA = 0.76;

/**
 * The stroke palette for plotted expressions, indexed by the expression's position in the list.
 *
 * Fixed rather than theme-derived: an expression's color is part of its identity in the equation
 * list, so it must not change when the site theme flips. Every entry is a mid-tone that holds
 * contrast against both the light and the dark page background.
 */
export const GRAPH_SERIES_PALETTE: string[] = [
    '#d94a4a',
    '#3d8bd6',
    '#3fa860',
    '#9161d8',
    '#e8912a',
    '#20a5a0',
    '#d95fa8',
    '#8a8f2f',
];

/**
 * The theme used when no DOM is available (server rendering) or a custom property resolves empty.
 *
 * Every color is a neutral mid gray so the fallback never commits the plot to a light or a dark
 * page, and the background stays transparent so the host element's own color shows through.
 */
export const DEFAULT_GRAPH_THEME: GraphTheme = {
    background: 'transparent',
    axis: 'rgba(127, 127, 127, 0.9)',
    gridMajor: 'rgba(127, 127, 127, 0.35)',
    gridMinor: 'rgba(127, 127, 127, 0.16)',
    label: 'rgba(127, 127, 127, 1)',
    labelBacking: 'rgba(127, 127, 127, 0.2)',
    series: [...GRAPH_SERIES_PALETTE],
};

/** Scales a color's existing alpha rather than replacing it, so a translucent token stays subordinate. */
function fadeColor(color: string, factor: number): string {
    const rgba = parseColor(color);

    return rgba
        ? setColorAlpha(color, numberRoundTo(rgba[3] * factor, ALPHA_PRECISION))
        : color;
}

/**
 * Resolves the canvas colors for a graph from the site's `--vp-c-*` custom properties.
 *
 * Carries no framework dependency: the caller re-invokes it whenever the site theme flips and hands
 * the result to the renderer.
 *
 * @param options - Where to read the custom properties from, and which series palette to use.
 * @returns A fully populated theme, falling back to {@link DEFAULT_GRAPH_THEME} per missing property.
 *
 * @example
 * ```ts
 * const graph = createGraph2D(host, {
 *     sample: samplePlot,
 *     theme: resolveGraphTheme(),
 * });
 * ```
 */
export function resolveGraphTheme(options?: GraphThemeOptions): GraphTheme {
    const series = [...options?.series ?? GRAPH_SERIES_PALETTE];
    const root = options?.root ?? (typeof document === 'undefined' ? undefined : document.documentElement);

    if (!root) {
        return {
            ...DEFAULT_GRAPH_THEME,
            series,
        };
    }

    const styles = getComputedStyle(root);
    const readProperty = (name: string, fallback: string) => styles.getPropertyValue(name).trim() || fallback;

    const background = readProperty('--vp-c-bg', DEFAULT_GRAPH_THEME.background);
    const divider = readProperty('--vp-c-divider', DEFAULT_GRAPH_THEME.gridMajor);

    return {
        background,
        axis: readProperty('--vp-c-text-3', DEFAULT_GRAPH_THEME.axis),
        gridMajor: divider,
        gridMinor: fadeColor(divider, GRID_MINOR_FADE),
        label: readProperty('--vp-c-text-2', DEFAULT_GRAPH_THEME.label),
        labelBacking: setColorAlpha(background, LABEL_BACKING_ALPHA),
        series,
    };
}
