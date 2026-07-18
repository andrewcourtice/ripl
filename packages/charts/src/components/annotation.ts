import type {
    ChartComponentOptions,
} from './_base';

import {
    ChartComponent,
} from './_base';

import type {
    Group,
    Rect,
    Scale,
} from '@ripl/core';

import {
    createCircle,
    createGroup,
    createLine,
    createRect,
    createText,
    setColorAlpha,
} from '@ripl/core';

import {
    typeIsNumber,
} from '@ripl/utilities';

/** Which axis an annotation's value(s) are measured against. */
export type AnnotationAxis = 'x' | 'y';

/** A reference line drawn across the plot at a fixed value on one axis. */
export interface ChartLineAnnotation {
    /** Discriminator. Optional — a line is the default annotation kind. */
    type?: 'line';
    /** The axis the {@link ChartLineAnnotation.value} is measured on. */
    axis: AnnotationAxis;
    /** The axis value at which the line is drawn. */
    value: number;
    /** Optional label rendered beside the line. */
    label?: string;
    /** Line colour. Defaults to a neutral annotation colour. */
    color?: string;
    /** Line width in pixels. Defaults to 1. */
    lineWidth?: number;
    /** Canvas dash pattern. Defaults to a dashed line. */
    lineDash?: number[];
}

/** A shaded band spanning a value range on one axis (a threshold/target region). */
export interface ChartBandAnnotation {
    /** Discriminator selecting a band annotation. */
    type: 'band';
    /** The axis the band's {@link ChartBandAnnotation.from}/{@link ChartBandAnnotation.to} are measured on. */
    axis: AnnotationAxis;
    /** Lower bound of the band, in axis values. */
    from: number;
    /** Upper bound of the band, in axis values. */
    to: number;
    /** Fill colour. Defaults to a neutral annotation colour. */
    color?: string;
    /** Optional label rendered inside the band. */
    label?: string;
    /** Fill opacity (0–1). Defaults to 0.12. */
    opacity?: number;
}

/** A marker (dot + optional label) placed at a specific x/y data coordinate. */
export interface ChartPointAnnotation {
    /** Discriminator selecting a point annotation. */
    type: 'point';
    /** The x value (on the x scale) of the marker. */
    x: number;
    /** The y value (on the y scale) of the marker. */
    y: number;
    /** Optional label rendered beside the marker. */
    label?: string;
    /** Marker colour. Defaults to a neutral annotation colour. */
    color?: string;
    /** Marker radius in pixels. Defaults to 4. */
    radius?: number;
}

/** Any chart annotation: a reference line, a shaded band, or a point marker. */
export type ChartAnnotation = ChartLineAnnotation | ChartBandAnnotation | ChartPointAnnotation;

/** The x/y value scales an annotation resolves its values through. */
export interface AnnotationScales {
    /** The x-axis scale (value → pixel). Omit when the x axis is categorical. */
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    x?: Scale<any, number>;
    /** The y-axis scale (value → pixel). */
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    y?: Scale<any, number>;
}

/** The plot rectangle annotations are drawn within and clipped to. */
export interface AnnotationPlot {
    /** Left edge of the plot rectangle, in pixels. */
    x: number;
    /** Top edge of the plot rectangle, in pixels. */
    y: number;
    /** Width of the plot rectangle, in pixels. */
    width: number;
    /** Height of the plot rectangle, in pixels. */
    height: number;
}

const DEFAULT_COLOR = '#ef4444';
const DEFAULT_FONT = '11px sans-serif';

/**
 * Renders chart {@link ChartAnnotation}s — reference lines, shaded bands, and point markers — into
 * the plot area, resolving their values through the supplied axis scales. Annotations whose value
 * cannot be mapped (e.g. an `x` annotation against a categorical x axis) are skipped. The overlay is
 * redrawn each call, which is inexpensive for the handful of annotations a chart typically carries.
 */
export class ChartAnnotations extends ChartComponent {

    private _group?: Group;
    private _clip?: Rect;

    constructor(options: ChartComponentOptions) {
        super(options);
    }

    private _ensureGroup(): Group {
        if (!this._group) {
            this._group = createGroup({
                id: 'chart-annotations',
                class: 'chart-annotations',
                zIndex: 350,
            });

            this.scene.add(this._group);
        }

        return this._group;
    }

