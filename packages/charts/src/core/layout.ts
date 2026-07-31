/**
 * Chart layout management.
 *
 * A {@link ChartLayout} models the drawable canvas as a shrinking rectangle. Components
 * (title, legend, axes) reserve edge bands from it, and whatever remains is the plot area
 * where series are drawn. This replaces the ad-hoc `chartTop = padding.top + 20 + legendHeight`
 * arithmetic that was previously duplicated across every chart and that caused legends and
 * titles to overlap or clip the plotting area.
 */

import {
    DEFAULT_CHART_PADDING,
    ELEMENT_GAP,
} from '../constants/layout';

import {
    SPACING,
} from '../constants/spacing';

import {
    typeIsArray,
    typeIsNumber,
} from '@ripl/utilities';

export {
    DEFAULT_CHART_PADDING,
    ELEMENT_GAP,
    SPACING,
};

/** The center point and inscribed size of a rectangular {@link ChartArea}. */
export interface AreaCenter {
    /** The horizontal center of the area, in chart pixels. */
    cx: number;
    /** The vertical center of the area, in chart pixels. */
    cy: number;
    /** The inscribed size: the smaller of the area's width and height. */
    size: number;
}

/** A rectangular region expressed as a top-left origin plus dimensions. */
export interface ChartArea {
    /** Left edge of the region, in chart pixels. */
    x: number;
    /** Top edge of the region, in chart pixels. */
    y: number;
    /** Width of the region, in pixels. */
    width: number;
    /** Height of the region, in pixels. */
    height: number;
}

/**
 * Padding, in pixels: a uniform number, a `[top, right, bottom, left]` tuple, or a partial per-edge
 * object. Every option named `padding` accepts this same shape, on the chart and on every component.
 */
export type PaddingInput = number | [number, number, number, number] | Partial<ChartPadding>;

/** Padding with explicit top, right, bottom, and left values. */
export interface ChartPadding {
    /** Top padding, in pixels. */
    top: number;
    /** Right padding, in pixels. */
    right: number;
    /** Bottom padding, in pixels. */
    bottom: number;
    /** Left padding, in pixels. */
    left: number;
}

/**
 * Resolves a chart padding input into a full {@link ChartPadding}. A single number applies to all
 * four edges; a partial object sets individual edges and leaves the rest at `fallback`; `undefined`
 * falls back on every edge. Explicit `0` values are preserved.
 *
 * @param input - A uniform number, a partial per-edge object, or `undefined`.
 * @param fallback - Value used for any edge left unspecified. Defaults to {@link DEFAULT_CHART_PADDING}.
 * @returns Fully resolved padding for all four edges.
 */
export function resolveChartPadding(
    input?: PaddingInput,
    fallback: number = DEFAULT_CHART_PADDING
): ChartPadding {
    if (typeIsNumber(input)) {
        return {
            top: input,
            right: input,
            bottom: input,
            left: input,
        };
    }

    if (typeIsArray(input)) {
        return {
            top: input[0],
            right: input[1],
            bottom: input[2],
            left: input[3],
        };
    }

    return {
        top: input?.top ?? fallback,
        right: input?.right ?? fallback,
        bottom: input?.bottom ?? fallback,
        left: input?.left ?? fallback,
    };
}

/** An edge of the layout from which a band can be reserved. */
export type ChartSide = 'top' | 'bottom' | 'left' | 'right';

/**
 * Tracks the remaining free space within a chart and allows components to reserve
 * bands from any edge. The order of reservation determines stacking: bands reserved
 * first sit furthest from the plot area.
 *
 * Every reservation accepts a `gap` — space consumed beyond the returned band, separating it from
 * whatever is reserved next. Without one, adjacent elements (a title and the legend below it, a
 * legend and the plot) sit flush against each other. Callers should pass a step from
 * {@link SPACING} rather than a bare number; {@link ELEMENT_GAP} is the default separation between
 * two distinct chart elements.
 */
export class ChartLayout {

