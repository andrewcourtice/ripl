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
    Box,
    Circle,
    CircleState,
    Context,
    createCircle,
    createGroup,
    easeOutCubic,
    easeOutQuart,
    getExtent,
    Group,
    Scale,
    scaleContinuous,
    setColorAlpha,
} from '@ripl/core';

import {
    arrayForEach,
    arrayJoin,
    arrayMap,
    functionIdentity,
    typeIsFunction,
} from '@ripl/utilities';

export interface ScatterChartSeriesOptions<TData> {
    id: string;
    color?: string;
    xBy: keyof TData | ((item: TData) => number);
    yBy: keyof TData | ((item: TData) => number);
    sizeBy?: keyof TData | number | ((item: TData) => number);
    labelBy: string | ((item: TData) => string);
    minRadius?: number;
    maxRadius?: number;
}

export interface ScatterChartOptions<TData = unknown> extends BaseChartOptions {
    data: TData[];
    series: ScatterChartSeriesOptions<TData>[];
    keyBy: keyof TData | ((item: TData) => string);
    xAxisLabel?: string;
    yAxisLabel?: string;
}

export class ScatterChart<TData = unknown> extends Chart<ScatterChartOptions<TData>> {

    private bubbleGroups: Group[] = [];
    private xScale!: Scale;
    private yScale!: Scale;
    private sizeScale!: Scale;
    private colorGenerator = getColorGenerator();
    private xAxis: ChartXAxis;
    private yAxis: ChartYAxis;
    private tooltip: Tooltip;

    constructor(target: string | HTMLElement | Context, options: ScatterChartOptions<TData>) {
        super(target, options);

        this.xAxis = new ChartXAxis({
            scene: this.scene,
            renderer: this.renderer,
            bounds: Box.empty(),
            scale: this.xScale,
        });

        this.yAxis = new ChartYAxis({
            scene: this.scene,
            renderer: this.renderer,
            bounds: Box.empty(),
            scale: this.yScale,
        });

        this.tooltip = new Tooltip({
            scene: this.scene,
            renderer: this.renderer,
        });

        this.init();
    }

    private getSizeExtent(): [number, number] {
        const {
            data,
            series,
        } = this.options;

        const allSizes: number[] = [];

        arrayForEach(series, ({ sizeBy }) => {
            if (sizeBy === undefined) {
                return;
            }

            /* eslint-disable @typescript-eslint/no-explicit-any, no-nested-ternary */
            const getSizeValue = typeIsFunction(sizeBy)
                ? sizeBy
                : typeof sizeBy === 'number'
                    ? () => sizeBy
                    : (item: any) => item[sizeBy] as number;
            /* eslint-enable @typescript-eslint/no-explicit-any, no-nested-ternary */

            arrayForEach(data, item => {
                allSizes.push(getSizeValue(item));
            });
        });

        return allSizes.length > 0
            ? getExtent(allSizes, functionIdentity)
            : [1, 1];
    }

