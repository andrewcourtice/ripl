import type {
    ChartComponentOptions,
} from './_base';

import {
    ChartComponent,
} from './_base';

import type {
    ResolvedAnimation,
} from '../core/animation';

import {
    ANIMATION_REFERENCE,
} from '../core/animation';

import type {
    ChartAxisItemOptions,
    ChartYAxisItemOptions,
} from '../core/options';

import {
    resolveFormatLabel,
} from '../core/options';

import {
    axisTickCount,
} from '../core/scales';

import type {
    Element,
    Group,
    Line,
    Rect,
    Renderer,
    Scale,
    Scene,
    Text,
} from '@ripl/core';

import {
    Box,
    createGroup,
    createLine,
    createRect,
    createText,
    easeOutCubic,
    scaleContinuous,
} from '@ripl/core';

import {
    arrayJoin,
    numberFormat,
} from '@ripl/utilities';

/** Gap (px) between axis tick labels and the axis title. */
const TITLE_GAP = 6;

/** Fallback animation used when an axis is not given one by its host chart. */
const DEFAULT_AXIS_ANIMATION: ResolvedAnimation = {
    enabled: true,
    duration: ANIMATION_REFERENCE.axis,
    ease: easeOutCubic,
};

/** Horizontal axis alignment within the chart area. */
export type ChartXAxisAlignment = 'top' | 'bottom';

/** Vertical axis alignment within the chart area. */
export type ChartYAxisAlignment = 'left' | 'right';

/** Dimension used for measuring tick label overflow. */
export type LabelDimension = 'width' | 'height';

/** Options for constructing a chart axis component. */
export interface ChartAxisOptions extends ChartComponentOptions {
    /** Scale mapping domain values to pixel positions along the axis. */
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    scale: Scale<any, number>;
    /** Bounding box the axis is laid out within. */
    bounds: Box;
    /** Gap between the tick marks and their labels, in pixels. */
    padding?: number;
    /** Target number of ticks to generate. */
    tickCount?: number;
    /** Length of each tick mark, in pixels. */
    tickSize?: number;
    /** Maximum width the axis may occupy, in pixels. */
    maxWidth?: number;
    /** Maximum height the axis may occupy, in pixels. */
    maxHeight?: number;
    /** Whether the axis emits grid lines at its tick positions. */
    gridLines?: boolean;
    /** Which dimension (width or height) tick-label overflow is measured against. */
    labelDimension: LabelDimension;
    /** Optional axis title. */
    title?: string;
    /** CSS font shorthand for the axis title (defaults to a bold variant of the label font). */
    titleFont?: string;
    /** Colour of the axis line and tick marks. */
    stroke?: string;
    /** CSS font shorthand for the tick labels. */
    labelFont?: string;
    /** Colour of the tick labels. */
    labelColor?: string;
    /** Resolved animation used when tick labels and lines enter or update. */
    animation?: ResolvedAnimation;
    /** Formats a tick value into its label string. */
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    formatLabel?: (value: any) => string;
}

/** Options for an x-axis, omitting label dimension (always width). */
export interface ChartXAxisOptions extends Omit<ChartAxisOptions, 'labelDimension'> {
    /** Which edge the axis sits on (`top` or `bottom`). Defaults to `bottom`. */
    alignment?: ChartXAxisAlignment;
    /** Optional axis title. */
    title?: string;
    /** Formats a tick value into its label string. */
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    formatLabel?: (value: any) => string;
}

/** Options for a y-axis, omitting label dimension (always height). */
export interface ChartYAxisOptions extends Omit<ChartAxisOptions, 'labelDimension'> {
    /** Which edge the axis sits on (`left` or `right`). Defaults to `left`. */
    alignment?: ChartYAxisAlignment;
    /** Optional axis title. */
    title?: string;
    /** Formats a tick value into its label string. */
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    formatLabel?: (value: any) => string;
}

const LABEL_DIMENSION_MAP = {
    width: metrics => metrics.actualBoundingBoxLeft + metrics.actualBoundingBoxRight,
    height: metrics => metrics.actualBoundingBoxAscent + metrics.actualBoundingBoxDescent,
} as Record<LabelDimension, (metrics: TextMetrics) => number>;

/** Base axis component managing scale, ticks, labels, and an axis line. */
export class ChartAxis extends ChartComponent {

