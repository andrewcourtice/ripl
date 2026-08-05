import {
    createSVGElement,
    normalizeGradientColor,
} from './utilities';

import {
    degreesToRadians,
    getPatternTileGeometry,
} from '@ripl/core';

import type {
    Gradient,
    GradientBounds,
    GradientColorStop,
    Pattern,
} from '@ripl/core';

type GradientElementFactory = (gradient: Gradient) => SVGElement;
type GradientElementUpdater = (element: SVGElement, gradient: Gradient, bounds: GradientBounds) => void;

/** Cache entry for a gradient definition living in `<defs>`. */
/** A cached `<pattern>` definition: its referenced id and the live defs element. */
export interface PatternCacheEntry {
    /** The id the pattern is referenced by (`url(#id)`). */
    patternId: string;
    /** The live `<pattern>` element inside `<defs>`. */
    element: SVGElement;
}

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

const GRADIENT_ELEMENT_FACTORIES: Record<string, GradientElementFactory> = {
    linear: () => createSVGElement('linearGradient'),
    radial: () => createSVGElement('radialGradient'),
};

const GRADIENT_ELEMENT_UPDATERS: Record<string, GradientElementUpdater> = {
    linear: applyLinearGradientAttributes,
    radial: applyRadialGradientAttributes,
};

function applyGradientStops(gradientEl: SVGElement, stops: GradientColorStop[]) {
    gradientEl.replaceChildren();

    stops.forEach((stop) => {
        const stopEl = createSVGElement('stop');
        stopEl.setAttribute('offset', `${(stop.offset ?? 0) * 100}%`);
        stopEl.setAttribute('stop-color', normalizeGradientColor(stop.color));
        gradientEl.appendChild(stopEl);
    });
}

function applyLinearGradientAttributes(element: SVGElement, gradient: Gradient, bounds: GradientBounds): void {
    const angleRad = degreesToRadians((gradient as { angle: number }).angle - 90);
    const cos = Math.cos(angleRad) * 0.5;
    const sin = Math.sin(angleRad) * 0.5;

    element.setAttribute('x1', (bounds.x + (0.5 - cos) * bounds.width).toFixed(4));
    element.setAttribute('y1', (bounds.y + (0.5 - sin) * bounds.height).toFixed(4));
    element.setAttribute('x2', (bounds.x + (0.5 + cos) * bounds.width).toFixed(4));
    element.setAttribute('y2', (bounds.y + (0.5 + sin) * bounds.height).toFixed(4));
}

function applyRadialGradientAttributes(element: SVGElement, gradient: Gradient, bounds: GradientBounds): void {
    const position = (gradient as { position: [number, number] }).position;
    const cx = bounds.x + (position[0] / 100) * bounds.width;
    const cy = bounds.y + (position[1] / 100) * bounds.height;
    const radius = bounds.width / 2;

    element.setAttribute('cx', cx.toFixed(4));
    element.setAttribute('cy', cy.toFixed(4));
    element.setAttribute('r', radius.toFixed(4));
    element.setAttribute('fx', cx.toFixed(4));
    element.setAttribute('fy', cy.toFixed(4));

    // A user-space radial gradient is a circle; scaling about the centre restores the ellipse the bounding box gave it.
    const scaleY = bounds.height / bounds.width;

    element.setAttribute('gradientTransform', `translate(${cx.toFixed(4)},${cy.toFixed(4)}) scale(1,${scaleY.toFixed(4)}) translate(${(-cx).toFixed(4)},${(-cy).toFixed(4)})`);
}

/** Determines whether a parsed gradient maps to a native SVG gradient primitive (linear or radial). */
export function isSupportedSVGGradient(gradient: Gradient): boolean {
    return !!GRADIENT_ELEMENT_FACTORIES[gradient.type];
}

/**
 * Creates a gradient element for `<defs>` from a parsed gradient, or `undefined` when the gradient
 * type has no SVG primitive.
 *
 * @param gradient - The parsed gradient to render.
 * @param gradientId - The id the gradient is referenced by.
 * @param bounds - The rectangle the gradient's coordinates resolve against.
 * @returns The `<linearGradient>` or `<radialGradient>` element, or `undefined` for an unsupported type.
 */
