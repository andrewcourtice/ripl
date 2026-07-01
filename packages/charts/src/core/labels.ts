/**
 * Shared helpers for rendering data labels next to markers/bars.
 *
 * Charts opt in via their `labels` option (see `normalizeDataLabels`). A label is a `Text`
 * element positioned relative to its anchor point with a small offset, created at opacity 0 so
 * callers can fade it in alongside the element it annotates.
 */

import {
    createText,
    Text,
    TextState,
} from '@ripl/core';

import type {
    LabelAnchor,
} from './options';

/** Describes a single data label to render. */
export interface DataLabelSpec {
    id: string;
    x: number;
    y: number;
    anchor: LabelAnchor;
    content: string;
    font: string;
    fill: string;
    /** Distance in pixels between the anchor point and the label. */
    offset?: number;
}

/** Resolves the anchored position and text alignment for a data label. */
export function resolveDataLabelLayout(spec: Pick<DataLabelSpec, 'x' | 'y' | 'anchor' | 'offset'>) {
    const { x, y, anchor, offset = 8 } = spec;

    let labelX = x;
    let labelY = y;
    let textAlign: TextState['textAlign'] = 'center';
    let textBaseline: TextState['textBaseline'] = 'middle';

    switch (anchor) {
        case 'top':
            labelY = y - offset;
            textBaseline = 'bottom';
            break;
        case 'bottom':
            labelY = y + offset;
            textBaseline = 'top';
            break;
        case 'left':
            labelX = x - offset;
            textAlign = 'right';
            break;
        case 'right':
            labelX = x + offset;
            textAlign = 'left';
            break;
    }

    return {
        x: labelX,
        y: labelY,
        textAlign,
        textBaseline,
    };
}

/** Creates a data label `Text` element (at opacity 0) positioned by its anchor. */
export function createDataLabel(spec: DataLabelSpec): Text {
    const layout = resolveDataLabelLayout(spec);

    return createText({
        id: spec.id,
        class: 'data-label',
        content: spec.content,
        x: layout.x,
        y: layout.y,
        textAlign: layout.textAlign,
        textBaseline: layout.textBaseline,
        font: spec.font,
        fill: spec.fill,
        opacity: 0,
        zIndex: 5,
    });
}
