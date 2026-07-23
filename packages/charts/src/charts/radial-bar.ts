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
    ChartDataLabelsInput,
    ChartLegendInput,
    ValueFormatInput,
} from '../core/options';

import {
    normalizeDataLabels,
    resolveValueFormat,
} from '../core/options';

import {
    applyHoverHighlight,
} from '../core/interaction';

import {
    ANIMATION_REFERENCE,
    exitElement,
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
    Text,
    TextState,
} from '@ripl/core';

import {
    createArc,
    createGroup,
    createText,
    easeOutCubic,
    getThetaPoint,
    setColorAlpha,
} from '@ripl/core';

import {
    arrayJoin,
    functionIdentity,
    numberClamp,
    numberExtent,
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
    /** Optional accessor for a per-item color override (otherwise a palette color is generated). */
    colorBy?: keyof TData | ((item: TData) => string);
    /** Maximum value mapped to a full sweep (defaults to the largest value in the data). */
    maxValue?: number;
    /** Inner hole radius as a ratio of the chart size (0–1). Defaults to 0.2. */
    innerRadius?: number;
    /** Angular sweep of a full-value bar, in degrees. Defaults to 360 (a full circle). */
    range?: number;
    /** Gap between concentric rings as a ratio of the ring thickness (0–0.9). Defaults to 0.25. */
    gap?: number;
    /** Color of the faint full-length track drawn behind each value bar. Defaults to a light gray. */
    trackColor?: string;
    /** Round the ends of each value bar (and its track). Defaults to `false`. */
    rounded?: boolean;
    /** Legend configuration. Shown by default when there is more than one ring. */
    legend?: ChartLegendInput;
    /** Format applied to values shown as text (e.g. tooltips). */
    format?: ValueFormatInput;
    /** Show each ring's value just past the end of its bar, at the ring's mid-radius (`true`/`false` or detailed label options). Off by default. */
    labels?: ChartDataLabelsInput;
}