    /** Scale mapping domain values to pixel positions along the axis. */
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    public scale: Scale<any, number>;
    /** Bounding box the axis is laid out within. */
    public bounds: Box;
    /** Gap between the tick marks and their labels, in pixels. */
    public padding: number;
    /** Length of each tick mark, in pixels. */
    public tickSize: number;
    /** Target number of ticks to generate. */
    public tickCount: number;
    /** Optional axis title drawn alongside the ticks. */
    public title?: string;
    /** CSS font shorthand for the axis title. */
    public titleFont: string;
    /** Colour of the axis line and tick marks. */
    public stroke: string;
    /** CSS font shorthand for the tick labels. */
    public labelFont: string;
    /** Colour of the tick labels. */
    public labelColor: string;
    /** Resolved animation applied when ticks and labels enter or update. */
    public animation: ResolvedAnimation;
    /** Whether the axis renders and reserves layout space. */
    public visible: boolean = true;
    /** Formats a tick value into its label string. */
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    public formatLabel?: (value: any) => string;

    protected group: Group;
    protected line: Line;

    private _labelDimension: LabelDimension;
    private _clip?: Rect;
    protected cachedTicks?: unknown[];

    protected get ticks() {
        if (this.cachedTicks) {
            return this.cachedTicks;
        }

        const ticks = this.scale.ticks(this.tickCount);

        const [
            rangeMin,
            rangeMax,
        ] = this.scale.range;

        const rangeSize = Math.abs(rangeMax - rangeMin);
        const maxSize = this.measureLabels(ticks, LABEL_DIMENSION_MAP[this._labelDimension]);
        const tickRatio = rangeSize / (ticks.length * maxSize);
        const dropCount = Math.ceil(1 / tickRatio);
        const shouldDrop = tickRatio < 1;

        this.cachedTicks = ticks.filter((_, index) => !shouldDrop || index % dropCount === 0);
        return this.cachedTicks;
    }

    protected get maxLabelWidth() {
        return this.measureLabels(this.ticks, LABEL_DIMENSION_MAP.width);
    }

    protected get maxLabelHeight() {
        return this.measureLabels(this.ticks, LABEL_DIMENSION_MAP.height);
    }

    constructor(options: ChartAxisOptions) {
        const {
            scene,
            renderer,
            scale,
            bounds,
            labelDimension,
            padding = 8,
            tickSize = 5,
            tickCount = 10,
            stroke = '#777777',
            labelFont = '12px sans-serif',
            labelColor = '#777777',
        } = options;

        super({
            scene,
            renderer,
        });

        this.bounds = bounds;
        this.scale = scale;
        this.padding = padding;
        this.tickSize = tickSize;
        this.tickCount = tickCount;
        this._labelDimension = labelDimension;
        this.title = options.title;
        this.titleFont = options.titleFont ?? `bold ${labelFont}`;
        this.formatLabel = options.formatLabel;
        this.stroke = stroke;
        this.labelFont = labelFont;
        this.labelColor = labelColor;
        this.animation = options.animation ?? DEFAULT_AXIS_ANIMATION;

        // The axis line is kept as a direct reference (rather than re-queried each render) but still
        // lives inside the axis group alongside the tick groups and title text.
        this.line = createLine({
            class: 'chart-axis__line',
            stroke: this.stroke,
            x1: 0,
            y1: 0,
            x2: 0,
            y2: 0,
        });

        this.group = createGroup({
            class: 'chart-axis',
            children: [
                this.line,
            ],
        });

        scene.add(this.group);
    }

    /**
     * Clips this axis's ticks, labels, and line to the plot's along-axis extent (the plot span
     * on the axis's own direction × its reserved band), enabling the clip only while `enabled`.
     * Mirrors the plot-content clip: with no navigator the clip stays inert, so tick labels that
     * legitimately overhang the plot edge render in full. Called by the host chart per render.
     *
     * @param area - The current plot rectangle.
     * @param enabled - Whether the clip should mask (typically `true` only while navigating).
     */
    public clipTo(area: { x: number;
        y: number;
        width: number;
        height: number; }, enabled: boolean): void {
        if (!this._clip) {
            this._clip = createRect({
                x: 0,
                y: 0,
                width: 0,
                height: 0,
                clip: false,
                pointerEvents: 'none',
                zIndex: Number.NEGATIVE_INFINITY,
            });

            this.group.add(this._clip);
        }

        const band = this.getBoundingBox();
        // The x-axis measures labels by width; it slides horizontally, so clip its horizontal span to
        // the plot. Across the axis (its label thickness) it needs breathing room so a label's
        // ascent/descent isn't shaved at the plot/strip edge — pad the cross extent generously. The
        // y-axis is the mirror image.
        const horizontal = this._labelDimension === 'width';
        const crossPad = 20;

        this._clip.x = horizontal ? area.x : band.left - crossPad;
        this._clip.y = horizontal ? band.top - crossPad : area.y;
        this._clip.width = horizontal ? area.width : band.width + crossPad * 2;
        this._clip.height = horizontal ? band.height + crossPad * 2 : area.height;
        this._clip.clip = enabled;
    }

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    protected measureLabels(values: any[], producer: (metrics: TextMetrics) => number) {
        return values.reduce((output, value) => {
            const label = this.formatLabel ? this.formatLabel(value) : numberFormat(value, { precision: 2 });
            const metrics = this.context.measureText(label, this.labelFont);
            return Math.max(output, producer(metrics));
        }, 0);
    }

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    protected formatTickLabel(value: any): string {
        return this.formatLabel ? this.formatLabel(value) : numberFormat(value, { precision: 2 });
    }

