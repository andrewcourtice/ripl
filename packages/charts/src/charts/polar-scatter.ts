import {
    BaseChartOptions,
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

import {
    LegendItem,
} from '../components/legend';

import {
    Circle,
    CircleState,
    Context,
    createCircle,
    createGroup,
    createLine,
    createText,
    easeOutCubic,
    EventMap,
    getExtent,
    Group,
    Line,
    scaleContinuous,
    Scale,
    setColorAlpha,
    Text,
} from '@ripl/core';

import {
    arrayJoin,
    functionIdentity,
    typeIsFunction,
} from '@ripl/utilities';

const TAU = Math.PI * 2;

/** Opacity applied to a marker's fill at rest (full opacity on hover). */
const REST_ALPHA = 0.7;

/** Configuration for an individual polar scatter series. */
export interface PolarScatterSeriesOptions<TData> {
    id: string;
    color?: string;
    label: string;
    /** Angular position in degrees (0° at the top, increasing clockwise). */
    angle: keyof TData | ((item: TData) => number);
    /** Radial position (distance from the centre), on the radial value scale. */
    radius: keyof TData | ((item: TData) => number);
    /** Optional accessor whose value scales each marker's size between `minRadius` and `maxRadius`. */
    sizeBy?: keyof TData | number | ((item: TData) => number);
    minRadius?: number;
    maxRadius?: number;
}

/** Options for configuring a {@link PolarScatterChart}. */
export interface PolarScatterChartOptions<TData = unknown> extends BaseChartOptions {
    data: TData[];
    series: PolarScatterSeriesOptions<TData>[];
    /** Maximum radial value (defaults to the largest radius value in the data). */
    maxRadiusValue?: number;
    /** Number of concentric value rings. Defaults to 4. */
    levels?: number;
    /** Number of angular spokes/labels around the circle. Defaults to 8. */
    angleTicks?: number;
    legend?: ChartLegendInput;
    /** Format applied to radial values shown as text (tooltips + ring labels). */
    format?: ValueFormatInput;
}

/** Payload emitted for polar scatter marker interaction events. */
export interface PolarScatterMarkerEvent {
    x: number;
    y: number;
    angleValue: number;
    radiusValue: number;
    sizeValue: number;
    seriesId: string;
}

/** Events emitted by a {@link PolarScatterChart} that consumers can subscribe to via `chart.on(...)`. */
export interface PolarScatterChartEventMap extends EventMap {
    markerclick: PolarScatterMarkerEvent;
    markerenter: PolarScatterMarkerEvent;
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

    private seriesGroups: Group[] = [];
    private gridGroup?: Group;
    private tooltip: Tooltip;
    private radialScale!: Scale;

    constructor(target: string | HTMLElement | Context, options: PolarScatterChartOptions<TData>) {
        super(target, options);

        this.tooltip = new Tooltip({
            scene: this.scene,
            renderer: this.renderer,
        });

        this.init();
    }

    /** Converts an angle in degrees (0° at top, clockwise) to a canvas point at the given radius. */
    private point(cx: number, cy: number, angleDeg: number, radius: number): [number, number] {
        const theta = (angleDeg - 90) * (Math.PI / 180);
        return [cx + radius * Math.cos(theta), cy + radius * Math.sin(theta)];
    }

    private drawGrid(cx: number, cy: number, gridRadius: number, levels: number, angleTicks: number) {
        const formatValue = resolveValueFormat(this.options.format);

        if (!this.gridGroup) {
            this.gridGroup = createGroup({
                id: 'polar-scatter-grid',
                class: 'polar-scatter-grid',
                zIndex: 0,
            });

            this.scene.add(this.gridGroup);
        }

        // Concentric value rings + a value label on each.
        const ringIndices = Array.from({ length: levels }).map((_, i) => i + 1);
        const ringCircles = this.gridGroup.getElementsByType('circle') as Circle[];

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

            this.gridGroup!.add(ring);
        });

        ringUpdates.forEach(([level, ring]) => {
            ring.cx = cx;
            ring.cy = cy;
            ring.radius = (gridRadius / levels) * level;
        });

        // Ring value labels (along the top spoke).
        const ringLabels = this.gridGroup.getElementsByType<Text>('text').filter(text => text.id.startsWith('ring-label-'));

        const {
            left: labelEntries,
            inner: labelUpdates,
            right: labelExits,
        } = arrayJoin(ringIndices, ringLabels, (level, text) => text.id === `ring-label-${level}`);

        labelExits.forEach(el => el.destroy());

        const ringValue = (level: number) => (this.radialScale.inverse ? this.radialScale.inverse((gridRadius / levels) * level) : 0);

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

            this.gridGroup!.add(label);
        });

        labelUpdates.forEach(([level, label]) => {
            label.content = formatValue(ringValue(level));
            label.x = cx + 4;
            label.y = cy - (gridRadius / levels) * level;
        });

        // Angular spokes + degree labels.
        const spokeIndices = Array.from({ length: angleTicks }).map((_, i) => i);
        const spokeStep = 360 / angleTicks;
        const spokeLines = this.gridGroup.getElementsByType<Line>('line');

        const {
            left: spokeEntries,
            inner: spokeUpdates,
            right: spokeExits,
        } = arrayJoin(spokeIndices, spokeLines, (index, line) => line.id === `spoke-${index}`);

        spokeExits.forEach(el => el.destroy());

        spokeEntries.forEach(index => {
            const [x2, y2] = this.point(cx, cy, index * spokeStep, gridRadius);

            const line = createLine({
                id: `spoke-${index}`,
                x1: cx,
                y1: cy,
                x2,
                y2,
                stroke: '#eceff3',
                lineWidth: 1,
            });

            this.gridGroup!.add(line);
        });

        spokeUpdates.forEach(([index, line]) => {
            const [x2, y2] = this.point(cx, cy, index * spokeStep, gridRadius);
            line.x1 = cx;
            line.y1 = cy;
            line.x2 = x2;
            line.y2 = y2;
        });

        const angleLabels = this.gridGroup.getElementsByType<Text>('text').filter(text => text.id.startsWith('angle-label-'));

        const {
            left: angleEntries,
            inner: angleUpdates,
            right: angleExits,
        } = arrayJoin(spokeIndices, angleLabels, (index, text) => text.id === `angle-label-${index}`);

        angleExits.forEach(el => el.destroy());

        const angleLabelProps = (index: number) => {
            const deg = index * spokeStep;
            const [x, y] = this.point(cx, cy, deg, gridRadius + 12);
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

            this.gridGroup!.add(label);
        });

        angleUpdates.forEach(([index, label]) => {
            const { x, y, content } = angleLabelProps(index);
            label.x = x;
            label.y = y;
            label.content = content;
        });
    }

    private attachMarkerHover(marker: Circle, values: PolarScatterMarkerEvent, content: string, restFill: string, stroke: string, radius: number) {
        const hover = this.resolveAnimation(ANIMATION_REFERENCE.hover);

        const payload = (point: { x: number;
            y: number; }): PolarScatterMarkerEvent => ({
            ...values,
            x: point.x,
            y: point.y,
        });

        applyHoverHighlight(marker, {
            renderer: this.renderer,
            duration: hover.duration,
            ease: hover.ease,
            tooltip: this.tooltip,
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
                    active: true,
                }))
                : [];

            this.reserveLegend(layout, legendItems, this.options.legend);

            const area = layout.area;
            const cx = area.x + area.width / 2;
            const cy = area.y + area.height / 2;
            const gridRadius = (Math.min(area.width, area.height) / 2) * 0.82;

            // Radial value scale: 0 at the centre, the data max (or override) at the outer ring.
            const radiusValues = series.flatMap(srs => data.map(resolveAccessor<TData, number>(srs.radius)));
            const [, dataMax] = radiusValues.length ? getExtent(radiusValues, functionIdentity) : [0, 1];
            const maxRadiusValue = this.options.maxRadiusValue ?? (dataMax > 0 ? dataMax : 1);

            this.radialScale = scaleContinuous([0, maxRadiusValue], [0, gridRadius], { clamp: true });

            this.drawGrid(cx, cy, gridRadius, levels, angleTicks);

            const enter = this.resolveAnimation(ANIMATION_REFERENCE.enter);

            const {
                left: seriesEntries,
                inner: seriesUpdates,
                right: seriesExits,
            } = arrayJoin(series, this.seriesGroups, 'id');

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
                const [px, py] = this.point(cx, cy, angleValue, this.radialScale(radiusValue));

                let markerRadius = minRadius;
                let sizeValue = 0;

                if (srs.sizeBy !== undefined) {
                    const getSize = resolveAccessor<TData, number>(srs.sizeBy);
                    sizeValue = getSize(item);
                    const sizes = data.map(getSize);
                    const [sMin, sMax] = getExtent(sizes, functionIdentity);
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

                this.attachMarkerHover(marker, spec.values, spec.content, spec.restFill, spec.color, spec.markerRadius);

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
                    this.attachMarkerHover(marker, spec.values, spec.content, spec.restFill, spec.color, spec.markerRadius);
                });
            });

            this.scene.add(entryGroups);

            this.seriesGroups = [
                ...entryGroups,
                ...seriesUpdates.map(([, group]) => group),
            ];

            this.registerHighlightGroups(this.seriesGroups);

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

/** Factory function that creates a new {@link PolarScatterChart} instance. */
export function createPolarScatterChart<TData = unknown>(target: string | HTMLElement | Context, options: PolarScatterChartOptions<TData>) {
    return new PolarScatterChart<TData>(target, options);
}
