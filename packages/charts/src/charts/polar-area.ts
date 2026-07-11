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
    formatNumber,
    normalizeSegmentLabels,
    resolveValueFormat,
} from '../core/options';

import {
    createSegmentLabel,
    resolveSegmentLabelLayout,
} from '../core/labels';

import {
    applyHoverHighlight,
} from '../core/interaction';

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
    maxOf,
    scaleContinuous,
    setColorAlpha,
    TAU,
} from '@ripl/core';

import {
    arrayJoin,
    typeIsFunction,
} from '@ripl/utilities';

/** The opacity applied to a segment's fill at rest (full opacity is used on hover). */
const REST_ALPHA = 0.55;

/** Options for configuring a {@link PolarAreaChart}. */
export interface PolarAreaChartOptions<TData = unknown> extends BaseChartOptions {
    data: TData[];
    key: keyof TData | ((item: TData) => string);
    value: keyof TData | ((item: TData) => number);
    label: keyof TData | ((item: TData) => string);
    color?: keyof TData | ((item: TData) => string);
    /** Inner radius ratio (0 - 1). Defaults to 0.15 */
    innerRadiusRatio?: number;
    /** Maximum radius ratio (0 - 0.5). Defaults to 0.45 (similar to pie chart). */
    maxRadiusRatio?: number;
    /** Padding angle between segments in radians. Defaults to 0.02 */
    padAngle?: number;
    /** Number of concentric grid rings. Defaults to 4 */
    levels?: number;
    /** Legend showing each segment. Shown by default (more than one segment); pass `false` to hide. */
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

/** Payload emitted for polar-area segment interaction events. */
export interface PolarAreaChartSegmentEvent {
    x: number;
    y: number;
    value: number;
    label: string;
    key: string;
}

/** Events emitted by a {@link PolarAreaChart} that consumers can subscribe to via `chart.on(...)`. */
export interface PolarAreaChartEventMap extends EventMap {
    segmentclick: PolarAreaChartSegmentEvent;
    segmententer: PolarAreaChartSegmentEvent;
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

    private groups: Group[] = [];
    private gridGroup?: Group;
    private gridRings: Circle[] = [];
    private gridLabels: Text[] = [];
    private gridLines: Line[] = [];
    private tooltip: Tooltip;

    constructor(target: string | HTMLElement | Context, options: PolarAreaChartOptions<TData>) {
        super(target, options);

        this.tooltip = new Tooltip({
            scene: this.scene,
            renderer: this.renderer,
            placement: 'center',
        });

        this.init();
    }

    private drawGrid(
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
        const isEntry = !this.gridGroup;
        const animDuration = this.getAnimationDuration(800);
        const radiusStep = (maxRadius - innerRadius) / levels;

        if (isEntry) {
            this.gridGroup = createGroup({
                id: 'polar-grid',
                class: 'polar-grid',
                zIndex: 0,
            });

            this.scene.add(this.gridGroup);
        }

        // --- Concentric rings ---
        const levelIndices = Array.from({ length: levels }).map((_, i) => i + 1);

        const {
            left: ringEntries,
            inner: ringUpdates,
            right: ringExits,
        } = arrayJoin(levelIndices, this.gridRings, (level, ring) => ring.id === `polar-ring-${level}`);

        ringExits.forEach(el => el.destroy());

        const newRings = ringEntries.map(level => {
            const levelRadius = innerRadius + radiusStep * level;

            const ring = createCircle({
                id: `polar-ring-${level}`,
                cx,
                cy,
                radius: isEntry ? innerRadius : levelRadius,
                stroke: '#e5e7eb',
                lineWidth: 1,
                data: {
                    radius: levelRadius,
                },
            });

            ring.autoFill = false;
            this.gridGroup!.add(ring);

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

        this.gridRings = [
            ...newRings,
            ...ringUpdates.map(([, ring]) => ring),
        ];

        // --- Ring value labels ---
        const {
            left: labelEntries,
            inner: labelUpdates,
            right: labelExits,
        } = arrayJoin(levelIndices, this.gridLabels, (level, label) => label.id === `polar-ring-label-${level}`);

        labelExits.forEach(el => el.destroy());

        const newLabels = labelEntries.map(level => {
            const levelRadius = innerRadius + radiusStep * level;
            const levelValue = formatNumber((maxValue / levels) * level);

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

            this.gridGroup!.add(label);

            return label;
        });

        labelUpdates.forEach(([level, label]) => {
            const levelRadius = innerRadius + radiusStep * level;
            const levelValue = formatNumber((maxValue / levels) * level);

            label.content = levelValue;
            label.data = {
                x: cx + 4,
                y: cy - levelRadius - 2,
            } as Partial<TextState>;
        });

        this.gridLabels = [
            ...newLabels,
            ...labelUpdates.map(([, label]) => label),
        ];

        // --- Radial axis lines ---
        const lineIndices = Array.from({ length: segmentCount }).map((_, i) => i);

        const {
            left: lineEntries,
            inner: lineUpdates,
            right: lineExits,
        } = arrayJoin(lineIndices, this.gridLines, (idx, line) => line.id === `polar-axis-${idx}`);

        lineExits.forEach(el => el.destroy());

        const newLines = lineEntries.map(idx => {
            const angle = startOffset + idx * angleStep;
            const x2 = cx + maxRadius * Math.cos(angle);
            const y2 = cy + maxRadius * Math.sin(angle);
            const x1 = cx + innerRadius * Math.cos(angle);
            const y1 = cy + innerRadius * Math.sin(angle);

            const line = createLine({
                id: `polar-axis-${idx}`,
                x1,
                y1,
                x2: isEntry ? x1 : x2,
                y2: isEntry ? y1 : y2,
                stroke: '#e5e7eb',
                lineWidth: 1,
                data: {
                    x2,
                    y2,
                },
            });

            this.gridGroup!.add(line);

            return line;
        });

        lineUpdates.forEach(([idx, line]) => {
            const angle = startOffset + idx * angleStep;
            const x2 = cx + maxRadius * Math.cos(angle);
            const y2 = cy + maxRadius * Math.sin(angle);
            const x1 = cx + innerRadius * Math.cos(angle);
            const y1 = cy + innerRadius * Math.sin(angle);

            line.data = {
                x1,
                y1,
                x2,
                y2,
            } as Partial<LineState>;
        });

        this.gridLines = [
            ...newLines,
            ...lineUpdates.map(([, line]) => line),
        ];

        // Animate: staggered entry for new elements, smooth transition for updates
        const allElements = this.gridGroup!.children;

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
                color,
                innerRadiusRatio = 0.15,
                maxRadiusRatio = 0.45,
                padAngle = 0.02,
                levels = 4,
            } = this.options;

            if (!data.length) {
                return Promise.resolve();
            }

            const layout = this.createLayout();

            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            const getKey = typeIsFunction(key) ? key : (item: any) => item[key] as string;
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            const getValue = typeIsFunction(value) ? value : (item: any) => item[value] as number;
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            const getLabel = typeIsFunction(label) ? label : (item: any) => item[label] as string;
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            const getColor = typeIsFunction(color) ? color : (item: any) => item[color] as string;

            // Register each segment in the shared colour map so legend swatches and segments share
            // stable palette colours (honouring any explicit per-item colour).
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
                active: true,
            }));

