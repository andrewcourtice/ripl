import {
    APPLIED_DEFINITION,
} from './constants';

import type {
    Styles,
    SVGContextElement,
} from './types';

import {
    objectForEach,
} from '@ripl/utilities';

interface AppliedDefinition {
    attributes: Record<string, string>;
    styleKeys: string[];
    textContent?: string;
}

type TrackedSVGElement = SVGElement & {
    [APPLIED_DEFINITION]?: AppliedDefinition;
};

function removeStaleAttributes(svgElement: SVGElement, previous: Record<string, string>, current: Record<string, string>): void {
    for (const key of Object.keys(previous)) {
        if (key !== 'id' && !(key in current)) {
            svgElement.removeAttribute(key);
        }
    }
}

function resetStaleStyles(svgElement: SVGElement, previousKeys: string[], current: Partial<Styles>): void {
    const style = svgElement.style as unknown as Record<string, string>;

    for (const key of previousKeys) {
        if (!(key in current)) {
            style[key] = '';
        }
    }
}

/**
 * Writes a context element's definition through to its live SVG DOM node, diffing against the
 * snapshot of the previously applied definition so stale attributes and inline styles are
 * removed rather than surviving between frames.
 */
export function updateSVGElement(svgElement: SVGElement, { id, definition }: SVGContextElement) {
    const {
        styles,
        attributes,
        textContent,
    } = definition;

    const trackedElement = svgElement as TrackedSVGElement;
    const applied = trackedElement[APPLIED_DEFINITION];

    svgElement.setAttribute('id', id);
    Object.assign(svgElement.style, styles);
    objectForEach(attributes, (key, value) => svgElement.setAttribute(key.toString(), value));

    if (applied) {
        removeStaleAttributes(svgElement, applied.attributes, attributes);
        resetStaleStyles(svgElement, applied.styleKeys, styles);
    }

    if (textContent !== applied?.textContent) {
        svgElement.textContent = textContent ?? '';
    }

    trackedElement[APPLIED_DEFINITION] = {
        attributes,
        styleKeys: Object.keys(styles),
        textContent,
    };
}
