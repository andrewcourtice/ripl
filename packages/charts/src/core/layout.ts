/**
 * Chart layout management.
 *
 * A {@link ChartLayout} models the drawable canvas as a shrinking rectangle. Components
 * (title, legend, axes) reserve edge bands from it, and whatever remains is the plot area
 * where series are drawn. This replaces the ad-hoc `chartTop = padding.top + 20 + legendHeight`
 * arithmetic that was previously duplicated across every chart and that caused legends and
 * titles to overlap or clip the plotting area.
 */

/** A rectangular region expressed as a top-left origin plus dimensions. */
export interface ChartArea {
    x: number;
    y: number;
    width: number;
    height: number;
}

/** Padding with explicit top, right, bottom, and left values. */
export interface ChartPadding {
    top: number;
    right: number;
    bottom: number;
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

    private topEdge: number;
    private leftEdge: number;
    private rightEdge: number;
    private bottomEdge: number;

    constructor(width: number, height: number, padding: ChartPadding) {
        this.topEdge = padding.top;
        this.leftEdge = padding.left;
        this.rightEdge = width - padding.right;
        this.bottomEdge = height - padding.bottom;
    }

    /** The remaining free area after all reservations so far. */
    public get area(): ChartArea {
        return {
            x: this.leftEdge,
            y: this.topEdge,
            width: Math.max(0, this.rightEdge - this.leftEdge),
            height: Math.max(0, this.bottomEdge - this.topEdge),
        };
    }

    /** Reserves a band of the given thickness from the top edge and returns it. */
    public reserveTop(amount: number): ChartArea {
        const region: ChartArea = {
            x: this.leftEdge,
            y: this.topEdge,
            width: Math.max(0, this.rightEdge - this.leftEdge),
            height: amount,
        };

        this.topEdge += amount;
        return region;
    }

    /** Reserves a band of the given thickness from the bottom edge and returns it. */
    public reserveBottom(amount: number): ChartArea {
        this.bottomEdge -= amount;

        return {
            x: this.leftEdge,
            y: this.bottomEdge,
            width: Math.max(0, this.rightEdge - this.leftEdge),
            height: amount,
        };
    }

    /** Reserves a band of the given thickness from the left edge and returns it. */
    public reserveLeft(amount: number): ChartArea {
        const region: ChartArea = {
            x: this.leftEdge,
            y: this.topEdge,
            width: amount,
            height: Math.max(0, this.bottomEdge - this.topEdge),
        };

        this.leftEdge += amount;
        return region;
    }

    /** Reserves a band of the given thickness from the right edge and returns it. */
    public reserveRight(amount: number): ChartArea {
        this.rightEdge -= amount;

        return {
            x: this.rightEdge,
            y: this.topEdge,
            width: amount,
            height: Math.max(0, this.bottomEdge - this.topEdge),
        };
    }

    /** Reserves a band from the given side. Horizontal sides consume width, vertical sides consume height. */
    public reserve(side: ChartSide, amount: number): ChartArea {
        switch (side) {
            case 'top':
                return this.reserveTop(amount);
            case 'bottom':
                return this.reserveBottom(amount);
            case 'left':
                return this.reserveLeft(amount);
            case 'right':
                return this.reserveRight(amount);
        }
    }

}
