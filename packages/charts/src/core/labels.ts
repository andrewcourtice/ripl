/**
 * Shared helpers for rendering data labels next to markers/bars.
 *
 * Charts opt in via their `labels` option (see `normalizeDataLabels`). A label is a `Text`
 * element positioned relative to its anchor point with a small offset, created at opacity 0 so
 * callers can fade it in alongside the element it annotates.
 */

import type {
    Point,
    Text,
    TextState,
} from '@ripl/core';

import {
    createText,
    getThetaPoint,
} from '@ripl/core';

import type {
    ChartSegmentLabelsOptions,
    LabelAnchor,
    SegmentLabelPosition,
} from './options';

export type { SegmentLabelPosition };

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

// ---------------------------------------------------------------------------
// Segment labels (pie, polar-area, treemap, funnel, sunburst)
// ---------------------------------------------------------------------------

/**
 * Shared segment-label style constants. Every chart routes its segment labels through these so the
 * appearance is identical across chart types **and** across the Canvas and SVG contexts. The
 * cross-context inconsistency this fixes came from labels that omitted `font`, leaving each backend
 * to fall back to its own default — always set an explicit font.
 */
export const SEGMENT_LABEL_FONT = '600 11px sans-serif';
/** Fill for labels drawn inside a segment (on top of the filled shape). */
export const SEGMENT_LABEL_INSIDE_FILL = '#ffffff';
/** Fill for labels drawn outside a segment (on the chart background). */
export const SEGMENT_LABEL_OUTSIDE_FILL = '#333333';

/** Describes a single segment label to render. */
export interface SegmentLabelSpec {
    id?: string;
    x: number;
    y: number;
    content: string;
    /** Defaults to the shared centered/middle alignment used for inside labels. */
    textAlign?: TextState['textAlign'];
    textBaseline?: TextState['textBaseline'];
    /** Defaults to {@link SEGMENT_LABEL_FONT}. */
    font?: string;
    /** Defaults to the inside fill; pass the outside fill (or a custom colour) as needed. */
    fill?: string;
    /** Initial opacity (defaults to 0 so callers can fade the label in). */
    opacity?: number;
    zIndex?: number;
}

/**
 * Creates a segment label `Text` with **all** style properties set explicitly (never inheriting the
 * context default), guaranteeing identical rendering across chart types and Canvas/SVG contexts.
 */
export function createSegmentLabel(spec: SegmentLabelSpec): Text {
    return createText({
        id: spec.id,
        class: 'segment__label',
        content: spec.content,
        x: spec.x,
        y: spec.y,
        fill: spec.fill ?? SEGMENT_LABEL_INSIDE_FILL,
        font: spec.font ?? SEGMENT_LABEL_FONT,
        textAlign: spec.textAlign ?? 'center',
        textBaseline: spec.textBaseline ?? 'middle',
        opacity: spec.opacity ?? 0,
        zIndex: spec.zIndex ?? 1,
    });
}

/** Input geometry for placing a label around a radial (arc-based) segment. */
export interface RadialLabelInput {
    cx: number;
    cy: number;
    startAngle: number;
    endAngle: number;
    /** Outer radius of the segment. */
    radius: number;
    /** Inner radius of the segment (0 for a full pie slice). */
    innerRadius?: number;
    /** Fraction (0–1) between inner and outer radius for the inside anchor. Defaults to 0.5. */
    insideRatio?: number;
    /** Radial gap from the outer edge to the leader-line elbow (outside labels). Defaults to 12. */
    outerGap?: number;
    /** Horizontal run of the leader line before the label (outside labels). Defaults to 20. */
    horizontalLength?: number;
    /** Gap between the leader line and the label text (outside labels). Defaults to 4. */
    textGap?: number;
}

/** A resolved anchor for a radial label, plus alignment. */
export interface RadialLabelAnchor {
    x: number;
    y: number;
    textAlign: TextState['textAlign'];
    textBaseline: TextState['textBaseline'];
}

