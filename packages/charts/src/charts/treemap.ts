import type {
    BaseChartOptions,
} from '../core/chart';

import {
    Chart,
} from '../core/chart';

import type {
    ValueFormatInput,
} from '../core/options';

import {
    resolveValueFormat,
} from '../core/options';

import {
    createSegmentLabel,
} from '../core/labels';

import {
    applyHoverHighlight,
} from '../core/interaction';

import {
    ANIMATION_REFERENCE,
} from '../core/animation';

import {
    Tooltip,
} from '../components/tooltip';

import type {
    Context,
    EventMap,
    Group,
    Rect,
    RectState,
    Text,
} from '@ripl/core';

import {
    createGroup,
    createRect,
    easeOutCubic,
    setColorAlpha,
} from '@ripl/core';

import {
    arrayJoin,
    typeIsFunction,
} from '@ripl/utilities';

/** Options for configuring a {@link TreemapChart}. */
export interface TreemapChartOptions<TData = unknown> extends BaseChartOptions {
    data: TData[];
    key: keyof TData | ((item: TData) => string);
    value: keyof TData | ((item: TData) => number);
    label: keyof TData | ((item: TData) => string);
    color?: keyof TData | ((item: TData) => string);
    gap?: number;
    borderRadius?: number;
    /** Format applied to cell values shown as text (e.g. tooltips). */
    format?: ValueFormatInput;
}

/** Payload emitted for treemap cell interaction events. */
export interface TreemapChartCellEvent {
    x: number;
    y: number;
    value: number;
    label: string;
    key: string;
}

/** Events emitted by a {@link TreemapChart} that consumers can subscribe to via `chart.on(...)`. */
export interface TreemapChartEventMap extends EventMap {
    cellclick: TreemapChartCellEvent;
    cellenter: TreemapChartCellEvent;
    cellleave: TreemapChartCellEvent;
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

/**
 * Treemap chart rendering hierarchical data as nested, space-filling rectangles.
 *
 * Uses a recursive binary split layout to partition the available area
 * proportionally by value. Supports tooltips, auto-sized labels for
 * sufficiently large cells, and animated entry/update transitions.
 *
 * @typeParam TData - The type of each data item in the dataset.
 */
/** The opacity applied to a cell's fill at rest (full opacity is used on hover). */
const REST_ALPHA = 0.65;

export class TreemapChart<TData = unknown> extends Chart<TreemapChartOptions<TData>, TreemapChartEventMap> {

    private groups: Group[] = [];
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

            const layout = this.createLayout();
            this.reserveTitle(layout);
            const area = layout.area;

            const items = data.map(item => ({
                key: getKey(item),
                value: getValue(item),
                label: getLabel(item),
                color: getColor ? getColor(item) : undefined,
            }));

            // Resolve colours through the shared id-keyed map so they stay stable across data
            // updates instead of being reassigned from the generator on every render.
            this.resolveSeriesColors(items.map(item => ({
                id: item.key,
                color: item.color,
            })));

            const colorFor = (node: { key: string;
                color?: string; }) => node.color ?? this.getSeriesColor(node.key);

            const nodes = layoutTreemap(
                items,
                area.x,
                area.y,
                area.width,
                area.height,
                gap
            );

            const {
                left: entries,
                inner: updates,
                right: exits,
            } = arrayJoin(nodes, this.groups, (node, group) => node.key === group.id);

            exits.forEach(el => el.destroy());

            // A cell only carries a label when it is large enough to fit one; the font scales with
            // the cell width. Shared by the entry and update branches so both stay in sync.
            const showLabelFor = (node: { width: number;
                height: number; }) => node.width > 40 && node.height > 20;
            const labelFont = (width: number) => `600 ${Math.min(12, Math.max(9, width / 8))}px sans-serif`;