export function createSVGGradientElement(gradient: Gradient, gradientId: string, bounds: GradientBounds): SVGElement | undefined {
    const factory = GRADIENT_ELEMENT_FACTORIES[gradient.type];

    if (!factory) {
        return undefined;
    }

    const element = factory(gradient);

    element.setAttribute('id', gradientId);

    if (gradient.repeating) {
        element.setAttribute('spreadMethod', 'repeat');
    }

    updateSVGGradientElement(element, gradient, bounds);

    return element;
}

/**
 * Updates an existing gradient `<defs>` element in place from a parsed gradient.
 *
 * Coordinates are written in user space against the element's own bounding box rather than SVG's
 * per-node `objectBoundingBox`, so an element that paints as several paths ramps once across all of
 * them and matches what the canvas backend draws. They are rewritten every render because they move
 * with the element.
 *
 * @param element - The live gradient element in `<defs>`.
 * @param gradient - The parsed gradient to render.
 * @param bounds - The rectangle the gradient's coordinates resolve against.
 */
export function updateSVGGradientElement(element: SVGElement, gradient: Gradient, bounds: GradientBounds): void {
    element.setAttribute('gradientUnits', 'userSpaceOnUse');

    GRADIENT_ELEMENT_UPDATERS[gradient.type]?.(element, gradient, bounds);
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

    return normalizeGradientColor(nearest.color);
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
    // Widen the filter region beyond the default 10% margins so large blurs and offsets aren't clipped.
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

// Renders shared pattern tile geometry into `<pattern>` children so canvas and SVG draw identical tiles.
function appendPatternTileShapes(element: SVGElement, pattern: Pattern): void {
    const geometry = getPatternTileGeometry(pattern);

    if (pattern.background !== 'transparent') {
        const background = createSVGElement('rect');

        background.setAttribute('x', '0');
        background.setAttribute('y', '0');
        background.setAttribute('width', String(geometry.size));
        background.setAttribute('height', String(geometry.size));
        background.setAttribute('fill', pattern.background);
        element.appendChild(background);
    }

    geometry.shapes.forEach(shape => {
        if (shape.kind === 'line') {
            const line = createSVGElement('line');

            line.setAttribute('x1', String(shape.x1));
            line.setAttribute('y1', String(shape.y1));
            line.setAttribute('x2', String(shape.x2));
            line.setAttribute('y2', String(shape.y2));
            line.setAttribute('stroke', pattern.foreground);
            line.setAttribute('stroke-width', String(shape.width));
            element.appendChild(line);
            return;
        }

        const dot = createSVGElement('circle');

        dot.setAttribute('cx', String(shape.cx));
        dot.setAttribute('cy', String(shape.cy));
        dot.setAttribute('r', String(shape.radius));
        dot.setAttribute('fill', pattern.foreground);
        element.appendChild(dot);
    });
}

/**
 * Creates a `<pattern>` definition for a parsed pattern paint, tiled in user space so the motif
 * is stable regardless of the painted element's bounds.
 *
 * @param pattern - The parsed pattern to materialize.
 * @param patternId - The id the pattern is referenced by (`url(#id)`).
 * @returns The `<pattern>` element to append to `<defs>`.
 */
export function createSVGPatternElement(pattern: Pattern, patternId: string): SVGElement {
    const element = createSVGElement('pattern');

    element.setAttribute('id', patternId);
    element.setAttribute('patternUnits', 'userSpaceOnUse');
    element.setAttribute('width', String(pattern.size));
    element.setAttribute('height', String(pattern.size));

    appendPatternTileShapes(element, pattern);

    return element;
}

/**
 * Updates a cached `<pattern>` definition in place for a (possibly changed) pattern paint,
 * rebuilding its tile children.
 *
 * @param element - The live `<pattern>` element inside `<defs>`.
 * @param pattern - The parsed pattern to re-render.
 */
export function updateSVGPatternElement(element: SVGElement, pattern: Pattern): void {
    element.setAttribute('width', String(pattern.size));
    element.setAttribute('height', String(pattern.size));

    while (element.firstChild) {
        element.removeChild(element.firstChild);
    }

    appendPatternTileShapes(element, pattern);
}
