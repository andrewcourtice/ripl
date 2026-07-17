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
    ValueFormatInput,
} from '../core/options';

import {
    resolveValueFormat,
} from '../core/options';

import {
    applyHoverHighlight,
} from '../core/interaction';

import {
    ANIMATION_REFERENCE,
} from '../core/animation';

import type {
    getColorGenerator,
} from '../constants/colors';

import {
    Tooltip,
} from '../components/tooltip';

import type {
    LegendItem,
} from '../components/legend';

import type {
    Arc,
    ArcState,
    Context,
    EventMap,
    Group,
} from '@ripl/core';

import {
    createArc,
    createGroup,
    easeOutQuint,
    scaleContinuous,
    setColorAlpha,
    TAU,
} from '@ripl/core';

import {
    arrayJoin,
    numberSum,
} from '@ripl/utilities';

/** The opacity applied to a segment's fill at rest (full opacity is used on hover). */
const REST_ALPHA = 0.65;

/** A node in a sunburst hierarchy with optional nested children and an optional typed datum. */
export interface SunburstNode<TData = unknown> {
    /** Unique identifier for the node. */
    id: string;
    /** Display label shown in the legend and tooltips. */
    label: string;
    /** The node's numeric value, which determines its angular extent. */
    value: number;
    /** Optional colour override; child nodes inherit their parent's colour when omitted. */
    color?: string;
    /** Child nodes rendered in the next ring outward, within this node's angular range. */
    children?: SunburstNode<TData>[];
    /** Arbitrary datum carried through to segment interaction events. */
    data?: TData;
}

/** Options for configuring a {@link SunburstChart}. */
export interface SunburstChartOptions<TData = unknown> extends BaseChartOptions {
    /** The root nodes of the hierarchy to render as concentric rings. */
    data: SunburstNode<TData>[];
    /** Legend configuration, listing the top-level nodes. */
    legend?: ChartLegendInput;
    /** Format applied to node values shown as text (e.g. tooltips). */
    format?: ValueFormatInput;
}

/** Payload emitted for sunburst segment interaction events. */
export interface SunburstChartSegmentEvent<TData = unknown> {
    /** X position of the segment centroid, in canvas coordinates. */
    x: number;
    /** Y position of the segment centroid, in canvas coordinates. */
    y: number;
    /** The node's numeric value. */
    value: number;
    /** The node's display label. */
    label: string;
    /** The node's unique id. */
    id: string;
    /** The datum from the source {@link SunburstNode}, if one was provided. */
    data?: TData;
}

/** Events emitted by a {@link SunburstChart} that consumers can subscribe to via `chart.on(...)`. */
export interface SunburstChartEventMap<TData = unknown> extends EventMap {
    /** Emitted when a segment is clicked. */
    segmentclick: SunburstChartSegmentEvent<TData>;
    /** Emitted when the pointer enters a segment. */
    segmententer: SunburstChartSegmentEvent<TData>;
    /** Emitted when the pointer leaves a segment. */
    segmentleave: SunburstChartSegmentEvent<TData>;
}

interface FlattenedArc<TData = unknown> {
    id: string;
    label: string;
    value: number;
    color: string;
    depth: number;
    startAngle: number;
    endAngle: number;
    data?: TData;
}

function flattenNodes<TData = unknown>(
    nodes: SunburstNode<TData>[],
    depth: number,
    startAngle: number,
    endAngle: number,
    colorGenerator: ReturnType<typeof getColorGenerator>,
    parentColor?: string,
    resolvedColors?: Map<string, string>
): FlattenedArc<TData>[] {
    const total = numberSum(nodes, node => node.value);

    if (total === 0) return [];

    const scale = scaleContinuous([0, total], [startAngle, endAngle], {
        clamp: true,
    });

    let currentAngle = startAngle;
    const result: FlattenedArc<TData>[] = [];

    nodes.forEach(node => {
        const nodeEndAngle = currentAngle + (scale(node.value) - scale(0));
        const color = resolvedColors?.get(node.id) ?? node.color ?? parentColor ?? colorGenerator.next().value!;

        result.push({
            id: node.id,
            label: node.label,
            value: node.value,
            color,
            depth,
            startAngle: currentAngle,
            endAngle: nodeEndAngle,
            data: node.data,
        });

        if (node.children && node.children.length > 0) {
            result.push(...flattenNodes(
                node.children,
                depth + 1,
                currentAngle,
                nodeEndAngle,
                colorGenerator,
                color
            ));
        }

        currentAngle = nodeEndAngle;
    });

    return result;
}

/**
 * Sunburst chart rendering hierarchical data as concentric arc rings.
 *
 * Each depth level is rendered as a ring of arc segments whose angular
 * extent is proportional to the node's value. Child nodes inherit parent
 * colors and are positioned within the parent's angular range. Supports
 * legend, tooltips, and staggered radial entry animations.
 */
export class SunburstChart<TData = unknown> extends Chart<SunburstChartOptions<TData>, SunburstChartEventMap<TData>> {

    private _groups: Group[] = [];
    private _tooltip: Tooltip;

    constructor(target: string | HTMLElement | Context, options: SunburstChartOptions<TData>) {
        super(target, options);

        this._tooltip = new Tooltip({
            scene: this.scene,
            renderer: this.renderer,
            placement: 'center',
        });

        this.init();
    }

