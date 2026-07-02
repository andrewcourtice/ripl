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
} from '../core/animation';

import {
    Tooltip,
} from '../components/tooltip';

import {
    LegendItem,
} from '../components/legend';

import {
    Circle,
    Context,
    createCircle,
    createGroup,
    createLine,
    createPolyline,
    createText,
    easeOutCubic,
    easeOutQuart,
    Element,
    EventMap,
    Group,
    Line,
    LineState,
    Point,
    Polyline,
    PolylineState,
    setColorAlpha,
    Text,
    TextState,
} from '@ripl/core';

import {
    arrayJoin,
    typeIsFunction,
} from '@ripl/utilities';

/** Configuration for an individual radar chart series. */
export interface RadarChartSeriesOptions<TData> {
    id: string;
    color?: string;
    label: string;
    value: keyof TData | ((item: TData) => number);
    opacity?: number;
}

/** Options for configuring a {@link RadarChart}. */
export interface RadarChartOptions<TData = unknown> extends BaseChartOptions {
    data: TData[];
    series: RadarChartSeriesOptions<TData>[];
    axes: string[];
    maxValue?: number;
    levels?: number;
    legend?: ChartLegendInput;
    /** Format applied to point values shown as text (e.g. tooltips). */
    format?: ValueFormatInput;
}

/** Payload emitted for radar point interaction events. */
export interface RadarChartPointEvent {
    x: number;
    y: number;
    value: number;
    axisLabel: string;
    seriesId: string;
}

/** Events emitted by a {@link RadarChart} that consumers can subscribe to via `chart.on(...)`. */
export interface RadarChartEventMap extends EventMap {
    pointclick: RadarChartPointEvent;
    pointenter: RadarChartPointEvent;
    pointleave: RadarChartPointEvent;
}

