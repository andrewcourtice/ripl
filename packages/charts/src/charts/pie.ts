import type {
    BaseChartOptions,
} from '../core/chart';

import {
    Chart,
} from '../core/chart';

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
    getTotal,
    scaleContinuous,
    setColorAlpha,
    TAU,
} from '@ripl/core';

import {
    arrayJoin,
} from '@ripl/utilities';

/** The opacity applied to a segment's fill at rest (full opacity is used on hover). */
const REST_ALPHA = 0.55;

/** Slices narrower than this angle (radians) omit their label to avoid clutter. */
const MIN_LABEL_ANGLE = 0.15;

/** Options for configuring a {@link PieChart}. */
export interface PieChartOptions<TData = unknown> extends BaseChartOptions {
    data: TData[];
    key: keyof TData | ((item: TData) => string);
    value: keyof TData | ((item: TData) => number);
    label: keyof TData | ((item: TData) => string);
    color?: keyof TData | ((item: TData) => string);
    innerRadius?: number;
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
    x: number;
    y: number;
    value: number;
    label: string;
    key: string;
}

/** Events emitted by a {@link PieChart} that consumers can subscribe to via `chart.on(...)`. */
export interface PieChartEventMap extends EventMap {
    segmentclick: PieChartSegmentEvent;
    segmententer: PieChartSegmentEvent;
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

    private groups: Group[] = [];
    private tooltip: Tooltip;

    constructor(target: string | HTMLElement | Context, options: PieChartOptions<TData>) {
        super(target, options);

        this.tooltip = new Tooltip({
            scene: this.scene,
            renderer: this.renderer,
            placement: 'center',
        });

        this.init();
    }

    public async render() {
        return super.render((scene, renderer) => {
            const { data, key, value, label, color } = this.options;

            const getKey = resolveAccessor<TData, string>(key);
            const getValue = resolveAccessor<TData, number>(value);
            const getLabel = resolveAccessor<TData, string>(label);
            const getColor = (item: TData): string | undefined => (color ? resolveAccessor<TData, string>(color)(item) : undefined);

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
            const size = Math.min(area.width, area.height);
            const cx = area.x + area.width / 2;
            const cy = area.y + area.height / 2;

            const total = getTotal(data, getValue);
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
            } = arrayJoin(calculations, this.groups, (item, group) => item.key === group.id);

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

                this.attachSegmentHover(segmentArc, {
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
                this.attachSegmentHover(arc, {
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

            this.groups = [
                ...entries,
                ...updates,
            ];

            this.registerHighlightGroups(this.groups);

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

            const transitionUpdates = async () => renderer.transition(updates, element => ({
                duration: update.duration,
                ease: update.ease,
                state: element.data as Partial<BaseElementState>,
            }));

            const transitionExits = async () => renderer.transition(exits, element => ({
                duration: exit.duration,
                ease: exit.ease,
                state: element.data as Partial<BaseElementState>,
                onComplete: el => el.destroy(),
            }));

            return Promise.all([
                transitionEntries(),
                transitionUpdates(),
                transitionExits(),
            ]);
        });
    }

    private attachSegmentHover(arc: Arc, segment: { color: string;
        value: number;
        label: string;
        key: string; }) {
        const { color, value, label, key } = segment;
        const hover = this.resolveAnimation(ANIMATION_REFERENCE.hover);
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
            duration: hover.duration,
            ease: hover.ease,
            tooltip: this.tooltip,
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

/** Factory function that creates a new {@link PieChart} instance. */
export function createPieChart<TData = unknown>(target: string | HTMLElement | Context, options: PieChartOptions<TData>) {
    return new PieChart<TData>(target, options);
}
