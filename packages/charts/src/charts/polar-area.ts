import type {
    NumericAccessor,
} from '../core/data';

import type {
    BaseChartOptions,
} from '../core/chart';

import {
    Chart,
} from '../core/chart';

import {
    areaCenter,
} from '../core/layout';

import type {
    ChartLegendInput,
    ChartSegmentLabelsInput,
    ValueFormatInput,
} from '../core/options';

import {
    normalizeSegmentLabels,
    resolveSegmentPadWidth,
    resolveValueFormat,
} from '../core/options';

import {
    createSegmentLabel,
    resolveSegmentLabelLayout,
} from '../core/labels';

import {
    applySegmentInteraction,
    arcCentroidAnchor,
} from '../core/interaction';

import {
    resolveAccessor,
} from '../core/data';

import {
    resolveColorBy,
} from '../core/color';

import {
    ANIMATION_REFERENCE,
} from '../core/animation';

import {
    Tooltip,
} from '../components/tooltip';

import type {
    LegendItem,
} from '../components/legend';

import type {
    Arc,
    ArcState,
    BaseElementState,
    Circle,
    CircleState,
    Context,
    EventMap,
    Group,
    Line,
    LineState,
    Polyline,
    PolylineState,
    Text,
    TextState,
} from '@ripl/core';

import {
    createArc,
    createCircle,
    createGroup,
    createLine,
    createPolyline,
    createText,
    easeOutQuint,
    elementIsArc,
    getThetaPoint,
    scaleRadial,
    setColorAlpha,
    TAU,
} from '@ripl/core';

import {
    arrayJoin,
    arrayMapRange,
    numberFormat,
    numberMaxOf,
} from '@ripl/utilities';

/** Fill opacity a segment carries at rest, matching the bar series so the two read as one family. */
const SEGMENT_REST_ALPHA = 0.78;

/** Options for configuring a {@link PolarAreaChart}. */
export interface PolarAreaChartOptions<TData = unknown> extends BaseChartOptions {
    /** The dataset to render, one equal-angle segment per item. */
    data: TData[];
    /** Accessor for each item's unique key, used to match segments across data updates. */
    key: keyof TData | ((item: TData) => string);
    /** Accessor for each item's numeric value, which determines the segment's radial extent. */
    value: NumericAccessor<TData>;
    /** Accessor for each item's display label (shown in the legend and segment labels). */
    label: keyof TData | ((item: TData) => string);
    /** Optional accessor for a per-item color override (otherwise a palette color is generated). */
    colorBy?: keyof TData | ((item: TData) => string);
    /** Inner radius as a fraction of the chart size (0 - 1). Defaults to 0.15 */
    innerRadius?: number;
    /** Maximum radius ratio (0 - 0.5). Defaults to 0.45 (similar to pie chart). */
    maxRadiusRatio?: number;
    /**
     * Padding angle between segments in radians, producing a wedge-shaped gap that widens with radius.
     *
     * @deprecated Use {@link PolarAreaChartOptions.padWidth} for a gap of constant width. Still honored
     * when `padWidth` is not set, so existing charts keep their look.
     */
    padAngle?: number;
    /** Gap between adjacent segments, in logical pixels. Segments face each other with parallel edges a constant distance apart, rather than a wedge that widens with radius. Defaults to 2; pass 0 for touching segments. Takes precedence over the deprecated `padAngle`. */
    padWidth?: number;
    /** Number of concentric grid rings. Defaults to 4 */
    levels?: number;
    /** Legend showing each segment. Shown by default (more than one segment); pass `false` to hide. */
    legend?: ChartLegendInput;
    /**
     * Segment labels. Hidden by default (the legend is shown by default). `true` shows labels
     * inside each segment; `'outside'` places them beyond the arc with a leader line; a full object
     * customizes position/font/color.
     */
    labels?: ChartSegmentLabelsInput;
    /** Format applied to segment values shown as text (e.g. tooltips). */
    format?: ValueFormatInput;
}

/** Payload emitted for polar-area segment interaction events. */
export interface PolarAreaChartSegmentEvent {
    /** X position of the segment centroid, in canvas coordinates. */
    x: number;
    /** Y position of the segment centroid, in canvas coordinates. */
    y: number;
    /** The segment's numeric value. */
    value: number;
    /** The segment's display label. */
    label: string;
    /** The segment's unique key. */
    key: string;
}

