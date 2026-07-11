import type {
    ChartComponentOptions,
} from './_base';
import {
    ChartComponent,
} from './_base';

import {
    formatNumber,
} from '../core/options';

import type {
    ResolvedAnimation,
} from '../core/animation';
import {
    ANIMATION_REFERENCE,
} from '../core/animation';

import type {
    Element,
    Group,
    Line,
    Scale,
    Text,
} from '@ripl/core';
import {
    Box,
    createGroup,
    createLine,
    createText,
    easeOutCubic,
} from '@ripl/core';

import {
    arrayJoin,
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
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    scale: Scale<any, number>;
    bounds: Box;
    padding?: number;
    tickCount?: number;
    tickSize?: number;
    maxWidth?: number;
    maxHeight?: number;
    gridLines?: boolean;
    labelDimension: LabelDimension;
    title?: string;
    titleFont?: string;
    stroke?: string;
    labelFont?: string;
    labelColor?: string;
    animation?: ResolvedAnimation;
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    formatLabel?: (value: any) => string;
}

/** Options for an x-axis, omitting label dimension (always width). */
export interface ChartXAxisOptions extends Omit<ChartAxisOptions, 'labelDimension'> {
    alignment?: ChartXAxisAlignment;
    title?: string;
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    formatLabel?: (value: any) => string;
}

/** Options for a y-axis, omitting label dimension (always height). */
export interface ChartYAxisOptions extends Omit<ChartAxisOptions, 'labelDimension'> {
    alignment?: ChartYAxisAlignment;
    title?: string;
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    formatLabel?: (value: any) => string;
}

const LABEL_DIMENSION_MAP = {
    width: metrics => metrics.actualBoundingBoxLeft + metrics.actualBoundingBoxRight,
    height: metrics => metrics.actualBoundingBoxAscent + metrics.actualBoundingBoxDescent,
} as Record<LabelDimension, (metrics: TextMetrics) => number>;

/** Base axis component managing scale, ticks, labels, and an axis line. */
export class ChartAxis extends ChartComponent {

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    public scale: Scale<any, number>;
    public bounds: Box;
    public padding: number;
    public tickSize: number;
    public tickCount: number;
    public title?: string;
    public titleFont: string;
    public stroke: string;
    public labelFont: string;
    public labelColor: string;
    public animation: ResolvedAnimation;
    public visible: boolean = true;
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    public formatLabel?: (value: any) => string;

    protected group: Group;
    protected line: Line;

    private labelDimension: LabelDimension;
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
        const maxSize = this.measureLabels(ticks, LABEL_DIMENSION_MAP[this.labelDimension]);
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
        this.labelDimension = labelDimension;
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

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    protected measureLabels(values: any[], producer: (metrics: TextMetrics) => number) {
        return values.reduce((output, value) => {
            const label = this.formatLabel ? this.formatLabel(value) : formatNumber(value);
            const metrics = this.context.measureText(label, this.labelFont);
            return Math.max(output, producer(metrics));
        }, 0);
    }

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    protected formatTickLabel(value: any): string {
        return this.formatLabel ? this.formatLabel(value) : formatNumber(value);
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

    public render() {

    }

}

/** Horizontal (x) axis component with top/bottom alignment. */
export class ChartXAxis extends ChartAxis {

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