    private async drawBubbles() {
        const {
            data,
            series,
            keyBy,
        } = this.options;

        const {
            left: seriesEntries,
            inner: seriesUpdates,
            right: seriesExits,
        } = arrayJoin(series, this.bubbleGroups, 'id');

        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const getKey = typeIsFunction(keyBy) ? keyBy : (item: any) => item[keyBy] as string;

        arrayForEach(seriesExits, series => series.destroy());

        const seriesBubbleValueProducer = ({
            id,
            xBy,
            yBy,
            sizeBy,
            labelBy,
            color,
            minRadius = 3,
            maxRadius = 20,
        }: ScatterChartSeriesOptions<TData>) => {
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            const getXValue = typeIsFunction(xBy) ? xBy : (item: any) => item[xBy] as number;
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            const getYValue = typeIsFunction(yBy) ? yBy : (item: any) => item[yBy] as number;
            /* eslint-disable @typescript-eslint/no-explicit-any, no-nested-ternary */
            const getSizeValue = sizeBy === undefined
                ? () => minRadius
                : typeIsFunction(sizeBy)
                    ? sizeBy
                    : typeof sizeBy === 'number'
                        ? () => sizeBy
                        : (item: any) => item[sizeBy] as number;
            /* eslint-enable @typescript-eslint/no-explicit-any, no-nested-ternary */
            const getLabel = typeIsFunction(labelBy) ? labelBy : () => labelBy;

            return (item: TData) => {
                const key = getKey(item);
                const xValue = getXValue(item);
                const yValue = getYValue(item);
                const sizeValue = getSizeValue(item);
                const label = getLabel(item);

                const x = this.xScale(xValue);
                const y = this.yScale(yValue);
                const radius = sizeBy === undefined
                    ? minRadius
                    : this.sizeScale(sizeValue) * (maxRadius - minRadius) + minRadius;

                return {
                    id: `${id}-${key}`,
                    xValue,
                    yValue,
                    sizeValue,
                    label,
                    state: {
                        fillStyle: setColorAlpha(color as string, 0.7),
                        strokeStyle: color,
                        lineWidth: 2,
                        cx: x,
                        cy: y,
                        radius,
                    } as CircleState,
                };
            };
        };

        const seriesEntryGroups = arrayMap(seriesEntries, series => {
            series.color ??= this.colorGenerator.next().value;

            const getBubbleValues = seriesBubbleValueProducer(series);

            const children = arrayMap(data, item => {
                const {
                    id,
                    xValue,
                    yValue,
                    sizeValue,
                    label,
                    state,
                } = getBubbleValues(item);

                const bubble = createCircle({
                    id,
                    ...state,
                    radius: 0,
                    fillStyle: setColorAlpha(state.fillStyle as string, 0),
                    strokeStyle: setColorAlpha(state.strokeStyle as string, 0),
                    data: state,
                });

                bubble.on('mouseenter', () => {
                    const tooltipText = series.sizeBy !== undefined
                        ? `${label}: (${xValue.toFixed(2)}, ${yValue.toFixed(2)}, ${sizeValue.toFixed(2)})`
                        : `${label}: (${xValue.toFixed(2)}, ${yValue.toFixed(2)})`;

                    this.tooltip.show(state.cx, state.cy - state.radius - 10, tooltipText);

                    this.renderer.transition(bubble, {
                        duration: 300,
                        ease: easeOutQuart,
                        state: {
                            fillStyle: state.strokeStyle,
                            radius: state.radius * 1.2,
                        },
                    });

                    bubble.once('mouseleave', () => {
                        this.tooltip.hide();

                        this.renderer.transition(bubble, {
                            duration: 300,
                            ease: easeOutQuart,
                            state: {
                                fillStyle: setColorAlpha(state.strokeStyle as string, 0.7),
                                radius: state.radius,
                            },
                        });
                    });
                });

                return bubble;
            });

            return createGroup({
                id: series.id,
                children,
            });
        });

        const seriesUpdateGroups = arrayMap(seriesUpdates, ([series, group]) => {
            const getBubbleValues = seriesBubbleValueProducer(series);
            const bubbles = group.getElementsByType('circle') as Circle[];

            const {
                left: bubbleEntries,
                inner: bubbleUpdates,
                right: bubbleExits,
            } = arrayJoin(data, bubbles, (item, bubble) => bubble.id === `${series.id}-${getKey(item)}`);

            // Exit transition - fade out and shrink
            const exitTransitions = arrayMap(bubbleExits, bubble => {
                return this.renderer.transition(bubble, {
                    duration: 500,
                    ease: easeOutCubic,
                    state: {
                        radius: 0,
                        fillStyle: setColorAlpha(bubble.fillStyle as string, 0),
                        strokeStyle: setColorAlpha(bubble.strokeStyle as string, 0),
                    },
                }).then(() => bubble.destroy());
            });

            // Entry transitions - add new bubbles
            arrayMap(bubbleEntries, item => {
                const {
                    id,
                    xValue,
                    yValue,
                    sizeValue,
                    label,
                    state,
                } = getBubbleValues(item);

                const bubble = createCircle({
                    id,
                    ...state,
                    radius: 0,
                    fillStyle: setColorAlpha(state.fillStyle as string, 0),
                    strokeStyle: setColorAlpha(state.strokeStyle as string, 0),
                    data: state,
                });

                bubble.on('mouseenter', () => {
                    const tooltipText = series.sizeBy !== undefined
                        ? `${label}: (${xValue.toFixed(2)}, ${yValue.toFixed(2)}, ${sizeValue.toFixed(2)})`
                        : `${label}: (${xValue.toFixed(2)}, ${yValue.toFixed(2)})`;

                    this.tooltip.show(state.cx, state.cy - state.radius - 10, tooltipText);

                    this.renderer.transition(bubble, {
                        duration: 300,
                        ease: easeOutQuart,
                        state: {
                            fillStyle: state.strokeStyle,
                            radius: state.radius * 1.2,
                        },
                    });

                    bubble.once('mouseleave', () => {
                        this.tooltip.hide();

                        this.renderer.transition(bubble, {
                            duration: 300,
                            ease: easeOutQuart,
                            state: {
                                fillStyle: setColorAlpha(state.strokeStyle as string, 0.7),
                                radius: state.radius,
                            },
                        });
                    });
                });

                group.add(bubble);
            });

            // Update existing bubbles
            arrayForEach(bubbleUpdates, ([item, bubble]) => {
                const {
                    xValue,
                    yValue,
                    sizeValue,
                    label,
                    state,
                } = getBubbleValues(item);

                bubble.data = state;

                // Update hover listeners for new values
                bubble.on('mouseenter', () => {
                    const tooltipText = series.sizeBy !== undefined
                        ? `${label}: (${xValue.toFixed(2)}, ${yValue.toFixed(2)}, ${sizeValue.toFixed(2)})`
                        : `${label}: (${xValue.toFixed(2)}, ${yValue.toFixed(2)})`;

                    this.tooltip.show(state.cx, state.cy - state.radius - 10, tooltipText);

                    this.renderer.transition(bubble, {
                        duration: 300,
                        ease: easeOutQuart,
                        state: {
                            fillStyle: state.strokeStyle,
                            radius: state.radius * 1.2,
                        },
                    });

                    bubble.once('mouseleave', () => {
                        this.tooltip.hide();

                        this.renderer.transition(bubble, {
                            duration: 300,
                            ease: easeOutQuart,
                            state: {
                                fillStyle: setColorAlpha(state.strokeStyle as string, 0.7),
                                radius: state.radius,
                            },
                        });
                    });
                });
            });

            return {
                group,
                exitTransitions,
            };
        });

        this.scene.add(seriesEntryGroups);

        this.bubbleGroups = [
            ...seriesEntryGroups,
            ...arrayMap(seriesUpdateGroups, ({ group }) => group),
        ];

        // Entry animations - fade in and grow
        const entryTransitions = arrayMap(seriesEntryGroups, group => {
            const bubbles = group.getElementsByType('circle') as Circle[];

            return this.renderer.transition(bubbles, (element, index, length) => ({
                duration: 1000,
                delay: index * (800 / length),
                ease: easeOutCubic,
                state: element.data as CircleState,
            }));
        });

        // Update animations - move and resize
        const updateTransitions = arrayMap(seriesUpdateGroups, ({ group }) => {
            const bubbles = group.getElementsByType('circle') as Circle[];

            return this.renderer.transition(bubbles, element => ({
                duration: 1000,
                ease: easeOutCubic,
                state: element.data as CircleState,
            }));
        });

        // Collect all exit transitions
        const exitTransitions = arrayMap(seriesUpdateGroups, ({ exitTransitions }) => exitTransitions).flat();

        return Promise.all([
            ...entryTransitions,
            ...updateTransitions,
            ...exitTransitions,
        ]);
    }

