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
    exitElement,
} from '../core/animation';

import type {
    ChartAxisItemOptions,
    ChartYAxisItemOptions,
} from '../core/options';

import {
    formatTimeLabel,
    resolveFormatLabel,
} from '../core/options';

import {
    axisTickCount,
} from '../core/scales';

import {
    SPACING,
} from '../constants/spacing';

import type {
    Element,
    Group,
    Line,
    LineState,
    Rect,
    Renderer,
    Scale,
    Scene,
    Text,
    TextState,
} from '@ripl/core';

import {
    Box,
    createGroup,
    createLine,
    createRect,
    createText,
    degreesToRadians,
    easeOutCubic,
    scaleContinuous,
} from '@ripl/core';

import {
    arrayJoin,
    numberFormat,
    stringUniqueId,
    typeIsDate,
} from '@ripl/utilities';

/**
 * Gap (px) between the axis tick labels and the axis title. A full element step: the title is a
 * distinct piece of chart furniture, not part of the label band, and at a smaller gap the two read
 * as one cramped block.
 */
const TITLE_GAP = SPACING.md;

// Rotated x-axis labels anchor their trailing edge at the tick so the slanted text hangs clear of
// the plot; flat labels center under it.
function tickLabelAlignment(rotationRad: number): 'center' | 'left' | 'right' {
    if (rotationRad === 0) {
        return 'center';
    }

    return rotationRad < 0 ? 'right' : 'left';
}

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
    /** Color of the axis line and tick marks. */
    stroke?: string;
    /** CSS font shorthand for the tick labels. */
    labelFont?: string;
    /** Color of the tick labels. */
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

/** The tweenable geometry of a single tick: its mark and its label anchor. */
interface AxisTickState {
    /** Endpoints of the tick mark. */
    line: Pick<LineState, 'x1' | 'y1' | 'x2' | 'y2'>;
    /** The label's anchor, plus the transform origin any rotation pivots about. */
    label: Pick<TextState, 'x' | 'y'> & Partial<Pick<TextState, 'transformOriginX' | 'transformOriginY'>>;
}

/** Tick-label properties that must be assigned rather than interpolated. */
interface AxisLabelPaint {
    /** Horizontal alignment of the label against its anchor. */
    textAlign: NonNullable<TextState['textAlign']>;
    /** Vertical alignment of the label against its anchor. */
    textBaseline: NonNullable<TextState['textBaseline']>;
    /** Label rotation, in radians. */
    rotation: number;
}

/** Where an axis title's anchor sits, and how it is oriented. */
interface AxisTitlePosition {
    /** The x coordinate of the title's anchor. */
    x: number;
    /** The y coordinate of the title's anchor. */
    y: number;
    /** Title rotation, in radians. */
    rotation?: number;
    /** The x coordinate the rotation pivots about. */
    transformOriginX?: number;
    /** The y coordinate the rotation pivots about. */
    transformOriginY?: number;
    /** Vertical alignment of the title against its anchor. Defaults to `middle`. */
    textBaseline?: NonNullable<TextState['textBaseline']>;
}

/** Base axis component managing scale, ticks, labels, and an axis line. */
export class ChartAxis extends ChartComponent {

    /** Gap between the tick marks and their labels, in pixels. */
    public padding: number;
    /** Length of each tick mark, in pixels. */
    public tickSize: number;
    /** Color of the axis line and tick marks. */
    public stroke: string;
    /** Color of the tick labels. */
    public labelColor: string;
    /** Resolved animation applied when ticks and labels enter or update. */
    public animation: ResolvedAnimation;

    protected group: Group;
    protected line: Line;

    /**
     * Held as an instance field (rather than re-queried by id) so its id can be namespaced per axis
     * with the group id, because a colon in an id breaks a `#`-id selector.
     */
    protected _titleText?: Text;

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    private _scale: Scale<any, number>;
    // The scale the previous render drew with, used to seed entering ticks at the position their
    // value used to occupy. `undefined` marks the first render, which draws without movement.
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    private _previousScale?: Scale<any, number>;
    // Tick group id -> the raw tick value it was built from, so a leaving tick can still be mapped
    // through the new scale (its id only carries the stringified value).
    private _tickValues = new Map<string, unknown>();
    private _bounds: Box;
    private _tickCount: number;
    private _title?: string;
    private _titleFont: string;
    private _labelFont: string;
    private _labelRotation?: number;
    private _visible: boolean = true;
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    private _formatLabel?: (value: any) => string;

