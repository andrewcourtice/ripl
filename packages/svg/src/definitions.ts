import {
    createSVGElement,
    normaliseGradientColor,
} from './helpers';

import {
    degreesToRadians,
} from '@ripl/core';

import type {
    Gradient,
    GradientColorStop,
} from '@ripl/core';

type GradientElementFactory = (gradient: Gradient) => SVGElement;
type GradientElementUpdater = (element: SVGElement, gradient: Gradient) => void;

/** Cache entry for a gradient definition living in `<defs>`. */
export interface GradientCacheEntry {
    /** The unique id referenced by `url(#...)` paint values. */
    gradientId: string;
    /** The live gradient element in `<defs>`. */
    element: SVGElement;
}

/** Cache entry for a text-path geometry definition living in `<defs>`. */
export interface TextPathCacheEntry {
    /** The unique id referenced by a `<textPath>` element's `href`. */
    pathId: string;
    /** The live `<path>` element in `<defs>` carrying the text path geometry. */
    element: SVGElement;
}

/** Cache entry for a clip definition living in `<defs>`. */
export interface ClipCacheEntry {
    /** The unique id referenced by `clip-path` attributes. */
    clipId: string;
    /** The live `<clipPath>` element in `<defs>`. */
    clipPathElement: SVGElement;
    /** The `<path>` child of the `<clipPath>` carrying the clip geometry. */
    pathElement: SVGElement;
}

/** Cache entry for a drop-shadow filter definition living in `<defs>`. */
export interface ShadowCacheEntry {
    /** The unique id referenced by `filter` attributes. */
    filterId: string;
    /** The live `<filter>` element in `<defs>`. */
    filterElement: SVGElement;
    /** The `<feDropShadow>` child of the `<filter>` carrying the shadow parameters. */
    shadowElement: SVGElement;
}

function applyGradientStops(gradientEl: SVGElement, stops: GradientColorStop[]) {
    gradientEl.replaceChildren();

    stops.forEach((stop) => {
        const stopEl = createSVGElement('stop');
        stopEl.setAttribute('offset', `${(stop.offset ?? 0) * 100}%`);
        stopEl.setAttribute('stop-color', normaliseGradientColor(stop.color));
        gradientEl.appendChild(stopEl);
    });
}

function applyLinearGradientAttributes(element: SVGElement, gradient: Gradient): void {
    const angleRad = degreesToRadians((gradient as { angle: number }).angle - 90);
    const x1 = 0.5 - Math.cos(angleRad) * 0.5;
    const y1 = 0.5 - Math.sin(angleRad) * 0.5;
    const x2 = 0.5 + Math.cos(angleRad) * 0.5;
    const y2 = 0.5 + Math.sin(angleRad) * 0.5;

    element.setAttribute('x1', x1.toFixed(4));
    element.setAttribute('y1', y1.toFixed(4));
    element.setAttribute('x2', x2.toFixed(4));
    element.setAttribute('y2', y2.toFixed(4));
}

function applyRadialGradientAttributes(element: SVGElement, gradient: Gradient): void {
    const cx = (gradient as { position: [number, number] }).position[0] / 100;
    const cy = (gradient as { position: [number, number] }).position[1] / 100;

    element.setAttribute('cx', cx.toFixed(4));
    element.setAttribute('cy', cy.toFixed(4));
    element.setAttribute('r', '0.5');
    element.setAttribute('fx', cx.toFixed(4));
    element.setAttribute('fy', cy.toFixed(4));
}

const GRADIENT_ELEMENT_FACTORIES: Record<string, GradientElementFactory> = {
    linear: () => createSVGElement('linearGradient'),
    radial: () => createSVGElement('radialGradient'),
};

const GRADIENT_ELEMENT_UPDATERS: Record<string, GradientElementUpdater> = {
    linear: applyLinearGradientAttributes,
    radial: applyRadialGradientAttributes,
};