const TAU = Math.PI * 2;

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

    private seriesGroups: Group[] = [];
    private gridGroup?: Group;
    private gridLevels: Polyline[] = [];
    private gridAxisLines: Line[] = [];
    private gridLabels: Text[] = [];
    private tooltip!: Tooltip;
    constructor(target: string | HTMLElement | Context, options: RadarChartOptions<TData>) {
        super(target, options);

        this.tooltip = new Tooltip({
            scene: this.scene,
            renderer: this.renderer,
        });

        this.init();
    }

    private drawGrid(cx: number, cy: number, radius: number, axes: string[], levels: number) {
        const isEntry = !this.gridGroup;
        const animDuration = this.getAnimationDuration(800);
        const angleStep = TAU / axes.length;

        if (isEntry) {
            this.gridGroup = createGroup({
                id: 'radar-grid',
                class: 'radar-grid',
                zIndex: 0,
            });

            this.scene.add(this.gridGroup);
        }

        const levelPoints = (level: number): Point[] => {
            const levelRadius = (radius / levels) * level;
            const points: Point[] = [];

            for (let i = 0; i <= axes.length; i++) {
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
        } = arrayJoin(levelIndices, this.gridLevels, (level, poly) => poly.id === `radar-level-${level}`);

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
            this.gridGroup!.add(polygon);

            return polygon;
        });

        levelUpdates.forEach(([level, poly]) => {
            poly.data = {
                points: levelPoints(level),
            } as PolylineState;
        });

        this.gridLevels = [
            ...newLevels,
            ...levelUpdates.map(([, poly]) => poly),
        ];

        // --- Radial axis lines ---
        const axisIndices = axes.map((_, i) => i);

        const axisEnd = (index: number): Point => {
            const angle = index * angleStep - TAU / 4;
            return [cx + radius * Math.cos(angle), cy + radius * Math.sin(angle)];
        };

        const {
            left: lineEntries,
            inner: lineUpdates,
            right: lineExits,
        } = arrayJoin(axisIndices, this.gridAxisLines, (idx, line) => line.id === `radar-axis-${idx}`);

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

            this.gridGroup!.add(line);

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

        this.gridAxisLines = [
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
        } = arrayJoin(axisIndices, this.gridLabels, (idx, label) => label.id === `radar-label-${idx}`);

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
                content: axes[idx] ?? '',
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

            this.gridGroup!.add(label);

            return label;
        });

        labelUpdates.forEach(([idx, label]) => {
            const { labelX, labelY, textAlign } = labelProps(idx);

            label.content = axes[idx] ?? '';
            label.textAlign = textAlign;
            label.data = {
                x: labelX,
                y: labelY,
            } as Partial<TextState>;
        });

        this.gridLabels = [
            ...newLabels,
            ...labelUpdates.map(([, label]) => label),
        ];

        // Animate: staggered grow on entry, smooth morph on update. Exclude exiting labels — they
        // run their own fade-out transition above and are destroyed on completion.
        const allElements = this.gridGroup!.children.filter(element => !exitLabels.has(element));

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

    private async drawSeries(cx: number, cy: number, radius: number, maxValue: number) {
        const {
            data,
            series,
            axes,
        } = this.options;

        const angleStep = TAU / axes.length;

        const {
            left: seriesEntries,
            inner: seriesUpdates,
            right: seriesExits,
        } = arrayJoin(series, this.seriesGroups, 'id');

        seriesExits.forEach(el => el.destroy());

        const getSeriesPoints = (srs: RadarChartSeriesOptions<TData>) => {
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            const getValue = typeIsFunction(srs.value) ? srs.value : (item: any) => item[srs.value] as number;

            return data.map((item, index) => {
                const value = getValue(item);
                const normalizedValue = Math.min(value / maxValue, 1);
                const angle = index * angleStep - TAU / 4;
                const x = cx + radius * normalizedValue * Math.cos(angle);
                const y = cy + radius * normalizedValue * Math.sin(angle);

                return {
                    point: [x, y] as Point,
                    value,
                    axisLabel: axes[index] ?? '',
                };
            });
        };

        const seriesEntryGroups = seriesEntries.map(srs => {
            const color = this.getSeriesColor(srs.id);
            const opacity = srs.opacity ?? 0.25;
            const pointsData = getSeriesPoints(srs);

            const closedPoints = [
                ...pointsData.map(p => p.point),
                pointsData[0]?.point ?? [cx, cy],
            ] as Point[];

            const area = createPolyline({
                id: `${srs.id}-area`,
                fill: setColorAlpha(color, opacity),
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

                this.attachPointHover(marker, pd, srs.id, color);

                return marker;
            });

            return createGroup({
                id: srs.id,
                children: [area, ...markers],
            });
        });

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

                    this.attachPointHover(marker, pointsData[index], srs.id, updateColor);
                }
            });

            return group;
        });

        this.scene.add(seriesEntryGroups);

        this.seriesGroups = [
            ...seriesEntryGroups,
            ...seriesUpdateGroups,
        ];

        // Series groups map 1:1 to legend items (by id); register them for legend hover-highlight.
        this.registerHighlightGroups(this.seriesGroups);

        // Animate entries
        const entryTransitions = seriesEntryGroups.map(group => {
            const area = group.getElementsByType('polyline')[0] as Polyline;
            const markers = group.getElementsByType('circle');

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

            return [areaTransition, markersTransition];
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

        return Promise.all([
            ...entryTransitions,
            ...updateTransitions,
        ].flat());
    }

    public async render() {
        return super.render(async () => {
            const {
                axes,
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
                    active: true,
                }))
                : [];

            this.reserveLegend(layout, legendItems, this.options.legend);

            const area = layout.area;
            const cx = area.x + area.width / 2;
            const cy = area.y + area.height / 2;
            const radius = Math.min(area.width, area.height) / 2 - 30;

            // Compute max value from data if not provided
            let computedMax = maxValue ?? 0;

            if (!maxValue) {
                series.forEach(srs => {
                    // eslint-disable-next-line @typescript-eslint/no-explicit-any
                    const getValue = typeIsFunction(srs.value) ? srs.value : (item: any) => item[srs.value] as number;

                    this.options.data.forEach(item => {
                        computedMax = Math.max(computedMax, getValue(item));
                    });
                });
            }

            const gridTransition = this.drawGrid(cx, cy, radius, axes, levels);
            const seriesTransition = this.drawSeries(cx, cy, radius, computedMax);

            return Promise.all([gridTransition, seriesTransition]);
        });
    }

    private attachPointHover(marker: Circle, pd: { point: Point;
        axisLabel: string;
        value: number; }, seriesId: string, color: string) {
        const hover = this.resolveAnimation(ANIMATION_REFERENCE.hover);
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
            duration: hover.duration,
            ease: hover.ease,
            tooltip: this.tooltip,
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

/** Factory function that creates a new {@link RadarChart} instance. */
export function createRadarChart<TData = unknown>(target: string | HTMLElement | Context, options: RadarChartOptions<TData>) {
    return new RadarChart<TData>(target, options);
}
