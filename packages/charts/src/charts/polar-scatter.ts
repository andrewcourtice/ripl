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
    Circle,
    CircleState,
    Context,
    EventMap,
    Group,
    Line,
    Scale,
    Text,
} from '@ripl/core';

import {
    createCircle,
    createGroup,
    createLine,
    createText,
    degreesToRadians,
    easeOutCubic,
    scaleContinuous,
    setColorAlpha,
} from '@ripl/core';

import {
    arrayJoin,
    functionIdentity,
    numberExtent,
} from '@ripl/utilities';

/** Opacity applied to a marker's fill at rest (full opacity on hover). */
const REST_ALPHA = 0.7;

/** Configuration for an individual polar scatter series. */
export interface PolarScatterSeriesOptions<TData> {
    /** Unique identifier for the series. */
    id: string;
    /** Optional colour override for the series (otherwise a palette colour is generated). */
    color?: string;
    /** Display label for the series (shown in the legend and tooltips). */
    label: string;
    /** Angular position in degrees (0° at the top, increasing clockwise). */
    angle: NumericAccessor<TData>;
    /** Radial position (distance from the centre), on the radial value scale. */
    radius: NumericAccessor<TData>;
    /** Optional accessor whose value scales each marker's size between `minRadius` and `maxRadius`. */
    sizeBy?: NumericAccessor<TData> | number;
    /** Smallest marker radius in pixels when `sizeBy` is set. Defaults to 4. */
    minRadius?: number;
    /** Largest marker radius in pixels when `sizeBy` is set. Defaults to 14. */
    maxRadius?: number;
}

/** Options for configuring a {@link PolarScatterChart}. */
export interface PolarScatterChartOptions<TData = unknown> extends BaseChartOptions {
    /** The dataset plotted across all series. */
    data: TData[];
    /** The series to render, each mapping the data to angle/radius positions. */
    series: PolarScatterSeriesOptions<TData>[];
    /** The value mapped to the outer radius (defaults to the largest radius value in the data). */
    maxValue?: number;
    /** Number of concentric value rings. Defaults to 4. */
    levels?: number;
    /** Number of angular spokes/labels around the circle. Defaults to 8. */
    angleTicks?: number;
    /** Legend configuration. Shown by default when there is more than one series. */
    legend?: ChartLegendInput;
    /** Format applied to radial values shown as text (tooltips + ring labels). */
    format?: ValueFormatInput;
}

/** Payload emitted for polar scatter marker interaction events. */
export interface PolarScatterMarkerEvent {
    /** X position of the marker, in canvas coordinates. */
    x: number;
    /** Y position of the marker, in canvas coordinates. */
    y: number;
    /** The marker's angular value, in degrees. */
    angleValue: number;
    /** The marker's radial value. */
    radiusValue: number;
    /** The marker's size value (0 when the series has no `sizeBy` accessor). */
    sizeValue: number;
    /** The id of the series the marker belongs to. */
    seriesId: string;
}

/** Events emitted by a {@link PolarScatterChart} that consumers can subscribe to via `chart.on(...)`. */
export interface PolarScatterChartEventMap extends EventMap {
    /** Emitted when a marker is clicked. */
    markerclick: PolarScatterMarkerEvent;
    /** Emitted when the pointer enters a marker. */
    markerenter: PolarScatterMarkerEvent;
    /** Emitted when the pointer leaves a marker. */
    markerleave: PolarScatterMarkerEvent;
}

/**
 * Polar scatter chart plotting points by angle and radius on a circular grid.
 *
 * Each point's angular position encodes one variable and its distance from the centre another, with
 * an optional third variable driving marker size. Renders concentric value rings and angular spokes,
 * with interactive tooltips, a legend, and animated entry/update/exit transitions.
 *
 * @typeParam TData - The type of each data item in the dataset.
 */
export class PolarScatterChart<TData = unknown> extends Chart<PolarScatterChartOptions<TData>, PolarScatterChartEventMap> {

    private _seriesGroups: Group[] = [];
    private _gridGroup?: Group;
    private _tooltip: Tooltip;
    private _radialScale!: Scale;

    constructor(target: string | HTMLElement | Context, options: PolarScatterChartOptions<TData>) {
        super(target, options);

        this._tooltip = new Tooltip({
            scene: this.scene,
            renderer: this.renderer,
        });

        this.init();
    }

