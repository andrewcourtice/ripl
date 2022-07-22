import {
    ChartOptions,
    createChart,
} from '../core/chart';

import {
    createArc,
    createText,
    easeOutQuint,
    getArcCentroid,
    getTotal,
    scaleContinuous,
    TAU,
} from '@ripl/core';

import {
    arrayForEach,
    isFunction,
} from '@ripl/utilities';

export interface PieChartOptions<TData = unknown> extends ChartOptions {
    data: TData[];
    value: keyof TData | ((item: TData) => number);
    label: keyof TData | ((item: TData) => string);
    color: keyof TData | ((item: TData) => string);
}

export const createPieChart = createChart<PieChartOptions>(instance => {
    const {
        options,
        scene,
        renderer,
        onUpdate,
    } = instance;

    let segments: ReturnType<typeof createArc>[];
    let labels: ReturnType<typeof createText>[];

    const calculate = () => {
        const {
            data,
            value,
            label,
            color,
        } = options;

        const size = Math.min(scene.canvas.width, scene.canvas.height);

        const getValue = isFunction(value) ? value : (item: unknown) => item[value] as number;
        const getLabel = isFunction(label) ? label : (item: unknown) => item[label] as string;
        const getColor = isFunction(color) ? color : (item: unknown) => item[color] as string;

        const total = getTotal(data, getValue);
        const scale = scaleContinuous([0, total], [0, TAU], true);
        const cx = scene.canvas.width / 2;
        const cy = scene.canvas.height / 2;

        let startAngle = -(TAU / 4);

        segments = [];
        labels = [];

        arrayForEach(data, item => {
            const value = getValue(item);
            const color = getColor(item);
            const label = getLabel(item);
            const endAngle = startAngle + scale(value);

            const segmentArc = createArc({
                cx,
                cy,
                startAngle,
                endAngle: [startAngle, endAngle],
                radius: [0, size * 0.45],
                innerRadius: [0, size * 0.25],
                fillStyle: color || '#FF0000',
            });

            const [
                centroidx,
                centroidY,
            ] = getArcCentroid(segmentArc.state(1));

            const segmentLabel = createText({
                fillStyle: '#000000',
                x: centroidx,
                y: centroidY,
                content: label,
                textAlign: 'center',
                textBaseline: 'middle',
                globalAlpha: [0, 1],
            });

            segments.push(segmentArc);
            labels.push(segmentLabel);

            startAngle = endAngle;

            return segmentArc;
        });
    };

    calculate();
    onUpdate(calculate);

    return async () => {
        scene.clear();
        scene.add([
            ...segments,
            ...labels,
        ]);

        await renderer.transition(segments, {
            duration: 2000,
            ease: easeOutQuint,
            delay: index => index * (2000 / segments.length),
        });

        return renderer.transition(labels, {
            duration: 3000,
            ease: easeOutQuint,
        });
    };
});