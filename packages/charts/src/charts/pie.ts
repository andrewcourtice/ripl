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
    resolveValueFormat,
} from '../core/options';

import {
    createSegmentLabel,
    resolveSegmentLabelLayout,
} from '../core/labels';

import {
    ANIMATION_REFERENCE,
} from '../core/animation';

import {
    applyHoverHighlight,
} from '../core/interaction';

import {
    resolveAccessor,
} from '../core/data';

import {
    resolveColorBy,
} from '../core/color';

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
    Context,
    EventMap,
    Group,
    Polyline,
    PolylineState,
    Text,
    TextState,
} from '@ripl/core';

import {
    createArc,
    createGroup,
    createPolyline,
    elementIsArc,
    scaleContinuous,
    setColorAlpha,
    TAU,
} from '@ripl/core';

import {
    arrayJoin,
    numberSum,
} from '@ripl/utilities';

/** The opacity applied to a segment's fill at rest (full opacity is used on hover). */
const REST_ALPHA = 0.55;

/** Slices narrower than this angle (radians) omit their label to avoid clutter. */
const MIN_LABEL_ANGLE = 0.15;

/** Options for configuring a {@link PieChart}. */
export interface PieChartOptions<TData = unknown> extends BaseChartOptions {
    /** The dataset to render, one segment per item. */
    data: TData[];
    /** Accessor for each item's unique key, used to match segments across data updates. */
    key: keyof TData | ((item: TData) => string);
    /** Accessor for each item's numeric value, which determines its proportional arc angle. */
    value: NumericAccessor<TData>;
    /** Accessor for each item's display label (shown in the legend and segment labels). */
    label: keyof TData | ((item: TData) => string);
    /** Optional accessor for a per-item colour override (otherwise a palette colour is generated). */
    colorBy?: keyof TData | ((item: TData) => string);
    /** Inner hole radius (donut). A value `<= 1` is a fraction of the outer radius; larger values are absolute pixels. Defaults to 0 (a solid pie). */
    innerRadius?: number;
    /** Legend configuration. Shown by default; pass `false` to hide. */
    legend?: ChartLegendInput;
    /**
     * Segment labels. Hidden by default (the legend is shown by default). `true` shows labels
     * inside each segment; `'outside'` places them beyond the arc with a leader line; a full object
     * customises position/font/colour.
     */
    labels?: ChartSegmentLabelsInput;
    /** Format applied to segment values shown as text (e.g. tooltips). */
    format?: ValueFormatInput;
}

/** Payload emitted for pie segment interaction events. */
export interface PieChartSegmentEvent {
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

/** Events emitted by a {@link PieChart} that consumers can subscribe to via `chart.on(...)`. */
export interface PieChartEventMap extends EventMap {
    /** Emitted when a segment is clicked. */
    segmentclick: PieChartSegmentEvent;
    /** Emitted when the pointer enters a segment. */
    segmententer: PieChartSegmentEvent;
    /** Emitted when the pointer leaves a segment. */
    segmentleave: PieChartSegmentEvent;
}

/**
 * Pie chart rendering proportional arc segments with optional inner radius (donut).
 *
 * Supports a chart title, interactive tooltips, a legend in any position, and animated
 * entry/update/exit transitions. Segments grow outward from the centre with staggered delays,
 * and labels fade in after the arcs have settled.
 *
 * @typeParam TData - The type of each data item in the dataset.
 */
export class PieChart<TData = unknown> extends Chart<PieChartOptions<TData>, PieChartEventMap> {

    private _groups: Group[] = [];
    private _tooltip: Tooltip;

    constructor(target: string | HTMLElement | Context, options: PieChartOptions<TData>) {
        super(target, options);

        this._tooltip = new Tooltip({
            scene: this.scene,
            renderer: this.renderer,
            placement: 'center',
        });

        this.init();
    }

