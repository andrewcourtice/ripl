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
} from '../core/animation';

import {
    Tooltip,
} from '../components/tooltip';

import type {
    LegendItem,
} from '../components/legend';

import type {
    Circle,
    Context,
    Element,
    EventMap,
    Group,
    Line,
    LineState,
    Point,
    Polyline,
    PolylineState,
    Text,
    TextState,
} from '@ripl/core';

import {
    createCircle,
    createGroup,
    createLine,
    createPolyline,
    createText,
    easeOutCubic,
    easeOutQuart,
    getThetaPoint,
    scaleRadial,
    setColorAlpha,
    TAU,
} from '@ripl/core';

import {
    arrayJoin,
    typeIsFunction,
} from '@ripl/utilities';

/** Configuration for an individual radar chart series. */
export interface RadarChartSeriesOptions<TData> {
    /** Unique identifier for the series. */
    id: string;
    /** Optional colour override for the series (otherwise a palette colour is generated). */
    color?: string;
    /** Display label for the series (shown in the legend and tooltips). */
    label: string;
    /** Accessor for each data item's value on the series' axis. */
    value: NumericAccessor<TData>;
    /** Fill opacity of the series' area polygon. Defaults to 0.25. */
    fillOpacity?: number;
}

/** Options for configuring a {@link RadarChart}. */
export interface RadarChartOptions<TData = unknown> extends BaseChartOptions {
    /** The dataset, with one item per axis (in axis order). */
    data: TData[];
    /** The series to overlay, each rendered as a filled polygon. */
    series: RadarChartSeriesOptions<TData>[];
    /** Axis labels arranged clockwise around the chart, one per data item. */
    categories: string[];
    /** Maximum value mapped to the outer ring (defaults to the largest value across all series). */
    maxValue?: number;
    /** Number of concentric grid rings. Defaults to 5. */
    levels?: number;
    /** Legend configuration. Shown by default when there is more than one series. */
    legend?: ChartLegendInput;
    /** Format applied to point values shown as text (e.g. tooltips). */
    format?: ValueFormatInput;
    /** Show each point's value beside its polygon vertex, offset outward along the vertex's angle (`true`/`false` or detailed label options). Off by default. */
    labels?: ChartDataLabelsInput;
}

/** Payload emitted for radar point interaction events. */
export interface RadarChartPointEvent {
    /** X position of the point marker, in canvas coordinates. */
    x: number;
    /** Y position of the point marker, in canvas coordinates. */
    y: number;
    /** The point's value on its axis. */
    value: number;
    /** The label of the axis the point sits on. */
    axisLabel: string;
    /** The id of the series the point belongs to. */
    seriesId: string;
}

/** Events emitted by a {@link RadarChart} that consumers can subscribe to via `chart.on(...)`. */
export interface RadarChartEventMap extends EventMap {
    /** Emitted when a point marker is clicked. */
    pointclick: RadarChartPointEvent;
    /** Emitted when the pointer enters a point marker. */
    pointenter: RadarChartPointEvent;
    /** Emitted when the pointer leaves a point marker. */
    pointleave: RadarChartPointEvent;
}

// Distance in pixels between a polygon vertex and its value label, measured outward along the
// vertex's angle so the label clears the marker (radius 3, growing to 5 on hover).
const VALUE_LABEL_OFFSET = 10;

/**
 * Radar (spider) chart plotting multi-axis data as filled polygonal areas.
 *
 * Renders a circular grid with concentric rings and radial axis lines,
 * then overlays one or more series as filled polyline areas with markers.
 * Supports interactive tooltips, legend, and animated transitions.
 *
 * @typeParam TData - The type of each data item in the dataset.
 */
export class RadarChart<TData = unknown> extends Chart<RadarChartOptions<TData>, RadarChartEventMap> {

    private _seriesGroups: Group[] = [];
    private _gridGroup?: Group;
    private _gridLevels: Polyline[] = [];
    private _gridAxisLines: Line[] = [];
    private _gridLabels: Text[] = [];
    private _tooltip!: Tooltip;
    constructor(target: string | HTMLElement | Context, options: RadarChartOptions<TData>) {
        super(target, options);

        this._tooltip = new Tooltip({
            scene: this.scene,
            renderer: this.renderer,
        });

        this.init();
    }

