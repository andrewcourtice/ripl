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
    arrayJoin,
    arrayMap,
    isFunction,
} from '@ripl/utilities';

export interface PieChartOptions<TData = unknown> extends ChartOptions {
    data: TData[];
    key: keyof TData | ((item: TData) => string);
    value: keyof TData | ((item: TData) => number);
    label: keyof TData | ((item: TData) => string);
    color: keyof TData | ((item: TData) => string);
}

export const createPieChart = createChart<PieChartOptions>(instance => {
    const {
        scene,
        renderer,
        onUpdate,
    } = instance;

    let segments: ReturnType<typeof createArc>[] = [];
    let labels: ReturnType<typeof createText>[] = [];
    let queue = [] as (() => void)[];

    const calculate = () => {
        const {
            data,
            key,
            value,
            label,
            color,
        } = instance.options;

        const size = Math.min(scene.width, scene.height);

        const getKey = isFunction(key) ? key : (item: unknown) => item[key] as string;
        const getValue = isFunction(value) ? value : (item: unknown) => item[value] as number;
        const getLabel = isFunction(label) ? label : (item: unknown) => item[label] as string;
        const getColor = isFunction(color) ? color : (item: unknown) => item[color] as string;

        const total = getTotal(data, getValue);
        const scale = scaleContinuous([0, total], [0, TAU], true);
        const cx = scene.width / 2;
        const cy = scene.height / 2;
        const offset = TAU / 4;

        let startAngle = -offset;

        const calculations = arrayMap(data, item => {
            const key = getKey(item);
            const value = getValue(item);
            const color = getColor(item);
            const label = getLabel(item);
            const endAngle = startAngle + scale(value);
            const radius = size * 0.45;
            const innerRadius = size * 0.25;

            const output = {
                key,
                value,
                color,
                label,
                startAngle,
                endAngle,
                radius,
                innerRadius,
                item,
            };

            startAngle = endAngle;

            return output;
        });

        const {
            left: entries,
            inner: updates,
            right: exits,
        } = arrayJoin(calculations, segments, (item, segment) => item.key === segment.id);

        segments = [];
        labels = [];
        queue = [];

        const enters = arrayMap(entries, item => {
            const {
                key,
                value,
                color,
                label,
                startAngle,
                endAngle,
                radius,
                innerRadius,
            } = item;

            const segmentArc = createArc({
                cx,
                cy,
                startAngle: [startAngle - Math.PI / 4, startAngle],
                endAngle: [startAngle, endAngle],
                radius: [0, radius],
                innerRadius: [0, innerRadius],
                fillStyle: color || '#FF0000',
            }, {
                id: key,
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

            return [
                segmentArc,
                segmentLabel,
            ];
        });

        queue.push(async () => {
            scene.add(enters.flat());

            await renderer.transition(enters.map(en => en[0]), {
                duration: 2000,
                ease: easeOutQuint,
                delay: index => index * (2000 / segments.length),
            });

            return renderer.transition(enters.map(en => en[1]), {
                duration: 3000,
                ease: easeOutQuint,
            });
        });

        const ups = arrayMap(updates, ([item, segment]) => {
            const {
                color,
                startAngle,
                endAngle,
                radius,
                innerRadius,
            } = item;

            segment.to({
                startAngle,
                endAngle,
                radius,
                innerRadius,
                fillStyle: color,
            });

            segments.push(segment);

            return segment;
        });

        queue.push(async () => {
            //scene.add(ups);

            await renderer.transition(ups, {
                duration: 2000,
                ease: easeOutQuint,
            });
        });
    };

    calculate();
    onUpdate(calculate);

    return async () => {
        await Promise.all(arrayMap(queue, exec => exec()));
    };
});