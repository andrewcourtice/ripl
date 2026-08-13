import type {
    NumericAccessor,
} from '../core/data';

import type {
    BaseChartOptions,
    HighlightOptions,
    MarkSelector,
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
    DEFAULT_SEGMENT_PAD_WIDTH,
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

/** Slices narrower than this angle (radians) omit their label to avoid clutter. */
const MIN_LABEL_ANGLE = 0.15;

/** Fill opacity a segment carries at rest, matching the bar series so the two read as one family. */
const SEGMENT_REST_ALPHA = 0.78;

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
    /** Optional accessor for a per-item color override (otherwise a palette color is generated). */
    colorBy?: keyof TData | ((item: TData) => string);
    /** Inner hole radius (donut). A value `<= 1` is a fraction of the outer radius; larger values are absolute pixels. Defaults to 0 (a solid pie). */
    innerRadius?: number;
    /** Gap between adjacent segments, in logical pixels. Segments face each other with parallel edges a constant distance apart, rather than a wedge that widens with radius. Defaults to 2; pass 0 for touching segments. */
    padWidth?: number;
    /** Legend configuration. Shown by default; pass `false` to hide. */
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
 * entry/update/exit transitions. Segments grow outward from the center with staggered delays,
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

    /**
     * Highlights the segment at a key, dimming every other segment exactly as hovering it does. The
     * highlight is a one-shot command: the next render (a resize, an {@link Chart.update}, a legend
     * toggle) or the next pointer hover restores the chart, and it emits no segment events.
     *
     * @param selector - The segment's key, a `{ key }` ref, or an accessor over the chart's data.
     * @param options - What to show alongside the segment's highlight state.
     * @returns `true` when a live segment matched, `false` when nothing changed.
     *
     * @example
     * ```ts
     * chart.highlightSegment('Chrome', { tooltip: true });
     * chart.highlightSegment(data => data[0].browser);
     * ```
     */
    public highlightSegment(selector: MarkSelector<TData>, options?: HighlightOptions): boolean {
        return this.replayMark('segment', this.resolveMarkSelector(selector, this.options.data), options);
    }

    public async render() {
        return super.render((scene, renderer) => {
            const { data, key, value, label, colorBy, padWidth = DEFAULT_SEGMENT_PAD_WIDTH } = this.options;

            const getKey = resolveAccessor<TData, string>(key);
            const getValue = resolveAccessor<TData, number>(value);
            const getLabel = resolveAccessor<TData, string>(label);
            const getColor = resolveColorBy<TData>(colorBy);

            const labels = normalizeSegmentLabels(this.options.labels);

            // Register segments in the shared color map so palette colors stay stable across updates
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
                active: this.isItemActive(getKey(item)),
            }));

            this.reserveLegend(layout, legendItems, this.options.legend);

            const area = layout.area;
            const { cx, cy, size } = areaCenter(area);

            const activeData = this.filterActive(data, getKey);

            const total = numberSum(activeData, getValue);
            const scale = scaleContinuous([0, total], [0, TAU], { clamp: true });
            const offset = TAU / 4;
            const segmentPad = activeData.length <= 1 ? 0 : padWidth;

            let startAngle = -offset;

            const calculations = activeData.map(item => {
                const itemKey = getKey(item);
                const itemValue = getValue(item);
                const itemColor = colorFor(item);
                const itemLabel = getLabel(item);
                const endAngle = startAngle + scale(itemValue);
                const radius = size * 0.45;
                const innerRadiusOption = this.options.innerRadius;
                let innerRadius = 0;

                if (innerRadiusOption !== undefined) {
                    // Fractions are of the outer radius and clamped below it, else the hole inverts the donut
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
                    padWidth: segmentPad,
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
                    padWidth: segmentPad,
                    radius,
                    innerRadius,
                } = item;

                const segmentArc = createArc({
                    class: 'segment__arc',
                    cx: segmentCx,
                    cy: segmentCy,
                    startAngle: segmentStart,
                    padWidth: segmentPad,
                    fill: setColorAlpha(segmentColor, SEGMENT_REST_ALPHA),
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

                // Stash rest opacity in `.data`; hidden labels/connectors settle at 0 so they can fade in later
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
                    padWidth: segmentPad,
                } = item;

                const arc = group.query('arc') as Arc;
                const labelText = group.query('text') as Text;
                const connector = group.query('polyline') as Polyline;

                const resolvedColor = item.color;

                const arcData = {
                    cx: segmentCx,
                    cy: segmentCy,
                    radius,
                    innerRadius,
                    startAngle: segmentStart,
                    endAngle: segmentEnd,
                    fill: setColorAlpha(resolvedColor, SEGMENT_REST_ALPHA),
                } as Partial<ArcState>;

                arc.padWidth = segmentPad;
                arc.data = arcData;
                this._attachSegmentHover(arc, {
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

                // Route points through `.data` so the connector tweens with the label instead of snapping
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

                return renderer.transition(elements.filter(element => !elementIsArc(element)), element => ({
                    duration: enter.duration,
                    ease: enter.ease,
                    state: element.data as Partial<BaseElementState>,
                }));
            };

            // Groups are inert in transitions, so drive the leaf children to their stashed `.data`
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

                // Destroy the whole group; destroying leaves individually leaves empty groups behind
                exits.forEach(group => group.destroy());
            };

            return Promise.all([
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

        applySegmentInteraction<Arc, PieChartSegmentEvent>(arc, {
            renderer: this.renderer,
            animation: () => this.resolveAnimation(ANIMATION_REFERENCE.hover),
            tooltip: this._tooltip,
            anchor: arcCentroidAnchor(arc),
            content: () => formatValue(value),
            payload: {
                value,
                label,
                key,
            },
            // Every segment shares one rest tint, so the hover reads as the others dimming rather than this one lifting.
            onHighlight: hovered => this.applySeriesHighlight(hovered ? key : null),
            onEnter: event => this.emit('segmententer', event),
            onLeave: event => this.emit('segmentleave', event),
            onClick: event => this.emit('segmentclick', event),
        });

        // The arc carries the hover treatment but no id of its own, so register it under its group's key.
        this.registerMark('segment', key, arc);
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
