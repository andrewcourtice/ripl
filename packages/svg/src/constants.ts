import type {
    Styles,
} from './types';

import type {
    TextAlignment,
    TextBaseline,
} from '@ripl/core';

/** Symbol key under which the snapshot of the last-applied definition is stored on a live SVG DOM element. */
export const APPLIED_DEFINITION = Symbol('applied-definition');

/** Maps unified context style values to their SVG equivalents, keyed by style property name. */
export const SVG_STYLE_MAP = {
    textAnchor: {
        left: 'start',
        right: 'end',
        center: 'middle',
    } as Record<TextAlignment, string>,
    // Browsers only honor `dominant-baseline` on `<text>`; `alignment-baseline` never reaches a node this backend writes.
    dominantBaseline: {
        top: 'text-before-edge',
        middle: 'central',
        bottom: 'text-after-edge',
    } as Record<TextBaseline, string>,
} as Record<keyof Styles, Record<string, string>>;

/** Maps the canvas composite operations that have a CSS `mix-blend-mode` equivalent to that blend mode. Operations with no equivalent (`source-over`, `destination-out`, `xor`, `copy`) are absent. */
export const SVG_BLEND_MODES: Record<string, string> = {
    multiply: 'multiply',
    screen: 'screen',
    overlay: 'overlay',
    darken: 'darken',
    lighten: 'lighten',
    'color-dodge': 'color-dodge',
    'color-burn': 'color-burn',
    'hard-light': 'hard-light',
    'soft-light': 'soft-light',
    difference: 'difference',
    exclusion: 'exclusion',
    hue: 'hue',
    saturation: 'saturation',
    color: 'color',
    luminosity: 'luminosity',
    lighter: 'plus-lighter',
};