    private _topEdge: number;
    private _leftEdge: number;
    private _rightEdge: number;
    private _bottomEdge: number;

    constructor(width: number, height: number, padding: ChartPadding) {
        this._topEdge = padding.top;
        this._leftEdge = padding.left;
        this._rightEdge = width - padding.right;
        this._bottomEdge = height - padding.bottom;
    }

    /** The remaining free area after all reservations so far. */
    public get area(): ChartArea {
        return {
            x: this._leftEdge,
            y: this._topEdge,
            width: Math.max(0, this._rightEdge - this._leftEdge),
            height: Math.max(0, this._bottomEdge - this._topEdge),
        };
    }

    /**
     * Reserves a band of the given thickness from the top edge and returns it.
     *
     * @param amount - Thickness of the band, in pixels.
     * @param gap - Extra space consumed after the band, separating it from the next reservation.
     */
    public reserveTop(amount: number, gap: number = 0): ChartArea {
        const region: ChartArea = {
            x: this._leftEdge,
            y: this._topEdge,
            width: Math.max(0, this._rightEdge - this._leftEdge),
            height: amount,
        };

        this._topEdge += amount + gap;
        return region;
    }

    /**
     * Reserves a band of the given thickness from the bottom edge and returns it.
     *
     * @param amount - Thickness of the band, in pixels.
     * @param gap - Extra space consumed after the band, separating it from the next reservation.
     */
    public reserveBottom(amount: number, gap: number = 0): ChartArea {
        this._bottomEdge -= amount;

        const region: ChartArea = {
            x: this._leftEdge,
            y: this._bottomEdge,
            width: Math.max(0, this._rightEdge - this._leftEdge),
            height: amount,
        };

        this._bottomEdge -= gap;
        return region;
    }

    /**
     * Reserves a band of the given thickness from the left edge and returns it.
     *
     * @param amount - Thickness of the band, in pixels.
     * @param gap - Extra space consumed after the band, separating it from the next reservation.
     */
    public reserveLeft(amount: number, gap: number = 0): ChartArea {
        const region: ChartArea = {
            x: this._leftEdge,
            y: this._topEdge,
            width: amount,
            height: Math.max(0, this._bottomEdge - this._topEdge),
        };

        this._leftEdge += amount + gap;
        return region;
    }

    /**
     * Reserves a band of the given thickness from the right edge and returns it.
     *
     * @param amount - Thickness of the band, in pixels.
     * @param gap - Extra space consumed after the band, separating it from the next reservation.
     */
    public reserveRight(amount: number, gap: number = 0): ChartArea {
        this._rightEdge -= amount;

        const region: ChartArea = {
            x: this._rightEdge,
            y: this._topEdge,
            width: amount,
            height: Math.max(0, this._bottomEdge - this._topEdge),
        };

        this._rightEdge -= gap;
        return region;
    }

    /**
     * Reserves a band from the given side. Horizontal sides consume width, vertical sides consume
     * height.
     *
     * @param side - The edge to reserve from.
     * @param amount - Thickness of the band, in pixels.
     * @param gap - Extra space consumed after the band, separating it from the next reservation.
     */
    public reserve(side: ChartSide, amount: number, gap: number = 0): ChartArea {
        const reservers: Record<ChartSide, (amount: number, gap: number) => ChartArea> = {
            top: (value, spacing) => this.reserveTop(value, spacing),
            bottom: (value, spacing) => this.reserveBottom(value, spacing),
            left: (value, spacing) => this.reserveLeft(value, spacing),
            right: (value, spacing) => this.reserveRight(value, spacing),
        };

        return reservers[side](amount, gap);
    }

}

/** Computes the center point and inscribed size (the smaller of width and height) of a rectangular area: the shared basis for laying out radial and polar charts. */
export function areaCenter(area: ChartArea): AreaCenter {
    return {
        cx: area.x + area.width / 2,
        cy: area.y + area.height / 2,
        size: Math.min(area.width, area.height),
    };
}