/** Events emitted by a {@link PolarAreaChart} that consumers can subscribe to via `chart.on(...)`. */
export interface PolarAreaChartEventMap extends EventMap {
    /** Emitted when a segment is clicked. */
    segmentclick: PolarAreaChartSegmentEvent;
    /** Emitted when the pointer enters a segment. */
    segmententer: PolarAreaChartSegmentEvent;
    /** Emitted when the pointer leaves a segment. */
    segmentleave: PolarAreaChartSegmentEvent;
}

/**
 * Polar area chart rendering equal-angle segments whose radius encodes value.
 *
 * Each data point occupies an equal angular slice; the radial extent of each
 * segment is proportional to its value. Includes a concentric grid with
 * value labels, radial axis lines, an optional legend, and animated
 * entry/update/exit transitions.
 *
 * @typeParam TData - The type of each data item in the dataset.
 */
export class PolarAreaChart<TData = unknown> extends Chart<PolarAreaChartOptions<TData>, PolarAreaChartEventMap> {

    private _groups: Group[] = [];
    private _gridGroup?: Group;
    private _gridLabelGroup?: Group;
    private _gridRings: Circle[] = [];
    private _gridLabels: Text[] = [];
    private _gridLines: Line[] = [];
    private _tooltip: Tooltip;

    constructor(target: string | HTMLElement | Context, options: PolarAreaChartOptions<TData>) {
        super(target, options);

        this._tooltip = new Tooltip({
            scene: this.scene,
            renderer: this.renderer,
            placement: 'center',
        });

        this.init();
    }