    private _labelDimension: LabelDimension;
    private _clip?: Rect;
    protected cachedTicks?: unknown[];

    /**
     * Scale mapping domain values to pixel positions along the axis. Assigning a scale invalidates
     * the cached tick set, so a measurement taken after the assignment reflects the new domain.
     */
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    public get scale(): Scale<any, number> {
        return this._scale;
    }

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    public set scale(value: Scale<any, number>) {
        this._scale = value;
        this.invalidate();
    }

    /**
     * Bounding box the axis is laid out within. Assign a new {@link Box} rather than mutating the
     * existing one: an in-place edit cannot invalidate the cached measurement, and it also silently
     * stales any box a caller has already read.
     */
    public get bounds(): Box {
        return this._bounds;
    }

    public set bounds(value: Box) {
        this._bounds = value;
        this.invalidate();
    }

    /** Target number of ticks to generate. */
    public get tickCount(): number {
        return this._tickCount;
    }

    public set tickCount(value: number) {
        this._tickCount = value;
        this.invalidate();
    }

    /** Optional axis title drawn alongside the ticks. */
    public get title(): string | undefined {
        return this._title;
    }

    public set title(value: string | undefined) {
        this._title = value;
        this.invalidate();
    }

    /** CSS font shorthand for the axis title. */
    public get titleFont(): string {
        return this._titleFont;
    }

    public set titleFont(value: string) {
        this._titleFont = value;
        this.invalidate();
    }

    /** CSS font shorthand for the tick labels. */
    public get labelFont(): string {
        return this._labelFont;
    }

    public set labelFont(value: string) {
        this._labelFont = value;
        this.invalidate();
    }

    /**
     * Tick label rotation in degrees; positive tilts labels counterclockwise. Consumed by the
     * x-axis; the label band and overflow handling account for the rotated extent.
     */
    public get labelRotation(): number | undefined {
        return this._labelRotation;
    }

    public set labelRotation(value: number | undefined) {
        this._labelRotation = value;
        this.invalidate();
    }

    /** Whether the axis renders and reserves layout space. */
    public get visible(): boolean {
        return this._visible;
    }

    public set visible(value: boolean) {
        this._visible = value;
        this.invalidate();
    }

    /** Formats a tick value into its label string. */
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    public get formatLabel(): ((value: any) => string) | undefined {
        return this._formatLabel;
    }

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    public set formatLabel(value: ((value: any) => string) | undefined) {
        this._formatLabel = value;
        this.invalidate();
    }

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
        const maxSize = this.measureTickFootprint(ticks);
        const tickRatio = rangeSize / (ticks.length * maxSize);
        const dropCount = Math.ceil(1 / tickRatio);
        const shouldDrop = tickRatio < 1;