/** Payload emitted for radial bar interaction events. */
export interface RadialBarChartBarEvent {
    /** X position of the chart center, in canvas coordinates. */
    x: number;
    /** Y position of the chart center, in canvas coordinates. */
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
                // annular sector) would land halfway to the center. Anchor at the mid-sweep point
                // on the band centerline instead, honoring the animated target state in `data`.
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
                    active: this.isItemActive(getKey(item)),
                }))
                : [];

            this.reserveLegend(layout, legendItems, this.options.legend);

            const area = layout.area;
            const { cx, cy, size } = areaCenter(area);
            const outerRadius = (size / 2) * 0.92;
            const holeRadius = outerRadius * innerRadius;

            // Legend-hidden rings are excluded from the banding, so the remaining rings thicken to
            // fill the radial range and the sweep scale re-fits the visible values.
            const activeData = this.filterActive(data, getKey);

            const values = activeData.map(getValue);
            const [, dataMax] = values.length ? numberExtent(values, functionIdentity) : [0, 1];
            const maxValue = this.options.maxValue ?? (dataMax > 0 ? dataMax : 1);
            const sweep = (range * Math.PI) / 180;

            const bandCount = Math.max(1, activeData.length);
            const band = (outerRadius - holeRadius) / bandCount;

            // Geometry for the ring at data index `i` (first category outermost). Bars are stroked
            // arcs, so we return the band centerline radius + thickness (the stroke width) rather
            // than an inner/outer pair.
            const ringGeometry = (i: number, itemValue: number) => {
                const ringOuter = outerRadius - i * band;
                const thickness = band * (1 - gap);
                const center = ringOuter - thickness / 2;
                const endAngle = TOP_ANGLE + numberClamp(itemValue / maxValue, 0, 1) * sweep;

                return {
                    center,
                    thickness,
                    endAngle,
                };
            };

            const dataLabels = normalizeDataLabels(this.options.labels);
            const exitAnimation = this.resolveAnimation(ANIMATION_REFERENCE.exit);

            // The value label sits just past the bar's sweep end, on the ring's centerline. The
            // angular clearance covers half the stroke thickness (a rounded cap extends that far
            // beyond `endAngle`) plus a small pixel gap, converted to radians at the ring's radius.
            const labelPoint = (geometry: ReturnType<typeof ringGeometry>) => {
                const clearance = geometry.center > 0 ? (geometry.thickness / 2 + 6) / geometry.center : 0;
                const [x, y] = getThetaPoint(geometry.endAngle + clearance, geometry.center, cx, cy);

                return {
                    x,
                    y,
                };
            };

            const buildLabel = (item: TData, geometry: ReturnType<typeof ringGeometry>): Text => {
                const { x, y } = labelPoint(geometry);

                return createText({
                    id: `${getKey(item)}-label`,
                    class: 'radial-bar__label',
                    content: formatValue(getValue(item)),
                    x,
                    y,
                    textAlign: 'center',
                    textBaseline: 'middle',
                    font: dataLabels.font,
                    fill: dataLabels.fontColor,
                    pointerEvents: 'none',
                    opacity: 0,
                    data: {
                        opacity: 1,
                    } as Partial<TextState>,
                });
            };

            const {
                left: entries,
                inner: updates,
                right: exits,
            } = arrayJoin(activeData, this._groups, (item, group) => group.id === getKey(item));

            exits.forEach(group => group.destroy());

            const entryGroups = entries.map(item => {
                const i = activeData.indexOf(item);
                const itemColor = colorFor(item);
                const { center, thickness, endAngle } = ringGeometry(i, getValue(item));

                const track = createArc({
                    id: `${getKey(item)}-track`,
                    class: 'radial-bar__track',
                    cx,
                    cy,
                    radius: center,
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
                    radius: center,
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
                    children: [
                        track,
                        bar,
                        ...(dataLabels.visible ? [buildLabel(item, {
                            center,
                            thickness,
                            endAngle,
                        })] : []),
                    ],
                });
            });

            const enteringLabels: Text[] = [];
            const updatingLabels: Text[] = [];

            updates.forEach(([item, group]) => {
                const i = activeData.indexOf(item);
                const itemColor = colorFor(item);
                const { center, thickness, endAngle } = ringGeometry(i, getValue(item));

                const track = group.query('.radial-bar__track') as Arc;
                const bar = group.query('.radial-bar__bar') as Arc;

                if (track) {
                    // lineCap isn't a tweenable value, so apply it directly so toggling `rounded`
                    // takes effect on update, not just first render.
                    track.lineCap = lineCap;
                    track.stroke = trackColor;
                    track.data = {
                        cx,
                        cy,
                        radius: center,
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
                        radius: center,
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

                // Reconcile the value label against the current `labels` option so it can be
                // toggled and restyled at runtime, tracking the bar's sweep end as values change.
                const valueLabel = group.query('.radial-bar__label') as Text | null;

                if (!dataLabels.visible) {
                    if (valueLabel) {
                        void exitElement(this.renderer, valueLabel, exitAnimation, { opacity: 0 });
                    }

                    return;
                }

                const geometry = {
                    center,
                    thickness,
                    endAngle,
                };

                if (!valueLabel) {
                    const entering = buildLabel(item, geometry);

                    group.add(entering);
                    enteringLabels.push(entering);

                    return;
                }

                const { x, y } = labelPoint(geometry);

                // Text content isn't tweenable, so apply it directly.
                valueLabel.content = formatValue(getValue(item));
                valueLabel.font = dataLabels.font;
                valueLabel.data = {
                    x,
                    y,
                    fill: dataLabels.fontColor,
                    opacity: 1,
                } as Partial<TextState>;

                updatingLabels.push(valueLabel);
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

            // Entry labels fade in alongside the sweeping bars; entering/updating labels on update
            // fade in or glide to the refreshed sweep end. Exiting labels fade via `exitElement`.
            const entryLabels = entryGroups.map(group => group.query('.radial-bar__label') as Text).filter(Boolean);

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
                this.renderer.transition(entryLabels, (element, index, length) => ({
                    duration: enter.duration,
                    delay: stagger(index, length, enter.duration),
                    ease: easeOutCubic,
                    state: element.data as Partial<TextState>,
                })),
                this.renderer.transition([...enteringLabels, ...updatingLabels], element => ({
                    duration: update.duration,
                    ease: easeOutCubic,
                    state: element.data as Partial<TextState>,
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
