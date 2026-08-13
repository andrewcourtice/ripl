import {
    Shape2D,
} from '../core';

import type {
    BaseElementState,
    ElementDefaults,
    Shape2DOptions,
} from '../core';

import type {
    Context,
    ContextPath,
} from '../context';

import {
    Box,
    getPadAngleAtRadius,
    getPadInnerRadius,
    getThetaPoint,
    HALF_PI,
    TAU,
} from '../math';

import {
    numberClamp,
    typeIsNil,
} from '@ripl/utilities';

import {
    interpolateNumber,
} from '../interpolators';

/** Pad-trimmed sector geometry a rounded annular sector is traced from. */
interface ArcSector {
    cx: number;
    cy: number;
    radius: number;
    innerRadius: number;
    startAngle: number;
    endAngle: number;
    halfGap: number;
    outerCornerRadius: number;
    innerCornerRadius: number;
}

/** State interface for an arc element, defining center, angles, radii, padding, and border radius. */
export interface ArcState extends BaseElementState {
    /** The x-coordinate of the arc's center. */
    cx: number;
    /** The y-coordinate of the arc's center. */
    cy: number;
    /** The start angle of the arc, in radians. */
    startAngle: number;
    /** The end angle of the arc, in radians. */
    endAngle: number;
    /** The outer radius of the arc. */
    radius: number;
    /** The inner radius of the arc, producing an annular sector when set. */
    innerRadius?: number;
    /** The angular padding between the arc and its neighbors, in radians. Produces a wedge-shaped gap that widens with radius; use {@link ArcState.padWidth} for a gap of constant width. Ignored whenever `padWidth` is provided, `0` included. A `padAngle` wider than the sector collapses it onto its `endAngle`, where an oversized `padWidth` collapses it onto its mid-angle. */
    padAngle?: number;
    /** The padding between the arc and its neighbors, in logical pixels. Each radius is inset by `asin(padWidth / 2r)`, so an annular sector holds the gap constant and faces its neighbors with parallel edges, its inner radius floored at the radius where those edges would meet so that an `innerRadius` of `0` still carries the gap to the center rather than tapering it away; an open arc has no inner edge to inset, so the gap becomes a single trim at the outer radius and adjacent edges converge to nothing at the center. Takes precedence over {@link ArcState.padAngle} whenever it is provided — `padWidth: 0` means no padding rather than a fall back to `padAngle`, so animating it up from `0` is continuous. Negative values are treated as `0`. */
    padWidth?: number;
    /** The corner radius applied to the arc's corners, clamped to half the band thickness and to what the sector's span allows. An annular sector rounds all four corners; an open arc rounds the two outer corners and keeps a sharp center point. A non-zero value on an open arc also closes the path through the center, turning a chord-closed segment into a wedge and so changing its filled area, hit region and stroke — do not animate it up from `0` on an open arc. */
    borderRadius?: number;
}

/** Insets a sector by `inset` at both ends, collapsing it to its mid-angle rather than inverting it. */
function insetSector(startAngle: number, endAngle: number, inset: number): [number, number] {
    if (inset <= 0) {
        return [
            startAngle,
            endAngle,
        ];
    }

    const start = startAngle + inset;
    const end = endAngle - inset;

    if (start <= end) {
        return [
            start,
            end,
        ];
    }

    const midAngle = (startAngle + endAngle) / 2;

    return [
        midAngle,
        midAngle,
    ];
}

/** Traces a forward arc, pinning a sub-epsilon inverted sweep to zero rather than letting it wrap a full turn. */
function traceForwardArc(path: ContextPath, cx: number, cy: number, radius: number, fromAngle: number, toAngle: number): void {
    path.arc(cx, cy, radius, fromAngle, Math.max(fromAngle, toAngle));
}

/** Angular offset from a sector edge to the center of a corner circle of `cornerRadius` seated at `centerRadius`. */
function getCornerCenterOffset(centerRadius: number, halfGap: number, cornerRadius: number): number {
    const offset = halfGap + cornerRadius;

    if (!(centerRadius > 0)) {
        return offset > 0 ? HALF_PI : 0;
    }

    return Math.asin(Math.min(offset / centerRadius, 1));
}

/** Clamps a corner radius to `limit`, resolving the `0 / 0` a half-span sine of exactly 1 produces to the value either side of it. */
function clampCornerRadius(limit: number, numerator: number, denominator: number): number {
    if (!(denominator > 0)) {
        return numerator > 0 ? limit : 0;
    }

    return numberClamp(numerator / denominator, 0, limit);
}