    private _drawGrid(
        cx: number,
        cy: number,
        innerRadius: number,
        maxRadius: number,
        maxValue: number,
        levels: number,
        angleStep: number,
        startOffset: number,
        segmentCount: number
    ) {
        const isEntry = !this._gridGroup;
        const animDuration = this.getAnimationDuration(800);
        const radiusStep = (maxRadius - innerRadius) / levels;

        if (isEntry) {
            this._gridGroup = createGroup({
                id: 'polar-grid',
                class: 'polar-grid',
                zIndex: 0,
            });

            // Value labels are read off a band of their own, so a translucent segment never shows through them.
            this._gridLabelGroup = createGroup({
                id: 'polar-grid-labels',
                class: 'polar-grid',
                zIndex: 1,
            });

            this.scene.add(this._gridGroup);
            this.scene.add(this._gridLabelGroup);
        }

        // --- Concentric rings ---
        const levelIndices = arrayMapRange(levels, i => i + 1);

        const {
            left: ringEntries,
            inner: ringUpdates,
            right: ringExits,
        } = arrayJoin(levelIndices, this._gridRings, (level, ring) => ring.id === `polar-ring-${level}`);

        ringExits.forEach(el => el.destroy());

        const newRings = ringEntries.map(level => {
            const levelRadius = innerRadius + radiusStep * level;

            const ring = createCircle({
                id: `polar-ring-${level}`,
                cx,
                cy,
                radius: isEntry ? innerRadius : levelRadius,
                stroke: this.theme.gridColor,
                lineWidth: 1,
                data: {
                    radius: levelRadius,
                },
            });

            ring.autoFill = false;
            this._gridGroup!.add(ring);

            return ring;
        });

        ringUpdates.forEach(([level, ring]) => {
            const levelRadius = innerRadius + radiusStep * level;

            ring.data = {
                cx,
                cy,
                radius: levelRadius,
            } as Partial<CircleState>;
        });

        this._gridRings = [
            ...newRings,
            ...ringUpdates.map(([, ring]) => ring),
        ];

        // --- Ring value labels ---
        const {
            left: labelEntries,
            inner: labelUpdates,
            right: labelExits,
        } = arrayJoin(levelIndices, this._gridLabels, (level, label) => label.id === `polar-ring-label-${level}`);

        labelExits.forEach(el => el.destroy());

        const newLabels = labelEntries.map(level => {
            const levelRadius = innerRadius + radiusStep * level;
            const levelValue = numberFormat((maxValue / levels) * level, { precision: 2 });

            const label = createText({
                id: `polar-ring-label-${level}`,
                x: cx + 4,
                y: cy - levelRadius - 2,
                content: levelValue,
                fill: '#9ca3af',
                font: '10px sans-serif',
                textAlign: 'left',
                textBaseline: 'bottom',
                opacity: isEntry ? 0 : 1,
                data: {
                    opacity: 1,
                },
            });

            this._gridLabelGroup!.add(label);

            return label;
        });

        labelUpdates.forEach(([level, label]) => {
            const levelRadius = innerRadius + radiusStep * level;
            const levelValue = numberFormat((maxValue / levels) * level, { precision: 2 });

            label.content = levelValue;
            label.data = {
                x: cx + 4,
                y: cy - levelRadius - 2,
            } as Partial<TextState>;
        });

        this._gridLabels = [
            ...newLabels,
            ...labelUpdates.map(([, label]) => label),
        ];

        // --- Radial axis lines ---
        const lineIndices = arrayMapRange(segmentCount, i => i);

        const {
            left: lineEntries,
            inner: lineUpdates,
            right: lineExits,
        } = arrayJoin(lineIndices, this._gridLines, (idx, line) => line.id === `polar-axis-${idx}`);

        lineExits.forEach(el => el.destroy());

        const newLines = lineEntries.map(idx => {
            const angle = startOffset + idx * angleStep;
            const [x2, y2] = getThetaPoint(angle, maxRadius, cx, cy);
            const [x1, y1] = getThetaPoint(angle, innerRadius, cx, cy);

            const line = createLine({
                id: `polar-axis-${idx}`,
                x1,
                y1,
                x2: isEntry ? x1 : x2,
                y2: isEntry ? y1 : y2,
                stroke: this.theme.gridColor,
                lineWidth: 1,
                data: {
                    x2,
                    y2,
                },
            });

            this._gridGroup!.add(line);

            return line;
        });

        lineUpdates.forEach(([idx, line]) => {
            const angle = startOffset + idx * angleStep;
            const [x2, y2] = getThetaPoint(angle, maxRadius, cx, cy);
            const [x1, y1] = getThetaPoint(angle, innerRadius, cx, cy);

            line.data = {
                x1,
                y1,
                x2,
                y2,
            } as Partial<LineState>;
        });

        this._gridLines = [
            ...newLines,
            ...lineUpdates.map(([, line]) => line),
        ];

        // Animate: staggered entry for new elements, smooth transition for updates
        const allElements = [
            ...this._gridGroup!.children,
            ...this._gridLabelGroup!.children,
        ];

        if (isEntry) {
            return this.renderer.transition(allElements, (element, index, length) => ({
                duration: animDuration,
                delay: index * (animDuration / length) * 0.3,
                ease: easeOutQuint,
                state: element.data as Partial<BaseElementState>,
            }));
        }

        return this.renderer.transition(allElements, element => ({
            duration: animDuration,
            ease: easeOutQuint,
            state: element.data as Partial<BaseElementState>,
        }));
    }

