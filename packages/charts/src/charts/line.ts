import {
    BaseChartOptions,
    Chart,
} from '../core/chart';

import {
    getColorGenerator,
} from '../constants/colors';

import {
    ChartXAxis,
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
    Circle,
    CircleState,
    Context,
    createCircle,
    createGroup,
    createPolyline,
    easeOutCubic,
    easeOutQuart,
    getExtent,
    Group,
    interpolatePath,
    Point,
    Polyline,
    PolylineRenderer,
    PolylineState,
    Scale,
    scaleContinuous,
} from '@ripl/core';

import {
    arrayFlatMap,
    arrayForEach,
    arrayJoin,
    arrayMap,
    functionIdentity,
    typeIsFunction,
} from '@ripl/utilities';

export interface LineChartSeriesOptions<TData> {
    id: string;
    color?: string;
    valueBy: keyof TData | number | ((item: TData) => number);
    labelBy: string | ((item: TData) => string);
    lineType?: PolylineRenderer;
    lineWidth?: number;
    showMarkers?: boolean;
    markerRadius?: number;
}

export interface LineChartOptions<TData = unknown> extends BaseChartOptions {
    data: TData[];
    series: LineChartSeriesOptions<TData>[];
    keyBy: keyof TData | ((item: TData) => string);
    labelBy?: keyof TData | ((item: TData) => string);
    xAxisLabel?: string;
    yAxisLabel?: string;
    showGrid?: boolean;
    showCrosshair?: boolean;
    showLegend?: boolean;
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    formatXLabel?: (value: any) => string;
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    formatYLabel?: (value: any) => string;
}

export class LineChart<TData = unknown> extends Chart<LineChartOptions<TData>> {

    private lineGroups: Group[] = [];
    private yScale!: Scale;
    private xScale!: Scale<string>;
    private colorGenerator = getColorGenerator();
    private xAxis!: ChartXAxis;
    private yAxis!: ChartYAxis;
    private tooltip!: Tooltip;
    private legend?: Legend;
    private grid?: Grid;
    private crosshair?: Crosshair;
    private seriesColors: Map<string, string> = new Map();

    constructor(target: string | HTMLElement | Context, options: LineChartOptions<TData>) {
        super(target, options);

        this.tooltip = new Tooltip({
            scene: this.scene,
            renderer: this.renderer,
        });

        this.xAxis = new ChartXAxis({
            scene: this.scene,
            renderer: this.renderer,
            bounds: Box.empty(),
            scale: scaleContinuous([0, 1], [0, 1]),
            title: options.xAxisLabel,
            formatLabel: options.formatXLabel,
        });

        this.yAxis = new ChartYAxis({
            scene: this.scene,
            renderer: this.renderer,
            bounds: Box.empty(),
            scale: scaleContinuous([0, 1], [0, 1]),
            title: options.yAxisLabel,
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
                horizontal: false,
            });
        }