    /**
     * Draws (or redraws) the given annotations within the plot rectangle.
     *
     * @param annotations - The annotations to render.
     * @param scales - The x/y value scales used to position them.
     * @param plot - The plot rectangle they are drawn within.
     * @param clip - When `true`, mask the annotations to `plot` so they don't bleed past the plot
     *   edges while a navigator pans/zooms (which rescales the axes). Defaults to `false`.
     */
    public render(annotations: ChartAnnotation[], scales: AnnotationScales, plot: AnnotationPlot, clip = false): void {
        const group = this._ensureGroup();
        group.clear();

        if (clip) {
            // Re-establish the clip mask as the group's first child (clear() detached it): a
            // fill-less rect with `clip` set masks every later sibling to the plot rectangle — the
            // same sibling-mask the series/grid/axes use — so annotations stay inside the plot when
            // the navigator rescales the axes. Added only while clipping, so non-navigator rendering
            // is byte-identical.
            if (!this._clip) {
                this._clip = createRect({
                    id: 'chart-annotations__clip',
                    x: 0,
                    y: 0,
                    width: 0,
                    height: 0,
                    clip: false,
                    pointerEvents: 'none',
                    zIndex: Number.NEGATIVE_INFINITY,
                });
            }

            this._clip.x = plot.x;
            this._clip.y = plot.y;
            this._clip.width = plot.width;
            this._clip.height = plot.height;
            this._clip.clip = true;

            group.add(this._clip);
        }

        annotations.forEach((annotation, index) => {
            if (annotation.type === 'band') {
                this._renderBand(group, annotation, scales, plot, index);
                return;
            }

            if (annotation.type === 'point') {
                this._renderPoint(group, annotation, scales, index);
                return;
            }

            this._renderLine(group, annotation, scales, plot, index);
        });
    }

    private _renderLine(group: Group, annotation: ChartLineAnnotation, scales: AnnotationScales, plot: AnnotationPlot, index: number): void {
        const scale = annotation.axis === 'x' ? scales.x : scales.y;
        const position = scale?.(annotation.value);

        if (!typeIsNumber(position) || Number.isNaN(position)) {
            return;
        }

        const color = annotation.color ?? DEFAULT_COLOR;
        const vertical = annotation.axis === 'x';

        group.add(createLine({
            id: `annotation-line-${index}`,
            x1: vertical ? position : plot.x,
            y1: vertical ? plot.y : position,
            x2: vertical ? position : plot.x + plot.width,
            y2: vertical ? plot.y + plot.height : position,
            stroke: color,
            lineWidth: annotation.lineWidth ?? 1,
            lineDash: annotation.lineDash ?? [6, 4],
            pointerEvents: 'none',
        }));

        if (annotation.label) {
            group.add(createText({
                id: `annotation-line-label-${index}`,
                content: annotation.label,
                fill: color,
                font: DEFAULT_FONT,
                x: vertical ? position + 4 : plot.x + plot.width - 4,
                y: vertical ? plot.y + 4 : position - 4,
                textAlign: vertical ? 'left' : 'right',
                textBaseline: vertical ? 'top' : 'bottom',
                pointerEvents: 'none',
            }));
        }
    }

    private _renderBand(group: Group, annotation: ChartBandAnnotation, scales: AnnotationScales, plot: AnnotationPlot, index: number): void {
        const scale = annotation.axis === 'x' ? scales.x : scales.y;
        const fromPosition = scale?.(annotation.from);
        const toPosition = scale?.(annotation.to);

        if (!typeIsNumber(fromPosition) || !typeIsNumber(toPosition) || Number.isNaN(fromPosition) || Number.isNaN(toPosition)) {
            return;
        }

        const color = annotation.color ?? DEFAULT_COLOR;
        const start = Math.min(fromPosition, toPosition);
        const thickness = Math.abs(toPosition - fromPosition);
        const vertical = annotation.axis === 'x';

        group.add(createRect({
            id: `annotation-band-${index}`,
            x: vertical ? start : plot.x,
            y: vertical ? plot.y : start,
            width: vertical ? thickness : plot.width,
            height: vertical ? plot.height : thickness,
            fill: setColorAlpha(color, annotation.opacity ?? 0.12),
            pointerEvents: 'none',
        }));

        if (annotation.label) {
            group.add(createText({
                id: `annotation-band-label-${index}`,
                content: annotation.label,
                fill: color,
                font: DEFAULT_FONT,
                x: vertical ? start + thickness / 2 : plot.x + 4,
                y: vertical ? plot.y + 4 : start + 4,
                textAlign: vertical ? 'center' : 'left',
                textBaseline: 'top',
                pointerEvents: 'none',
            }));
        }
    }

    private _renderPoint(group: Group, annotation: ChartPointAnnotation, scales: AnnotationScales, index: number): void {
        const x = scales.x?.(annotation.x);
        const y = scales.y?.(annotation.y);

        if (!typeIsNumber(x) || !typeIsNumber(y) || Number.isNaN(x) || Number.isNaN(y)) {
            return;
        }

        const color = annotation.color ?? DEFAULT_COLOR;

        group.add(createCircle({
            id: `annotation-point-${index}`,
            cx: x,
            cy: y,
            radius: annotation.radius ?? 4,
            fill: color,
            pointerEvents: 'none',
        }));

        if (annotation.label) {
            group.add(createText({
                id: `annotation-point-label-${index}`,
                content: annotation.label,
                fill: color,
                font: DEFAULT_FONT,
                x: x + 6,
                y: y - 6,
                textAlign: 'left',
                textBaseline: 'bottom',
                pointerEvents: 'none',
            }));
        }
    }

    /** Removes the annotation elements from the scene. */
    public destroy(): void {
        this._group?.destroy();
        this._group = undefined;
        super.destroy();
    }

}

/** Factory function that creates a new {@link ChartAnnotations} component. */
export function createChartAnnotations(options: ChartComponentOptions): ChartAnnotations {
    return new ChartAnnotations(options);
}