    public async render() {
        return super.render((scene, renderer) => {
            const {
                data,
                key,
                value,
                label,
                colorBy,
                innerRadius = 0.15,
                maxRadiusRatio = 0.45,
                padAngle = 0.02,
                levels = 4,
            } = this.options;

            const padWidth = resolveSegmentPadWidth(this.options.padWidth, this.options.padAngle);

            if (!data.length) {
                return Promise.resolve();
            }

            const layout = this.createLayout();

            const getKey = resolveAccessor<TData, string>(key);
            const getValue = resolveAccessor<TData, number>(value);
            const getLabel = resolveAccessor<TData, string>(label);
            const getColor = resolveColorBy<TData>(colorBy);

            this.resolveSeriesColors(data.map(item => ({
                id: getKey(item),
                color: getColor(item),
            })));

            const colorFor = (item: TData) => getColor(item) ?? this.getSeriesColor(getKey(item));

            const labels = normalizeSegmentLabels(this.options.labels);

            // Shared layout pass: reserve title and legend bands first.
            this.reserveTitle(layout);

            const legendItems: LegendItem[] = data.map(item => ({
                id: getKey(item),
                label: getLabel(item),
                color: colorFor(item),
                active: this.isItemActive(getKey(item)),
            }));

            this.reserveLegend(layout, legendItems, this.options.legend);

            const area = layout.area;
            const { cx: centerX, cy: centerY, size } = areaCenter(area);

            const activeData = this.filterActive(data, getKey);

            const maxValue = activeData.length ? (numberMaxOf(activeData, getValue) ?? 0) : 0;
            const valueScale = scaleRadial([0, maxValue], [size * innerRadius, size * maxRadiusRatio]);

            const angleStep = TAU / Math.max(1, activeData.length);
            const startOffset = -TAU / 4; // Start at 12 o'clock similar to PieChart

            const gridTransition = this._drawGrid(
                centerX,
                centerY,
                size * innerRadius,
                size * maxRadiusRatio,
                maxValue,
                levels,
                angleStep,
                startOffset,
                activeData.length
            );

            const calculations = activeData.map((item, index) => {
                const key = getKey(item);
                const v = getValue(item);
                const color = colorFor(item);
                const label = getLabel(item);
                const cx = centerX;
                const cy = centerY;
                const startAngle = startOffset + index * angleStep;
                const endAngle = startAngle + angleStep;
                const radius = valueScale(v);

                return {
                    key,
                    value: v,
                    color,
                    label,
                    cx,
                    cy,
                    startAngle,
                    endAngle,
                    padAngle,
                    padWidth,
                    radius,
                    innerRadius: size * innerRadius,
                    item,
                };
            });

            const {
                left: entryData,
                inner: updateData,
                right: exitData,
            } = arrayJoin(calculations, this._groups, (item, group) => item.key === group.id);

            const entries = entryData.map(item => {
                const {
                    key,
                    color,
                    label,
                    cx,
                    cy,
                    startAngle,
                    endAngle,
                    padAngle,
                    padWidth,
                    radius,
                    innerRadius,
                } = item;

                const segmentArc = createArc({
                    class: 'segment__arc',
                    cx,
                    cy,
                    startAngle,
                    endAngle: startAngle, // animate angle grow subtly
                    padAngle,
                    padWidth,
                    fill: setColorAlpha(color, SEGMENT_REST_ALPHA),
                    radius: innerRadius, // animate radial growth
                    innerRadius,
                    data: {
                        endAngle,
                        radius,
                    } as Partial<ArcState>,
                });

                this._attachSegmentHover(segmentArc, {
                    value: item.value,
                    label,
                    key,
                });

                const labelInfo = resolveSegmentLabelLayout(item, labels, label);

                const connector = createPolyline({
                    class: 'segment__connector',
                    points: labelInfo.connector,
                    stroke: color,
                    lineWidth: 1,
                    opacity: 0,
                    pointerEvents: 'none',
                    zIndex: 1,
                });

                const segmentLabel = createSegmentLabel({
                    content: labelInfo.content,
                    x: labelInfo.x,
                    y: labelInfo.y,
                    textAlign: labelInfo.textAlign,
                    textBaseline: labelInfo.textBaseline,
                    fill: labelInfo.fill,
                    font: labelInfo.font,
                });

                connector.data = { opacity: labelInfo.showConnector ? 1 : 0 } as Partial<PolylineState>;
                segmentLabel.data = { opacity: labelInfo.visible ? 1 : 0 } as Partial<TextState>;

                return createGroup({
                    id: key,
                    class: 'segment',
                    children: [
                        segmentArc,
                        connector,
                        segmentLabel,
                    ],
                });
            });

            const updates = updateData.map(([item, group]) => {
                const {
                    cx,
                    cy,
                    radius,
                    innerRadius,
                    startAngle,
                    endAngle,
                    padAngle,
                    padWidth,
                } = item;

                const arc = group.query('arc') as Arc;
                const label = group.query('text') as Text;
                const connector = group.query('polyline') as Polyline;

                const resolvedColor = item.color;

                const arcData = {
                    cx,
                    cy,
                    radius,
                    innerRadius,
                    startAngle,
                    endAngle,
                    padAngle,
                    fill: setColorAlpha(resolvedColor, SEGMENT_REST_ALPHA),
                } as Partial<ArcState>;

                arc.padWidth = padWidth;
                arc.data = arcData;

                this._attachSegmentHover(arc, {
                    value: item.value,
                    label: item.label,
                    key: item.key,
                });

                const labelInfo = resolveSegmentLabelLayout(item, labels, item.label);

                label.content = labelInfo.content;
                label.textAlign = labelInfo.textAlign;
                label.textBaseline = labelInfo.textBaseline;
                label.fill = labelInfo.fill;

                if (labelInfo.font) {
                    label.font = labelInfo.font;
                }

                label.data = {
                    x: labelInfo.x,
                    y: labelInfo.y,
                    opacity: labelInfo.visible ? 1 : 0,
                } as Partial<TextState>;

                connector.stroke = resolvedColor;
                connector.data = {
                    points: labelInfo.connector,
                    opacity: labelInfo.showConnector ? 1 : 0,
                } as Partial<PolylineState>;

                return group;
            });

            const exits = exitData.map(group => {
                const arc = group.query('arc') as Arc;
                const label = group.query('text') as Text;
                const connector = group.query('polyline') as Polyline;

                const midAngle = (arc.startAngle + arc.endAngle) / 2;

                arc.data = {
                    startAngle: midAngle,
                    endAngle: midAngle,
                    radius: arc.innerRadius,
                } as Partial<ArcState>;

                label.data = {
                    opacity: 0,
                } as Partial<TextState>;

                connector.data = {
                    opacity: 0,
                };

                return group;
            });

            this._groups = [
                ...entries,
                ...updates,
            ];

            this.registerHighlightGroups(this._groups);

            scene.add(entries);

            const animDuration = this.getAnimationDuration(1000);

            async function transitionEntries() {
                const elements = entries.flatMap(group => group.children);

                await renderer.transition(elements.filter(elementIsArc), (element, index, length) => ({
                    duration: animDuration,
                    ease: easeOutQuint,
                    delay: index * (animDuration / length),
                    state: element.data as Partial<ArcState>,
                }));

                return renderer.transition(elements.filter(element => !elementIsArc(element)), element => ({
                    duration: animDuration * 1.5,
                    ease: easeOutQuint,
                    state: element.data as Partial<BaseElementState>,
                }));
            }

            async function transitionUpdates() {
                return renderer.transition(updates.flatMap(group => group.children), element => ({
                    duration: animDuration * 0.8,
                    ease: easeOutQuint,
                    state: element.data as Partial<BaseElementState>,
                }));
            }

            async function transitionExits() {
                await renderer.transition(exits.flatMap(group => group.children), element => ({
                    duration: animDuration * 0.8,
                    ease: easeOutQuint,
                    state: element.data as Partial<BaseElementState>,
                }));

                exits.forEach(group => group.destroy());
            }

            return Promise.all([
                gridTransition,
                transitionEntries(),
                transitionUpdates(),
                transitionExits(),
            ]);
        });
    }

