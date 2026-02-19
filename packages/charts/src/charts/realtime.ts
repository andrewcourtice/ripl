import {
    BaseChartOptions,
    Chart,
} from '../core/chart';

import {
    ChartYAxis,
} from '../components/axis';

import {
    Tooltip,
} from '../components/tooltip';

import {
    Legend,
    LegendItem,
} from '../components/legend';

import {
    Grid,
} from '../components/grid';

import {
    Crosshair,
} from '../components/crosshair';

import {
    Box,
    Context,
    createGroup,
    createPolyline,
    easeOutCubic,
    getExtent,
    Group,
    Point,
    Polyline,
    PolylineRenderer,
    PolylineState,
    Scale,
    scaleContinuous,
    setColorAlpha,
} from '@ripl/core';

import {
    arrayForEach,
    arrayMap,
    functionIdentity,
} from '@ripl/utilities';

export interface RealtimeChartSeriesOptions {
    id: string;
    color?: string;
    label?: string;
    lineType?: PolylineRenderer;
    lineWidth?: number;
    showArea?: boolean;
    areaOpacity?: number;
}

export interface RealtimeChartOptions extends BaseChartOptions {
    series: RealtimeChartSeriesOptions[];
    windowSize?: number;
    showGrid?: boolean;
    showCrosshair?: boolean;
    showYAxis?: boolean;
    showLegend?: boolean;
    yMin?: number;
    yMax?: number;
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    formatYLabel?: (value: any) => string;
    transitionDuration?: number;
}

export class RealtimeChart extends Chart<RealtimeChartOptions> {

    private buffers: Map<string, number[]> = new Map();
    private seriesGroups: Group[] = [];
    private yScale!: Scale;
    private yAxis!: ChartYAxis;
    private tooltip!: Tooltip;
    private legend?: Legend;
    private grid?: Grid;
    private crosshair?: Crosshair;
    private windowSize: number;
    private transitionDuration: number;

    constructor(target: string | HTMLElement | Context, options: RealtimeChartOptions) {
        super(target, options);

        this.windowSize = options.windowSize ?? 60;
        this.transitionDuration = options.transitionDuration ?? 300;

        this.tooltip = new Tooltip({
            scene: this.scene,
            renderer: this.renderer,
        });

        this.yAxis = new ChartYAxis({
            scene: this.scene,
            renderer: this.renderer,
            bounds: Box.empty(),
            scale: scaleContinuous([0, 1], [0, 1]),
            formatLabel: options.formatYLabel,
        });

        if (options.showGrid !== false) {
            this.grid = new Grid({
                scene: this.scene,
                renderer: this.renderer,
                horizontal: true,
                vertical: false,
            });
        }

        if (options.showCrosshair !== false) {
            this.crosshair = new Crosshair({
                scene: this.scene,
                renderer: this.renderer,
                vertical: true,
                horizontal: true,
            });
        }

        // Initialise buffers for each series
        arrayForEach(options.series, srs => {
            this.buffers.set(srs.id, []);
        });

        this.init();
    }

    private getWindowSize(): number {
        return this.windowSize;
    }

    private getTransitionDuration(): number {
        return this.transitionDuration;
    }

    public push(values: Record<string, number>): void {
        const maxLen = this.getWindowSize();

        for (const [seriesId, value] of Object.entries(values)) {
            let buffer = this.buffers.get(seriesId);

            if (!buffer) {
                buffer = [];
                this.buffers.set(seriesId, buffer);
            }

            buffer.push(value);

            if (buffer.length > maxLen) {
                buffer.splice(0, buffer.length - maxLen);
            }
        }

        this.render();
    }

    public clear(): void {
        this.buffers.forEach(buffer => buffer.length = 0);
        this.seriesGroups.forEach(group => group.destroy());
        this.seriesGroups = [];
        this.render();
    }

    public override update(options: Partial<RealtimeChartOptions>): void {
        if (options.windowSize !== undefined) {
            this.windowSize = options.windowSize;
        }

        if (options.transitionDuration !== undefined) {
            this.transitionDuration = options.transitionDuration;
        }

        super.update(options);
    }