    private _drawGrid(cx: number, cy: number, radius: number, categories: string[], levels: number) {
        const isEntry = !this._gridGroup;
        const animDuration = this.getAnimationDuration(800);
        const angleStep = TAU / categories.length;

        if (isEntry) {
            this._gridGroup = createGroup({
                id: 'radar-grid',
                class: 'radar-grid',
                zIndex: 0,
            });

            this.scene.add(this._gridGroup);
        }

        const levelPoints = (level: number): Point[] => {
            const levelRadius = (radius / levels) * level;
            const points: Point[] = [];

            for (let i = 0; i <= categories.length; i++) {
                const angle = i * angleStep - TAU / 4;
                points.push([
                    cx + levelRadius * Math.cos(angle),
                    cy + levelRadius * Math.sin(angle),
                ]);
            }

            return points;
        };

        // --- Concentric level polygons ---
        const levelIndices = Array.from({ length: levels }).map((_, i) => i + 1);

        const {
            left: levelEntries,
            inner: levelUpdates,
            right: levelExits,
        } = arrayJoin(levelIndices, this._gridLevels, (level, poly) => poly.id === `radar-level-${level}`);

        levelExits.forEach(el => el.destroy());

        const newLevels = levelEntries.map(level => {
            const points = levelPoints(level);

            const polygon = createPolyline({
                id: `radar-level-${level}`,
                stroke: '#e5e7eb',
                lineWidth: 1,
                points: isEntry ? points.map(() => [cx, cy] as Point) : points,
                data: {
                    points,
                } as PolylineState,
            });

            polygon.autoFill = false;
            this._gridGroup!.add(polygon);

            return polygon;
        });

        levelUpdates.forEach(([level, poly]) => {
            poly.data = {
                points: levelPoints(level),
            } as PolylineState;
        });

        this._gridLevels = [
            ...newLevels,
            ...levelUpdates.map(([, poly]) => poly),
        ];

        // --- Radial axis lines ---
        const axisIndices = categories.map((_, i) => i);

        const axisEnd = (index: number): Point => {
            const angle = index * angleStep - TAU / 4;
            return [cx + radius * Math.cos(angle), cy + radius * Math.sin(angle)];
        };

        const {
            left: lineEntries,
            inner: lineUpdates,
            right: lineExits,
        } = arrayJoin(axisIndices, this._gridAxisLines, (idx, line) => line.id === `radar-axis-${idx}`);

        lineExits.forEach(el => el.destroy());

        const newLines = lineEntries.map(idx => {
            const [x2, y2] = axisEnd(idx);

            const line = createLine({
                id: `radar-axis-${idx}`,
                x1: cx,
                y1: cy,
                x2: isEntry ? cx : x2,
                y2: isEntry ? cy : y2,
                stroke: '#d1d5db',
                lineWidth: 1,
                data: {
                    x2,
                    y2,
                } as Partial<LineState>,
            });

            this._gridGroup!.add(line);

            return line;
        });

        lineUpdates.forEach(([idx, line]) => {
            const [x2, y2] = axisEnd(idx);

            line.data = {
                x1: cx,
                y1: cy,
                x2,
                y2,
            } as Partial<LineState>;
        });

        this._gridAxisLines = [
            ...newLines,
            ...lineUpdates.map(([, line]) => line),
        ];

        // --- Axis labels ---
        const labelProps = (index: number) => {
            const angle = index * angleStep - TAU / 4;
            const labelX = cx + (radius + 15) * Math.cos(angle);
            const labelY = cy + (radius + 15) * Math.sin(angle);

            let textAlign: CanvasTextAlign = 'center';

            if (Math.cos(angle) > 0.1) {
                textAlign = 'left';
            } else if (Math.cos(angle) < -0.1) {
                textAlign = 'right';
            }

            return {
                labelX,
                labelY,
                textAlign,
            };
        };

        const {
            left: labelEntries,
            inner: labelUpdates,
            right: labelExits,
        } = arrayJoin(axisIndices, this._gridLabels, (idx, label) => label.id === `radar-label-${idx}`);

        // Fade exiting axis labels out before destroying them (instead of removing instantly) so
        // removing an axis animates symmetrically with adding one.
        const exitLabels = new Set<Element>(labelExits);

        labelExits.forEach(label => {
            this.renderer.transition(label, {
                duration: animDuration,
                ease: easeOutQuart,
                state: {
                    opacity: 0,
                },
                onComplete: el => el.destroy(),
            });
        });

        const newLabels = labelEntries.map(idx => {
            const { labelX, labelY, textAlign } = labelProps(idx);

            const label = createText({
                id: `radar-label-${idx}`,
                x: labelX,
                y: labelY,
                content: categories[idx] ?? '',
                fill: '#6b7280',
                font: '11px sans-serif',
                textAlign,
                textBaseline: 'middle',
                // Always start hidden so a newly-added axis label fades in via the transition below,
                // not just on the first render.
                opacity: 0,
                data: {
                    opacity: 1,
                } as Partial<TextState>,
            });

            this._gridGroup!.add(label);

            return label;
        });

        labelUpdates.forEach(([idx, label]) => {
            const { labelX, labelY, textAlign } = labelProps(idx);

            label.content = categories[idx] ?? '';
            label.textAlign = textAlign;
            label.data = {
                x: labelX,
                y: labelY,
            } as Partial<TextState>;
        });

        this._gridLabels = [
            ...newLabels,
            ...labelUpdates.map(([, label]) => label),
        ];

        // Animate: staggered grow on entry, smooth morph on update. Exclude exiting labels — they
        // run their own fade-out transition above and are destroyed on completion.
        const allElements = this._gridGroup!.children.filter(element => !exitLabels.has(element));

        if (isEntry) {
            return this.renderer.transition(allElements, (element, index, length) => ({
                duration: animDuration,
                delay: index * (animDuration / length) * 0.2,
                ease: easeOutQuart,
                state: element.data as Record<string, unknown>,
            }));
        }

        return this.renderer.transition(allElements, element => ({
            duration: animDuration,
            ease: easeOutQuart,
            state: element.data as Record<string, unknown>,
        }));
    }