            this.reserveLegend(layout, legendItems, this.options.legend);

            const area = layout.area;
            const size = Math.min(area.width, area.height);
            const centerX = area.x + area.width / 2;
            const centerY = area.y + area.height / 2;

            const maxValue = maxOf(data, getValue) ?? 0;
            const valueScale = scaleContinuous([0, maxValue], [size * innerRadiusRatio, size * maxRadiusRatio], { clamp: true });

            const angleStep = TAU / data.length;
            const startOffset = -TAU / 4; // Start at 12 o'clock similar to PieChart

            const gridTransition = this.drawGrid(
                centerX,
                centerY,
                size * innerRadiusRatio,
                size * maxRadiusRatio,
                maxValue,
                levels,
                angleStep,
                startOffset,
                data.length
            );

            const calculations = data.map((item, index) => {
                const key = getKey(item);
                const v = getValue(item);
                const color = colorFor(item);
                const label = getLabel(item);
                const cx = centerX;
                const cy = centerY;
                const startAngle = startOffset + index * angleStep;
                const endAngle = startAngle + angleStep;
                const innerRadius = size * innerRadiusRatio;
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
                    radius,
                    innerRadius,
                    item,
                };
            });

            const {
                left: entryData,
                inner: updateData,
                right: exitData,
            } = arrayJoin(calculations, this.groups, (item, group) => item.key === group.id);

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
                    stroke: color,
                    fill: setColorAlpha(color, REST_ALPHA),
                    lineWidth: 2,
                    radius: innerRadius, // animate radial growth
                    innerRadius,
                    data: {
                        endAngle,
                        radius,
                    } as Partial<ArcState>,
                });

                this.attachSegmentHover(segmentArc, {
                    color,
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

                // Fade each to its intended rest opacity on entry (hidden labels/connectors settle at
                // 0 so they can later fade *in* on an update, rather than sitting at full opacity).
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
                } = item;

                const arc = group.query('arc') as Arc;
                const label = group.query('text') as Text;
                const connector = group.query('polyline') as Polyline;

                const resolvedColor = item.color ?? (arc.stroke as string);

                const arcData = {
                    cx,
                    cy,
                    radius,
                    innerRadius,
                    startAngle,
                    endAngle,
                    padAngle,
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

            this.groups = [
                ...entries,
                ...updates,
            ];

            this.registerHighlightGroups(this.groups);

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

                // Fade in the non-arc children (labels and any outside-label connectors) to their
                // intended rest opacity (hidden ones settle at 0), read from each element's `.data`.
                return renderer.transition(elements.filter(element => !elementIsArc(element)), element => ({
                    duration: animDuration * 1.5,
                    ease: easeOutQuint,
                    state: element.data as Partial<BaseElementState>,
                }));
            }

            async function transitionUpdates() {
                return renderer.transition(updates, element => ({
                    duration: animDuration * 0.8,
                    ease: easeOutQuint,
                    state: element.data as Partial<BaseElementState>,
                }));
            }

            async function transitionExits() {
                return renderer.transition(exits, element => ({
                    duration: animDuration * 0.8,
                    ease: easeOutQuint,
                    state: element.data as Partial<BaseElementState>,
                    onComplete: element => element.destroy(),
                }));
            }

            return Promise.all([
                gridTransition,
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
            y: number; }): PolarAreaChartSegmentEvent => ({
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
            content: () => `${label}: ${formatValue(value)}`,
            highlight: { fill: color },
            restore: { fill: setColorAlpha(color, REST_ALPHA) },
            onEnter: point => this.emit('segmententer', payload(point)),
            onLeave: point => this.emit('segmentleave', payload(point)),
            onClick: point => this.emit('segmentclick', payload(point)),
        });
    }
}

/** Factory function that creates a new {@link PolarAreaChart} instance. */
export function createPolarAreaChart<TData = unknown>(target: string | HTMLElement | Context, options: PolarAreaChartOptions<TData>) {
    return new PolarAreaChart<TData>(target, options);
}