    private drawSeries(chartLeft: number, chartRight: number, chartTop: number, chartBottom: number) {
        const {
            series,
        } = this.options;

        this.resolveSeriesColors(series);

        const maxLen = this.getWindowSize();
        const duration = this.getTransitionDuration();

        const existingGroupMap = new Map<string, Group>();
        arrayForEach(this.seriesGroups, group => existingGroupMap.set(group.id, group));

        const newGroups: Group[] = [];
        const updatedGroups: Group[] = [];

        arrayForEach(series, srs => {
            const buffer = this.buffers.get(srs.id) || [];
            const color = this.getSeriesColor(srs.id);
            const showArea = srs.showArea !== false;
            const areaOpacity = srs.areaOpacity ?? 0.2;

            // Need at least 2 points for a renderable line
            const pointCount = buffer.length;
            const existingGroup = existingGroupMap.get(srs.id);

            if (pointCount < 2) {
                // Not enough data — destroy existing group if any, skip creation
                if (existingGroup) {
                    existingGroup.destroy();
                    existingGroupMap.delete(srs.id);
                }

                return;
            }

            // Compute points from buffer
            const linePoints: Point[] = arrayMap(buffer, (value, index) => {
                const x = chartLeft + (index / Math.max(1, maxLen - 1)) * (chartRight - chartLeft);
                const y = this.yScale(value);
                return [x, y];
            });

            // Area points: line points + closing back to baseline
            const areaPoints: Point[] = [];

            if (showArea) {
                const baseline = chartBottom;

                areaPoints.push([linePoints[0][0], baseline]);

                arrayForEach(linePoints, point => {
                    areaPoints.push(point);
                });

                areaPoints.push([linePoints[pointCount - 1][0], baseline]);
            }

            if (existingGroup) {
                // Update existing group
                const polylines = existingGroup.getElementsByType('polyline') as Polyline[];
                const areaFill = showArea ? polylines[0] : undefined;
                const line = showArea ? polylines[1] : polylines[0];

                if (line) {
                    line.data = {
                        points: linePoints,
                        renderer: srs.lineType,
                    } as PolylineState;
                }

                if (areaFill && showArea) {
                    areaFill.data = {
                        points: areaPoints,
                    } as PolylineState;
                }

                existingGroupMap.delete(srs.id);
                updatedGroups.push(existingGroup);
            } else {
                // Create new group
                const children: (Polyline)[] = [];

                if (showArea) {
                    const areaFill = createPolyline({
                        id: `${srs.id}-area`,
                        fillStyle: setColorAlpha(color, areaOpacity),
                        strokeStyle: undefined,
                        points: areaPoints,
                        renderer: srs.lineType,
                        data: {
                            points: areaPoints,
                        } as PolylineState,
                    });

                    areaFill.autoStroke = false;
                    children.push(areaFill);
                }

                const line = createPolyline({
                    id: `${srs.id}-line`,
                    lineWidth: srs.lineWidth ?? 2,
                    strokeStyle: color,
                    points: linePoints,
                    renderer: srs.lineType,
                    data: {
                        points: linePoints,
                    } as PolylineState,
                });

                children.push(line);

                const group = createGroup({
                    id: srs.id,
                    children,
                });

                newGroups.push(group);
            }
        });

        // Remove groups that are no longer in the series list
        existingGroupMap.forEach(group => group.destroy());

        // Add new groups to scene
        if (newGroups.length > 0) {
            this.scene.add(newGroups);
        }

        this.seriesGroups = [
            ...newGroups,
            ...updatedGroups,
        ];

        // Transition all groups (only polylines with ≥2 points)
        const transitions = arrayMap(this.seriesGroups, group => {
            const polylines = group.getElementsByType('polyline') as Polyline[];

            return arrayMap(polylines, polyline => {
                const targetState = polyline.data as PolylineState | undefined;

                if (targetState?.points && targetState.points.length >= 2) {
                    return this.renderer.transition(polyline, {
                        duration: this.getAnimationDuration(duration),
                        ease: easeOutCubic,
                        state: targetState,
                    });
                }

                return Promise.resolve();
            });
        });

        return Promise.all(transitions.flat());
    }

