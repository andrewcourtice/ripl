import {
    BaseChartOptions,
    Chart,
} from '../core/chart';

import {
    Arc,
    ArcState,
    BaseElementState,
    createArc,
    createGroup,
    createText,
    easeOutQuint,
    elementIsArc,
    elementIsText,
    getTotal,
    Group,
    scaleContinuous,
    TAU,
    Text,
    TextState,
} from '@ripl/core';

import {
    arrayFilter,
    arrayJoin,
    arrayMap,
    typeIsFunction,
} from '@ripl/utilities';

export interface PieChartOptions<TData = unknown> extends BaseChartOptions {
    data: TData[];
    key: keyof TData | ((item: TData) => string);
    value: keyof TData | ((item: TData) => number);
    label: keyof TData | ((item: TData) => string);
    color: keyof TData | ((item: TData) => string);
}

export class PieChart<TData = unknown> extends Chart<PieChartOptions<TData>> {

    private groups: Group[] = [];

    constructor(target: string | HTMLElement, options: PieChartOptions<TData>) {
        super(target, options);
        this.init();
    }

    public async render() {
        return super.render((scene, renderer) => {
            const {
                data,
                key,
                value,
                label,
                color,
            } = this.options;

            const size = Math.min(scene.width, scene.height);

            const getKey = typeIsFunction(key) ? key : (item: unknown) => item[key] as string;
            const getValue = typeIsFunction(value) ? value : (item: unknown) => item[value] as number;
            const getLabel = typeIsFunction(label) ? label : (item: unknown) => item[label] as string;
            const getColor = typeIsFunction(color) ? color : (item: unknown) => item[color] as string;

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
            } = arrayJoin(calculations, this.groups, (item, group) => item.key === group.id);

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

                const segmentArc = createArc({
                    class: 'segment__arc',
                    cx,
                    cy,
                    startAngle,
                    padAngle,
                    endAngle: startAngle,
                    radius: 0,
                    innerRadius: 0,
                    fillStyle: color || '#FF0000',
                    data: {
                        endAngle,
                        radius,
                        innerRadius,
                    } as Partial<ArcState>,
                });

                const [
                    centroidx,
                    centroidY,
                ] = segmentArc.centroid;

                const segmentLabel = createText({
                    class: 'segment__label',
                    fillStyle: '#000000',
                    x: centroidx,
                    y: centroidY,
                    content: label,
                    textAlign: 'center',
                    textBaseline: 'middle',
                    globalAlpha: 0,
                });

                return createGroup({
                    id: key,
                    class: 'segment',
                    children: [
                        segmentArc,
                        segmentLabel,
                    ],
                });
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

                const arc = group.find('arc') as Arc;
                const label = group.find('text') as Text;

                arc.data = {
                    cx,
                    cy,
                    radius,
                    innerRadius,
                    startAngle,
                    endAngle,
                    fillStyle: color,
                } as Partial<ArcState>;

                const [
                    centroidx,
                    centroidY,
                ] = arc.centroid;

                label.data = {
                    x: centroidx,
                    y: centroidY,
                };

                return group;
            });

            const exits = arrayMap(right, group => {
                const arc = group.find('arc') as Arc;
                const label = group.find('text') as Text;

                const midAngle = (arc.startAngle + arc.endAngle) / 2;

                arc.data = {
                    startAngle: midAngle,
                    endAngle: midAngle,
                    radius: 0,
                    innerRadius: 0,
                } as Partial<ArcState>;

                label.data = {
                    globalAlpha: 0,
                } as Partial<TextState>;

                return group;
            });

            this.groups = [
                ...entries,
                ...updates,
            ];

            scene.add(entries);

            async function transitionEntries() {
                const elements = entries.flatMap(group => group.children);

                await renderer.transition(arrayFilter(elements, elementIsArc), (element, index, length) => ({
                    duration: 1000,
                    ease: easeOutQuint,
                    delay: index * (1000 / length),
                    state: element.data as Partial<ArcState>,
                }));

                return renderer.transition(arrayFilter(elements, elementIsText), {
                    duration: 2000,
                    ease: easeOutQuint,
                    state: {
                        globalAlpha: 1,
                    },
                });
            }

            async function transitionUpdates() {
                return renderer.transition(updates, element => ({
                    duration: 1000,
                    ease: easeOutQuint,
                    state: element.data as Partial<BaseElementState>,
                }));
            }

            async function transitionExits() {
                return renderer.transition(exits, element => ({
                    duration: 1000,
                    ease: easeOutQuint,
                    state: element.data as Partial<BaseElementState>,
                    callback: element => element.destroy(),
                }));
            }

            return Promise.all([
                transitionEntries(),
                transitionUpdates(),
                transitionExits(),
            ]);
        });
    }

}

export function createPieChart<TData = unknown>(target: string | HTMLElement, options: PieChartOptions<TData>) {
    return new PieChart<TData>(target, options);
}