/** Determines whether a parsed gradient maps to a native SVG gradient primitive (linear or radial). */
export function isSupportedSVGGradient(gradient: Gradient): boolean {
    return !!GRADIENT_ELEMENT_FACTORIES[gradient.type];
}

/** Creates a gradient element for `<defs>` from a parsed gradient, or `undefined` when the gradient type has no SVG primitive. */
export function createSVGGradientElement(gradient: Gradient, gradientId: string): SVGElement | undefined {
    const factory = GRADIENT_ELEMENT_FACTORIES[gradient.type];

    if (!factory) {
        return undefined;
    }

    const element = factory(gradient);

    element.setAttribute('id', gradientId);
    element.setAttribute('gradientUnits', 'objectBoundingBox');

    if (gradient.repeating) {
        element.setAttribute('spreadMethod', 'repeat');
    }

    GRADIENT_ELEMENT_UPDATERS[gradient.type]?.(element, gradient);
    applyGradientStops(element, gradient.stops);

    return element;
}

/** Updates an existing gradient `<defs>` element in place from a parsed gradient. */
export function updateSVGGradientElement(element: SVGElement, gradient: Gradient): void {
    GRADIENT_ELEMENT_UPDATERS[gradient.type]?.(element, gradient);
    applyGradientStops(element, gradient.stops);
}

/** Resolves a solid paint fallback for a gradient with no SVG primitive, using the color stop nearest the middle of the gradient. */
export function resolveConicGradientFallback(gradient: Gradient): string {
    const stops = gradient.stops;

    if (stops.length === 0) {
        return 'none';
    }

    let nearest = stops[0];
    let nearestDistance = Number.POSITIVE_INFINITY;

    stops.forEach((stop, index) => {
        const inferredOffset = stops.length === 1 ? 0.5 : index / (stops.length - 1);
        const offset = stop.offset ?? inferredOffset;
        const distance = Math.abs(offset - 0.5);

        if (distance < nearestDistance) {
            nearestDistance = distance;
            nearest = stop;
        }
    });

    return normaliseGradientColor(nearest.color);
}

/** Creates a `<clipPath>` definition (with its geometry `<path>` child) for `<defs>`. */
export function createSVGClipPathElement(clipId: string): ClipCacheEntry {
    const clipPathElement = createSVGElement('clipPath');
    clipPathElement.setAttribute('id', clipId);

    const pathElement = createSVGElement('path');
    clipPathElement.appendChild(pathElement);

    return {
        clipId,
        clipPathElement,
        pathElement,
    };
}

/** Creates a `<filter>` definition (with its `<feDropShadow>` child) for `<defs>`. */
export function createSVGShadowFilterElement(filterId: string): ShadowCacheEntry {
    const filterElement = createSVGElement('filter');
    const shadowElement = createSVGElement('feDropShadow');

    filterElement.setAttribute('id', filterId);
    // Widen the filter region beyond the default 10% margins so large blurs and
    // offsets aren't clipped at the element's bounding box.
    filterElement.setAttribute('x', '-50%');
    filterElement.setAttribute('y', '-50%');
    filterElement.setAttribute('width', '200%');
    filterElement.setAttribute('height', '200%');
    filterElement.appendChild(shadowElement);

    return {
        filterId,
        filterElement,
        shadowElement,
    };
}

/** Creates the `<path>` definition for `<defs>` that a `<textPath>` element references by id. */
export function createSVGTextPathDefElement(pathId: string): TextPathCacheEntry {
    const element = createSVGElement('path');
    element.setAttribute('id', pathId);

    return {
        pathId,
        element,
    };
}

/** Sweeps a `<defs>` cache, removing every entry (and its live defs node) not marked as used during the last render pass. */
export function sweepDefsCache<TEntry>(cache: Map<string, TEntry>, namespace: string, usedDefs: Set<string>, getDefsNode: (entry: TEntry) => SVGElement): void {
    cache.forEach((entry, key) => {
        if (usedDefs.has(`${namespace}:${key}`)) {
            return;
        }

        getDefsNode(entry).remove();
        cache.delete(key);
    });
}
