import {
    Box,
    Context,
    getExtent,
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
    functionIdentity, typeIsFunction,
} from '@ripl/utilities';

export interface ScatterChartSeriesOptions<TData> {
    id: string;
    color?: string;
    value: keyof TData | number | ((item: TData) => number);
    label: string | ((item: TData) => string);
}

export interface ScatterChartOptions<TData = unknown> extends BaseChartOptions {
    data: TData[];
    series: ScatterChartSeriesOptions<TData>[];
    key: keyof TData | ((item: TData) => string);
}

export class ScatterChart extends Chart<ScatterChartOptions> {

    private colorGenerator = getColorGenerator();
    private xScale!: Scale;
    private yScale!: Scale;
    private xAxis: ChartXAxis;
    private yAxis: ChartYAxis;

    constructor(target: string | HTMLElement | Context, options: ScatterChartOptions) {
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
                series,
            } = this.options;

            const getKey = typeIsFunction(key) ? key : (item: unknown) => item[key] as string;
            const keys = data.map(getKey);
            const seriesExtents = series.flatMap(({ valueBy }) => {
                const getValue = typeIsFunction(valueBy)
                    ? valueBy
                    : (item: unknown) => item[valueBy] as number;

                return getExtent(data, getValue);
            }).concat(0);

            const dataExtent = getExtent(seriesExtents, functionIdentity);

            this.yScale = scaleContinuous(dataExtent, [this.scene.height - 20, 20], {
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

            this.xScale = scaleContinuous();

            this.xAxis.scale = this.xScalePoint;
            this.xAxis.bounds = new Box(
                20,
                yAxisBoundingBox.right,
                this.scene.height - 20,
                this.scene.width - 20
            );

            const xAxisBoundingBox = this.xAxis.getBoundingBox();

            this.yScale = scaleContinuous(dataExtent, [xAxisBoundingBox.top, 20], {
                padToTicks: 10,
            });

            this.yAxis.scale = this.yScale;
            this.yAxis.bounds.bottom = xAxisBoundingBox.top;
        });
    }

}