/** Clamps a requested corner radius to the band thickness and to what the sector's span allows, per arc. */
function getCornerRadii(radius: number, innerRadius: number, span: number, halfGap: number, cornerRadius: number): [number, number] {
    const limit = Math.min(cornerRadius, (radius - innerRadius) / 2);

    if (!(limit > 0) || span <= 0 || span >= TAU) {
        return [0, 0];
    }

    if (span >= Math.PI) {
        return [limit, limit];
    }

    const halfSpanSine = Math.sin(span / 2);

    return [
        clampCornerRadius(limit, halfSpanSine * radius - halfGap, 1 + halfSpanSine),
        clampCornerRadius(limit, halfSpanSine * innerRadius - halfGap, 1 - halfSpanSine),
    ];
}

/** Traces an annular sector whose four corners are rounded by circles tangent to both an edge and an arc. */
function traceRoundedAnnularSector(path: ContextPath, sector: ArcSector): void {
    const {
        cx,
        cy,
        radius,
        innerRadius,
        startAngle,
        endAngle,
        halfGap,
        outerCornerRadius,
        innerCornerRadius,
    } = sector;

    const outerCenterRadius = radius - outerCornerRadius;
    const innerCenterRadius = innerRadius + innerCornerRadius;

    const [outerStart, outerEnd] = insetSector(startAngle, endAngle, getCornerCenterOffset(outerCenterRadius, halfGap, outerCornerRadius));
    const [innerStart, innerEnd] = insetSector(startAngle, endAngle, getCornerCenterOffset(innerCenterRadius, halfGap, innerCornerRadius));

    const startEdgeAngle = startAngle - HALF_PI;
    const endEdgeAngle = endAngle + HALF_PI;

    const [outerStartX, outerStartY] = getThetaPoint(outerStart, outerCenterRadius, cx, cy);
    const [outerEndX, outerEndY] = getThetaPoint(outerEnd, outerCenterRadius, cx, cy);
    const [innerStartX, innerStartY] = getThetaPoint(innerStart, innerCenterRadius, cx, cy);
    const [innerEndX, innerEndY] = getThetaPoint(innerEnd, innerCenterRadius, cx, cy);

    const [x1, y1] = getThetaPoint(startEdgeAngle, innerCornerRadius, innerStartX, innerStartY);
    const [x2, y2] = getThetaPoint(startEdgeAngle, outerCornerRadius, outerStartX, outerStartY);
    const [x3, y3] = getThetaPoint(endEdgeAngle, innerCornerRadius, innerEndX, innerEndY);

    path.moveTo(x1, y1);
    path.lineTo(x2, y2);
    traceForwardArc(path, outerStartX, outerStartY, outerCornerRadius, startEdgeAngle, outerStart);
    traceForwardArc(path, cx, cy, radius, outerStart, outerEnd);
    traceForwardArc(path, outerEndX, outerEndY, outerCornerRadius, outerEnd, endEdgeAngle);
    path.lineTo(x3, y3);
    traceForwardArc(path, innerEndX, innerEndY, innerCornerRadius, endEdgeAngle, innerEnd + Math.PI);
    path.arc(cx, cy, innerRadius, innerEnd, innerStart, true);
    traceForwardArc(path, innerStartX, innerStartY, innerCornerRadius, innerStart + Math.PI, startEdgeAngle + TAU);
    path.closePath();
}

/** Traces a wedge whose two outer corners are rounded and whose center point stays sharp. */
function traceRoundedWedge(path: ContextPath, cx: number, cy: number, radius: number, startAngle: number, endAngle: number, cornerRadius: number): void {
    const centerRadius = radius - cornerRadius;

    const [outerStart, outerEnd] = insetSector(startAngle, endAngle, getCornerCenterOffset(centerRadius, 0, cornerRadius));

    const startEdgeAngle = startAngle - HALF_PI;
    const endEdgeAngle = endAngle + HALF_PI;

    const [outerStartX, outerStartY] = getThetaPoint(outerStart, centerRadius, cx, cy);
    const [outerEndX, outerEndY] = getThetaPoint(outerEnd, centerRadius, cx, cy);
    const [x1, y1] = getThetaPoint(startEdgeAngle, cornerRadius, outerStartX, outerStartY);

    path.moveTo(cx, cy);
    path.lineTo(x1, y1);
    traceForwardArc(path, outerStartX, outerStartY, cornerRadius, startEdgeAngle, outerStart);
    traceForwardArc(path, cx, cy, radius, outerStart, outerEnd);
    traceForwardArc(path, outerEndX, outerEndY, cornerRadius, outerEnd, endEdgeAngle);
    path.lineTo(cx, cy);
    path.closePath();
}

