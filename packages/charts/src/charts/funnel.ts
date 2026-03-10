import {
    BaseChartOptions,
    Chart,
} from '../core/chart';

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
    arrayJoin,
    typeIsFunction,
} from '@ripl/utilities';

/** Options for configuring a {@link FunnelChart}. */
export interface FunnelChartOptions<TData = unknown> extends BaseChartOptions {
    data: TData[];
    key: keyof TData | ((item: TData) => string);
    value: keyof TData | ((item: TData) => number);
    label: keyof TData | ((item: TData) => string);
    color?: keyof TData | ((item: TData) => string);
    gap?: number;
    borderRadius?: number;
}

/**
 * Funnel chart rendering horizontally centered bars of decreasing width.
 *
 * Each data item is rendered as a centered rectangle whose width is
 * proportional to its value relative to the maximum. Segments are stacked
 * vertically with configurable gaps. Supports tooltips, labels, and
 * animated expand-from-center entry transitions.
 *
 * @typeParam TData - The type of each data item in the dataset.
 */
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

            const colorGenerator = this.colorGenerator;

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

            data.forEach(item => {
                maxValue = Math.max(maxValue, getValue(item));
            });

            const padding = this.getPadding();
            const availableWidth = scene.width - padding.left - padding.right;
            const availableHeight = scene.height - padding.top - padding.bottom;
            const segmentHeight = (availableHeight - gap * (data.length - 1)) / data.length;

            const calculations = data.map((item, index) => {
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

            exits.forEach(el => el.destroy());

            const entryGroups = entries.map(item => {
                const itemColor = item.color ?? colorGenerator.next().value!;

                const rect = createRect({
                    id: `${item.key}-rect`,
                    x: scene.width / 2,
                    y: item.y,
                    width: 0,
                    height: item.height,
                    fill: setColorAlpha(itemColor, 0.7),
                    borderRadius,
                    data: {
                        x: item.x,
                        width: item.width,
                        fill: setColorAlpha(itemColor, 0.7),
                    } as RectState,
                });

                rect.on('mouseenter', () => {
                    this.tooltip.show(item.x + item.width / 2, item.y, `${item.label}: ${item.value}`);

                    renderer.transition(rect, {
                        duration: this.getAnimationDuration(200),
                        ease: easeOutQuart,
                        state: {
                            fill: itemColor,
                        },
                    });

                    rect.on('mouseleave', () => {
                        this.tooltip.hide();

                        renderer.transition(rect, {
                            duration: this.getAnimationDuration(200),
                            ease: easeOutQuart,
                            state: {
                                fill: setColorAlpha(itemColor, 0.7),
                            },
                        });
                    });
                });

                const text = createText({
                    id: `${item.key}-label`,
                    x: scene.width / 2,
                    y: item.y + item.height / 2,
                    content: item.label,
                    fill: '#333',
                    font: '12px sans-serif',
                    textAlign: 'center',
                    textBaseline: 'middle',
                    opacity: 0,
                    data: {
                        opacity: 1,
                    },
                });

                return createGroup({
                    id: item.key,
                    children: [rect, text],
                });
            });

            const updateGroups = updates.map(([item, group]) => {
                const rect = group.getElementsByType('rect')[0] as Rect;
                const itemColor = item.color ?? (rect.fill as string);

                if (rect) {
                    rect.data = {
                        x: item.x,
                        y: item.y,
                        width: item.width,
                        height: item.height,
                        fill: setColorAlpha(itemColor, 0.7),
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

/** Factory function that creates a new {@link FunnelChart} instance. */
export function createFunnelChart<TData = unknown>(target: string | HTMLElement | Context, options: FunnelChartOptions<TData>) {
    return new FunnelChart<TData>(target, options);
}