    public async render() {
        return super.render((scene, renderer) => {
            const { data, key, value, label, colorBy } = this.options;

            const getKey = resolveAccessor<TData, string>(key);
            const getValue = resolveAccessor<TData, number>(value);
            const getLabel = resolveAccessor<TData, string>(label);
            const getColor = resolveColorBy<TData>(colorBy);

            const labels = normalizeSegmentLabels(this.options.labels);

            // Register each segment in the shared colour map so it draws a palette colour instead
            // of the unresolved-series grey fallback (honouring any explicit per-item colour).
            this.resolveSeriesColors(data.map(item => ({
                id: getKey(item),
                color: getColor(item),
            })));

            const colorFor = (item: TData) => getColor(item) ?? this.getSeriesColor(getKey(item));

            // Shared layout pass: reserve title and legend bands first.
            const layout = this.createLayout();
            this.reserveTitle(layout);

            const legendItems: LegendItem[] = data.map(item => ({
                id: getKey(item),
                label: getLabel(item),
                color: colorFor(item),
                active: true,
            }));

            this.reserveLegend(layout, legendItems, this.options.legend);

            const area = layout.area;
            const { cx, cy, size } = areaCenter(area);

            const total = numberSum(data, getValue);
            const scale = scaleContinuous([0, total], [0, TAU], { clamp: true });
            const offset = TAU / 4;
            const padAngle = data.length === 1 ? 0 : 0.1 / data.length;

            let startAngle = -offset;

            const calculations = data.map(item => {
                const itemKey = getKey(item);
                const itemValue = getValue(item);
                const itemColor = colorFor(item);
                const itemLabel = getLabel(item);
                const endAngle = startAngle + scale(itemValue);
                const radius = size * 0.45;
                const innerRadiusOption = this.options.innerRadius;
                // Default to a true pie (no hole); a donut is opt-in via `innerRadius`. This matches
                // the documented default of 0 and keeps the demo's pie/donut toggle consistent.
                let innerRadius = 0;

                if (innerRadiusOption !== undefined) {
                    // A fractional value is a fraction of the *outer radius* (so 0.55 is a hole 55% of
                    // the ring), not of the overall size — otherwise the hole could exceed the ring and
                    // render an inverted donut. Absolute values are taken as-is. Always clamp below the
                    // outer radius so the ring stays visible.
                    const resolved = innerRadiusOption <= 1 ? radius * innerRadiusOption : innerRadiusOption;
                    innerRadius = Math.min(resolved, radius * 0.95);
                }

                const output = {
                    key: itemKey,
                    value: itemValue,
                    color: itemColor,
                    label: itemLabel,
                    cx,
                    cy,
                    startAngle,
                    endAngle,
                    padAngle,
                    radius,
                    innerRadius,
                    item,
                };

                startAngle = endAngle;

                return output;
            });

            const {
                left: entryData,
                inner: updateData,
                right: exitData,
            } = arrayJoin(calculations, this._groups, (item, group) => item.key === group.id);

            const entries = entryData.map(item => {
                const {
                    key: segmentKey,
                    value: segmentValue,
                    color: segmentColor,
                    label: segmentLabel,
                    cx: segmentCx,
                    cy: segmentCy,
                    startAngle: segmentStart,
                    endAngle: segmentEnd,
                    padAngle: segmentPad,
                    radius,
                    innerRadius,
                } = item;

                const segmentArc = createArc({
                    class: 'segment__arc',
                    cx: segmentCx,
                    cy: segmentCy,
                    startAngle: segmentStart,
                    padAngle: segmentPad,
                    stroke: segmentColor,
                    fill: setColorAlpha(segmentColor, REST_ALPHA),
                    lineWidth: 2,
                    endAngle: segmentStart,
                    radius: 0,
                    innerRadius: 0,
                    data: {
                        endAngle: segmentEnd,
                        radius,
                        innerRadius,
                    } as Partial<ArcState>,
                });

                this._attachSegmentHover(segmentArc, {
                    color: segmentColor,
                    value: segmentValue,
                    label: segmentLabel,
                    key: segmentKey,
                });

                const labelInfo = resolveSegmentLabelLayout(item, labels, segmentLabel, MIN_LABEL_ANGLE);

                const connector = createPolyline({
                    class: 'segment__connector',
                    points: labelInfo.connector,
                    stroke: segmentColor,
                    lineWidth: 1,
                    opacity: 0,
                    pointerEvents: 'none',
                    zIndex: 1,
                });

                const labelText = createSegmentLabel({
                    content: labelInfo.content,
                    x: labelInfo.x,
                    y: labelInfo.y,
                    textAlign: labelInfo.textAlign,
                    textBaseline: labelInfo.textBaseline,
                    fill: labelInfo.fill,
                    font: labelInfo.font,
                });

                // Fade each to its intended rest opacity on entry (hidden labels/connectors settle at
                // 0 so they can later fade *in* on an update, rather than sitting at full opacity).
                connector.data = { opacity: labelInfo.showConnector ? 1 : 0 } as Partial<PolylineState>;
                labelText.data = { opacity: labelInfo.visible ? 1 : 0 } as Partial<TextState>;

                return createGroup({
                    id: segmentKey,
                    class: 'segment',
                    children: [
                        segmentArc,
                        connector,
                        labelText,
                    ],
                });
            });

            const updates = updateData.map(([item, group]) => {
                const {
                    cx: segmentCx,
                    cy: segmentCy,
                    radius,
                    innerRadius,
                    startAngle: segmentStart,
                    endAngle: segmentEnd,
                    padAngle: segmentPad,
                } = item;

                const arc = group.query('arc') as Arc;
                const labelText = group.query('text') as Text;
                const connector = group.query('polyline') as Polyline;

                const resolvedColor = item.color ?? (arc.stroke as string);

                const arcData = {
                    cx: segmentCx,
                    cy: segmentCy,
                    radius,
                    innerRadius,
                    startAngle: segmentStart,
                    endAngle: segmentEnd,
                    padAngle: segmentPad,
                    stroke: resolvedColor,
                    fill: setColorAlpha(resolvedColor, REST_ALPHA),
                } as Partial<ArcState>;

                arc.data = arcData;
                this._attachSegmentHover(arc, {
                    color: resolvedColor,
                    value: item.value,
                    label: item.label,
                    key: item.key,
                });

                const labelInfo = resolveSegmentLabelLayout(item, labels, item.label, MIN_LABEL_ANGLE);

                labelText.content = labelInfo.content;
                labelText.textAlign = labelInfo.textAlign;
                labelText.textBaseline = labelInfo.textBaseline;
                labelText.fill = labelInfo.fill;

                if (labelInfo.font) {
                    labelText.font = labelInfo.font;
                }

                labelText.data = {
                    x: labelInfo.x,
                    y: labelInfo.y,
                    opacity: labelInfo.visible ? 1 : 0,
                } as Partial<TextState>;

                // Route the connector's new geometry through `.data` (not a direct `points =`) so it
                // tweens in lockstep with the label position instead of snapping.
                connector.stroke = resolvedColor;
                connector.data = {
                    points: labelInfo.connector,
                    opacity: labelInfo.showConnector ? 1 : 0,
                } as Partial<PolylineState>;

                return group;
            });

            const exits = exitData.map(group => {
                const arc = group.query('arc') as Arc;
                const labelText = group.query('text') as Text;
                const connector = group.query('polyline') as Polyline;

                const midAngle = (arc.startAngle + arc.endAngle) / 2;

                arc.data = {
                    startAngle: midAngle,
                    endAngle: midAngle,
                    radius: 0,
                    innerRadius: 0,
                } as Partial<ArcState>;

                labelText.data = {
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

            const enter = this.resolveAnimation(ANIMATION_REFERENCE.enter);
            const update = this.resolveAnimation(ANIMATION_REFERENCE.update);
            const exit = this.resolveAnimation(ANIMATION_REFERENCE.exit);

            const transitionEntries = async () => {
                const elements = entries.flatMap(group => group.children);

                await renderer.transition(elements.filter(elementIsArc), (element, index, length) => ({
                    duration: enter.duration,
                    ease: enter.ease,
                    delay: length <= 1 ? 0 : (index / length) * enter.duration,
                    state: element.data as Partial<ArcState>,
                }));

                // Fade in the non-arc children (labels and any outside-label connectors) to their
                // intended rest opacity (hidden ones settle at 0), read from each element's `.data`.
                return renderer.transition(elements.filter(element => !elementIsArc(element)), element => ({
                    duration: enter.duration,
                    ease: enter.ease,
                    state: element.data as Partial<BaseElementState>,
                }));
            };

            // Segments are grouped, but transitions animate their own state — so drive the leaf
            // children (arc/label/connector) to their stashed `.data`, not the inert group.
            const transitionUpdates = async () => renderer.transition(updates.flatMap(group => group.children), element => ({
                duration: update.duration,
                ease: update.ease,
                state: element.data as Partial<BaseElementState>,
            }));

            const transitionExits = async () => {
                await renderer.transition(exits.flatMap(group => group.children), element => ({
                    duration: exit.duration,
                    ease: exit.ease,
                    state: element.data as Partial<BaseElementState>,
                }));

                // Destroy the whole segment group once its leaves have collapsed (destroying leaves
                // individually would leave empty group nodes behind).
                exits.forEach(group => group.destroy());
            };

            return Promise.all([
                transitionEntries(),
                transitionUpdates(),
                transitionExits(),
            ]);
        });
    }

    private _attachSegmentHover(arc: Arc, segment: { color: string;
        value: number;
        label: string;
        key: string; }) {
        const { color, value, label, key } = segment;
        const formatValue = resolveValueFormat(this.options.format);

        const payload = (point: { x: number;
            y: number; }): PieChartSegmentEvent => ({
            x: point.x,
            y: point.y,
            value,
            label,
            key,
        });

        applyHoverHighlight(arc, {
            renderer: this.renderer,
            animation: () => this.resolveAnimation(ANIMATION_REFERENCE.hover),
            tooltip: this._tooltip,
            anchor: () => {
                const [x, y] = arc.getCentroid(arc.data as Partial<ArcState>);
                return {
                    x,
                    y,
                };
            },
            content: () => formatValue(value),
            highlight: { fill: color },
            restore: { fill: setColorAlpha(color, REST_ALPHA) },
            onEnter: point => this.emit('segmententer', payload(point)),
            onLeave: point => this.emit('segmentleave', payload(point)),
            onClick: point => this.emit('segmentclick', payload(point)),
        });
    }

}

/**
 * Factory function that creates a new {@link PieChart} instance.
 *
 * @example
 * ```ts
 * createPieChart(target, {
 *     data: [
 *         { browser: 'Chrome', share: 64 },
 *         { browser: 'Safari', share: 19 },
 *         { browser: 'Edge', share: 5 },
 *     ],
 *     key: 'browser',
 *     value: 'share',
 *     label: 'browser',
 *     innerRadius: 0.6,
 * });
 * ```
 */
export function createPieChart<TData = unknown>(target: string | HTMLElement | Context, options: PieChartOptions<TData>) {
    return new PieChart<TData>(target, options);
}
