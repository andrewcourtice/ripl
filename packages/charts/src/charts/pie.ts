import {
    ChartOptions,
    createChart,
} from '../core/chart';

import {
    Arc,
    createArc,
    createGroup,
    createText,
    easeOutQuint,
    Element,
    getArcCentroid,
    getTotal,
    scaleContinuous,
    TAU,
    Text,
} from '@ripl/core';

import {
    arrayFilter,
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
    } = instance;

    let groups = [] as ReturnType<typeof createGroup>[]; //this is temporary

    return async () => {
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
        const offset = TAU / 4;
        const padAngle = 0.05 / data.length;

        let startAngle = -offset;

        const calculations = arrayMap(data, item => {
            const key = getKey(item);
            const value = getValue(item);
            const color = getColor(item);
            const label = getLabel(item);
            const cx = scene.width / 2;
            const cy = scene.height / 2;
            const endAngle = startAngle + scale(value);
            const radius = size * 0.45;
            const innerRadius = size * 0.25;

            const output = {
                key,
                value,
                color,
                label,
                cx,
                cy,
                startAngle,
                endAngle,
                padAngle,
                radius,
                innerRadius,
                item,
            };

            startAngle = endAngle;

            return output;
        });

        const {
            left,
            inner,
            right,
        } = arrayJoin(calculations, groups, (item, group) => item.key === group.id);

        const entries = arrayMap(left, item => {
            const {
                key,
                value,
                color,
                label,
                cx,
                cy,
                startAngle,
                endAngle,
                padAngle,
                radius,
                innerRadius,
            } = item;

            const group = createGroup(undefined, {
                id: key,
            });

            const segmentArc = createArc({
                cx,
                cy,
                startAngle,
                padAngle,
                endAngle: [startAngle, endAngle],
                radius: [0, radius],
                innerRadius: [0, innerRadius],
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

            group.add([
                segmentArc,
                segmentLabel,
            ]);

            return group;
        });

        const updates = arrayMap(inner, ([item, group]) => {
            const {
                color,
                cx,
                cy,
                radius,
                innerRadius,
                startAngle,
                endAngle,
            } = item;

            const arc = group.find('arc') as Element<Arc>;
            const label = group.find('text') as Element<Text>;

            arc.to({
                cx,
                cy,
                radius,
                innerRadius,
                startAngle,
                endAngle,
                fillStyle: color,
            }, 1);

            const [
                centroidx,
                centroidY,
            ] = getArcCentroid(arc.state(1));

            label.to({
                x: centroidx,
                y: centroidY,
            }, 1);

            return group;
        });

        const exits = arrayMap(right, group => {
            const arc = group.find('arc') as Element<Arc>;
            const label = group.find('text') as Element<Text>;

            const {
                startAngle,
            } = arc.state();

            arc.to({
                endAngle: startAngle,
                radius: 0,
                innerRadius: 0,
            }, 1);

            label.to({
                globalAlpha: 0,
            });

            return group;
        });

        groups = [
            ...entries,
            ...updates,
        ];

        scene.add(entries);

        async function transitionEntries() {
            const elements = entries.flatMap(group => group.elements);

            await renderer.transition(arrayFilter(elements, el => el.type === 'arc'), {
                duration: 1000,
                ease: easeOutQuint,
                delay: (index, length) => index * (1000 / length),
            });

            return renderer.transition(arrayFilter(elements, el => el.type === 'text'), {
                duration: 2000,
                ease: easeOutQuint,
            });
        }

        async function transitionUpdates() {
            return renderer.transition(updates, {
                duration: 1000,
                ease: easeOutQuint,
            });
        }

        async function transitionExits() {
            return renderer.transition(exits, {
                duration: 1000,
                ease: easeOutQuint,
                callback: element => element.destroy(),
            });
        }

        return Promise.all([
            transitionEntries(),
            transitionUpdates(),
            transitionExits(),
        ]);
    };
});