    private _attachSegmentHover(arc: Arc, segment: { value: number;
        label: string;
        key: string; }) {
        const { value, label, key } = segment;
        const formatValue = resolveValueFormat(this.options.format);

        applySegmentInteraction<Arc, PolarAreaChartSegmentEvent>(arc, {
            renderer: this.renderer,
            animation: () => this.resolveAnimation(ANIMATION_REFERENCE.hover),
            tooltip: this._tooltip,
            anchor: arcCentroidAnchor(arc),
            content: () => `${label}: ${formatValue(value)}`,
            payload: {
                value,
                label,
                key,
            },
            onHighlight: hovered => this.highlightSeries(hovered ? key : null),
            onEnter: event => this.emit('segmententer', event),
            onLeave: event => this.emit('segmentleave', event),
            onClick: event => this.emit('segmentclick', event),
        });
    }
}

/**
 * Factory function that creates a new {@link PolarAreaChart} instance.
 *
 * @example
 * ```ts
 * createPolarAreaChart(target, {
 *     data: [
 *         { day: 'Mon', sales: 42 },
 *         { day: 'Tue', sales: 58 },
 *         { day: 'Wed', sales: 31 },
 *     ],
 *     key: 'day',
 *     value: 'sales',
 *     label: 'day',
 * });
 * ```
 */
export function createPolarAreaChart<TData = unknown>(target: string | HTMLElement | Context, options: PolarAreaChartOptions<TData>) {
    return new PolarAreaChart<TData>(target, options);
}
