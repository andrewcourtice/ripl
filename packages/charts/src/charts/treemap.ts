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

export interface TreemapChartOptions<TData = unknown> extends BaseChartOptions {
    data: TData[];
    key: keyof TData | ((item: TData) => string);
    value: keyof TData | ((item: TData) => number);
    label: keyof TData | ((item: TData) => string);
    color?: keyof TData | ((item: TData) => string);
    gap?: number;
    borderRadius?: number;
}

interface TreemapNode {
    key: string;
    value: number;
    label: string;
    color?: string;
    x: number;
    y: number;
    width: number;
    height: number;
}

interface TreemapItem {
    key: string;
    value: number;
    label: string;
    color?: string;
}

function layoutTreemap(
    items: TreemapItem[],
    x: number,
    y: number,
    width: number,
    height: number,
    gap: number
): TreemapNode[] {
    const total = items.reduce((sum, item) => sum + item.value, 0);

    if (items.length === 0 || total === 0) return [];

    if (items.length === 1) {
        return [{
            ...items[0],
            x: x + gap / 2,
            y: y + gap / 2,
            width: Math.max(0, width - gap),
            height: Math.max(0, height - gap),
        }];
    }

    // Sort by value descending
    const sorted = [...items].sort((a, b) => b.value - a.value);

    // Split into two groups trying to balance total values
    let leftTotal = 0;
    const halfTotal = total / 2;
    let splitIndex = 0;

    for (let i = 0; i < sorted.length; i++) {
        if (leftTotal + sorted[i].value > halfTotal && i > 0) {
            splitIndex = i;
            break;
        }

        leftTotal += sorted[i].value;
        splitIndex = i + 1;
    }

    const leftItems = sorted.slice(0, splitIndex);
    const rightItems = sorted.slice(splitIndex);
    const leftRatio = leftTotal / total;

    if (width >= height) {
        const leftWidth = width * leftRatio;
        return [
            ...layoutTreemap(leftItems, x, y, leftWidth, height, gap),
            ...layoutTreemap(rightItems, x + leftWidth, y, width - leftWidth, height, gap),
        ];
    }

    const topHeight = height * leftRatio;
    return [
        ...layoutTreemap(leftItems, x, y, width, topHeight, gap),
        ...layoutTreemap(rightItems, x, y + topHeight, width, height - topHeight, gap),
    ];
}

export class TreemapChart<TData = unknown> extends Chart<TreemapChartOptions<TData>> {

    private groups: Group[] = [];
    private colorGenerator = getColorGenerator();
    private tooltip: Tooltip;

    constructor(target: string | HTMLElement | Context, options: TreemapChartOptions<TData>) {
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
                gap = 3,
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

            const padding = this.getPadding();

            const items = arrayMap(data, item => ({
                key: getKey(item),
                value: getValue(item),
                label: getLabel(item),
                color: getColor ? getColor(item) : undefined,
            }));

            const nodes = layoutTreemap(
                items,
                padding.left,
                padding.top,
                scene.width - padding.left - padding.right,
                scene.height - padding.top - padding.bottom,
                gap
            );

            const {
                left: entries,
                inner: updates,
                right: exits,
            } = arrayJoin(nodes, this.groups, (node, group) => node.key === group.id);

            arrayForEach(exits, group => group.destroy());

            const entryGroups = arrayMap(entries, node => {
                const nodeColor = node.color ?? colorGenerator.next().value!;

                const rect = createRect({
                    id: `${node.key}-rect`,
                    x: node.x + node.width / 2,
                    y: node.y + node.height / 2,
                    width: 0,
                    height: 0,
                    fillStyle: setColorAlpha(nodeColor, 0.65),
                    borderRadius,
                    data: {
                        x: node.x,
                        y: node.y,
                        width: node.width,
                        height: node.height,
                        fillStyle: setColorAlpha(nodeColor, 0.65),
                    } as RectState,
                });

                rect.on('mouseenter', () => {
                    this.tooltip.show(
                        node.x + node.width / 2,
                        node.y,
                        `${node.label}: ${node.value}`
                    );

                    renderer.transition(rect, {
                        duration: this.getAnimationDuration(200),
                        ease: easeOutQuart,
                        state: {
                            fillStyle: nodeColor,
                        },
                    });

                    rect.once('mouseleave', () => {
                        this.tooltip.hide();

                        renderer.transition(rect, {
                            duration: this.getAnimationDuration(200),
                            ease: easeOutQuart,
                            state: {
                                fillStyle: setColorAlpha(nodeColor, 0.65),
                            },
                        });
                    });
                });

                // Add label if the cell is large enough
                const children: (Rect | ReturnType<typeof createText>)[] = [rect];

                if (node.width > 40 && node.height > 20) {
                    const text = createText({
                        id: `${node.key}-label`,
                        x: node.x + node.width / 2,
                        y: node.y + node.height / 2,
                        content: node.label,
                        fillStyle: '#333',
                        font: `${Math.min(12, Math.max(9, node.width / 8))}px sans-serif`,
                        textAlign: 'center',
                        textBaseline: 'middle',
                        globalAlpha: 0,
                        data: {
                            globalAlpha: 1,
                        },
                    });

                    children.push(text);
                }

                return createGroup({
                    id: node.key,
                    children,
                });
            });

            const updateGroups = arrayMap(updates, ([node, group]) => {
                const rect = group.getElementsByType('rect')[0] as Rect;
                const nodeColor = node.color ?? (rect.fillStyle as string);

                if (rect) {
                    rect.data = {
                        x: node.x,
                        y: node.y,
                        width: node.width,
                        height: node.height,
                        fillStyle: setColorAlpha(nodeColor, 0.65),
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

            const rectsTransition = renderer.transition(entryRects, (element, index, length) => ({
                duration: this.getAnimationDuration(800),
                delay: index * (this.getAnimationDuration(500) / length),
                ease: easeOutCubic,
                state: element.data as RectState,
            }));

            const entryTexts = entryGroups.flatMap(g => g.getElementsByType('text'));

            const textsTransition = renderer.transition(entryTexts, (element, index, length) => ({
                duration: this.getAnimationDuration(500),
                delay: this.getAnimationDuration(300) + index * (this.getAnimationDuration(400) / length),
                ease: easeOutCubic,
                state: (element.data ?? {}) as Record<string, unknown>,
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

export function createTreemapChart<TData = unknown>(target: string | HTMLElement | Context, options: TreemapChartOptions<TData>) {
    return new TreemapChart<TData>(target, options);
}
