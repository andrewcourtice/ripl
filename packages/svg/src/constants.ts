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
    alignmentBaseline: {
        top: 'text-before-edge',
        middle: 'middle',
        bottom: 'text-after-edge',
    } as Record<TextBaseline, string>,
    // Browsers only honor `dominant-baseline` on `<text>`; `alignment-baseline` applies to `<tspan>`/`<textPath>`.
    dominantBaseline: {
        top: 'text-before-edge',
        middle: 'central',
        bottom: 'text-after-edge',
    } as Record<TextBaseline, string>,
} as Record<keyof Styles, Record<string, string>>;
