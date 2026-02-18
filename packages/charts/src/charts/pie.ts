import {
    BaseChartOptions,
    Chart,
} from '../core/chart';

import {
    getColorGenerator,
} from '../constants/colors';

import {
    Tooltip,
} from '../components/tooltip';

import {
    Legend,
    LegendItem,
} from '../components/legend';

import {
    Arc,
    ArcState,
    BaseElementState,
    Context,
    createArc,
    createGroup,
    createText,
    easeOutQuart,
    easeOutQuint,
    elementIsArc,
    elementIsText,
    getTotal,
    Group,
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

export interface PieChartOptions<TData = unknown> extends BaseChartOptions {
    data: TData[];
    key: keyof TData | ((item: TData) => string);
    value: keyof TData | ((item: TData) => number);
    label: keyof TData | ((item: TData) => string);
    color?: keyof TData | ((item: TData) => string);
    innerRadius?: number;
    showLegend?: boolean;
}

export class PieChart<TData = unknown> extends Chart<PieChartOptions<TData>> {

    private groups: Group[] = [];
    private colorGenerator = getColorGenerator();
    private tooltip: Tooltip;
    private legend?: Legend;

    constructor(target: string | HTMLElement | Context, options: PieChartOptions<TData>) {
        super(target, options);

        this.tooltip = new Tooltip({
            scene: this.scene,
            renderer: this.renderer,
        });

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

            const colorGenerator = this.colorGenerator;

            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            const getKey = typeIsFunction(key) ? key : (item: any) => item[key] as string;
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            const getValue = typeIsFunction(value) ? value : (item: any) => item[value] as number;
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            const getLabel = typeIsFunction(label) ? label : (item: any) => item[label] as string;
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            const getColor = typeIsFunction(color) ? color : (item: any) => item[color] as string;

            // Compute legend bounds early to reserve space
            const padding = this.getPadding();
            let legendHeight = 0;

            if (this.options.showLegend !== false && data.length > 0) {
                const legendItems: LegendItem[] = arrayMap(data, item => ({
                    id: getKey(item),
                    label: getLabel(item),
                    color: getColor(item) ?? colorGenerator.next().value,
                    active: true,
                }));

                if (!this.legend) {
                    this.legend = new Legend({
                        scene: this.scene,
                        renderer: this.renderer,
                        items: legendItems,
                        position: 'bottom',
                        onToggle: () => this.render(),
                    });
                } else {
                    this.legend.update(legendItems);
                }

                const legendWidth = scene.width - padding.left - padding.right;
                legendHeight = this.legend.getBoundingBox(legendWidth).height;
            }

            const size = Math.min(scene.width, scene.height - legendHeight);

            const total = getTotal(data, getValue);
            const scale = scaleContinuous([0, total], [0, TAU], { clamp: true });
            const offset = TAU / 4;
            const padAngle = data.length === 1 ? 0 : 0.1 / data.length;

            let startAngle = -offset;

            const calculations = arrayMap(data, item => {
                const key = getKey(item);
                const value = getValue(item);
                const color = getColor(item);
                const label = getLabel(item);
                const cx = scene.width / 2;
                const cy = (scene.height - legendHeight) / 2;
                const endAngle = startAngle + scale(value);
                const radius = size * 0.45;
                const innerRadiusOption = this.options.innerRadius;
                let innerRadius = size * 0.25;

                if (innerRadiusOption !== undefined) {
                    innerRadius = innerRadiusOption <= 1 ? size * innerRadiusOption : innerRadiusOption;
                }

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
                    padAngle,
                    strokeStyle: color,
                    fillStyle: setColorAlpha(color, 0.55),
                    lineWidth: 2,
                    endAngle: startAngle,
                    radius: 0,
                    innerRadius: 0,
                    data: {
                        endAngle,
                        radius,
                        innerRadius,
                    } as Partial<ArcState>,
                });

                segmentArc.on('mouseenter', () => {
                    const [
                        centroidX,
                        centroidY,
                    ] = segmentArc.getCentroid(segmentArc.data as Partial<ArcState>);

                    this.tooltip.show(centroidX, centroidY, value.toString());

                    renderer.transition(segmentArc, {
                        duration: this.getAnimationDuration(500),
                        ease: easeOutQuart,
                        state: {
                            fillStyle: color,
                        },
                    });
                });

                segmentArc.once('mouseleave', () => {
                    this.tooltip.hide();

                    renderer.transition(segmentArc, {
                        duration: this.getAnimationDuration(500),
                        ease: easeOutQuart,
                        state: {
                            fillStyle: setColorAlpha(color, 0.55),
                        },
                    });
                });

                const [
                    centroidX,
                    centroidY,
                ] = segmentArc.getCentroid(segmentArc.data as Partial<ArcState>);

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

                const resolvedColor = item.color ?? arc.strokeStyle;

                const arcData = {
                    cx,
                    cy,
                    radius,
                    innerRadius,
                    startAngle,
                    endAngle,
                    padAngle,
                    strokeStyle: resolvedColor,
                    fillStyle: setColorAlpha(resolvedColor, 0.55),
                } as Partial<ArcState>;

                const [
                    centroidx,
                    centroidY,
                ] = arc.getCentroid(arcData);

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

            // Render legend
            if (this.legend && legendHeight > 0) {
                const legendWidth = scene.width - padding.left - padding.right;
                this.legend.render(padding.left, scene.height - legendHeight, legendWidth);
            }

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
                    duration: animDuration * 2,
                    ease: easeOutQuint,
                    state: {
                        globalAlpha: 1,
                    },
                });
            }

            async function transitionUpdates() {
                return renderer.transition(updates, element => ({
                    duration: animDuration,
                    ease: easeOutQuint,
                    state: element.data as Partial<BaseElementState>,
                }));
            }

            async function transitionExits() {
                return renderer.transition(exits, element => ({
                    duration: animDuration,
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

export function createPieChart<TData = unknown>(target: string | HTMLElement | Context, options: PieChartOptions<TData>) {
    return new PieChart<TData>(target, options);
}
