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
    Context,
    createGroup,
    createRect,
    createText,
    easeOutCubic,
    easeOutQuart,
    Group,
    Rect,
    RectState,
    setColorAlpha,
} from '@ripl/core';

import {
    arrayForEach,
    arrayJoin,
    arrayMap,
    typeIsFunction,
} from '@ripl/utilities';

export interface FunnelChartOptions<TData = unknown> extends BaseChartOptions {
    data: TData[];
    key: keyof TData | ((item: TData) => string);
    value: keyof TData | ((item: TData) => number);
    label: keyof TData | ((item: TData) => string);
    color?: keyof TData | ((item: TData) => string);
    gap?: number;
    borderRadius?: number;
}

export class FunnelChart<TData = unknown> extends Chart<FunnelChartOptions<TData>> {

    private groups: Group[] = [];
    private tooltip: Tooltip;

    constructor(target: string | HTMLElement | Context, options: FunnelChartOptions<TData>) {
        super(target, options);

        this.tooltip = new Tooltip({
            scene: this.scene,
            renderer: this.renderer,
        });

        this.init();
    }

    public async render() {
        return super.render(async (scene, renderer) => {
            const {
                data,
                key,
                value,
                label,
                color,
                gap = 4,
                borderRadius = 4,
            } = this.options;

            const colorGenerator = getColorGenerator();

            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            const getKey = typeIsFunction(key) ? key : (item: any) => item[key] as string;
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            const getValue = typeIsFunction(value) ? value : (item: any) => item[value] as number;
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            const getLabel = typeIsFunction(label) ? label : (item: any) => item[label] as string;

            let getColor: ((item: TData) => string) | undefined;

            if (color) {
                // eslint-disable-next-line @typescript-eslint/no-explicit-any
                getColor = typeIsFunction(color) ? color : (item: any) => item[color] as string;
            }

            // Find max value for width scaling
            let maxValue = 0;

            arrayForEach(data, item => {
                maxValue = Math.max(maxValue, getValue(item));
            });

            const padding = this.getPadding();
            const availableWidth = scene.width - padding.left - padding.right;
            const availableHeight = scene.height - padding.top - padding.bottom;
            const segmentHeight = (availableHeight - gap * (data.length - 1)) / data.length;

            const calculations = arrayMap(data, (item, index) => {
                const itemKey = getKey(item);
                const itemValue = getValue(item);
                const itemLabel = getLabel(item);
                const itemColor = getColor ? getColor(item) : undefined;
                const widthRatio = itemValue / (maxValue || 1);
                const segmentWidth = availableWidth * widthRatio;
                const x = padding.left + (availableWidth - segmentWidth) / 2;
                const y = padding.top + index * (segmentHeight + gap);

                return {
                    key: itemKey,
                    value: itemValue,
                    label: itemLabel,
                    color: itemColor,
                    x,
                    y,
                    width: segmentWidth,
                    height: segmentHeight,
                };
            });

            const {
                left: entries,
                inner: updates,
                right: exits,
            } = arrayJoin(calculations, this.groups, (item, group) => item.key === group.id);

            arrayForEach(exits, group => group.destroy());

            const entryGroups = arrayMap(entries, item => {
                const itemColor = item.color ?? colorGenerator.next().value!;

                const rect = createRect({
                    id: `${item.key}-rect`,
                    x: scene.width / 2,
                    y: item.y,
                    width: 0,
                    height: item.height,
                    fillStyle: setColorAlpha(itemColor, 0.7),
                    borderRadius,
                    data: {
                        x: item.x,
                        width: item.width,
                        fillStyle: setColorAlpha(itemColor, 0.7),
                    } as RectState,
                });

                rect.on('mouseenter', () => {
                    this.tooltip.show(item.x + item.width / 2, item.y, `${item.label}: ${item.value}`);

                    renderer.transition(rect, {
                        duration: this.getAnimationDuration(200),
                        ease: easeOutQuart,
                        state: {
                            fillStyle: itemColor,
                        },
                    });

                    rect.once('mouseleave', () => {
                        this.tooltip.hide();

                        renderer.transition(rect, {
                            duration: this.getAnimationDuration(200),
                            ease: easeOutQuart,
                            state: {
                                fillStyle: setColorAlpha(itemColor, 0.7),
                            },
                        });
                    });
                });

                const text = createText({
                    id: `${item.key}-label`,
                    x: scene.width / 2,
                    y: item.y + item.height / 2,
                    content: item.label,
                    fillStyle: '#333',
                    font: '12px sans-serif',
                    textAlign: 'center',
                    textBaseline: 'middle',
                    globalAlpha: 0,
                    data: {
                        globalAlpha: 1,
                    },
                });

                return createGroup({
                    id: item.key,
                    children: [rect, text],
                });
            });

            const updateGroups = arrayMap(updates, ([item, group]) => {
                const rect = group.getElementsByType('rect')[0] as Rect;
                const itemColor = item.color ?? (rect.fillStyle as string);

                if (rect) {
                    rect.data = {
                        x: item.x,
                        y: item.y,
                        width: item.width,
                        height: item.height,
                        fillStyle: setColorAlpha(itemColor, 0.7),
                    } as RectState;
                }

                return group;
            });

            scene.add(entryGroups);

            this.groups = [
                ...entryGroups,
                ...updateGroups,
            ];

            // Animate entries
            const entryRects = entryGroups.flatMap(g => g.getElementsByType('rect')) as Rect[];
            const entryTexts = entryGroups.flatMap(g => g.getElementsByType('text'));

            const rectsTransition = renderer.transition(entryRects, (element, index, length) => ({
                duration: this.getAnimationDuration(800),
                delay: index * (this.getAnimationDuration(600) / length),
                ease: easeOutCubic,
                state: element.data as RectState,
            }));

            const textsTransition = renderer.transition(entryTexts, (element, index, length) => ({
                duration: this.getAnimationDuration(600),
                delay: this.getAnimationDuration(200) + index * (this.getAnimationDuration(600) / length),
                ease: easeOutCubic,
                state: element.data as Record<string, unknown>,
            }));

            // Animate updates
            const updateRects = updateGroups.flatMap(g => g.getElementsByType('rect')) as Rect[];

            const updatesTransition = renderer.transition(updateRects, element => ({
                duration: this.getAnimationDuration(800),
                ease: easeOutCubic,
                state: element.data as RectState,
            }));

            return Promise.all([
                rectsTransition,
                textsTransition,
                updatesTransition,
            ]);
        });
    }

}

export function createFunnelChart<TData = unknown>(target: string | HTMLElement | Context, options: FunnelChartOptions<TData>) {
    return new FunnelChart<TData>(target, options);
}