    /** The thickness reserved for the axis title (0 when there is no title). */
    protected get titleBand(): number {
        if (!this.title) {
            return 0;
        }

        const metrics = this.context.measureText(this.title, this.titleFont);
        const titleHeight = metrics.actualBoundingBoxAscent + metrics.actualBoundingBoxDescent;

        return titleHeight + TITLE_GAP;
    }

    /** Returns the box the axis occupies (its assigned bounds). */
    public getBoundingBox(): Box {
        return this.bounds;
    }

    /** Fades in newly-entered tick labels and lines using the chart's resolved animation. */
    protected animateEntries(elements: Element[]) {
        if (elements.length === 0) {
            return;
        }

        if (!this.animation.enabled || this.animation.duration <= 0) {
            elements.forEach(element => Object.assign(element, element.data ?? {}));
            return;
        }

        this.renderer.transition(elements, element => ({
            duration: this.animation.duration,
            ease: this.animation.ease,
            state: (element.data ?? {}) as Record<string, unknown>,
        }));
    }

    /** No-op base render; concrete axes ({@link ChartXAxis}/{@link ChartYAxis}) draw through their own render pass. */
    public render() {
        // No direct render pass: concrete axes draw through their tick/label
        // helpers, so the base component render is intentionally a no-op.
    }

}

/** Horizontal (x) axis component with top/bottom alignment. */
export class ChartXAxis extends ChartAxis {

    /** Which edge the axis sits on (`top` or `bottom`). */
    public alignment: ChartXAxisAlignment;

    constructor(options: ChartXAxisOptions) {
        const {
            alignment = 'bottom',
        } = options;

        super({
            ...options,
            labelDimension: 'width',
        });

        this.alignment = alignment;
    }

    /** Computes the band the x-axis reserves above/below the plot, sized to fit its tick labels and title (zero when hidden). */
    public getBoundingBox(): Box {
        const isBottomAligned = this.alignment === 'bottom';
        // A hidden axis reserves no band so the plot can use the full area.
        const clearance = this.visible
            ? this.maxLabelHeight
                + this.padding
                + this.tickSize
                + 1 // 1 for line width
                + this.titleBand
            : 0;

        const {
            top,
            left,
            bottom,
            right,
        } = this.bounds;

        return new Box(
            isBottomAligned ? bottom - clearance : top,
            left,
            isBottomAligned ? bottom : top + clearance,
            right
        );
    }