    private async _drawSeries(cx: number, cy: number, radius: number, maxValue: number) {
        const {
            data,
            categories,
        } = this.options;

        // Legend-hidden series fall into the series-exit join below and are removed.
        const series = this.filterActive(this.options.series);

        const angleStep = TAU / categories.length;
        const dataLabels = normalizeDataLabels(this.options.labels);
        const formatValue = resolveValueFormat(this.options.format);
        const exitAnimation = this.resolveAnimation(ANIMATION_REFERENCE.exit);

        const {
            left: seriesEntries,
            inner: seriesUpdates,
            right: seriesExits,
        } = arrayJoin(series, this._seriesGroups, 'id');

        seriesExits.forEach(el => el.destroy());

        // Radial value scale: 0 at the centre, the data max at the outer ring (clamps out-of-range values).
        const radiusScale = scaleRadial([0, maxValue], [0, radius]);

        const getSeriesPoints = (srs: RadarChartSeriesOptions<TData>) => {
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            const getValue = typeIsFunction(srs.value) ? srs.value : (item: any) => item[srs.value] as number;

            return data.map((item, index) => {
                const value = getValue(item);
                const scaledRadius = radiusScale(value);
                const angle = index * angleStep - TAU / 4;
                const x = cx + scaledRadius * Math.cos(angle);
                const y = cy + scaledRadius * Math.sin(angle);

                return {
                    point: [x, y] as Point,
                    value,
                    angle,
                    axisLabel: categories[index] ?? '',
                };
            });
        };

        type SeriesPoint = ReturnType<typeof getSeriesPoints>[number];

        // Offsets a value label outward from its vertex along the vertex's angle, aligning the
        // text away from the centre so it clears the marker on every side of the polygon.
        const labelProps = (pd: SeriesPoint) => {
            const [x, y] = getThetaPoint(pd.angle, VALUE_LABEL_OFFSET, ...pd.point);

            let textAlign: CanvasTextAlign = 'center';

            if (Math.cos(pd.angle) > 0.1) {
                textAlign = 'left';
            } else if (Math.cos(pd.angle) < -0.1) {
                textAlign = 'right';
            }

            let textBaseline: CanvasTextBaseline = 'middle';

            if (Math.sin(pd.angle) > 0.1) {
                textBaseline = 'top';
            } else if (Math.sin(pd.angle) < -0.1) {
                textBaseline = 'bottom';
            }

            return {
                x,
                y,
                textAlign,
                textBaseline,
            };
        };

        const buildLabel = (seriesId: string, pd: SeriesPoint, index: number): Text => {
            const { x, y, textAlign, textBaseline } = labelProps(pd);

            return createText({
                id: `${seriesId}-label-${index}`,
                content: formatValue(pd.value),
                x,
                y,
                textAlign,
                textBaseline,
                font: dataLabels.font,
                fill: dataLabels.fontColor,
                pointerEvents: 'none',
                opacity: 0,
                data: {
                    opacity: 1,
                } as Partial<TextState>,
            });
        };

        const seriesEntryGroups = seriesEntries.map(srs => {
            const color = this.getSeriesColor(srs.id);
            const fillOpacity = srs.fillOpacity ?? 0.25;
            const pointsData = getSeriesPoints(srs);

            const closedPoints = [
                ...pointsData.map(p => p.point),
                pointsData[0]?.point ?? [cx, cy],
            ] as Point[];

            const area = createPolyline({
                id: `${srs.id}-area`,
                fill: setColorAlpha(color, fillOpacity),
                stroke: color,
                lineWidth: 2,
                points: closedPoints.map(() => [cx, cy] as Point),
                data: {
                    points: closedPoints,
                } as PolylineState,
            });

            const markers = pointsData.map((pd, index) => {
                const marker = createCircle({
                    id: `${srs.id}-marker-${index}`,
                    cx: cx,
                    cy: cy,
                    radius: 0,
                    fill: color,
                    stroke: '#FFFFFF',
                    lineWidth: 1.5,
                    data: {
                        cx: pd.point[0],
                        cy: pd.point[1],
                        radius: 3,
                    },
                });

                this._attachPointHover(marker, pd, srs.id, color);

                return marker;
            });

            return createGroup({
                id: srs.id,
                children: [
                    area,
                    ...markers,
                    ...(dataLabels.visible ? pointsData.map((pd, index) => buildLabel(srs.id, pd, index)) : []),
                ],
            });
        });

        const enteringLabels: Text[] = [];
        const updatingLabels: Text[] = [];

        const seriesUpdateGroups = seriesUpdates.map(([srs, group]) => {
            const pointsData = getSeriesPoints(srs);
            const area = group.getElementsByType('polyline')[0] as Polyline;

            const closedPoints = [
                ...pointsData.map(p => p.point),
                pointsData[0]?.point ?? [cx, cy],
            ] as Point[];

            area.data = {
                points: closedPoints,
            } as PolylineState;

            const updateColor = this.getSeriesColor(srs.id);
            const markers = group.getElementsByType('circle') as Circle[];

            markers.forEach((marker, index) => {
                if (index < pointsData.length) {
                    marker.data = {
                        cx: pointsData[index].point[0],
                        cy: pointsData[index].point[1],
                        radius: 3,
                    };

                    this._attachPointHover(marker, pointsData[index], srs.id, updateColor);
                }
            });

            // Reconcile the vertex value labels against the current `labels` option so they can be
            // toggled and restyled at runtime, and follow the vertices as values change.
            const labels = group.getElementsByType('text') as Text[];

            if (!dataLabels.visible) {
                labels.forEach(label => {
                    void exitElement(this.renderer, label, exitAnimation, { opacity: 0 });
                });

                return group;
            }

            const {
                left: labelEntries,
                inner: labelUpdates,
                right: labelExits,
            } = arrayJoin(pointsData, labels, (pd, label) => label.id === `${srs.id}-label-${pointsData.indexOf(pd)}`);

            labelExits.forEach(label => {
                void exitElement(this.renderer, label, exitAnimation, { opacity: 0 });
            });

            labelEntries.forEach(pd => {
                const label = buildLabel(srs.id, pd, pointsData.indexOf(pd));

                group.add(label);
                enteringLabels.push(label);
            });

            labelUpdates.forEach(([pd, label]) => {
                const { x, y, textAlign, textBaseline } = labelProps(pd);

                // Text content and alignment aren't tweenable — apply them directly.
                label.content = formatValue(pd.value);
                label.textAlign = textAlign;
                label.textBaseline = textBaseline;
                label.font = dataLabels.font;
                label.data = {
                    x,
                    y,
                    fill: dataLabels.fontColor,
                    opacity: 1,
                } as Partial<TextState>;

                updatingLabels.push(label);
            });

            return group;
        });

        this.scene.add(seriesEntryGroups);

        this._seriesGroups = [
            ...seriesEntryGroups,
            ...seriesUpdateGroups,
        ];

        // Series groups map 1:1 to legend items (by id); register them for legend hover-highlight.
        this.registerHighlightGroups(this._seriesGroups);

        // Animate entries
        const entryTransitions = seriesEntryGroups.map(group => {
            const area = group.getElementsByType('polyline')[0] as Polyline;
            const markers = group.getElementsByType('circle');
            const labels = group.getElementsByType('text');

            const areaTransition = this.renderer.transition(area, {
                duration: this.getAnimationDuration(800),
                ease: easeOutCubic,
                state: area.data as PolylineState,
            });

            const markersTransition = this.renderer.transition(markers, (element) => ({
                duration: this.getAnimationDuration(800),
                ease: easeOutCubic,
                state: element.data as Record<string, unknown>,
            }));

            const labelsTransition = this.renderer.transition(labels, element => ({
                duration: this.getAnimationDuration(800),
                ease: easeOutCubic,
                state: element.data as Record<string, unknown>,
            }));

            return [areaTransition, markersTransition, labelsTransition];
        });

        // Animate updates
        const updateTransitions = seriesUpdateGroups.map(group => {
            const area = group.getElementsByType('polyline')[0] as Polyline;
            const markers = group.getElementsByType('circle');

            const areaTransition = this.renderer.transition(area, {
                duration: this.getAnimationDuration(800),
                ease: easeOutCubic,
                state: area.data as PolylineState,
            });

            const markersTransition = this.renderer.transition(markers, element => ({
                duration: this.getAnimationDuration(600),
                ease: easeOutCubic,
                state: element.data as Record<string, unknown>,
            }));

            return [areaTransition, markersTransition];
        });

        // Entering labels (per-vertex or when labels are toggled on) fade in; updating labels glide
        // to their refreshed vertex. Exiting labels run their own exit transition above.
        const labelTransition = this.renderer.transition([...enteringLabels, ...updatingLabels], element => ({
            duration: this.getAnimationDuration(600),
            ease: easeOutCubic,
            state: element.data as Partial<TextState>,
        }));

        return Promise.all([
            ...entryTransitions,
            ...updateTransitions,
            [labelTransition],
        ].flat());
    }