const ARC_DEFAULTS: ElementDefaults<ArcState> = {
    interpolators: {
        borderRadius: interpolateNumber,
        cx: interpolateNumber,
        cy: interpolateNumber,
        endAngle: interpolateNumber,
        innerRadius: interpolateNumber,
        padAngle: interpolateNumber,
        padWidth: interpolateNumber,
        radius: interpolateNumber,
        startAngle: interpolateNumber,
    },
};

/** An arc or annular sector shape supporting inner radius, angular or constant-width padding, and rounded corners. */
export class Arc extends Shape2D<ArcState> {

    /** The x-coordinate of the arc's center. */
    public get cx() {
        return this.getStateValue('cx');
    }

    public set cx(value) {
        this.setStateValue('cx', value);
    }

    /** The y-coordinate of the arc's center. */
    public get cy() {
        return this.getStateValue('cy');
    }

    public set cy(value) {
        this.setStateValue('cy', value);
    }

    /** The start angle of the arc, in radians. */
    public get startAngle() {
        return this.getStateValue('startAngle');
    }

    public set startAngle(value) {
        this.setStateValue('startAngle', value);
    }

    /** The end angle of the arc, in radians. */
    public get endAngle() {
        return this.getStateValue('endAngle');
    }

    public set endAngle(value) {
        this.setStateValue('endAngle', value);
    }

    /** The outer radius of the arc. */
    public get radius() {
        return this.getStateValue('radius');
    }

    public set radius(value) {
        this.setStateValue('radius', value);
    }

    /** The inner radius of the arc, producing an annular sector when set. */
    public get innerRadius() {
        return this.getStateValue('innerRadius');
    }

    public set innerRadius(value) {
        this.setStateValue('innerRadius', value);
    }

    /** The angular padding between the arc and its neighbors, in radians. Produces a wedge-shaped gap that widens with radius; use {@link Arc.padWidth} for a gap of constant width. Ignored whenever `padWidth` is provided, `0` included. A `padAngle` wider than the sector collapses it onto its `endAngle`, where an oversized `padWidth` collapses it onto its mid-angle. */
    public get padAngle() {
        return this.getStateValue('padAngle');
    }

    public set padAngle(value) {
        this.setStateValue('padAngle', value);
    }

    /** The padding between the arc and its neighbors, in logical pixels. Each radius is inset by `asin(padWidth / 2r)`, so an annular sector holds the gap constant and faces its neighbors with parallel edges, its inner radius floored at the radius where those edges would meet so that an `innerRadius` of `0` still carries the gap to the center rather than tapering it away; an open arc has no inner edge to inset, so the gap becomes a single trim at the outer radius and adjacent edges converge to nothing at the center. Takes precedence over {@link Arc.padAngle} whenever it is provided — `padWidth: 0` means no padding rather than a fall back to `padAngle`, so animating it up from `0` is continuous. Negative values are treated as `0`. */
    public get padWidth() {
        return this.getStateValue('padWidth');
    }

    public set padWidth(value) {
        this.setStateValue('padWidth', value);
    }

    /** The corner radius applied to the arc's corners, clamped to half the band thickness and to what the sector's span allows. An annular sector rounds all four corners; an open arc rounds the two outer corners and keeps a sharp center point. A non-zero value on an open arc also closes the path through the center, turning a chord-closed segment into a wedge and so changing its filled area, hit region and stroke — do not animate it up from `0` on an open arc. */
    public get borderRadius() {
        return this.getStateValue('borderRadius');
    }

    public set borderRadius(value) {
        this.setStateValue('borderRadius', value);
    }

    constructor(options: Shape2DOptions<ArcState>) {
        super('arc', options, ARC_DEFAULTS);
    }

    /** Computes the centroid point of this arc, optionally with state overrides. */
    public getCentroid(alterations?: Partial<ArcState>) {
        const {
            cx,
            cy,
            radius,
            startAngle,
            endAngle,
            innerRadius = 0,
        } = {
            cx: this.cx,
            cy: this.cy,
            radius: this.radius,
            startAngle: this.startAngle,
            endAngle: this.endAngle,
            innerRadius: this.innerRadius,
            ...alterations,
        };

        const angle = (startAngle + endAngle) / 2;
        const distance = innerRadius + (radius - innerRadius) / 2;

        return getThetaPoint(angle, distance, cx, cy);
    }