            const entryGroups = entries.map(node => {
                const nodeColor = colorFor(node);

                const rect = createRect({
                    id: `${node.key}-rect`,
                    x: node.x + node.width / 2,
                    y: node.y + node.height / 2,
                    width: 0,
                    height: 0,
                    fill: setColorAlpha(nodeColor, REST_ALPHA),
                    borderRadius,
                    data: {
                        x: node.x,
                        y: node.y,
                        width: node.width,
                        height: node.height,
                        fill: setColorAlpha(nodeColor, REST_ALPHA),
                    } as RectState,
                });

                this.attachCellHover(rect, node, nodeColor);

                // Add label if the cell is large enough
                const children: (Rect | Text)[] = [rect];

                if (showLabelFor(node)) {
                    const text = createSegmentLabel({
                        id: `${node.key}-label`,
                        x: node.x + node.width / 2,
                        y: node.y + node.height / 2,
                        content: node.label,
                        // Keep the treemap's size-adaptive font, but with the shared weight/family
                        // (and explicit styling, so Canvas and SVG render identically).
                        font: labelFont(node.width),
                    });

                    text.data = { opacity: 1 };

                    children.push(text);
                }

                return createGroup({
                    id: node.key,
                    children,
                });
            });

            // Labels reconciled on the update path (repositioned, and faded in/out as cells cross the
            // size threshold), collected here so they animate alongside their rectangles below.
            const updateTexts: Text[] = [];

            const updateGroups = updates.map(([node, group]) => {
                const rect = group.getElementsByType('rect')[0] as Rect;
                const nodeColor = colorFor(node);

                if (rect) {
                    rect.data = {
                        x: node.x,
                        y: node.y,
                        width: node.width,
                        height: node.height,
                        fill: setColorAlpha(nodeColor, REST_ALPHA),
                    } as RectState;

                    this.attachCellHover(rect, node, nodeColor);
                }

                // Move the label to the cell's new centre in lockstep with the rect (routing the new
                // position through `.data` so it tweens instead of snapping). Cells that grew past the
                // threshold gain a label; cells that shrank below it fade theirs out.
                const cx = node.x + node.width / 2;
                const cy = node.y + node.height / 2;
                const showLabel = showLabelFor(node);
                let text = group.getElementsByType('text')[0] as Text | undefined;

                if (!text && showLabel) {
                    text = createSegmentLabel({
                        id: `${node.key}-label`,
                        x: cx,
                        y: cy,
                        content: node.label,
                        font: labelFont(node.width),
                    });

                    group.add(text);
                }

                if (text) {
                    text.content = node.label;
                    text.font = labelFont(node.width);
                    text.data = {
                        x: cx,
                        y: cy,
                        opacity: showLabel ? 1 : 0,
                    };

                    updateTexts.push(text);
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

            // Glide the labels to their cells' new centres (and fade in/out) alongside the rects.
            const updateTextsTransition = renderer.transition(updateTexts, element => ({
                duration: this.getAnimationDuration(800),
                ease: easeOutCubic,
                state: (element.data ?? {}) as Record<string, unknown>,
            }));

            return Promise.all([
                rectsTransition,
                textsTransition,
                updatesTransition,
                updateTextsTransition,
            ]);
        });
    }

    private attachCellHover(rect: Rect, node: TreemapNode, color: string) {
        const hover = this.resolveAnimation(ANIMATION_REFERENCE.hover);
        const formatValue = resolveValueFormat(this.options.format);

        const payload = (point: { x: number;
            y: number; }): TreemapChartCellEvent => ({
            x: point.x,
            y: point.y,
            value: node.value,
            label: node.label,
            key: node.key,
        });

        applyHoverHighlight(rect, {
            renderer: this.renderer,
            duration: hover.duration,
            ease: hover.ease,
            tooltip: this.tooltip,
            anchor: () => ({
                x: node.x + node.width / 2,
                y: node.y,
            }),
            content: () => `${node.label}: ${formatValue(node.value)}`,
            highlight: { fill: color },
            restore: { fill: setColorAlpha(color, REST_ALPHA) },
            onEnter: point => this.emit('cellenter', payload(point)),
            onLeave: point => this.emit('cellleave', payload(point)),
            onClick: point => this.emit('cellclick', payload(point)),
        });
    }

}

/** Factory function that creates a new {@link TreemapChart} instance. */
export function createTreemapChart<TData = unknown>(target: string | HTMLElement | Context, options: TreemapChartOptions<TData>) {
    return new TreemapChart<TData>(target, options);
}
