import {
    Box,
    Circle,
    CircleState,
    Context,
    createCircle,
    createGroup,
    getExtent,
    Group,
    Scale,
    scaleContinuous,
} from '@ripl/core';

import {
    BaseChartOptions,
    Chart,
} from '../core';

import {
    ChartXAxis,
    ChartYAxis,
} from '../components/axis';

import {
    getColorGenerator,
} from '../constants/colors';

import {
    arrayJoin,
    functionIdentity,
    OneOrMore,
    typeIsFunction,
} from '@ripl/utilities';

export interface ScatterChartSeriesOptions<TData> {
    id: string;
    color?: string;
    xValue: keyof TData | number | ((item: TData) => number);
    yValue: keyof TData | number | ((item: TData) => number);
    size: keyof TData | number | ((item: TData) => number);
    label: string | ((item: TData) => string);
}

export interface ScatterChartOptions<TData = unknown> extends BaseChartOptions {
    data: TData[];
    series: OneOrMore<ScatterChartSeriesOptions<TData>>;
    key: keyof TData | ((item: TData) => string);
}

export class ScatterChart<TData = unknown> extends Chart<ScatterChartOptions<TData>> {

    private colorGenerator = getColorGenerator();
    private xScale!: Scale;
    private yScale!: Scale;
    private xAxis: ChartXAxis;
    private yAxis: ChartYAxis;
    private seriesGroups: Group[] = [];

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

        this.init();
    }

    public async render() {
        return super.render(() => {
            const {
                data,
                key,
                series: inputSeries,
            } = this.options;

            const getKey = typeIsFunction(key) ? key : (item: unknown) => item[key] as string;
            const keys = data.map(getKey);

            const series = ([] as ScatterChartSeriesOptions<TData>[]).concat(inputSeries);
            const seriesExtents = series
                .map(({ xValue, yValue }) => {
                    const getXValue = typeIsFunction(xValue)
                        ? xValue
                        : (item: unknown) => item[xValue] as number;

                    const getYValue = typeIsFunction(yValue)
                        ? yValue
                        : (item: unknown) => item[yValue] as number;

                    const xExtent = getExtent(data, getXValue);
                    const yExtent = getExtent(data, getYValue);

                    return [
                        xExtent,
                        yExtent,
                    ];
                })
                .concat([
                    [0, 0],
                ]);

            const xExtent = getExtent(seriesExtents.flatMap(([x]) => x), functionIdentity);
            const yExtent = getExtent(seriesExtents.flatMap(([y]) => y), functionIdentity);

            this.yScale = scaleContinuous(yExtent, [this.scene.height - 20, 20], {
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

            this.xScale = scaleContinuous(xExtent, [20, this.scene.width - 20], {
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

            this.yScale = scaleContinuous(yExtent, [xAxisBoundingBox.top, 20], {
                padToTicks: 10,
            });

            this.yAxis.scale = this.yScale;
            this.yAxis.bounds.bottom = xAxisBoundingBox.top;

            const {
                left: seriesEntries,
                inner: seriesUpdates,
                right: seriesExits,
            } = arrayJoin(series, this.seriesGroups, 'id');

            const se = seriesEntries.map(series => {
                return [
                    series,
                    createGroup({
                        class: 'scatter-chart__series',
                    }),
                ] as typeof seriesUpdates[number];
            });

            this.seriesGroups = se.concat(seriesUpdates).map(([series, group]) => {
                const points = group.getElementsByType<Circle>('circle');

                const getXValue = typeIsFunction(series.xValue)
                    ? series.xValue
                    : (item: unknown) => item[series.xValue] as number;

                const getYValue = typeIsFunction(series.yValue)
                    ? series.yValue
                    : (item: unknown) => item[series.yValue] as number;

                const {
                    left: pointEntries,
                    inner: pointUpdates,
                    right: pointExits,
                } = arrayJoin(data, points, (item, point) => point.id === `${series.id}-${getKey(item)}`);

                pointEntries.map(item => {
                    const key = getKey(item);
                    const xValue = getXValue(item);
                    const yValue = getYValue(item);
                    const x = this.xScale(xValue);
                    const y = this.yScale(yValue);

                    const circle = createCircle({
                        id: `${series.id}-${key}`,
                        cx: x,
                        cy: y,
                        radius: 0,
                        strokeStyle: '#000000',
                        fillStyle: 'rgba(0, 0, 0, 0.5)',
                        lineWidth: 2,
                        data: {
                            radius: 5,
                        } as CircleState,
                    });

                    group.add(circle);
                });

                return group;
            });
        });
    }

}