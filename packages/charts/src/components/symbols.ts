/**
 * Marker symbol factory shared by the point-marker charts (line, scatter).
 *
 * Every symbol is backed by an element whose geometry is `cx`/`cy`/`radius`, so hosts animate all
 * symbol types identically to circles (enter/exit radius tweens, hover radius bumps). Non-circle
 * symbols are regular polygons sized to the same visual area as a circle of the requested radius,
 * so mixed-symbol series read as equally weighted.
 */

import type {
    Circle,
    CircleState,
    Polygon,
} from '@ripl/core';

import {
    createCircle,
    createPolygon,
} from '@ripl/core';

import type {
    Shape2DOptions,
} from '@ripl/core';

/** The available marker symbol shapes. */
export type SymbolType = 'circle' | 'square' | 'diamond' | 'triangle';

/** An element usable as a point marker — circle or regular polygon, both animated via `radius`. */
export type SymbolElement = Circle | Polygon;

// Circumradius multipliers giving each regular polygon the same area as a circle of radius r:
// polygon area = (n/2)·R²·sin(2π/n) = π·r² → R = r·√(2π / (n·sin(2π/n))).
const TRIANGLE_RADIUS_FACTOR = Math.sqrt((2 * Math.PI) / (3 * Math.sin((2 * Math.PI) / 3)));
const QUAD_RADIUS_FACTOR = Math.sqrt((2 * Math.PI) / (4 * Math.sin((2 * Math.PI) / 4)));

const SYMBOL_SIDES: Record<Exclude<SymbolType, 'circle'>, number> = {
    triangle: 3,
    diamond: 4,
    square: 4,
};

/**
 * The circumradius a symbol element needs to match the visual area of a circle of the given
 * radius. Hosts animating a marker's `radius` should animate towards this value.
 *
 * @param type - The symbol shape.
 * @param radius - The equal-area circle radius the symbol should visually match.
 * @returns The circumradius to assign to the symbol element.
 */
export function symbolRadius(type: SymbolType, radius: number): number {
    if (type === 'triangle') {
        return radius * TRIANGLE_RADIUS_FACTOR;
    }

    if (type === 'square' || type === 'diamond') {
        return radius * QUAD_RADIUS_FACTOR;
    }

    return radius;
}

/**
 * Repositions a symbol element, keeping a rotated symbol's transform origin locked to its centre
 * (a square is a 45°-rotated regular quad, so its origin must follow `cx`/`cy`).
 *
 * @param element - The symbol element to move.
 * @param cx - The new centre x-coordinate.
 * @param cy - The new centre y-coordinate.
 */
export function positionSymbol(element: SymbolElement, cx: number, cy: number): void {
    element.cx = cx;
    element.cy = cy;

    if (element.rotation) {
        element.transformOriginX = cx;
        element.transformOriginY = cy;
    }
}

/**
 * Creates a marker element for the given symbol type. The returned element exposes
 * `cx`/`cy`/`radius`, so hosts treat every symbol identically for positioning and animation —
 * pass the equal-area circle radius through {@link symbolRadius} when sizing non-circle symbols.
 *
 * @param type - The symbol shape to create.
 * @param options - Shape options (`cx`, `cy`, `radius`, paint, events). `radius` is applied as-is.
 * @returns A {@link Circle} for `'circle'`, otherwise a regular {@link Polygon} oriented for the shape.
 *
 * @example
 * ```ts
 * const marker = createSymbol('triangle', {
 *     cx: 100,
 *     cy: 80,
 *     radius: symbolRadius('triangle', 4),
 *     fill: '#3b82f6',
 * });
 * ```
 */
export function createSymbol(type: SymbolType, options: Shape2DOptions<CircleState>): SymbolElement {
    if (type === 'circle') {
        return createCircle(options);
    }

    const {
        cx = 0,
        cy = 0,
        ...rest
    } = options;

    return createPolygon({
        ...rest,
        cx,
        cy,
        sides: SYMBOL_SIDES[type],
        // A regular quad renders vertex-up (a diamond); rotating 45° about its centre squares it.
        ...(type === 'square' ? {
            rotation: Math.PI / 4,
            transformOriginX: cx,
            transformOriginY: cy,
        } : {}),
    });
}
