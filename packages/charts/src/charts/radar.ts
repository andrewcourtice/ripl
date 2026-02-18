import {
    BaseChartOptions,
    Chart,
} from '../core/chart';

import {
    getColorGenerator,
} from '../constants/colors';

import {
    Tooltip,
} from '../components/tooltip';

import {
    Legend,
    LegendItem,
} from '../components/legend';

import {
    Context,
    createCircle,
    createGroup,
    createLine,
    createPolyline,
    createText,
    easeOutCubic,
    easeOutQuart,
    Group,
    Point,
    Polyline,
    PolylineState,
    setColorAlpha,
} from '@ripl/core';

import {
    arrayForEach,
    arrayJoin,
    arrayMap,
    typeIsFunction,
} from '@ripl/utilities';

export interface RadarChartSeriesOptions<TData> {
    id: string;
    color?: string;
    label: string;
    valueBy: keyof TData | ((item: TData) => number);
    opacity?: number;
}

export interface RadarChartOptions<TData = unknown> extends BaseChartOptions {
    data: TData[];
    series: RadarChartSeriesOptions<TData>[];
    axes: string[];
    maxValue?: number;
    levels?: number;
    showLegend?: boolean;
}

const TAU = Math.PI * 2;

export class RadarChart<TData = unknown> extends Chart<RadarChartOptions<TData>> {

    private seriesGroups: Group[] = [];
    private gridGroup?: Group;
    private colorGenerator = getColorGenerator();
    private tooltip!: Tooltip;
    private legend?: Legend;
    private seriesColors: Map<string, string> = new Map();

    constructor(target: string | HTMLElement | Context, options: RadarChartOptions<TData>) {
        super(target, options);

        this.tooltip = new Tooltip({
            scene: this.scene,
            renderer: this.renderer,
        });

        this.init();
    }

    private resolveSeriesColors() {
        arrayForEach(this.options.series, srs => {
            if (!this.seriesColors.has(srs.id)) {
                this.seriesColors.set(srs.id, srs.color ?? this.colorGenerator.next().value!);
            }

            if (srs.color) {
                this.seriesColors.set(srs.id, srs.color);
            }
        });
    }

    private getSeriesColor(seriesId: string): string {
        return this.seriesColors.get(seriesId) ?? '#a1afc4';
    }