    public async render() {
        return super.render(async (scene, renderer) => {
            const { data } = this.options;

            const colorGenerator = this.colorGenerator;

            // Resolve top-level node colours through the shared, id-keyed colour map so they stay
            // stable across data updates (randomising values must not reshuffle colours). Child
            // nodes inherit their parent's colour via `flattenNodes`.
            this.resolveSeriesColors(data.map(node => ({
                id: node.id,
                color: node.color,
            })));

            const resolvedColors = new Map<string, string>(
                data.map(node => [node.id, node.color ?? this.getSeriesColor(node.id)])
            );

            // Shared layout pass: reserve title and legend bands.
            const layout = this.createLayout();
            this.reserveTitle(layout);

            const legendItems: LegendItem[] = data.map(node => ({
                id: node.id,
                label: node.label,
                color: resolvedColors.get(node.id)!,
                active: true,
            }));

            this.reserveLegend(layout, legendItems, this.options.legend);

            const area = layout.area;
            const { cx, cy, size } = areaCenter(area);

            const offset = TAU / 4;
            const arcs = flattenNodes(data, 0, -offset, TAU - offset, colorGenerator, undefined, resolvedColors);

            // Find max depth
            let maxDepth = 0;

            arcs.forEach(arc => {
                maxDepth = Math.max(maxDepth, arc.depth);
            });

            const ringWidth = (size * 0.45) / (maxDepth + 1);
            const innerBaseRadius = size * 0.08;

            const {
                left: entries,
                inner: updates,
                right: exits,
            } = arrayJoin(arcs, this._groups, (arc, group) => arc.id === group.id);

            exits.forEach(el => el.destroy());

            const entryGroups = entries.map(arc => {
                const innerRadius = innerBaseRadius + arc.depth * ringWidth;
                const outerRadius = innerRadius + ringWidth - 2;
                const padAngle = 0.02;

                const segment = createArc({
                    id: `${arc.id}-arc`,
                    cx,
                    cy,
                    startAngle: arc.startAngle,
                    endAngle: arc.startAngle,
                    radius: 0,
                    innerRadius: 0,
                    padAngle,
                    fill: setColorAlpha(arc.color, REST_ALPHA),
                    stroke: arc.color,
                    lineWidth: 1,
                    data: {
                        endAngle: arc.endAngle,
                        radius: outerRadius,
                        innerRadius,
                    } as Partial<ArcState>,
                });

                this._attachSegmentHover(segment, arc);

                return createGroup({
                    id: arc.id,
                    children: [segment],
                });
            });

            const updateGroups = updates.map(([arc, group]) => {
                const innerRadius = innerBaseRadius + arc.depth * ringWidth;
                const outerRadius = innerRadius + ringWidth - 2;
                const segment = group.query('arc') as Arc;

                if (segment) {
                    segment.data = {
                        cx,
                        cy,
                        startAngle: arc.startAngle,
                        endAngle: arc.endAngle,
                        radius: outerRadius,
                        innerRadius,
                        fill: setColorAlpha(arc.color, REST_ALPHA),
                        stroke: arc.color,
                    } as Partial<ArcState>;

                    this._attachSegmentHover(segment, arc);
                }

                return group;
            });

            scene.add(entryGroups);

            this._groups = [
                ...entryGroups,
                ...updateGroups,
            ];

            // Animate entries
            const entryArcs = entryGroups.flatMap(g => g.getElementsByType('arc')) as Arc[];

            const entriesTransition = renderer.transition(entryArcs, (element, index, length) => ({
                duration: this.getAnimationDuration(1000),
                delay: index * (this.getAnimationDuration(800) / length),
                ease: easeOutQuint,
                state: element.data as Partial<ArcState>,
            }));

            // Animate updates
            const updateArcs = updateGroups.flatMap(g => g.getElementsByType('arc')) as Arc[];

            const updatesTransition = renderer.transition(updateArcs, element => ({
                duration: this.getAnimationDuration(1000),
                ease: easeOutQuint,
                state: element.data as Partial<ArcState>,
            }));

            return Promise.all([entriesTransition, updatesTransition]);
        });
    }

    private _attachSegmentHover(segment: Arc, arc: FlattenedArc<TData>) {
        const formatValue = resolveValueFormat(this.options.format);

        const payload = (point: { x: number;
            y: number; }): SunburstChartSegmentEvent<TData> => ({
            x: point.x,
            y: point.y,
            value: arc.value,
            label: arc.label,
            id: arc.id,
            data: arc.data,
        });

        applyHoverHighlight(segment, {
            renderer: this.renderer,
            animation: () => this.resolveAnimation(ANIMATION_REFERENCE.hover),
            tooltip: this._tooltip,
            anchor: () => {
                const [x, y] = segment.getCentroid(segment.data as Partial<ArcState>);
                return {
                    x,
                    y,
                };
            },
            content: () => `${arc.label}: ${formatValue(arc.value)}`,
            highlight: { fill: arc.color },
            restore: { fill: setColorAlpha(arc.color, REST_ALPHA) },
            onEnter: point => this.emit('segmententer', payload(point)),
            onLeave: point => this.emit('segmentleave', payload(point)),
            onClick: point => this.emit('segmentclick', payload(point)),
        });
    }

}

/**
 * Factory function that creates a new {@link SunburstChart} instance.
 *
 * @example
 * ```ts
 * createSunburstChart(target, {
 *     data: [{
 *         id: 'root',
 *         label: 'Budget',
 *         value: 100,
 *         children: [
 *             { id: 'ops', label: 'Operations', value: 60 },
 *             { id: 'rnd', label: 'R&D', value: 40 },
 *         ],
 *     }],
 * });
 * ```
 */
export function createSunburstChart<TData = unknown>(target: string | HTMLElement | Context, options: SunburstChartOptions<TData>) {
    return new SunburstChart<TData>(target, options);
}
