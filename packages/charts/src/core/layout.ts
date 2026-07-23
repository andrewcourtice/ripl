/**
 * Chart layout management.
 *
 * A {@link ChartLayout} models the drawable canvas as a shrinking rectangle. Components
 * (title, legend, axes) reserve edge bands from it, and whatever remains is the plot area
 * where series are drawn. This replaces the ad-hoc `chartTop = padding.top + 20 + legendHeight`
 * arithmetic that was previously duplicated across every chart and that caused legends and
 * titles to overlap or clip the plotting area.
 */

/** The center point and inscribed size of a rectangular {@link ChartArea}. */
export interface AreaCenter {
    /** The horizontal center of the area, in chart pixels. */
    cx: number;
    /** The vertical center of the area, in chart pixels. */
    cy: number;
    /** The inscribed size — the smaller of the area's width and height. */
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

/** An edge of the layout from which a band can be reserved. */
export type ChartSide = 'top' | 'bottom' | 'left' | 'right';

/**
 * Tracks the remaining free space within a chart and allows components to reserve
 * bands from any edge. The order of reservation determines stacking: bands reserved
 * first sit furthest from the plot area.
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

    /** Reserves a band of the given thickness from the top edge and returns it. */
    public reserveTop(amount: number): ChartArea {
        const region: ChartArea = {
            x: this._leftEdge,
            y: this._topEdge,
            width: Math.max(0, this._rightEdge - this._leftEdge),
            height: amount,
        };

        this._topEdge += amount;
        return region;
    }

    /** Reserves a band of the given thickness from the bottom edge and returns it. */
    public reserveBottom(amount: number): ChartArea {
        this._bottomEdge -= amount;

        return {
            x: this._leftEdge,
            y: this._bottomEdge,
            width: Math.max(0, this._rightEdge - this._leftEdge),
            height: amount,
        };
    }

    /** Reserves a band of the given thickness from the left edge and returns it. */
    public reserveLeft(amount: number): ChartArea {
        const region: ChartArea = {
            x: this._leftEdge,
            y: this._topEdge,
            width: amount,
            height: Math.max(0, this._bottomEdge - this._topEdge),
        };

        this._leftEdge += amount;
        return region;
    }

    /** Reserves a band of the given thickness from the right edge and returns it. */
    public reserveRight(amount: number): ChartArea {
        this._rightEdge -= amount;

        return {
            x: this._rightEdge,
            y: this._topEdge,
            width: amount,
            height: Math.max(0, this._bottomEdge - this._topEdge),
        };
    }

    /** Reserves a band from the given side. Horizontal sides consume width, vertical sides consume height. */
    public reserve(side: ChartSide, amount: number): ChartArea {
        const reservers: Record<ChartSide, (amount: number) => ChartArea> = {
            top: value => this.reserveTop(value),
            bottom: value => this.reserveBottom(value),
            left: value => this.reserveLeft(value),
            right: value => this.reserveRight(value),
        };

        return reservers[side](amount);
    }

}

/** Computes the center point and inscribed size (the smaller of width and height) of a rectangular area — the shared basis for laying out radial and polar charts. */
export function areaCenter(area: ChartArea): AreaCenter {
    return {
        cx: area.x + area.width / 2,
        cy: area.y + area.height / 2,
        size: Math.min(area.width, area.height),
    };
}