    /** @internal Local-space bounding box of the arc. */
    public _getLocalBoundingBox(): Box {
        const {
            cx,
            cy,
            radius,
            innerRadius,
            startAngle,
            endAngle,
        } = this;

        const [outerX1, outerY1] = getThetaPoint(startAngle, radius, cx, cy);
        const [outerX2, outerY2] = getThetaPoint(endAngle, radius, cx, cy);

        if (typeIsNil(innerRadius)) {
            return new Box(
                Math.min(cy, outerY1, outerY2),
                Math.min(cx, outerX1, outerX2),
                Math.max(cy, outerY1, outerY2),
                Math.max(cx, outerX1, outerX2)
            );
        }

        const [innerX1, innerY1] = getThetaPoint(startAngle, innerRadius, cx, cy);
        const [innerX2, innerY2] = getThetaPoint(endAngle, innerRadius, cx, cy);

        return new Box(
            Math.min(innerY1, innerY2, outerY1, outerY2),
            Math.min(innerX1, innerX2, outerX1, outerX2),
            Math.max(innerY1, innerY2, outerY1, outerY2),
            Math.max(innerX1, innerX2, outerX1, outerX2)
        );
    }

    /** Renders the arc to the provided {@link Context}. */
    public render(context: Context) {
        const {
            cx,
            cy,
            padAngle,
            padWidth,
            borderRadius = 0,
        } = this;

        const radius = Math.max(0, this.radius);
        const innerRadius = typeIsNil(this.innerRadius) ? this.innerRadius : Math.max(0, this.innerRadius);
        const hasPadWidth = !typeIsNil(padWidth);
        const gap = typeIsNil(padWidth) ? 0 : Math.max(0, padWidth);

        let {
            startAngle,
            endAngle,
        } = this;

        return super.render(context, path => {
            if (padAngle && !hasPadWidth) {
                const offset = padAngle / 2;

                startAngle = Math.min(startAngle + offset, endAngle);
                endAngle = Math.max(endAngle - offset, startAngle);
            }

            if (typeIsNil(innerRadius)) {
                const [outerStart, outerEnd] = insetSector(startAngle, endAngle, getPadAngleAtRadius(gap, radius));
                const [cornerRadius] = getCornerRadii(radius, 0, outerEnd - outerStart, 0, borderRadius);

                if (!cornerRadius) {
                    return path.arc(cx, cy, radius, outerStart, outerEnd);
                }

                return traceRoundedWedge(path, cx, cy, radius, outerStart, outerEnd, cornerRadius);
            }

            const paddedInnerRadius = Math.max(innerRadius, Math.min(radius, getPadInnerRadius(gap, endAngle - startAngle)));
            const [outerCornerRadius, innerCornerRadius] = getCornerRadii(radius, paddedInnerRadius, endAngle - startAngle, gap / 2, borderRadius);

            if (outerCornerRadius || innerCornerRadius) {
                return traceRoundedAnnularSector(path, {
                    cx,
                    cy,
                    radius,
                    innerRadius: paddedInnerRadius,
                    startAngle,
                    endAngle,
                    halfGap: gap / 2,
                    outerCornerRadius,
                    innerCornerRadius,
                });
            }

            const [outerStart, outerEnd] = insetSector(startAngle, endAngle, getPadAngleAtRadius(gap, radius));
            const [innerStart, innerEnd] = insetSector(startAngle, endAngle, getPadAngleAtRadius(gap, paddedInnerRadius));

            const [x1, y1] = getThetaPoint(outerStart, radius, cx, cy);
            const [x2, y2] = getThetaPoint(innerEnd, paddedInnerRadius, cx, cy);

            path.moveTo(x1, y1);
            path.arc(cx, cy, radius, outerStart, outerEnd);
            path.lineTo(x2, y2);
            path.arc(cx, cy, paddedInnerRadius, innerEnd, innerStart, true);
            path.lineTo(x1, y1);
        });
    }

}

/** Factory function that creates a new `Arc` instance. */
export function createArc(...options: ConstructorParameters<typeof Arc>) {
    return new Arc(...options);
}

/** Type guard that checks whether a value is an `Arc` instance. */
export function elementIsArc(value: unknown): value is Arc {
    return value instanceof Arc;
}