/** Resolved inside and outside placements for a radial segment label. */
export interface RadialLabelPlacement {
    /** Mid-angle of the segment (radians). */
    mid: number;
    /** Centered anchor at the segment centroid. */
    inside: RadialLabelAnchor;
    /** Anchor beyond the outer edge, with a leader-line polyline from the arc to the label. */
    outside: RadialLabelAnchor & { connector: Point[] };
}

/**
 * Computes both the inside (centroid) and outside (leader-line) label placements for a radial
 * segment. Shared by the pie and polar-area charts so their inside/outside label behaviour — and
 * the elbow leader line — stay identical. The outside `textAlign` flips by hemisphere so text reads
 * away from the centre.
 */
export function resolveRadialLabel(input: RadialLabelInput): RadialLabelPlacement {
    const {
        cx,
        cy,
        startAngle,
        endAngle,
        radius,
        innerRadius = 0,
        insideRatio = 0.5,
        outerGap = 12,
        horizontalLength = 20,
        textGap = 4,
    } = input;

    const mid = (startAngle + endAngle) / 2;
    const insideRadius = innerRadius + (radius - innerRadius) * insideRatio;
    const [insideX, insideY] = getThetaPoint(mid, insideRadius, cx, cy);

    const direction = Math.cos(mid) >= 0 ? 1 : -1;
    const [edgeX, edgeY] = getThetaPoint(mid, radius, cx, cy);
    const [elbowX, elbowY] = getThetaPoint(mid, radius + outerGap, cx, cy);
    const endX = elbowX + direction * horizontalLength;
    const textX = endX + direction * textGap;

    return {
        mid,
        inside: {
            x: insideX,
            y: insideY,
            textAlign: 'center',
            textBaseline: 'middle',
        },
        outside: {
            x: textX,
            y: elbowY,
            textAlign: direction > 0 ? 'left' : 'right',
            textBaseline: 'middle',
            connector: [
                [edgeX, edgeY],
                [elbowX, elbowY],
                [endX, elbowY],
            ],
        },
    };
}

/** Fully resolved layout for a segment label: placement, content, styling, and leader-line points. */
export interface SegmentLabelLayout {
    /** Whether the label should be shown (respects `labels.visible` and the min-angle guard). */
    visible: boolean;
    /** Text content, or `''` when hidden. */
    content: string;
    x: number;
    y: number;
    textAlign: TextState['textAlign'];
    textBaseline: TextState['textBaseline'];
    fill: string;
    font?: string;
    /** Leader-line points; always ≥2 (a degenerate line at the anchor when hidden/inside). */
    connector: Point[];
    /** Whether the leader line should be shown (visible outside labels only). */
    showConnector: boolean;
}

/**
 * Resolves a segment's label into a ready-to-render layout (inside centroid or outside leader line),
 * honouring visibility, an optional minimum-angle clutter guard, and position/font/colour options.
 * Shared by the pie and polar-area charts so their label behaviour is identical.
 *
 * The connector always has ≥2 points (a degenerate line at the anchor when hidden or inside) so
 * `Polyline.getBoundingBox` stays safe and renders nothing for non-outside labels.
 */
export function resolveSegmentLabelLayout(
    geometry: RadialLabelInput,
    labels: ChartSegmentLabelsOptions,
    text: string,
    minAngle: number = 0
): SegmentLabelLayout {
    const visible = labels.visible && (geometry.endAngle - geometry.startAngle) >= minAngle;
    const outside = labels.position === 'outside';
    const placement = resolveRadialLabel(geometry);
    const anchor = outside ? placement.outside : placement.inside;
    const fill = labels.fontColor ?? (outside ? SEGMENT_LABEL_OUTSIDE_FILL : SEGMENT_LABEL_INSIDE_FILL);
    const showConnector = visible && outside;

    return {
        visible,
        content: visible ? text : '',
        x: anchor.x,
        y: anchor.y,
        textAlign: anchor.textAlign,
        textBaseline: anchor.textBaseline,
        fill,
        font: labels.font,
        connector: showConnector
            ? placement.outside.connector
            : [[anchor.x, anchor.y], [anchor.x, anchor.y]],
        showConnector,
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
