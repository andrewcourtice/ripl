import {
    createGroup,
    getExtent,
    scaleContinuous,
    scaleDiscrete,
    Scene,
} from '@ripl/core';

import {
    ChartOptions,
    createChart,
} from '../core/chart';

import {
    axis,
} from '../core/axis';

import {
    arrayGroup,
    arrayJoin,
    ArrayJoinPredicate,
    arrayMap,
    objectForEach,
} from '@ripl/utilities';

export type ChartScaleType = 'linear' | 'discrete';
export type ChartScale = typeof scaleContinuous | typeof scaleDiscrete;

export type TrendChartSeriesType = 'line'
| 'column'
| 'bar'
| 'area';

export interface TrendChartSeries<TData = unknown> {
    type: TrendChartSeriesType;
    name: string;
    color: string;
    yScaleType: ChartScaleType;
    yValue: keyof TData | ((data: TData) => number);
}

export interface TrendChartAxis {
    position: 'top' | 'right' | 'bottom' | 'left';
    title: string;
}

export interface TrendChartOptions<TData = unknown> extends ChartOptions {
    key: keyof TData | ((data: TData) => unknown);
    xValue: keyof TData | ((data: TData) => unknown);
    xScaleType: ChartScaleType;
    series: TrendChartSeries<TData>[];
    stacked?: boolean;
}

const CHART_SCALE = {
    linear: scaleContinuous,
    discrete: scaleDiscrete,
} as Record<ChartScaleType, ChartScale>;

function getSeriesStuff(scene: Scene, data: unknown[], series: TrendChartSeries) {
    const {
        canvas,
    } = scene;

    const {
        type,
        name,
        color,
        xScaleType,
        yScaleType,
        xValue,
        yValue,
    } = series;

    const values = arrayMap(data, item => [
        xValue(item),
        yValue(item),
    ]);

    const xScale = CHART_SCALE[xScaleType] || scaleContinuous;
    const yScale = CHART_SCALE[yScaleType] || scaleContinuous;

    const xDomain = xScaleType === 'discrete'
        ? arrayMap(values, item => item[0])
        : getExtent(values, item => item[0]);

    const yDomain = xScaleType === 'discrete'
        ? arrayMap(values, item => item[1])
        : getExtent(values, item => item[1]);

    const scaleX = xScale(xDomain, [0, canvas.width]);
    const scaleY = yScale(yDomain, [canvas.height, 0]);


}

export const trendChart = createChart<TrendChartOptions>((options, scene, renderer) => {
    const {
        key,
        series,
        stacked,
        xScaleType,
        xValue,
    } = options;

    const {
        canvas,
    } = scene;

    const onRender = (data: unknown[]) => {
        const xScale = CHART_SCALE[xScaleType] || scaleContinuous;
        const xDomain = xScaleType === 'discrete'
            ? arrayMap(data, xValue)
            : getExtent(data, item => xValue(item) as number);

        const scaleX = xScale(xDomain, [0, canvas.width]);


    };


    return {
        onUpdate: (options) => {},
        onRender: data => {},
    };
});

// const data = [
//     {
//         id: 1,
//         africa: 52,
//         australia: 78,
//         poland: 13,
//     },
//     {
//         id: 2,
//         africa: 52,
//         australia: 78,
//         poland: 13,
//     },
//     {
//         id: 3,
//         africa: 52,
//         australia: 78,
//         poland: 13,
//     },
// ];

// barChart('something', {
//     data,
//     axes: {
//         x: {
//             value:
//         }
//     },
//     series: [
//         {
//             name: 'Africa',
//             color: 'red',
//             value: 'africa'
//         }
//     ]
// })