        this.init();
    }

    private resolveSeriesColors() {
        arrayForEach(this.options.series, series => {
            if (!this.seriesColors.has(series.id)) {
                this.seriesColors.set(series.id, series.color ?? this.colorGenerator.next().value!);
            }

            if (series.color) {
                this.seriesColors.set(series.id, series.color);
            }
        });
    }

    private getSeriesColor(seriesId: string): string {
        return this.seriesColors.get(seriesId) ?? '#a1afc4';
    }

    private async drawLines() {
        const {
            data,
            series,
            keyBy,
        } = this.options;

        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const getKey = typeIsFunction(keyBy) ? keyBy : (item: any) => item[keyBy] as string;

        const {
            left: seriesEntries,
            inner: seriesUpdates,
            right: seriesExits,
        } = arrayJoin(series, this.lineGroups, 'id');

        arrayForEach(seriesExits, group => group.destroy());

        const seriesLineValueProducer = (srs: LineChartSeriesOptions<TData>) => {
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            const getValue = typeIsFunction(srs.valueBy) ? srs.valueBy : (item: any) => item[srs.valueBy] as number;
            const color = this.getSeriesColor(srs.id);

            return (item: TData) => {
                const key = getKey(item);
                const value = getValue(item);
                const x = this.xScale(key);
                const y = this.yScale(value);

                return {
                    id: `${srs.id}-${key}`,
                    value,
                    point: [x, y] as Point,
                    state: {
                        fillStyle: '#FFFFFF',
                        strokeStyle: color,
                        lineWidth: 2,
                        cx: x,
                        cy: y,
                        radius: srs.markerRadius ?? 3,
                    } as CircleState,
                };
            };
        };

        const seriesEntryGroups = arrayMap(seriesEntries, srs => {
            const color = this.getSeriesColor(srs.id);
            const getValues = seriesLineValueProducer(srs);
            const showMarkers = srs.showMarkers !== false;

            const items = arrayMap(data, item => {
                const { id, value, point, state } = getValues(item);

                const marker = createCircle({
                    id,
                    ...state,
                    radius: 0,
                    data: state,
                });

                if (showMarkers) {
                    marker.on('mouseenter', () => {
                        const getLabel = typeIsFunction(srs.labelBy) ? srs.labelBy : () => srs.labelBy as string;
                        this.tooltip.show(state.cx, state.cy, `${getLabel(item)}: ${value}`);

                        this.renderer.transition(marker, {
                            duration: this.getAnimationDuration(300),
                            ease: easeOutQuart,
                            state: {
                                fillStyle: state.strokeStyle,
                                radius: (srs.markerRadius ?? 3) + 2,
                            },
                        });

                        marker.once('mouseleave', () => {
                            this.tooltip.hide();

                            this.renderer.transition(marker, {
                                duration: this.getAnimationDuration(300),
                                ease: easeOutQuart,
                                state: {
                                    fillStyle: '#FFFFFF',
                                    radius: srs.markerRadius ?? 3,
                                },
                            });
                        });
                    });
                } else {
                    marker.pointerEvents = 'none';
                }

                return {
                    point,
                    marker,
                };
            });

            const line = createPolyline({
                id: `${srs.id}-line`,
                lineWidth: srs.lineWidth ?? 2,
                strokeStyle: color,
                points: arrayMap(items, item => item.point),
                renderer: srs.lineType,
            });

            return createGroup({
                id: srs.id,
                children: [
                    line,
                    ...arrayMap(items, item => item.marker),
                ],
            });
        });

        const seriesUpdateGroups = arrayMap(seriesUpdates, ([srs, group]) => {
            const getValues = seriesLineValueProducer(srs);
            const line = group.getElementsByType('polyline')[0] as Polyline;
            const markers = group.getElementsByType('circle') as Circle[];

            const points = arrayMap(data, item => getValues(item).point);

            line.data = {
                points,
                renderer: srs.lineType,
            } as PolylineState;

            const {
                left: markerEntries,
                inner: markerUpdates,
                right: markerExits,
            } = arrayJoin(data, markers, (item, marker) => marker.id === `${srs.id}-${getKey(item)}`);

            arrayForEach(markerExits, marker => marker.destroy());

            arrayMap(markerEntries, item => {
                const { id, state } = getValues(item);

                const marker = createCircle({
                    id,
                    ...state,
                    radius: 0,
                    data: state,
                });

                group.add(marker);
            });

            arrayForEach(markerUpdates, ([item, marker]) => {
                const { state, value } = getValues(item);
                marker.data = state;

                marker.on('mouseenter', () => {
                    const getLabel = typeIsFunction(srs.labelBy) ? srs.labelBy : () => srs.labelBy as string;
                    this.tooltip.show(state.cx, state.cy, `${getLabel(item)}: ${value}`);

                    this.renderer.transition(marker, {
                        duration: this.getAnimationDuration(300),
                        ease: easeOutQuart,
                        state: {
                            fillStyle: state.strokeStyle,
                            radius: (srs.markerRadius ?? 3) + 2,
                        },
                    });

                    marker.once('mouseleave', () => {
                        this.tooltip.hide();

                        this.renderer.transition(marker, {
                            duration: this.getAnimationDuration(300),
                            ease: easeOutQuart,
                            state: {
                                fillStyle: '#FFFFFF',
                                radius: srs.markerRadius ?? 3,
                            },
                        });
                    });
                });
            });

            return group;
        });

        this.scene.add(seriesEntryGroups);

        this.lineGroups = [
            ...seriesEntryGroups,
            ...seriesUpdateGroups,
        ];

        const entryTransitions = arrayMap(seriesEntryGroups, group => {
            const markers = group.queryAll('circle') as Circle[];
            const line = group.query('polyline') as Polyline;

            const lineTransition = this.renderer.transition(line, {
                duration: this.getAnimationDuration(1000),
                ease: easeOutCubic,
                state: {
                    points: interpolatePath(line.points),
                },
            });

            const markersTransition = this.renderer.transition(markers, (element, index, length) => ({
                duration: this.getAnimationDuration(1000),
                delay: index * (this.getAnimationDuration(1000) / length),
                ease: easeOutCubic,
                state: element.data as CircleState,
            }));

            return [
                lineTransition,
                markersTransition,
            ];
        });

        const updateTransitions = arrayMap(seriesUpdateGroups, group => {
            const markers = group.queryAll('circle') as Circle[];
            const line = group.query('polyline') as Polyline;

            const lineTransition = this.renderer.transition(line, {
                duration: this.getAnimationDuration(1000),
                ease: easeOutCubic,
                state: line.data as PolylineState,
            });

            const markersTransition = this.renderer.transition(markers, (element) => ({
                duration: this.getAnimationDuration(1000),
                ease: easeOutCubic,
                state: element.data as CircleState,
            }));

            return [
                lineTransition,
                markersTransition,
            ];
        });

        return Promise.all([
            ...entryTransitions,
            ...updateTransitions,
        ].flat());
    }

    public async render() {
        return super.render(async (scene) => {
            const {
                data,
                series,
                keyBy,
            } = this.options;

            this.resolveSeriesColors();

            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            const getKey = typeIsFunction(keyBy) ? keyBy : (item: any) => item[keyBy] as string;
            const keys = arrayMap(data, getKey);

            const seriesExtents = arrayFlatMap(series, ({ valueBy }) => {
                const getValue = typeIsFunction(valueBy)
                    ? valueBy
                    // eslint-disable-next-line @typescript-eslint/no-explicit-any
                    : (item: any) => item[valueBy] as number;

                return getExtent(data, getValue);
            }).concat(0);

            const dataExtent = getExtent(seriesExtents, functionIdentity);

            const padding = this.getPadding();

            this.yScale = scaleContinuous(dataExtent, [scene.height - padding.bottom, padding.top], {
                padToTicks: 10,
            });

            this.yAxis.scale = this.yScale;
            this.yAxis.bounds = new Box(
                padding.top,
                padding.left,
                scene.height - padding.bottom,
                scene.width - padding.right
            );

            const yAxisBoundingBox = this.yAxis.getBoundingBox();

            this.xScale = scaleContinuous(
                [0, keys.length - 1],
                [yAxisBoundingBox.right + 20, scene.width - padding.right]
            ) as unknown as Scale<string>;

            // Create a string-keyed scale
            const xConvert = (value: string) => {
                const index = keys.indexOf(value);
                return yAxisBoundingBox.right + 20 + (index / Math.max(1, keys.length - 1)) * (scene.width - padding.right - yAxisBoundingBox.right - 20);
            };

            const xInvert = (value: number) => {
                const range = scene.width - padding.right - yAxisBoundingBox.right - 20;
                const index = Math.round(((value - yAxisBoundingBox.right - 20) / range) * (keys.length - 1));
                return keys[Math.max(0, Math.min(keys.length - 1, index))];
            };

            this.xScale = {
                ...(() => xConvert)(),
                domain: keys,
                range: [yAxisBoundingBox.right + 20, scene.width - padding.right],
                inverse: xInvert,
                ticks: () => keys,
                includes: (value: string) => keys.includes(value),
            } as unknown as Scale<string>;

            // Wrap as callable
            const xScaleCallable = Object.assign(
                (value: string) => xConvert(value),
                {
                    domain: keys,
                    range: [yAxisBoundingBox.right + 20, scene.width - padding.right] as number[],
                    inverse: xInvert,
                    ticks: () => keys,
                    includes: (value: string) => keys.includes(value),
                }
            );

            this.xScale = xScaleCallable as unknown as Scale<string>;

            this.xAxis.scale = this.xScale;
            this.xAxis.bounds = new Box(
                padding.top,
                yAxisBoundingBox.right,
                scene.height - padding.bottom,
                scene.width - padding.right
            );

            const xAxisBoundingBox = this.xAxis.getBoundingBox();

            this.yScale = scaleContinuous(dataExtent, [xAxisBoundingBox.top, padding.top], {
                padToTicks: 10,
            });

            this.yAxis.scale = this.yScale;
            this.yAxis.bounds.bottom = xAxisBoundingBox.top;

            // Render grid
            if (this.grid) {
                const yTicks = this.yScale.ticks(10);
                const yTickPositions = arrayMap(yTicks, tick => this.yScale(tick));

                this.grid.render(
                    [],
                    yTickPositions,
                    yAxisBoundingBox.right,
                    padding.top,
                    scene.width - padding.right - yAxisBoundingBox.right,
                    xAxisBoundingBox.top - padding.top
                );
            }

            // Setup crosshair
            if (this.crosshair) {
                this.crosshair.setup(
                    yAxisBoundingBox.right,
                    padding.top,
                    scene.width - padding.right - yAxisBoundingBox.right,
                    xAxisBoundingBox.top - padding.top
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
            if (this.options.showLegend !== false && series.length > 1) {
                const legendItems: LegendItem[] = arrayMap(series, srs => ({
                    id: srs.id,
                    label: typeIsFunction(srs.labelBy) ? srs.id : srs.labelBy as string,
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

                this.legend.render(yAxisBoundingBox.right, 0, scene.width - yAxisBoundingBox.right - padding.right);
            }

            return Promise.all([
                this.xAxis.render(),
                this.yAxis.render(),
                this.drawLines(),
            ]);
        });
    }

}

export function createLineChart<TData = unknown>(target: string | HTMLElement | Context, options: LineChartOptions<TData>) {
    return new LineChart<TData>(target, options);
}
