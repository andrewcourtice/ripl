import type {
    BaseChartOptions,
} from '../core/chart';
import {
    Chart,
} from '../core/chart';

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
    stagger,
} from '../core/animation';

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
    Context,
    EventMap,
    Group,
} from '@ripl/core';
import {
    createArc,
    createGroup,
    easeOutCubic,
    getExtent,
    getThetaPoint,
    setColorAlpha,
} from '@ripl/core';

import {
    arrayJoin,
    functionIdentity,
} from '@ripl/utilities';

const TOP_ANGLE = -Math.PI / 2;

/** Opacity applied to a bar's fill at rest (full opacity on hover). */
const REST_ALPHA = 0.85;

/** Options for configuring a {@link RadialBarChart}. */
export interface RadialBarChartOptions<TData = unknown> extends BaseChartOptions {
    data: TData[];
    key: keyof TData | ((item: TData) => string);
    value: keyof TData | ((item: TData) => number);
    label?: keyof TData | ((item: TData) => string);
    color?: keyof TData | ((item: TData) => string);
    /** Maximum value mapped to a full sweep (defaults to the largest value in the data). */
    maxValue?: number;
    /** Inner hole radius as a ratio of the chart size (0–1). Defaults to 0.2. */
    innerRadius?: number;
    /** Angular sweep of a full-value bar, in degrees. Defaults to 360 (a full circle). */
    range?: number;
    /** Gap between concentric rings as a ratio of the ring thickness (0–0.9). Defaults to 0.25. */
    gap?: number;
    trackColor?: string;
    /** Round the ends of each value bar (and its track). Defaults to `false`. */
    rounded?: boolean;
    /** @deprecated Use `rounded`. Any value `> 0` rounds the bar ends. */
    cornerRadius?: number;
    legend?: ChartLegendInput;
    /** Format applied to values shown as text (e.g. tooltips). */
    format?: ValueFormatInput;
}

/** Payload emitted for radial bar interaction events. */
export interface RadialBarChartBarEvent {
    x: number;
    y: number;
    value: number;
    label: string;
    key: string;
}

/** Events emitted by a {@link RadialBarChart} that consumers can subscribe to via `chart.on(...)`. */
export interface RadialBarChartEventMap extends EventMap {
    barclick: RadialBarChartBarEvent;
    barenter: RadialBarChartBarEvent;
    barleave: RadialBarChartBarEvent;
}

/**
 * Radial bar chart rendering each category as a concentric ring whose arc length encodes its value.
 *
 * Each ring has a faint full-length track behind a colored value arc that sweeps clockwise from the
 * top. Supports a configurable hole, ring gap, angular range, rounded caps, tooltips, a legend, and
 * animated entry/update/exit transitions.
 *
 * @typeParam TData - The type of each data item in the dataset.
 */
export class RadialBarChart<TData = unknown> extends Chart<RadialBarChartOptions<TData>, RadialBarChartEventMap> {

    private groups: Group[] = [];
    private tooltip: Tooltip;

    constructor(target: string | HTMLElement | Context, options: RadialBarChartOptions<TData>) {
        super(target, options);

        this.tooltip = new Tooltip({
            scene: this.scene,
            renderer: this.renderer,
        });

        this.init();
    }

    private attachBarHover(arc: Arc, values: RadialBarChartBarEvent, color: string, content: string) {
        const hover = this.resolveAnimation(ANIMATION_REFERENCE.hover);

        const payload = (point: { x: number;
            y: number; }): RadialBarChartBarEvent => ({
            ...values,
            x: point.x,
            y: point.y,
        });

        applyHoverHighlight(arc, {
            renderer: this.renderer,
            duration: hover.duration,
            ease: hover.ease,
            tooltip: this.tooltip,
            anchor: () => {
                // Bars are stroked open arcs (no inner radius), so `getCentroid` (which assumes an
                // annular sector) would land halfway to the centre. Anchor at the mid-sweep point
                // on the band centreline instead, honouring the animated target state in `data`.
                const state = (arc.data ?? {}) as Partial<ArcState>;
                const radius = state.radius ?? arc.radius;
                const startAngle = state.startAngle ?? arc.startAngle;
                const endAngle = state.endAngle ?? arc.endAngle;
                const [x, y] = getThetaPoint((startAngle + endAngle) / 2, radius, arc.cx, arc.cy);
                return {
                    x,
                    y,
                };
            },
            content: () => content,
            highlight: { stroke: color },
            restore: { stroke: setColorAlpha(color, REST_ALPHA) },
            onEnter: point => this.emit('barenter', payload(point)),
            onLeave: point => this.emit('barleave', payload(point)),
            onClick: point => this.emit('barclick', payload(point)),
        });
    }