    /** Renders the x-axis line, tick marks, and labels, reconciling and animating against the previous render. */
    public async render() {
        this.cachedTicks = undefined;
        const ticks = this.ticks;
        const boundingBox = this.getBoundingBox();

        this.line.x1 = boundingBox.left;
        this.line.y1 = boundingBox.top;
        this.line.x2 = boundingBox.right;
        this.line.y2 = boundingBox.top;

        const groups = this.group.queryAll<Group>('.chart-axis__tick-group');

        const {
            left: groupEntries,
            inner: groupUpdates,
            right: groupExits,
        } = arrayJoin(ticks, groups, (value, group) => group.id === `x-tick:${value}`);

        const labelEntryTexts = groupEntries.map(value => {
            const x = this.scale(value);
            const label = this.formatTickLabel(value);

            return createGroup({
                // Key by the raw tick value (namespaced), not the display label: the label is not
                // guaranteed unique/stable and, in the SVG renderer, tick-group ids share a single
                // global DOM cache with every other element — so a formatted label colliding with a
                // data element id (e.g. a candlestick group keyed by the same date string) makes the
                // two fight over one DOM node and the axis label vanishes. A value-namespaced id is
                // unique per tick and can't collide with data ids.
                id: `x-tick:${value}`,
                class: 'chart-axis__tick-group',
                zIndex: 1000,
                children: [
                    createText({
                        content: label,
                        x,
                        y: boundingBox.top + this.padding + this.tickSize + 1,
                        textAlign: 'center',
                        textBaseline: 'top',
                        fill: this.labelColor,
                        font: this.labelFont,
                        opacity: 0,
                        data: { opacity: 1 },
                    }),
                    createLine({
                        x1: x,
                        y1: boundingBox.top,
                        x2: x,
                        y2: boundingBox.top + this.tickSize,
                        stroke: this.stroke,
                        opacity: 0,
                        data: { opacity: 1 },
                    }),
                ],
            });
        });

        this.group.add(labelEntryTexts);
        this.group.remove(groupExits);

        // Animate entries
        const entryElements = labelEntryTexts.flatMap(g => [...g.getElementsByType('text'), ...g.getElementsByType('line')]);

        this.animateEntries(entryElements);

        groupUpdates.forEach(([value, group]) => {
            const line = group.query<Line>('line');
            const label = group.query<Text>('text');
            const x = this.scale(value);

            if (line) {
                line.x1 = x;
                line.y1 = boundingBox.top;
                line.x2 = x;
                line.y2 = boundingBox.top + this.tickSize;
            }

            if (label) {
                label.content = this.formatTickLabel(value);
                label.x = x;
                label.y = boundingBox.top + this.padding + this.tickSize + 1;
            }
        });

        // Render title in its own band below the tick labels.
        if (this.title) {
            const titleId = 'chart-axis__x-title';
            const titleX = (boundingBox.left + boundingBox.right) / 2;
            const titleY = boundingBox.bottom;
            let titleText = this.group.query<Text>(`#${titleId}`);

            if (!titleText) {
                titleText = createText({
                    id: titleId,
                    content: this.title,
                    x: titleX,
                    y: titleY,
                    textAlign: 'center',
                    textBaseline: 'bottom',
                    fill: this.labelColor,
                    font: this.titleFont,
                });

                this.group.add(titleText);
            } else {
                titleText.content = this.title;
                titleText.x = titleX;
                titleText.y = titleY;
            }
        }

        return Promise.resolve();
    }

}

/** Vertical (y) axis component with left/right alignment. */
export class ChartYAxis extends ChartAxis {

    /** Which edge the axis sits on (`left` or `right`). */
    public alignment: ChartYAxisAlignment;

    constructor(options: ChartYAxisOptions) {
        const {
            alignment = 'left',
        } = options;

        super({
            ...options,
            labelDimension: 'height',
        });

        this.alignment = alignment;
    }

    /** Computes the band the y-axis reserves left/right of the plot, sized to fit its tick labels and title (zero when hidden). */
    public getBoundingBox(): Box {
        const isLeftAligned = this.alignment === 'left';
        // A hidden axis reserves no band so the plot can use the full area.
        const clearance = this.visible
            ? this.maxLabelWidth
                + this.padding
                + this.tickSize
                + 1 // 1 for line width
                + this.titleBand
            : 0;

        const {
            top,
            left,
            bottom,
            right,
        } = this.bounds;

        return new Box(
            top,
            isLeftAligned ? left : right - clearance,
            bottom,
            isLeftAligned ? left + clearance : right
        );
    }