    /** Converts an angle in degrees (0° at top, clockwise) to a canvas point at the given radius. */
    private _point(cx: number, cy: number, angleDeg: number, radius: number): [number, number] {
        const theta = degreesToRadians(angleDeg - 90);
        return [cx + radius * Math.cos(theta), cy + radius * Math.sin(theta)];
    }

    private _drawGrid(cx: number, cy: number, gridRadius: number, levels: number, angleTicks: number) {
        const formatValue = resolveValueFormat(this.options.format);

        if (!this._gridGroup) {
            this._gridGroup = createGroup({
                id: 'polar-scatter-grid',
                class: 'polar-scatter-grid',
                zIndex: 0,
            });

            this.scene.add(this._gridGroup);
        }

        // Concentric value rings + a value label on each.
        const ringIndices = Array.from({ length: levels }).map((_, i) => i + 1);
        const ringCircles = this._gridGroup.getElementsByType('circle') as Circle[];

        const {
            left: ringEntries,
            inner: ringUpdates,
            right: ringExits,
        } = arrayJoin(ringIndices, ringCircles, (level, circle) => circle.id === `ring-${level}`);

        ringExits.forEach(el => el.destroy());

        ringEntries.forEach(level => {
            const ring = createCircle({
                id: `ring-${level}`,
                cx,
                cy,
                radius: (gridRadius / levels) * level,
                fill: 'transparent',
                stroke: '#e5e7eb',
                lineWidth: 1,
            });

            this._gridGroup!.add(ring);
        });

        ringUpdates.forEach(([level, ring]) => {
            ring.cx = cx;
            ring.cy = cy;
            ring.radius = (gridRadius / levels) * level;
        });

        // Ring value labels (along the top spoke).
        const ringLabels = this._gridGroup.getElementsByType<Text>('text').filter(text => text.id.startsWith('ring-label-'));

        const {
            left: labelEntries,
            inner: labelUpdates,
            right: labelExits,
        } = arrayJoin(ringIndices, ringLabels, (level, text) => text.id === `ring-label-${level}`);

        labelExits.forEach(el => el.destroy());

        const ringValue = (level: number) => (this._radialScale.inverse ? this._radialScale.inverse((gridRadius / levels) * level) : 0);

        labelEntries.forEach(level => {
            const label = createText({
                id: `ring-label-${level}`,
                x: cx + 4,
                y: cy - (gridRadius / levels) * level,
                content: formatValue(ringValue(level)),
                fill: '#9ca3af',
                font: '10px sans-serif',
                textAlign: 'left',
                textBaseline: 'middle',
            });

            this._gridGroup!.add(label);
        });

        labelUpdates.forEach(([level, label]) => {
            label.content = formatValue(ringValue(level));
            label.x = cx + 4;
            label.y = cy - (gridRadius / levels) * level;
        });

        // Angular spokes + degree labels.
        const spokeIndices = Array.from({ length: angleTicks }).map((_, i) => i);
        const spokeStep = 360 / angleTicks;
        const spokeLines = this._gridGroup.getElementsByType<Line>('line');

        const {
            left: spokeEntries,
            inner: spokeUpdates,
            right: spokeExits,
        } = arrayJoin(spokeIndices, spokeLines, (index, line) => line.id === `spoke-${index}`);

        spokeExits.forEach(el => el.destroy());

        spokeEntries.forEach(index => {
            const [x2, y2] = this._point(cx, cy, index * spokeStep, gridRadius);

            const line = createLine({
                id: `spoke-${index}`,
                x1: cx,
                y1: cy,
                x2,
                y2,
                stroke: '#eceff3',
                lineWidth: 1,
            });

            this._gridGroup!.add(line);
        });

        spokeUpdates.forEach(([index, line]) => {
            const [x2, y2] = this._point(cx, cy, index * spokeStep, gridRadius);
            line.x1 = cx;
            line.y1 = cy;
            line.x2 = x2;
            line.y2 = y2;
        });

        const angleLabels = this._gridGroup.getElementsByType<Text>('text').filter(text => text.id.startsWith('angle-label-'));

        const {
            left: angleEntries,
            inner: angleUpdates,
            right: angleExits,
        } = arrayJoin(spokeIndices, angleLabels, (index, text) => text.id === `angle-label-${index}`);

        angleExits.forEach(el => el.destroy());

        const angleLabelProps = (index: number) => {
            const deg = index * spokeStep;
            const [x, y] = this._point(cx, cy, deg, gridRadius + 12);
            return {
                x,
                y,
                content: `${Math.round(deg)}°`,
            };
        };

        angleEntries.forEach(index => {
            const { x, y, content } = angleLabelProps(index);

            const label = createText({
                id: `angle-label-${index}`,
                x,
                y,
                content,
                fill: '#9ca3af',
                font: '10px sans-serif',
                textAlign: 'center',
                textBaseline: 'middle',
            });

            this._gridGroup!.add(label);
        });

        angleUpdates.forEach(([index, label]) => {
            const { x, y, content } = angleLabelProps(index);
            label.x = x;
            label.y = y;
            label.content = content;
        });
    }