        this.cachedTicks = ticks.filter((_, index) => !shouldDrop || index % dropCount === 0);
        return this.cachedTicks;
    }

    /**
     * The footprint one tick label occupies along the axis direction, used by the overflow-drop
     * logic. The x-axis overrides this to account for label rotation.
     */
    protected measureTickFootprint(ticks: unknown[]): number {
        return this.measureLabels(ticks, LABEL_DIMENSION_MAP[this._labelDimension]);
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
            padding = SPACING.sm,
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

        this._bounds = bounds;
        this._scale = scale;
        this._tickCount = tickCount;
        this._title = options.title;
        this._titleFont = options.titleFont ?? `bold ${labelFont}`;
        this._formatLabel = options.formatLabel;
        this._labelFont = labelFont;
        this._labelDimension = labelDimension;
        this.padding = padding;
        this.tickSize = tickSize;
        this.stroke = stroke;
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
        // ascent/descent isn't shaved at the plot/strip edge, pad the cross extent generously. The
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
        if (this.formatLabel) {
            return this.formatLabel(value);
        }

        if (typeIsDate(value)) {
            const domain = this.scale.domain;
            const spanMs = Math.abs(Number(domain[domain.length - 1]) - Number(domain[0]));

            return formatTimeLabel(value, spanMs);
        }

        return numberFormat(value, { precision: 2 });
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

    /**
     * Discards the cached tick set so the next measurement or render recomputes it. Called
     * automatically whenever an input the tick set depends on is assigned ({@link ChartAxis.scale},
     * {@link ChartAxis.bounds}, {@link ChartAxis.tickCount}, {@link ChartAxis.labelFont},
     * {@link ChartAxis.labelRotation}, {@link ChartAxis.formatLabel}, {@link ChartAxis.title},
     * {@link ChartAxis.titleFont}, {@link ChartAxis.visible}), so hosts rarely need it directly.
     */
    public invalidate(): void {
        this.cachedTicks = undefined;
    }

    /**
     * The thickness, in pixels, this axis needs for its tick marks, labels and title: the band it
     * reserves out of the plot. Concrete axes measure across their own direction (an x-axis returns
     * a height, a y-axis a width) and return `0` when hidden.
     *
     * Measured from the same cached tick set the next {@link ChartAxis.render} draws, so a layout
     * pass that measures and then renders without changing the axis cannot disagree with itself.
     */
    public measure(): number {
        return 0;
    }

    /** Returns the box the axis occupies (its assigned bounds). */
    public getBoundingBox(): Box {
        return this.bounds;
    }

    /** Whether transitions should animate, or land on their target state immediately. */
    protected get animated(): boolean {
        return this.animation.enabled && this.animation.duration > 0;
    }

    /** The id prefix namespacing this axis's tick groups. Overridden per concrete axis. */
    protected get tickPrefix(): string {
        return 'tick';
    }

    /**
     * The id of the tick group for `value`.
     *
     * Keyed by the raw tick value, not the display label: the label is not guaranteed unique or
     * stable and, in the SVG renderer, tick-group ids share a single global DOM cache with every
     * other element, so a formatted label colliding with a data element id (e.g. a candlestick group
     * keyed by the same date string) makes the two fight over one DOM node and the axis label
     * vanishes. Namespacing by the axis's own group id keeps the id unique per tick, per axis, and
     * clear of data ids.
     */
    protected tickId(value: unknown): string {
        return `${this.tickPrefix}:${this.group.id}:${value}`;
    }

    /**
     * Where a tick's mark and label sit for `value` under `scale`. Overridden per concrete axis; the
     * shared reconcile drives every enter/update/exit position through it, and passes the *previous*
     * scale to seed an entering tick at the position its value used to occupy.
     */
    // eslint-disable-next-line @typescript-eslint/no-explicit-any, @typescript-eslint/no-unused-vars
    protected tickState(value: unknown, scale: Scale<any, number>, boundingBox: Box): AxisTickState {
        return {
            line: {
                x1: 0,
                y1: 0,
                x2: 0,
                y2: 0,
            },
            label: {
                x: 0,
                y: 0,
            },
        };
    }

    /** The non-tweenable tick-label paint. Overridden per concrete axis. */
    protected tickLabelPaint(): AxisLabelPaint {
        return {
            textAlign: 'center',
            textBaseline: 'middle',
            rotation: 0,
        };
    }

    /** Every tweenable leaf inside a tick group: its mark and its label. */
    private _tickLeaves(group: Group): { line?: Line;
        label?: Text; } {
        return {
            line: group.query<Line>('line') ?? undefined,
            label: group.query<Text>('text') ?? undefined,
        };
    }

    /**
     * The state an entering tick starts from: the position its value occupied under the previous
     * scale, so a rescale reads as the labels sliding to their new places rather than one set fading
     * out while another fades in at different spots. Falls back to the target position on the first
     * render, or when the value does not map into the previous scale (a new category).
     */
    private _entryState(value: unknown, boundingBox: Box, target: AxisTickState): AxisTickState {
        if (!this._previousScale) {
            return target;
        }

        const seeded = this.tickState(value, this._previousScale, boundingBox);

        return Number.isFinite(seeded.label.x) && Number.isFinite(seeded.label.y)
            ? seeded
            : target;
    }

    /** Transitions `element` to `state`, or assigns it directly when animation is off. */
    private _transition(element: Element, state: Record<string, unknown>): Promise<unknown> {
        if (!this.animated) {
            Object.assign(element, state);
            return Promise.resolve();
        }

        return this.renderer.transition(element, {
            duration: this.animation.duration,
            ease: this.animation.ease,
            state: state as never,
        });
    }

    /**
     * Reconciles this axis's tick marks and labels against the current tick set, joined by tick
     * value so a tick that survives a rescale keeps its elements.
     *
     * - Entering ticks are created at their previous-scale position, transparent, and transition to
     *   their new position at full opacity.
     * - Surviving ticks transition to their new position.
     * - Leaving ticks slide toward where their value now maps and fade out before being destroyed.
     *
     * Non-tweenable properties (`content`, `textAlign`, `textBaseline`, `rotation`, paint) are
     * assigned directly — interpolating them would snap them mid-transition.
     *
     * @param boundingBox - The axis's band, which the tick geometry is measured from.
     * @returns Resolves once every tick transition has settled.
     */
    protected reconcileTicks(boundingBox: Box): Promise<unknown> {
        const ticks = this.ticks;
        const paint = this.tickLabelPaint();
        const groups = this.group.queryAll<Group>('.chart-axis__tick-group');

        const {
            left: entries,
            inner: updates,
            right: exits,
        } = arrayJoin(ticks, groups, (value, group) => group.id === this.tickId(value));

        const pending: Promise<unknown>[] = [
            ...this._exitTicks(exits, boundingBox),
            ...this._enterTicks(entries, boundingBox, paint),
            ...this._updateTicks(updates, boundingBox, paint),
        ];

        this._previousScale = this.scale;

        return Promise.all(pending);
    }

    /** Slides leaving ticks toward their new position while fading them out, then destroys them. */
    private _exitTicks(groups: Group[], boundingBox: Box): Promise<unknown>[] {
        return groups.map(group => {
            const value = this._tickValues.get(group.id);

            this._tickValues.delete(group.id);

            // Retag the group first so it can't collide with a re-entering tick of the same value
            // while it fades; the reconcile join and the SVG DOM cache both key on class and id.
            group.classList.delete('chart-axis__tick-group');
            group.id = `${group.id}:exit:${stringUniqueId()}`;

            if (!this.animated) {
                group.destroy();
                return Promise.resolve();
            }

            // Fade the leaves, not the group: a group carries no explicit opacity to interpolate
            // from, so a group-level fade would silently do nothing and then pop.
            const { line, label } = this._tickLeaves(group);
            const target = value === undefined ? undefined : this.tickState(value, this.scale, boundingBox);
            const slide = target && Number.isFinite(target.label.x) && Number.isFinite(target.label.y);

            return Promise.all([
                line && this._transition(line, {
                    opacity: 0,
                    ...(slide ? target.line : {}),
                }),
                label && this._transition(label, {
                    opacity: 0,
                    ...(slide ? target.label : {}),
                }),
            ]).then(() => group.destroy());
        });
    }

    /** Creates entering ticks at their seeded start state and transitions them into place. */
    private _enterTicks(values: unknown[], boundingBox: Box, paint: AxisLabelPaint): Promise<unknown>[] {
        const created = values.map(value => {
            const target = this.tickState(value, this.scale, boundingBox);
            const start = this._entryState(value, boundingBox, target);
            const id = this.tickId(value);

            this._tickValues.set(id, value);

            const group = createGroup({
                id,
                class: 'chart-axis__tick-group',
                zIndex: 1000,
                // An explicit opacity so a group-level fade has a value to interpolate from.
                opacity: 1,
                children: [
                    createText({
                        content: this.formatTickLabel(value),
                        ...start.label,
                        ...paint,
                        fill: this.labelColor,
                        font: this.labelFont,
                        opacity: 0,
                    }),
                    createLine({
                        ...start.line,
                        stroke: this.stroke,
                        opacity: 0,
                    }),
                ],
            });

            return {
                group,
                target,
            };
        });

        this.group.add(created.map(({ group }) => group));

        return created.flatMap(({ group, target }) => {
            const { line, label } = this._tickLeaves(group);

            return [
                line && this._transition(line, {
                    opacity: 1,
                    ...target.line,
                }),
                label && this._transition(label, {
                    opacity: 1,
                    ...target.label,
                }),
            ].filter(Boolean) as Promise<unknown>[];
        });
    }

    /** Transitions surviving ticks to their new position, restyling them in place. */
    private _updateTicks(pairs: [unknown, Group][], boundingBox: Box, paint: AxisLabelPaint): Promise<unknown>[] {
        return pairs.flatMap(([value, group]) => {
            const target = this.tickState(value, this.scale, boundingBox);
            const { line, label } = this._tickLeaves(group);

            this._tickValues.set(group.id, value);

            if (line) {
                line.stroke = this.stroke;
            }

            if (label) {
                // Non-tweenable: interpolating text content or its alignment snaps at t=0.5.
                label.content = this.formatTickLabel(value);
                label.textAlign = paint.textAlign;
                label.textBaseline = paint.textBaseline;
                label.rotation = paint.rotation;
                label.fill = this.labelColor;
                label.font = this.labelFont;
            }

            return [
                line && this._transition(line, target.line as unknown as Record<string, unknown>),
                label && this._transition(label, target.label as unknown as Record<string, unknown>),
            ].filter(Boolean) as Promise<unknown>[];
        });
    }

    /**
     * Moves the axis line to `state`, transitioning on an update and landing immediately on the
     * first render (an axis is drawn straight away, and only animates between states thereafter).
     */
    protected reconcileLine(state: Pick<LineState, 'x1' | 'y1' | 'x2' | 'y2'>): Promise<unknown> {
        this.line.stroke = this.stroke;

        if (!this._previousScale) {
            Object.assign(this.line, state);

            if (!this.animated) {
                this.line.opacity = 1;
                return Promise.resolve();
            }

            this.line.opacity = 0;

            return this._transition(this.line, { opacity: 1 });
        }

        return this._transition(this.line, state as unknown as Record<string, unknown>);
    }

    /**
     * Moves the axis title to `position`, transitioning on an update and fading it in on creation.
     * Removes the title (fading it out) when the axis no longer has one.
     *
     * @param position - Where the title's anchor sits, plus any rotation and transform origin.
     * @param id - The title element's id, namespaced per axis by the caller.
     */
    protected reconcileTitle(position: AxisTitlePosition, id: string): Promise<unknown> {
        if (!this.title) {
            const previous = this._titleText;

            this._titleText = undefined;

            return previous
                ? exitElement(this.renderer, previous, this.animation)
                : Promise.resolve();
        }

        if (!this._titleText) {
            this._titleText = createText({
                id,
                content: this.title,
                ...position,
                textAlign: 'center',
                textBaseline: position.textBaseline ?? 'middle',
                fill: this.labelColor,
                font: this.titleFont,
                opacity: this.animated ? 0 : 1,
            });

            this.group.add(this._titleText);

            return this._transition(this._titleText, { opacity: 1 });
        }

        // Non-tweenable: content, paint and rotation are assigned; only the anchor animates.
        this._titleText.content = this.title;
        this._titleText.fill = this.labelColor;
        this._titleText.font = this.titleFont;

        if (position.rotation !== undefined) {
            this._titleText.rotation = position.rotation;
        }

        return this._transition(this._titleText, position as unknown as Record<string, unknown>);
    }

    /** No-op base render; concrete axes ({@link ChartXAxis}/{@link ChartYAxis}) draw through their own render pass. */
    public render() {
        // No direct render pass: concrete axes draw through their tick/label
        // helpers, so the base component render is intentionally a no-op.
    }

    /**
     * Removes everything the axis has drawn — ticks, labels, the axis line and the title — fading it
     * out when animating. Charts call this instead of {@link ChartAxis.render} for an axis that should
     * not be drawn this pass, so that an axis which *was* drawn leaves the scene rather than lingering
     * at its last position. Safe to call on an axis that has never rendered.
     *
     * The axis is kept alive, not destroyed: the same instance renders again (entering from scratch)
     * as soon as it has something to draw.
     *
     * @returns Resolves once the exit transitions have settled.
     */
    public hide(): Promise<unknown> {
        const groups = this.group.queryAll<Group>('.chart-axis__tick-group');
        const title = this._titleText;

        // Coming back has to enter from scratch: there is no previous scale left to slide from, and
        // the recorded tick values no longer point at live elements.
        this._previousScale = undefined;
        this._tickValues.clear();
        this._titleText = undefined;
        this.invalidate();

        if (!this.animated) {
            groups.forEach(group => group.destroy());
            title?.destroy();
            this.line.opacity = 0;

            return Promise.resolve();
        }

        const exits = groups.map(group => {
            // Retag before fading so the group cannot collide with a tick that re-enters while it is
            // still on its way out (the reconcile join and the SVG DOM cache both key on class and id).
            group.classList.delete('chart-axis__tick-group');
            group.id = `${group.id}:exit:${stringUniqueId()}`;

            const { line, label } = this._tickLeaves(group);

            return Promise.all([
                line && this._transition(line, { opacity: 0 }),
                label && this._transition(label, { opacity: 0 }),
            ]).then(() => group.destroy());
        });

        return Promise.all([
            ...exits,
            title ? exitElement(this.renderer, title, this.animation) : Promise.resolve(),
            this._transition(this.line, { opacity: 0 }),
        ]);
    }

    /** Destroys the axis, removing its group (line, ticks, labels, and title) from the scene. */
    public destroy() {
        this.group.destroy();
        super.destroy();
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

    /** The canvas-space rotation applied to tick labels; degrees are authored counterclockwise-positive. */
    private get _labelRotationRad(): number {
        return this.labelRotation ? -degreesToRadians(this.labelRotation) : 0;
    }

    /** The vertical extent of one tick label, projecting the rotated text box when labels are rotated. */
    private get _labelBandHeight(): number {
        if (!this.labelRotation) {
            return this.maxLabelHeight;
        }

        const theta = degreesToRadians(this.labelRotation);

        return Math.abs(this.maxLabelWidth * Math.sin(theta)) + Math.abs(this.maxLabelHeight * Math.cos(theta));
    }

    /** Rotated labels occupy a narrower footprint along the axis, so fewer are dropped on overflow. */
    protected override measureTickFootprint(ticks: unknown[]): number {
        if (!this.labelRotation) {
            return super.measureTickFootprint(ticks);
        }

        const theta = degreesToRadians(this.labelRotation);
        const width = this.measureLabels(ticks, LABEL_DIMENSION_MAP.width);
        const height = this.measureLabels(ticks, LABEL_DIMENSION_MAP.height);

        return Math.abs(width * Math.cos(theta)) + Math.abs(height * Math.sin(theta));
    }

    /** The height the x-axis reserves above/below the plot, sized to fit its tick labels and title (zero when hidden). */
    public override measure(): number {
        // A hidden axis reserves no band so the plot can use the full area.
        if (!this.visible) {
            return 0;
        }

        return this._labelBandHeight
            + this.padding
            + this.tickSize
            + 1 // 1 for line width
            + this.titleBand;
    }

    /** Computes the band the x-axis reserves above/below the plot, sized to fit its tick labels and title (zero when hidden). */
    public getBoundingBox(): Box {
        const isBottomAligned = this.alignment === 'bottom';
        const clearance = this.measure();

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

    /** The tick-group id prefix for an x-axis. */
    protected override get tickPrefix(): string {
        return 'x-tick';
    }

    /** Tick marks drop from the axis line, with the label below them. */
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    protected override tickState(value: unknown, scale: Scale<any, number>, boundingBox: Box): AxisTickState {
        const x = scale(value);
        const labelY = boundingBox.top + this.padding + this.tickSize + 1;

        return {
            line: {
                x1: x,
                y1: boundingBox.top,
                x2: x,
                y2: boundingBox.top + this.tickSize,
            },
            label: {
                x,
                y: labelY,
                transformOriginX: x,
                transformOriginY: labelY,
            },
        };
    }

    protected override tickLabelPaint(): AxisLabelPaint {
        const rotation = this._labelRotationRad;

        return {
            textAlign: tickLabelAlignment(rotation),
            textBaseline: rotation === 0 ? 'top' : 'middle',
            rotation,
        };
    }

    /** Renders the x-axis line, tick marks, labels, and title, animating against the previous render. */
    public async render() {
        const boundingBox = this.getBoundingBox();

        // The title sits in its own band below the tick labels, anchored to the band's outer edge.
        const title = this.reconcileTitle({
            x: (boundingBox.left + boundingBox.right) / 2,
            y: boundingBox.bottom,
            textBaseline: 'bottom',
        }, `chart-axis__x-title:${this.group.id}`);

        const line = this.reconcileLine({
            x1: boundingBox.left,
            y1: boundingBox.top,
            x2: boundingBox.right,
            y2: boundingBox.top,
        });

        return Promise.all([
            line,
            this.reconcileTicks(boundingBox),
            title,
        ]);
    }

}

/** Vertical (y) axis component with left/right alignment. */
export class ChartYAxis extends ChartAxis {

    /** Which edge the axis sits on (`left` or `right`). */
    public alignment: ChartYAxisAlignment;
    /**
     * Pixels this axis is shifted outward from its aligned chart edge (a left axis toward the chart's
     * left edge, a right axis toward its right edge). Internal/auto-computed by the multi-axis layout
     * to stack additional same-side axes clear of one another; `0` (the default) leaves the axis at its
     * bounds edge.
     */
    public offset: number = 0;

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

    /** The width the y-axis reserves left/right of the plot, sized to fit its tick labels and title (zero when hidden). */
    public override measure(): number {
        // A hidden axis reserves no band so the plot can use the full area.
        if (!this.visible) {
            return 0;
        }

        return this.maxLabelWidth
            + this.padding
            + this.tickSize
            + 1 // 1 for line width
            + this.titleBand;
    }

    /** Computes the band the y-axis reserves left/right of the plot, sized to fit its tick labels and title (zero when hidden), shifted outward by {@link ChartYAxis.offset}. */
    public getBoundingBox(): Box {
        const isLeftAligned = this.alignment === 'left';
        const clearance = this.measure();

        const {
            top,
            left,
            bottom,
            right,
        } = this.bounds;

        // The offset shifts the whole band outward (left axes leftward, right axes rightward), so a
        // second, third, … same-side axis stacks clear of the one nearer the plot. Zero (single-axis
        // and every current chart) leaves the band exactly at its bounds edge.
        return new Box(
            top,
            isLeftAligned ? left - this.offset : right - clearance + this.offset,
            bottom,
            isLeftAligned ? left + clearance - this.offset : right + this.offset
        );
    }

    /** The tick-group id prefix for a y-axis. */
    protected override get tickPrefix(): string {
        return 'y-tick';
    }

    /**
     * Tick marks project away from the plot and the label sits beyond them. A left axis draws off its
     * band's plot-facing (right) edge with ticks pointing left; a right axis mirrors that, so both
     * sit between the plot and their own labels.
     */
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    protected override tickState(value: unknown, scale: Scale<any, number>, boundingBox: Box): AxisTickState {
        const isLeft = this.alignment === 'left';
        const y = scale(value);
        const lineX = isLeft ? boundingBox.right : boundingBox.left;
        const tickEndX = isLeft ? lineX - this.tickSize : lineX + this.tickSize;
        const labelX = isLeft
            ? lineX - this.padding - this.tickSize - 1
            : lineX + this.padding + this.tickSize + 1;

        return {
            line: {
                x1: lineX,
                y1: y,
                x2: tickEndX,
                y2: y,
            },
            label: {
                x: labelX,
                y,
            },
        };
    }

    protected override tickLabelPaint(): AxisLabelPaint {
        return {
            textAlign: this.alignment === 'left' ? 'right' : 'left',
            textBaseline: 'middle',
            rotation: 0,
        };
    }

    /** Renders the y-axis line, tick marks, labels, and title, animating against the previous render. */
    public async render() {
        const boundingBox = this.getBoundingBox();
        const isLeft = this.alignment === 'left';
        const lineX = isLeft ? boundingBox.right : boundingBox.left;

        // Anchor the rotated title to the outer edge of its band (not centered) so the full
        // TITLE_GAP sits between the title and the tick labels, matching the x-axis, without
        // widening the reserved band, so the plot margins are unchanged.
        const titleThickness = this.titleBand - TITLE_GAP;
        const titleX = isLeft
            ? boundingBox.left + titleThickness / 2
            : boundingBox.right - titleThickness / 2;
        const titleY = (boundingBox.top + boundingBox.bottom) / 2;

        const title = this.reconcileTitle({
            x: titleX,
            y: titleY,
            rotation: isLeft ? -Math.PI / 2 : Math.PI / 2,
            transformOriginX: titleX,
            transformOriginY: titleY,
        }, `chart-axis__y-title:${this.group.id}`);

        const line = this.reconcileLine({
            x1: lineX,
            y1: boundingBox.top,
            x2: lineX,
            y2: boundingBox.bottom,
        });

        return Promise.all([
            line,
            this.reconcileTicks(boundingBox),
            title,
        ]);
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