    /** Renders the y-axis line, tick marks, and labels, reconciling and animating against the previous render. */
    public async render() {
        this.cachedTicks = undefined;
        const ticks = this.ticks;
        const boundingBox = this.getBoundingBox();

        this.line.x1 = boundingBox.right;
        this.line.x2 = boundingBox.right;
        this.line.y1 = boundingBox.top;
        this.line.y2 = boundingBox.bottom;

        const groups = this.group.queryAll<Group>('.chart-axis__tick-group');

        const {
            left: groupEntries,
            inner: groupUpdates,
            right: groupExits,
        } = arrayJoin(ticks, groups, (value, group) => group.id === `y-tick:${value}`);

        const labelEntryTexts = groupEntries.map(value => {
            const y = this.scale(value);
            const label = this.formatTickLabel(value);

            return createGroup({
                // See the x-axis note: key by the namespaced raw tick value, not the display label,
                // so ids stay unique/stable and can't collide with data element ids in the SVG cache.
                id: `y-tick:${value}`,
                class: 'chart-axis__tick-group',
                zIndex: 1000,
                children: [
                    createText({
                        content: label,
                        x: boundingBox.right - this.padding - this.tickSize - 1,
                        y,
                        textAlign: 'right',
                        textBaseline: 'middle',
                        fill: this.labelColor,
                        font: this.labelFont,
                        opacity: 0,
                        data: { opacity: 1 },
                    }),
                    createLine({
                        x1: boundingBox.right,
                        y1: y,
                        x2: boundingBox.right - this.tickSize,
                        y2: y,
                        stroke: this.stroke,
                        opacity: 0,
                        data: { opacity: 1 },
                    }),
                ],
            });
        });

        this.group.add(labelEntryTexts);
        this.group.remove(groupExits);

        // Animate entries
        const entryElements = labelEntryTexts.flatMap(g => [...g.getElementsByType('text'), ...g.getElementsByType('line')]);

        this.animateEntries(entryElements);

        groupUpdates.forEach(([value, group]) => {
            const line = group.query<Line>('line');
            const label = group.query<Text>('text');
            const y = this.scale(value);

            if (line) {
                line.y1 = y;
                line.y2 = y;
            }

            if (label) {
                label.content = this.formatTickLabel(value);
                label.y = y;
            }
        });

        // Render the title rotated vertically in its own band at the far edge of the axis,
        // outside the tick labels so the two never overlap or clip.
        if (this.title) {
            const isLeftAligned = this.alignment === 'left';
            const titleId = 'chart-axis__y-title';
            const titleX = isLeftAligned
                ? boundingBox.left + this.titleBand / 2
                : boundingBox.right - this.titleBand / 2;
            const titleY = (boundingBox.top + boundingBox.bottom) / 2;
            const rotation = isLeftAligned ? -Math.PI / 2 : Math.PI / 2;

            let titleText = this.group.query<Text>(`#${titleId}`);

            if (!titleText) {
                titleText = createText({
                    id: titleId,
                    content: this.title,
                    x: titleX,
                    y: titleY,
                    textAlign: 'center',
                    textBaseline: 'middle',
                    fill: this.labelColor,
                    font: this.titleFont,
                    rotation,
                    transformOriginX: titleX,
                    transformOriginY: titleY,
                });

                this.group.add(titleText);
            } else {
                titleText.content = this.title;
                titleText.x = titleX;
                titleText.y = titleY;
                titleText.rotation = rotation;
                titleText.transformOriginX = titleX;
                titleText.transformOriginY = titleY;
            }
        }

        return Promise.resolve();
    }

}

/**
 * Builds an x/y axis pair from resolved axis options, wiring styling, tick formatter, tick count,
 * and alignment. Charts that render their own axes (rather than extending `CartesianChart`) share
 * this so the axis construction lives in one place.
 *
 * @param options - Scene/renderer plus the resolved x and y axis options and optional alignments.
 * @returns The constructed {@link ChartXAxis} and {@link ChartYAxis}.
 */
export function createChartAxes(options: {
    /** Scene the axes render into. */
    scene: Scene;
    /** Renderer driving the axes' animations. */
    renderer: Renderer;
    /** Resolved x-axis options. */
    xAxis: ChartAxisItemOptions;
    /** Resolved y-axis options. */
    yAxis: ChartYAxisItemOptions;
    /** X-axis edge (defaults to the {@link ChartXAxis} default). */
    xAlignment?: ChartXAxisAlignment;
    /** Y-axis edge (defaults to the y option's `position`). */
    yAlignment?: ChartYAxisAlignment;
}): { xAxis: ChartXAxis;
    yAxis: ChartYAxis; } {
    const {
        scene,
        renderer,
        xAxis,
        yAxis,
        xAlignment,
        yAlignment,
    } = options;

    const x = new ChartXAxis({
        scene,
        renderer,
        bounds: Box.empty(),
        scale: scaleContinuous([0, 1], [0, 1]),
        alignment: xAlignment,
        labelFont: xAxis.font,
        labelColor: xAxis.fontColor,
        formatLabel: resolveFormatLabel(xAxis.format),
        title: xAxis.title,
    });

    x.visible = xAxis.visible;
    x.tickCount = axisTickCount(xAxis);

    const y = new ChartYAxis({
        scene,
        renderer,
        bounds: Box.empty(),
        scale: scaleContinuous([0, 1], [0, 1]),
        alignment: yAlignment ?? (yAxis.position === 'right' ? 'right' : 'left'),
        labelFont: yAxis.font,
        labelColor: yAxis.fontColor,
        formatLabel: resolveFormatLabel(yAxis.format),
        title: yAxis.title,
    });

    y.visible = yAxis.visible;
    y.tickCount = axisTickCount(yAxis);

    return {
        xAxis: x,
        yAxis: y,
    };
}