    public async render() {
        // eslint-disable-next-line @typescript-eslint/no-unused-vars
        return super.render((scene, renderer) => {
            const {
                data,
                series,
            } = this.options;

            // Calculate extents for all series
            const xExtents = arrayMap(series, ({ xBy }) => {
                const getXValue = typeIsFunction(xBy)
                    ? xBy
                    // eslint-disable-next-line @typescript-eslint/no-explicit-any
                    : (item: any) => item[xBy] as number;

                return getExtent(data, getXValue);
            }).flat();

            const yExtents = arrayMap(series, ({ yBy }) => {
                const getYValue = typeIsFunction(yBy)
                    ? yBy
                    // eslint-disable-next-line @typescript-eslint/no-explicit-any
                    : (item: any) => item[yBy] as number;

                return getExtent(data, getYValue);
            }).flat();

            const xExtent = getExtent(xExtents, functionIdentity);
            const yExtent = getExtent(yExtents, functionIdentity);
            const sizeExtent = this.getSizeExtent();

            // Create size scale (normalized 0-1)
            this.sizeScale = scaleContinuous(sizeExtent, [0, 1]);

            // Create initial Y scale for axis positioning
            this.yScale = scaleContinuous(yExtent, [scene.height - 20, 20], {
                padToTicks: 10,
            });

            this.yAxis.scale = this.yScale;
            this.yAxis.bounds = new Box(
                20,
                20,
                this.scene.height - 20,
                this.scene.width - 20
            );

            const yAxisBoundingBox = this.yAxis.getBoundingBox();

            // Create X scale
            this.xScale = scaleContinuous(xExtent, [yAxisBoundingBox.right, this.scene.width - 20], {
                padToTicks: 10,
            });

            this.xAxis.scale = this.xScale;
            this.xAxis.bounds = new Box(
                20,
                yAxisBoundingBox.right,
                this.scene.height - 20,
                this.scene.width - 20
            );

            const xAxisBoundingBox = this.xAxis.getBoundingBox();

            // Update Y scale with correct range after X axis positioning
            this.yScale = scaleContinuous(yExtent, [xAxisBoundingBox.top, 20], {
                padToTicks: 10,
            });

            this.yAxis.scale = this.yScale;
            this.yAxis.bounds.bottom = xAxisBoundingBox.top;

            return Promise.all([
                this.xAxis.render(),
                this.yAxis.render(),
                this.drawBubbles(),
            ]);
        });
    }

}

export function createScatterChart<TData = unknown>(target: string | HTMLElement | Context, options: ScatterChartOptions<TData>) {
    return new ScatterChart<TData>(target, options);
}