    private _attachMarkerHover(marker: Circle, values: PolarScatterMarkerEvent, content: string, restFill: string, stroke: string, radius: number) {

        const payload = (point: { x: number;
            y: number; }): PolarScatterMarkerEvent => ({
            ...values,
            x: point.x,
            y: point.y,
        });

        applyHoverHighlight(marker, {
            renderer: this.renderer,
            animation: () => this.resolveAnimation(ANIMATION_REFERENCE.hover),
            tooltip: this._tooltip,
            anchor: () => ({
                x: marker.cx,
                y: marker.cy,
            }),
            content: () => content,
            highlight: {
                fill: stroke,
                radius: radius + 2,
            },
            restore: {
                fill: restFill,
                radius,
            },
            onEnter: point => this.emit('markerenter', payload(point)),
            onLeave: point => this.emit('markerleave', payload(point)),
            onClick: point => this.emit('markerclick', payload(point)),
        });
    }

    public async render() {
        return super.render(async () => {
            const {
                data,
                series,
                levels = 4,
                angleTicks = 8,
            } = this.options;

            this.resolveSeriesColors(series);

            const formatValue = resolveValueFormat(this.options.format);

            const layout = this.createLayout();
            this.reserveTitle(layout);

            const legendItems: LegendItem[] = series.length > 1
                ? series.map(srs => ({
                    id: srs.id,
                    label: srs.label,
                    color: this.getSeriesColor(srs.id),
                    active: this.isItemActive(srs.id),
                }))
                : [];

            this.reserveLegend(layout, legendItems, this.options.legend);

            const area = layout.area;
            const { cx, cy, size } = areaCenter(area);
            const gridRadius = (size / 2) * 0.82;

            // Legend-hidden series are excluded from the radial extent and rendering, so toggling a
            // series re-fits the value rings and animates its markers out through the exit join.
            const activeSeries = this.filterActive(series);

            // Radial value scale: 0 at the centre, the data max (or override) at the outer ring.
            const radiusValues = activeSeries.flatMap(srs => data.map(resolveAccessor<TData, number>(srs.radius)));
            const [, dataMax] = radiusValues.length ? numberExtent(radiusValues, functionIdentity) : [0, 1];
            const maxValue = this.options.maxValue ?? (dataMax > 0 ? dataMax : 1);

            this._radialScale = scaleContinuous([0, maxValue], [0, gridRadius], { clamp: true });

            this._drawGrid(cx, cy, gridRadius, levels, angleTicks);

            const enter = this.resolveAnimation(ANIMATION_REFERENCE.enter);

            const {
                left: seriesEntries,
                inner: seriesUpdates,
                right: seriesExits,
            } = arrayJoin(activeSeries, this._seriesGroups, 'id');

            seriesExits.forEach(group => group.destroy());

            // Computes a marker's target state, tooltip content, and event payload (no element).
            const computeMarker = (srs: PolarScatterSeriesOptions<TData>, item: TData, index: number) => {
                const getAngle = resolveAccessor<TData, number>(srs.angle);
                const getRadius = resolveAccessor<TData, number>(srs.radius);
                const color = srs.color ?? this.getSeriesColor(srs.id);
                const minRadius = srs.minRadius ?? 4;
                const maxRadius = srs.maxRadius ?? 14;

                const angleValue = getAngle(item);
                const radiusValue = getRadius(item);
                const [px, py] = this._point(cx, cy, angleValue, this._radialScale(radiusValue));

                let markerRadius = minRadius;
                let sizeValue = 0;

                if (srs.sizeBy !== undefined) {
                    const getSize = resolveAccessor<TData, number>(srs.sizeBy);
                    sizeValue = getSize(item);
                    const sizes = data.map(getSize);
                    const [sMin, sMax] = numberExtent(sizes, functionIdentity);
                    const ratio = sMax > sMin ? (sizeValue - sMin) / (sMax - sMin) : 0.5;
                    markerRadius = minRadius + ratio * (maxRadius - minRadius);
                }

                const restFill = setColorAlpha(color, REST_ALPHA);

                return {
                    id: `${srs.id}-${index}`,
                    color,
                    restFill,
                    markerRadius,
                    content: `${srs.label}: ${formatValue(radiusValue)} @ ${Math.round(angleValue)}°`,
                    values: {
                        x: px,
                        y: py,
                        angleValue,
                        radiusValue,
                        sizeValue,
                        seriesId: srs.id,
                    } as PolarScatterMarkerEvent,
                    state: {
                        cx: px,
                        cy: py,
                        radius: markerRadius,
                        fill: restFill,
                        stroke: color,
                        lineWidth: 2,
                    } as CircleState,
                };
            };

            const createMarker = (srs: PolarScatterSeriesOptions<TData>, item: TData, index: number) => {
                const spec = computeMarker(srs, item, index);

                const marker = createCircle({
                    id: spec.id,
                    ...spec.state,
                    radius: 0,
                    data: spec.state,
                });

                this._attachMarkerHover(marker, spec.values, spec.content, spec.restFill, spec.color, spec.markerRadius);

                return marker;
            };

            const entryGroups = seriesEntries.map(srs => {
                const markers = data.map((item, index) => createMarker(srs, item, index));

                return createGroup({
                    id: srs.id,
                    class: 'polar-scatter-series',
                    children: markers,
                });
            });

            seriesUpdates.forEach(([srs, group]) => {
                const markers = group.getElementsByType('circle') as Circle[];

                const {
                    left: markerEntries,
                    inner: markerUpdates,
                    right: markerExits,
                } = arrayJoin(data, markers, (item, marker) => marker.id === `${srs.id}-${data.indexOf(item)}`);

                markerExits.forEach(marker => marker.destroy());

                markerEntries.forEach(item => group.add(createMarker(srs, item, data.indexOf(item))));

                markerUpdates.forEach(([item, marker]) => {
                    const spec = computeMarker(srs, item, data.indexOf(item));
                    marker.data = spec.state;
                    this._attachMarkerHover(marker, spec.values, spec.content, spec.restFill, spec.color, spec.markerRadius);
                });
            });

            this.scene.add(entryGroups);

            this._seriesGroups = [
                ...entryGroups,
                ...seriesUpdates.map(([, group]) => group),
            ];

            this.registerHighlightGroups(this._seriesGroups);

            const entryMarkers = entryGroups.flatMap(group => group.getElementsByType('circle') as Circle[]);
            const updateMarkers = seriesUpdates.flatMap(([, group]) => group.getElementsByType('circle') as Circle[]);
            const update = this.resolveAnimation(ANIMATION_REFERENCE.update);

            return Promise.all([
                this.renderer.transition(entryMarkers, (element, index, length) => ({
                    duration: enter.duration,
                    delay: stagger(index, length, enter.duration),
                    ease: easeOutCubic,
                    state: element.data as CircleState,
                })),
                this.renderer.transition(updateMarkers, element => ({
                    duration: update.duration,
                    ease: easeOutCubic,
                    state: element.data as CircleState,
                })),
            ]);
        });
    }

}

/**
 * Factory function that creates a new {@link PolarScatterChart} instance.
 *
 * @example
 * ```ts
 * createPolarScatterChart(target, {
 *     data: [
 *         { bearing: 30, distance: 12, magnitude: 4 },
 *         { bearing: 120, distance: 26, magnitude: 8 },
 *     ],
 *     series: [{
 *         id: 'readings',
 *         label: 'Readings',
 *         angle: 'bearing',
 *         radius: 'distance',
 *         sizeBy: 'magnitude',
 *     }],
 * });
 * ```
 */
export function createPolarScatterChart<TData = unknown>(target: string | HTMLElement | Context, options: PolarScatterChartOptions<TData>) {
    return new PolarScatterChart<TData>(target, options);
}
