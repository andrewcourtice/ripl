import type {
    NumericAccessor,
} from '../core/data';

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
    clamp,
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
    /** The dataset to render, one concentric ring per item. */
    data: TData[];
    /** Accessor for each item's unique key, used to match rings across data updates. */
    key: keyof TData | ((item: TData) => string);
    /** Accessor for each item's numeric value, which determines its arc length. */
    value: NumericAccessor<TData>;
    /** Optional accessor for each item's display label (defaults to its key). */
    label?: keyof TData | ((item: TData) => string);
    /** Optional accessor for a per-item colour override (otherwise a palette colour is generated). */
    colorBy?: keyof TData | ((item: TData) => string);
    /** Maximum value mapped to a full sweep (defaults to the largest value in the data). */
    maxValue?: number;
    /** Inner hole radius as a ratio of the chart size (0–1). Defaults to 0.2. */
    innerRadius?: number;
    /** Angular sweep of a full-value bar, in degrees. Defaults to 360 (a full circle). */
    range?: number;
    /** Gap between concentric rings as a ratio of the ring thickness (0–0.9). Defaults to 0.25. */
    gap?: number;
    /** Colour of the faint full-length track drawn behind each value bar. Defaults to a light grey. */
    trackColor?: string;
    /** Round the ends of each value bar (and its track). Defaults to `false`. */
    rounded?: boolean;
    /** Legend configuration. Shown by default when there is more than one ring. */
    legend?: ChartLegendInput;
    /** Format applied to values shown as text (e.g. tooltips). */
    format?: ValueFormatInput;
}

/** Payload emitted for radial bar interaction events. */
export interface RadialBarChartBarEvent {
    /** X position of the chart centre, in canvas coordinates. */
    x: number;
    /** Y position of the chart centre, in canvas coordinates. */
    y: number;
    /** The bar's numeric value. */
    value: number;
    /** The bar's display label. */
    label: string;
    /** The bar's unique key. */
    key: string;
}

/** Events emitted by a {@link RadialBarChart} that consumers can subscribe to via `chart.on(...)`. */
export interface RadialBarChartEventMap extends EventMap {
    /** Emitted when a bar is clicked. */
    barclick: RadialBarChartBarEvent;
    /** Emitted when the pointer enters a bar. */
    barenter: RadialBarChartBarEvent;
    /** Emitted when the pointer leaves a bar. */
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

    private _groups: Group[] = [];
    private _tooltip: Tooltip;

    constructor(target: string | HTMLElement | Context, options: RadialBarChartOptions<TData>) {
        super(target, options);

        this._tooltip = new Tooltip({
            scene: this.scene,
            renderer: this.renderer,
        });

        this.init();
    }

    private _attachBarHover(arc: Arc, values: RadialBarChartBarEvent, color: string, content: string) {

        const payload = (point: { x: number;
            y: number; }): RadialBarChartBarEvent => ({
            ...values,
            x: point.x,
            y: point.y,
        });

        applyHoverHighlight(arc, {
            renderer: this.renderer,
            animation: () => this.resolveAnimation(ANIMATION_REFERENCE.hover),
            tooltip: this._tooltip,
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
                colorBy,
                innerRadius = 0.2,
                range = 360,
                gap = 0.25,
                trackColor = '#eceff3',
                rounded,
            } = this.options;

            const lineCap = rounded ? 'round' : 'butt';

            const getKey = resolveAccessor<TData, string>(key);
            const getValue = resolveAccessor<TData, number>(value);
            const getLabel = label !== undefined ? resolveAccessor<TData, string>(label) : getKey;
            const getColor = (item: TData): string | undefined => (colorBy ? resolveAccessor<TData, string>(colorBy)(item) : undefined);

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
                const endAngle = TOP_ANGLE + clamp(itemValue / maxValue, 0, 1) * sweep;

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
            } = arrayJoin(data, this._groups, (item, group) => group.id === getKey(item));

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

                this._attachBarHover(bar, {
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

                    this._attachBarHover(bar, {
                        x: cx,
                        y: cy,
                        value: getValue(item),
                        label: getLabel(item),
                        key: getKey(item),
                    }, itemColor, `${getLabel(item)}: ${formatValue(getValue(item))}`);
                }
            });

            this.scene.add(entryGroups);

            this._groups = [
                ...entryGroups,
                ...updates.map(([, group]) => group),
            ];

            this.registerHighlightGroups(this._groups);

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

/**
 * Factory function that creates a new {@link RadialBarChart} instance.
 *
 * @example
 * ```ts
 * createRadialBarChart(target, {
 *     data: [
 *         { team: 'Design', progress: 82 },
 *         { team: 'Engineering', progress: 64 },
 *         { team: 'Sales', progress: 45 },
 *     ],
 *     key: 'team',
 *     value: 'progress',
 *     label: 'team',
 *     maxValue: 100,
 *     rounded: true,
 * });
 * ```
 */
export function createRadialBarChart<TData = unknown>(target: string | HTMLElement | Context, options: RadialBarChartOptions<TData>) {
    return new RadialBarChart<TData>(target, options);
}