    public async render() {
        return super.render(async () => {
            const {
                categories,
                series,
                maxValue,
                levels = 5,
            } = this.options;

            this.resolveSeriesColors(series);

            // Shared layout pass: reserve title and legend bands.
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
            const radius = size / 2 - 30;

            // Compute max value from the legend-active series if not provided, so hiding a series
            // re-fits the radial scale to the remaining ones.
            let computedMax = maxValue ?? 0;

            if (!maxValue) {
                this.filterActive(series).forEach(srs => {
                    // eslint-disable-next-line @typescript-eslint/no-explicit-any
                    const getValue = typeIsFunction(srs.value) ? srs.value : (item: any) => item[srs.value] as number;

                    this.options.data.forEach(item => {
                        computedMax = Math.max(computedMax, getValue(item));
                    });
                });
            }

            const gridTransition = this._drawGrid(cx, cy, radius, categories, levels);
            const seriesTransition = this._drawSeries(cx, cy, radius, computedMax);

            return Promise.all([gridTransition, seriesTransition]);
        });
    }

    private _attachPointHover(marker: Circle, pd: { point: Point;
        axisLabel: string;
        value: number; }, seriesId: string, color: string) {
        const formatValue = resolveValueFormat(this.options.format);

        const payload = (point: { x: number;
            y: number; }): RadarChartPointEvent => ({
            x: point.x,
            y: point.y,
            value: pd.value,
            axisLabel: pd.axisLabel,
            seriesId,
        });

        applyHoverHighlight(marker, {
            renderer: this.renderer,
            animation: () => this.resolveAnimation(ANIMATION_REFERENCE.hover),
            tooltip: this._tooltip,
            anchor: () => ({
                x: marker.cx,
                y: marker.cy,
            }),
            content: () => `${pd.axisLabel}: ${formatValue(pd.value)}`,
            highlight: {
                fill: color,
                radius: 5,
            },
            restore: {
                fill: color,
                radius: 3,
            },
            onEnter: point => this.emit('pointenter', payload(point)),
            onLeave: point => this.emit('pointleave', payload(point)),
            onClick: point => this.emit('pointclick', payload(point)),
        });
    }

}

/**
 * Factory function that creates a new {@link RadarChart} instance.
 *
 * @example
 * ```ts
 * createRadarChart(target, {
 *     categories: ['Speed', 'Power', 'Range', 'Agility'],
 *     data: [
 *         { axis: 'Speed', modelA: 80 },
 *         { axis: 'Power', modelA: 60 },
 *         { axis: 'Range', modelA: 90 },
 *         { axis: 'Agility', modelA: 70 },
 *     ],
 *     series: [{
 *         id: 'model-a',
 *         label: 'Model A',
 *         value: 'modelA',
 *     }],
 * });
 * ```
 */
export function createRadarChart<TData = unknown>(target: string | HTMLElement | Context, options: RadarChartOptions<TData>) {
    return new RadarChart<TData>(target, options);
}