    private drawGrid(cx: number, cy: number, radius: number, axes: string[], levels: number) {
        if (this.gridGroup) {
            this.gridGroup.clear();
            this.scene.remove(this.gridGroup);
        }

        this.gridGroup = createGroup({
            id: 'radar-grid',
            class: 'radar-grid',
            zIndex: 0,
        });

        const angleStep = TAU / axes.length;

        // Draw concentric level polygons
        for (let level = 1; level <= levels; level++) {
            const levelRadius = (radius / levels) * level;
            const points: Point[] = [];

            for (let i = 0; i <= axes.length; i++) {
                const angle = i * angleStep - TAU / 4;
                points.push([
                    cx + levelRadius * Math.cos(angle),
                    cy + levelRadius * Math.sin(angle),
                ]);
            }

            const polygon = createPolyline({
                id: `radar-level-${level}`,
                strokeStyle: '#e5e7eb',
                lineWidth: 1,
                points,
            });

            polygon.autoFill = false;
            this.gridGroup.add(polygon);
        }

        // Draw axis lines and labels
        arrayForEach(axes, (axis, index) => {
            const angle = index * angleStep - TAU / 4;
            const x = cx + radius * Math.cos(angle);
            const y = cy + radius * Math.sin(angle);

            this.gridGroup!.add(createLine({
                id: `radar-axis-${index}`,
                x1: cx,
                y1: cy,
                x2: x,
                y2: y,
                strokeStyle: '#d1d5db',
                lineWidth: 1,
            }));

            const labelX = cx + (radius + 15) * Math.cos(angle);
            const labelY = cy + (radius + 15) * Math.sin(angle);

            let textAlign: CanvasTextAlign = 'center';

            if (Math.cos(angle) > 0.1) {
                textAlign = 'left';
            } else if (Math.cos(angle) < -0.1) {
                textAlign = 'right';
            }

            this.gridGroup!.add(createText({
                id: `radar-label-${index}`,
                x: labelX,
                y: labelY,
                content: axis,
                fillStyle: '#6b7280',
                font: '11px sans-serif',
                textAlign,
                textBaseline: 'middle',
            }));
        });

        this.scene.add(this.gridGroup);
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

        arrayForEach(seriesExits, group => group.destroy());

        const getSeriesPoints = (srs: RadarChartSeriesOptions<TData>) => {
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            const getValue = typeIsFunction(srs.valueBy) ? srs.valueBy : (item: any) => item[srs.valueBy] as number;

            return arrayMap(data, (item, index) => {
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

        const seriesEntryGroups = arrayMap(seriesEntries, srs => {
            const color = this.getSeriesColor(srs.id);
            const opacity = srs.opacity ?? 0.25;
            const pointsData = getSeriesPoints(srs);

            const closedPoints = [
                ...arrayMap(pointsData, p => p.point),
                pointsData[0]?.point ?? [cx, cy],
            ] as Point[];

            const area = createPolyline({
                id: `${srs.id}-area`,
                fillStyle: setColorAlpha(color, opacity),
                strokeStyle: color,
                lineWidth: 2,
                points: arrayMap(closedPoints, () => [cx, cy] as Point),
                data: {
                    points: closedPoints,
                } as PolylineState,
            });

            const markers = arrayMap(pointsData, (pd, index) => {
                const marker = createCircle({
                    id: `${srs.id}-marker-${index}`,
                    cx: cx,
                    cy: cy,
                    radius: 0,
                    fillStyle: color,
                    strokeStyle: '#FFFFFF',
                    lineWidth: 1.5,
                    data: {
                        cx: pd.point[0],
                        cy: pd.point[1],
                        radius: 3,
                    },
                });

                marker.on('mouseenter', () => {
                    this.tooltip.show(pd.point[0], pd.point[1], `${pd.axisLabel}: ${pd.value}`);

                    this.renderer.transition(marker, {
                        duration: this.getAnimationDuration(200),
                        ease: easeOutQuart,
                        state: {
                            radius: 5,
                        },
                    });

                    marker.once('mouseleave', () => {
                        this.tooltip.hide();

                        this.renderer.transition(marker, {
                            duration: this.getAnimationDuration(200),
                            ease: easeOutQuart,
                            state: {
                                radius: 3,
                            },
                        });
                    });
                });

                return marker;
            });

            return createGroup({
                id: srs.id,
                children: [area, ...markers],
            });
        });

        const seriesUpdateGroups = arrayMap(seriesUpdates, ([srs, group]) => {
            const pointsData = getSeriesPoints(srs);
            const area = group.getElementsByType('polyline')[0] as Polyline;

            const closedPoints = [
                ...arrayMap(pointsData, p => p.point),
                pointsData[0]?.point ?? [cx, cy],
            ] as Point[];

            area.data = {
                points: closedPoints,
            } as PolylineState;

            const markers = group.getElementsByType('circle');

            arrayForEach(markers, (marker, index) => {
                if (index < pointsData.length) {
                    marker.data = {
                        cx: pointsData[index].point[0],
                        cy: pointsData[index].point[1],
                        radius: 3,
                    };
                }
            });

            return group;
        });

        this.scene.add(seriesEntryGroups);

        this.seriesGroups = [
            ...seriesEntryGroups,
            ...seriesUpdateGroups,
        ];

        // Animate entries
        const entryTransitions = arrayMap(seriesEntryGroups, group => {
            const area = group.getElementsByType('polyline')[0] as Polyline;
            const markers = group.getElementsByType('circle');

            const areaTransition = this.renderer.transition(area, {
                duration: this.getAnimationDuration(800),
                ease: easeOutCubic,
                state: area.data as PolylineState,
            });

            const markersTransition = this.renderer.transition(markers, (element, index, length) => ({
                duration: this.getAnimationDuration(600),
                delay: this.getAnimationDuration(200) + index * (this.getAnimationDuration(400) / length),
                ease: easeOutCubic,
                state: element.data as Record<string, unknown>,
            }));

            return [areaTransition, markersTransition];
        });

        // Animate updates
        const updateTransitions = arrayMap(seriesUpdateGroups, group => {
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
        return super.render(async (scene) => {
            const {
                axes,
                series,
                maxValue,
                levels = 5,
            } = this.options;

            this.resolveSeriesColors();

            const padding = this.getPadding();

            // Compute legend bounds early to reserve space
            let legendHeight = 0;

            if (this.options.showLegend !== false && series.length > 1) {
                const legendItems: LegendItem[] = arrayMap(series, srs => ({
                    id: srs.id,
                    label: srs.label,
                    color: this.getSeriesColor(srs.id),
                    active: true,
                }));

                if (!this.legend) {
                    this.legend = new Legend({
                        scene: this.scene,
                        renderer: this.renderer,
                        items: legendItems,
                        position: 'top',
                        onToggle: () => this.render(),
                    });
                } else {
                    this.legend.update(legendItems);
                }

                legendHeight = this.legend.getBoundingBox(scene.width - padding.left - padding.right).height;
            }

            const cx = scene.width / 2;
            const cy = (scene.height + legendHeight) / 2;
            const radius = Math.min(
                scene.width - padding.left - padding.right,
                scene.height - padding.top - padding.bottom - legendHeight
            ) / 2 - 30;

            // Compute max value from data if not provided
            let computedMax = maxValue ?? 0;

            if (!maxValue) {
                arrayForEach(series, srs => {
                    // eslint-disable-next-line @typescript-eslint/no-explicit-any
                    const getValue = typeIsFunction(srs.valueBy) ? srs.valueBy : (item: any) => item[srs.valueBy] as number;

                    arrayForEach(this.options.data, item => {
                        computedMax = Math.max(computedMax, getValue(item));
                    });
                });
            }

            this.drawGrid(cx, cy, radius, axes, levels);

            // Render legend
            if (this.legend && legendHeight > 0) {
                this.legend.render(padding.left, 0, scene.width - padding.left - padding.right);
            }

            return this.drawSeries(cx, cy, radius, computedMax);
        });
    }

}

export function createRadarChart<TData = unknown>(target: string | HTMLElement | Context, options: RadarChartOptions<TData>) {
    return new RadarChart<TData>(target, options);
}
