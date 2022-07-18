import {
    chart,
    ChartOptions,
} from '../core/chart';

import {
    axis,
} from '../core/axis';

export interface BarChartSeries<TData> {
    name: string;
    color: string;
    value: keyof TData | ((data: TData) => number);
}

export interface BarChartOptions<TData = unknown> extends ChartOptions {
    data: TData[];
    series: BarChartSeries<TData>[];
    stacked: boolean;
    axes: {
        lineColor: string;
        labelColor: string;
        x: {
            enabled: boolean;
            labels: string[]| ((data: TData) => string);
        };
        y: {
            enabled: boolean;
            labels: string[]| ((data: TData) => string);
        };
    };
}

export const barChart = chart<BarChartOptions>((options, scene, renderer) => {
    const chartAxis = axis(scene, {

    });

    return {
        onUpdate: (options) => {},
        onRender: () => {},
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