    public async render() {
        return super.render(async () => {
            const {
                data,
                key,
                value,
                label,
                color,
                innerRadius = 0.2,
                range = 360,
                gap = 0.25,
                trackColor = '#eceff3',
                rounded,
                cornerRadius = 0,
            } = this.options;

            // `rounded` is the primary control; `cornerRadius > 0` remains a back-compat alias.
            const lineCap = (rounded ?? cornerRadius > 0) ? 'round' : 'butt';

            const getKey = resolveAccessor<TData, string>(key);
            const getValue = resolveAccessor<TData, number>(value);
            const getLabel = label !== undefined ? resolveAccessor<TData, string>(label) : getKey;
            const getColor = (item: TData): string | undefined => (color ? resolveAccessor<TData, string>(color)(item) : undefined);

            this.resolveSeriesColors(data.map(item => ({
                id: getKey(item),
                color: getColor(item),
            })));

            const colorFor = (item: TData) => getColor(item) ?? this.getSeriesColor(getKey(item));
            const formatValue = resolveValueFormat(this.options.format);

            const layout = this.createLayout();
            this.reserveTitle(layout);

            const legendItems: LegendItem[] = data.length > 1
                ? data.map(item => ({
                    id: getKey(item),
                    label: getLabel(item),
                    color: colorFor(item),
                    active: true,
                }))
                : [];

            this.reserveLegend(layout, legendItems, this.options.legend);

            const area = layout.area;
            const cx = area.x + area.width / 2;
            const cy = area.y + area.height / 2;
            const outerRadius = (Math.min(area.width, area.height) / 2) * 0.92;
            const holeRadius = outerRadius * innerRadius;

            const values = data.map(getValue);
            const [, dataMax] = values.length ? getExtent(values, functionIdentity) : [0, 1];
            const maxValue = this.options.maxValue ?? (dataMax > 0 ? dataMax : 1);
            const sweep = (range * Math.PI) / 180;

            const bandCount = Math.max(1, data.length);
            const band = (outerRadius - holeRadius) / bandCount;

            // Geometry for the ring at data index `i` (first category outermost). Bars are stroked
            // arcs, so we return the band centreline radius + thickness (the stroke width) rather
            // than an inner/outer pair.
            const ringGeometry = (i: number, itemValue: number) => {
                const ringOuter = outerRadius - i * band;
                const thickness = band * (1 - gap);
                const centre = ringOuter - thickness / 2;
                const endAngle = TOP_ANGLE + Math.max(0, Math.min(1, itemValue / maxValue)) * sweep;

                return {
                    centre,
                    thickness,
                    endAngle,
                };
            };

            const {
                left: entries,
                inner: updates,
                right: exits,
            } = arrayJoin(data, this.groups, (item, group) => group.id === getKey(item));

            exits.forEach(group => group.destroy());

            const entryGroups = entries.map(item => {
                const i = data.indexOf(item);
                const itemColor = colorFor(item);
                const { centre, thickness, endAngle } = ringGeometry(i, getValue(item));

                const track = createArc({
                    id: `${getKey(item)}-track`,
                    class: 'radial-bar__track',
                    cx,
                    cy,
                    radius: centre,
                    startAngle: TOP_ANGLE,
                    endAngle: TOP_ANGLE + sweep,
                    stroke: trackColor,
                    lineWidth: thickness,
                    lineCap,
                    pointerEvents: 'none',
                });

                track.autoFill = false;

                const bar = createArc({
                    id: `${getKey(item)}-bar`,
                    class: 'radial-bar__bar',
                    cx,
                    cy,
                    radius: centre,
                    startAngle: TOP_ANGLE,
                    endAngle: TOP_ANGLE,
                    stroke: setColorAlpha(itemColor, REST_ALPHA),
                    lineWidth: thickness,
                    lineCap,
                    data: {
                        endAngle,
                    } as Partial<ArcState>,
                });

                bar.autoFill = false;

                this.attachBarHover(bar, {
                    x: cx,
                    y: cy,
                    value: getValue(item),
                    label: getLabel(item),
                    key: getKey(item),
                }, itemColor, `${getLabel(item)}: ${formatValue(getValue(item))}`);

                return createGroup({
                    id: getKey(item),
                    class: 'radial-bar__segment',
                    children: [track, bar],
                });
            });

            updates.forEach(([item, group]) => {
                const i = data.indexOf(item);
                const itemColor = colorFor(item);
                const { centre, thickness, endAngle } = ringGeometry(i, getValue(item));

                const track = group.query('.radial-bar__track') as Arc;
                const bar = group.query('.radial-bar__bar') as Arc;

                if (track) {
                    // lineCap isn't a tweenable value — apply it directly so toggling `rounded`
                    // takes effect on update, not just first render.
                    track.lineCap = lineCap;
                    track.stroke = trackColor;
                    track.data = {
                        cx,
                        cy,
                        radius: centre,
                        lineWidth: thickness,
                        startAngle: TOP_ANGLE,
                        endAngle: TOP_ANGLE + sweep,
                    } as Partial<ArcState>;
                }

                if (bar) {
                    bar.lineCap = lineCap;
                    bar.stroke = setColorAlpha(itemColor, REST_ALPHA);
                    bar.data = {
                        cx,
                        cy,
                        radius: centre,
                        lineWidth: thickness,
                        startAngle: TOP_ANGLE,
                        endAngle,
                    } as Partial<ArcState>;

                    this.attachBarHover(bar, {
                        x: cx,
                        y: cy,
                        value: getValue(item),
                        label: getLabel(item),
                        key: getKey(item),
                    }, itemColor, `${getLabel(item)}: ${formatValue(getValue(item))}`);
                }
            });

            this.scene.add(entryGroups);

            this.groups = [
                ...entryGroups,
                ...updates.map(([, group]) => group),
            ];

            this.registerHighlightGroups(this.groups);

            const enter = this.resolveAnimation(ANIMATION_REFERENCE.enter);
            const update = this.resolveAnimation(ANIMATION_REFERENCE.update);

            const entryBars = entryGroups.map(group => group.query('.radial-bar__bar') as Arc).filter(Boolean);
            const trackAndUpdateArcs = [
                ...entryGroups.map(group => group.query('.radial-bar__track') as Arc).filter(Boolean),
                ...updates.flatMap(([, group]) => [group.query('.radial-bar__track') as Arc, group.query('.radial-bar__bar') as Arc]).filter(Boolean),
            ];

            return Promise.all([
                this.renderer.transition(entryBars, (element, index, length) => ({
                    duration: enter.duration,
                    delay: stagger(index, length, enter.duration),
                    ease: easeOutCubic,
                    state: element.data as Partial<ArcState>,
                })),
                this.renderer.transition(trackAndUpdateArcs, element => ({
                    duration: update.duration,
                    ease: easeOutCubic,
                    state: element.data as Partial<ArcState>,
                })),
            ]);
        });
    }

}

/** Factory function that creates a new {@link RadialBarChart} instance. */
export function createRadialBarChart<TData = unknown>(target: string | HTMLElement | Context, options: RadialBarChartOptions<TData>) {
    return new RadialBarChart<TData>(target, options);
}
