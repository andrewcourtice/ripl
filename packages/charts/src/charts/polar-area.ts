import {
    BaseChartOptions,
    Chart,
} from '../core/chart';

import {
    getColorGenerator,
} from '../constants/colors';

import {
    Arc,
    ArcState,
    BaseElementState,
    Context,
    createArc,
    createGroup,
    createText,
    easeOutQuint,
    elementIsArc,
    elementIsText,
    Group,
    maxOf,
    scaleContinuous,
    setColorAlpha,
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

export interface PolarAreaChartOptions<TData = unknown> extends BaseChartOptions {
    data: TData[];
    key: keyof TData | ((item: TData) => string);
    value: keyof TData | ((item: TData) => number);
    label: keyof TData | ((item: TData) => string);
    color?: keyof TData | ((item: TData) => string);
    /** Inner radius ratio (0 - 1). Defaults to 0.15 */
    innerRadiusRatio?: number;
    /** Maximum radius ratio (0 - 0.5). Defaults to 0.45 (similar to pie chart). */
    maxRadiusRatio?: number;
    /** Padding angle between segments in radians. Defaults to 0.02 */
    padAngle?: number;
}

/**
 * PolarAreaChart renders equal angle segments whose radius encodes the value.
 * Transitions follow the same pattern as `PieChart` (enter/update/exit with staged animation).
 */
export class PolarAreaChart<TData = unknown> extends Chart<PolarAreaChartOptions<TData>> {

    private groups: Group[] = [];

    constructor(target: string | HTMLElement | Context, options: PolarAreaChartOptions<TData>) {
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
                innerRadiusRatio = 0.15,
                maxRadiusRatio = 0.45,
                padAngle = 0.02,
            } = this.options;

            if (!data.length) {
                return Promise.resolve();
            }

            const colorGenerator = getColorGenerator();
            const size = Math.min(scene.width, scene.height);

            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            const getKey = typeIsFunction(key) ? key : (item: any) => item[key] as string;
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            const getValue = typeIsFunction(value) ? value : (item: any) => item[value] as number;
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            const getLabel = typeIsFunction(label) ? label : (item: any) => item[label] as string;
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            const getColor = typeIsFunction(color) ? color : (item: any) => item[color] as string;

            const maxValue = maxOf(data, getValue) ?? 0;
            const valueScale = scaleContinuous([0, maxValue], [size * innerRadiusRatio, size * maxRadiusRatio], { clamp: true });

            const angleStep = TAU / data.length;
            const startOffset = -TAU / 4; // Start at 12 o'clock similar to PieChart

            const calculations = arrayMap(data, (item, index) => {
                const key = getKey(item);
                const v = getValue(item);
                const color = getColor(item);
                const label = getLabel(item);
                const cx = scene.width / 2;
                const cy = scene.height / 2;
                const startAngle = startOffset + index * angleStep;
                const endAngle = startAngle + angleStep;
                const innerRadius = size * innerRadiusRatio;
                const radius = valueScale(v);

                return {
                    key,
                    value: v,
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
            });

            const {
                left,
                inner,
                right,
            } = arrayJoin(calculations, this.groups, (item, group) => item.key === group.id);

            const entries = arrayMap(left, item => {
                const {
                    key,
                    color = colorGenerator.next().value,
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
                    endAngle: startAngle, // animate angle grow subtly
                    padAngle,
                    strokeStyle: color,
                    fillStyle: setColorAlpha(color, 0.55),
                    lineWidth: 2,
                    radius: innerRadius, // animate radial growth
                    innerRadius,
                    data: {
                        endAngle,
                        radius,
                    } as Partial<ArcState>,
                });

                segmentArc.on('mouseenter', () => {
                    renderer.transition(segmentArc, {
                        duration: this.getAnimationDuration(400),
                        ease: easeOutQuint,
                        state: {
                            fillStyle: color,
                        },
                    });

                    segmentArc.once('mouseleave', () => {
                        renderer.transition(segmentArc, {
                            duration: this.getAnimationDuration(400),
                            ease: easeOutQuint,
                            state: {
                                fillStyle: setColorAlpha(color, 0.55),
                            },
                        });
                    });
                });

                const [centroidX, centroidY] = segmentArc.getCentroid(segmentArc.data as Partial<ArcState>);

                const segmentLabel = createText({
                    class: 'segment__label',
                    fillStyle: '#000000',
                    x: centroidX,
                    y: centroidY,
                    content: label,
                    textAlign: 'center',
                    textBaseline: 'middle',
                    globalAlpha: 0,
                    zIndex: 1,
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
                    padAngle,
                } = item;

                const arc = group.query('arc') as Arc;
                const label = group.query('text') as Text;

                const arcData = {
                    cx,
                    cy,
                    radius,
                    innerRadius,
                    startAngle,
                    endAngle,
                    padAngle,
                    strokeStyle: color,
                    fillStyle: setColorAlpha(color, 0.55),
                } as Partial<ArcState>;

                const [centroidx, centroidY] = arc.getCentroid(arcData);

                arc.data = arcData;
                label.data = {
                    x: centroidx,
                    y: centroidY,
                };

                return group;
            });

            const exits = arrayMap(right, group => {
                const arc = group.query('arc') as Arc;
                const label = group.query('text') as Text;

                const midAngle = (arc.startAngle + arc.endAngle) / 2;

                arc.data = {
                    startAngle: midAngle,
                    endAngle: midAngle,
                    radius: arc.innerRadius,
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

            const animDuration = this.getAnimationDuration(1000);

            async function transitionEntries() {
                const elements = entries.flatMap(group => group.children);

                await renderer.transition(arrayFilter(elements, elementIsArc), (element, index, length) => ({
                    duration: animDuration,
                    ease: easeOutQuint,
                    delay: index * (animDuration / length),
                    state: element.data as Partial<ArcState>,
                }));

                return renderer.transition(arrayFilter(elements, elementIsText), {
                    duration: animDuration * 1.5,
                    ease: easeOutQuint,
                    state: {
                        globalAlpha: 1,
                    },
                });
            }

            async function transitionUpdates() {
                return renderer.transition(updates, element => ({
                    duration: animDuration * 0.8,
                    ease: easeOutQuint,
                    state: element.data as Partial<BaseElementState>,
                }));
            }

            async function transitionExits() {
                return renderer.transition(exits, element => ({
                    duration: animDuration * 0.8,
                    ease: easeOutQuint,
                    state: element.data as Partial<BaseElementState>,
                    onComplete: element => element.destroy(),
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

export function createPolarAreaChart<TData = unknown>(target: string | HTMLElement | Context, options: PolarAreaChartOptions<TData>) {
    return new PolarAreaChart<TData>(target, options);
}