    public async render() {
        return super.render(async (scene) => {
            const {
                series,
                showYAxis,
            } = this.options;

            this.resolveSeriesColors(series);

            // Compute y extent from all buffers
            const allValues: number[] = [];

            this.buffers.forEach(buffer => {
                arrayForEach(buffer, value => allValues.push(value));
            });

            // If no data yet, use a default range
            if (allValues.length === 0) {
                allValues.push(0, 1);
            }

            let [yMin, yMax] = getExtent(allValues, functionIdentity);

            // Apply fixed bounds if provided
            if (this.options.yMin !== undefined) {
                yMin = this.options.yMin;
            }

            if (this.options.yMax !== undefined) {
                yMax = this.options.yMax;
            }

            // Ensure we have some range
            if (yMin === yMax) {
                yMin -= 1;
                yMax += 1;
            }

            const padding = this.getPadding();

            // Compute legend bounds early to reserve space
            let legendHeight = 0;

            if (this.options.showLegend !== false && series.length > 1) {
                const legendItems: LegendItem[] = arrayMap(series, srs => ({
                    id: srs.id,
                    label: srs.label ?? srs.id,
                    color: this.getSeriesColor(srs.id),
                    active: true,
                }));

                if (!this.legend) {
                    this.legend = new Legend({
                        scene: this.scene,
                        renderer: this.renderer,
                        items: legendItems,
                        position: 'top',
                    });
                } else {
                    this.legend.update(legendItems);
                }

                legendHeight = this.legend.getBoundingBox(scene.width - padding.left - padding.right).height;
            }

            const chartTop = padding.top + legendHeight;

            this.yScale = scaleContinuous([yMin, yMax], [scene.height - padding.bottom, chartTop], {
                padToTicks: 10,
            });

            let chartLeft = padding.left;

            if (showYAxis !== false) {
                this.yAxis.scale = this.yScale;
                this.yAxis.bounds = new Box(
                    chartTop,
                    padding.left,
                    scene.height - padding.bottom,
                    scene.width - padding.right
                );

                const yAxisBoundingBox = this.yAxis.getBoundingBox();
                chartLeft = yAxisBoundingBox.right + 10;
            }

            const chartRight = scene.width - padding.right;
            const chartBottom = scene.height - padding.bottom;

            // Render grid
            if (this.grid) {
                const yTicks = this.yScale.ticks(10);
                const yTickPositions = arrayMap(yTicks, tick => this.yScale(tick));

                this.grid.render(
                    [],
                    yTickPositions,
                    chartLeft,
                    chartTop,
                    chartRight - chartLeft,
                    chartBottom - chartTop
                );
            }

            // Setup crosshair
            if (this.crosshair) {
                this.crosshair.setup(
                    chartLeft,
                    chartTop,
                    chartRight - chartLeft,
                    chartBottom - chartTop
                );

                this.scene.on('mousemove', (event) => {
                    const { x, y } = event.data;
                    this.crosshair?.show(x, y);
                });

                this.scene.on('mouseleave', () => {
                    this.crosshair?.hide();
                });
            }

            // Render legend
            if (this.legend && legendHeight > 0) {
                this.legend.render(chartLeft, 0, chartRight - chartLeft);
            }

            const promises: Promise<unknown>[] = [];

            if (showYAxis !== false) {
                promises.push(this.yAxis.render());
            }

            promises.push(this.drawSeries(chartLeft, chartRight, chartTop, chartBottom));

            return Promise.all(promises);
        });
    }

}

export function createRealtimeChart(target: string | HTMLElement | Context, options: RealtimeChartOptions) {
    return new RealtimeChart(target, options);
}
