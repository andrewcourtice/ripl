import type {
    NumericAccessor,
} from '../core/data';

import type {
    BaseChartOptions,
} from '../core/chart';

import {
    Chart,
} from '../core/chart';

import type {
    ChartLegendInput,
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
    resolveColorBy,
} from '../core/color';

import {
    Tooltip,
} from '../components/tooltip';

import type {
    LegendItem,
} from '../components/legend';

import type {
    Context,
    EventMap,
    Group,
    Rect,
    RectState,
    Text,
    TextState,
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

/** The opacity applied to a segment's fill at rest (full opacity is used on hover). */
const REST_ALPHA = 0.7;

/** Options for configuring a {@link FunnelChart}. */
export interface FunnelChartOptions<TData = unknown> extends BaseChartOptions {
    /** The dataset rendered as funnel segments, top to bottom. */
    data: TData[];
    /** Accessor for each item's unique key (used for colour assignment and data joins). */
    key: keyof TData | ((item: TData) => string);
    /** Accessor for each segment's numeric value (drives its width). */
    value: NumericAccessor<TData>;
    /** Accessor for each segment's display label. */
    label: keyof TData | ((item: TData) => string);
    /** Optional per-item colour accessor; falls back to the generated palette. */
    colorBy?: keyof TData | ((item: TData) => string);
    /** Legend configuration. Shown by default; pass `false` to hide. */
    legend?: ChartLegendInput;
    /** Vertical gap in pixels between segments. Defaults to 4. */
    gap?: number;
    /** Corner radius in pixels applied to each segment. Defaults to 4. */
    borderRadius?: number;
    /** Format applied to segment values shown as text (e.g. tooltips). */
    format?: ValueFormatInput;
}

/** Payload emitted for funnel segment interaction events. */
export interface FunnelChartSegmentEvent {
    /** The x coordinate (in chart pixels) of the segment's top-centre anchor. */
    x: number;
    /** The y coordinate (in chart pixels) of the segment's top-centre anchor. */
    y: number;
    /** The value of the interacted segment. */
    value: number;
    /** The label of the interacted segment. */
    label: string;
    /** The key of the interacted segment. */
    key: string;
}

/** Events emitted by a {@link FunnelChart} that consumers can subscribe to via `chart.on(...)`. */
export interface FunnelChartEventMap extends EventMap {
    /** Emitted when a segment is clicked. */
    segmentclick: FunnelChartSegmentEvent;
    /** Emitted when the pointer enters a segment. */
    segmententer: FunnelChartSegmentEvent;
    /** Emitted when the pointer leaves a segment. */
    segmentleave: FunnelChartSegmentEvent;
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
export class FunnelChart<TData = unknown> extends Chart<FunnelChartOptions<TData>, FunnelChartEventMap> {

    private _groups: Group[] = [];
    private _tooltip: Tooltip;

    constructor(target: string | HTMLElement | Context, options: FunnelChartOptions<TData>) {
        super(target, options);

        this._tooltip = new Tooltip({
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
                colorBy,
                gap = 4,
                borderRadius = 4,
            } = this.options;

            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            const getKey = typeIsFunction(key) ? key : (item: any) => item[key] as string;
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            const getValue = typeIsFunction(value) ? value : (item: any) => item[value] as number;
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            const getLabel = typeIsFunction(label) ? label : (item: any) => item[label] as string;

            const getColor = resolveColorBy<TData>(colorBy);

            // Find max value for width scaling
            let maxValue = 0;

            data.forEach(item => {
                maxValue = Math.max(maxValue, getValue(item));
            });

            // Resolve colours through the shared id-keyed map so they stay stable across data
            // updates instead of being reassigned from the generator on every render.
            this.resolveSeriesColors(data.map(item => ({
                id: getKey(item),
                color: getColor(item),
            })));

            const colorFor = (item: { key: string;
                color?: string; }) => item.color ?? this.getSeriesColor(item.key);

            const layout = this.createLayout();
            this.reserveTitle(layout);

            const legendItems: LegendItem[] = data.map(item => ({
                id: getKey(item),
                label: getLabel(item),
                color: colorFor({
                    key: getKey(item),
                    color: getColor(item),
                }),
                active: true,
            }));

            this.reserveLegend(layout, legendItems, this.options.legend);

            const area = layout.area;

            const availableWidth = area.width;
            const availableHeight = area.height;
            const centerX = area.x + area.width / 2;
            const segmentHeight = (availableHeight - gap * (data.length - 1)) / data.length;

            const calculations = data.map((item, index) => {
                const itemKey = getKey(item);
                const itemValue = getValue(item);
                const itemLabel = getLabel(item);
                const itemColor = getColor(item);
                const widthRatio = itemValue / (maxValue || 1);
                const segmentWidth = availableWidth * widthRatio;
                const x = area.x + (availableWidth - segmentWidth) / 2;
                const y = area.y + index * (segmentHeight + gap);

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
            } = arrayJoin(calculations, this._groups, (item, group) => item.key === group.id);

            exits.forEach(el => el.destroy());

            const entryGroups = entries.map(item => {
                const itemColor = colorFor(item);

                const rect = createRect({
                    id: `${item.key}-rect`,
                    x: centerX,
                    y: item.y,
                    width: 0,
                    height: item.height,
                    fill: setColorAlpha(itemColor, REST_ALPHA),
                    borderRadius,
                    data: {
                        x: item.x,
                        width: item.width,
                        fill: setColorAlpha(itemColor, REST_ALPHA),
                    } as RectState,
                });

                this._attachSegmentHover(rect, item, itemColor);

                const text = createSegmentLabel({
                    id: `${item.key}-label`,
                    x: centerX,
                    y: item.y + item.height / 2,
                    content: item.label,
                });

                text.data = { opacity: 1 };

                return createGroup({
                    id: item.key,
                    children: [rect, text],
                });
            });

            const updateGroups = updates.map(([item, group]) => {
                const rect = group.getElementsByType('rect')[0] as Rect;
                const label = group.getElementsByType('text')[0] as Text;
                const itemColor = colorFor(item);

                if (rect) {
                    rect.data = {
                        x: item.x,
                        y: item.y,
                        width: item.width,
                        height: item.height,
                        fill: setColorAlpha(itemColor, REST_ALPHA),
                    } as RectState;

                    this._attachSegmentHover(rect, item, itemColor);
                }

                // Re-centre the label on the resized/repositioned segment (was previously left stale).
                if (label) {
                    label.content = item.label;
                    label.data = {
                        x: centerX,
                        y: item.y + item.height / 2,
                        opacity: 1,
                    } as Partial<TextState>;
                }

                return group;
            });

            scene.add(entryGroups);

            this._groups = [
                ...entryGroups,
                ...updateGroups,
            ];

            // Legend hover dims the other segments (group id == legend item id == item key).
            this.registerHighlightGroups(this._groups);

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

            // Animate updates (rects reposition/resize; labels re-centre on their segment).
            const updateRects = updateGroups.flatMap(g => g.getElementsByType('rect')) as Rect[];
            const updateTexts = updateGroups.flatMap(g => g.getElementsByType('text')) as Text[];

            const updatesTransition = renderer.transition(updateRects, element => ({
                duration: this.getAnimationDuration(800),
                ease: easeOutCubic,
                state: element.data as RectState,
            }));

            const updateTextsTransition = renderer.transition(updateTexts, element => ({
                duration: this.getAnimationDuration(800),
                ease: easeOutCubic,
                state: element.data as Partial<TextState>,
            }));

            return Promise.all([
                rectsTransition,
                textsTransition,
                updatesTransition,
                updateTextsTransition,
            ]);
        });
    }

    private _attachSegmentHover(rect: Rect, item: { key: string;
        value: number;
        label: string;
        x: number;
        y: number;
        width: number; }, color: string) {
        const formatValue = resolveValueFormat(this.options.format);

        const payload = (point: { x: number;
            y: number; }): FunnelChartSegmentEvent => ({
            x: point.x,
            y: point.y,
            value: item.value,
            label: item.label,
            key: item.key,
        });

        applyHoverHighlight(rect, {
            renderer: this.renderer,
            animation: () => this.resolveAnimation(ANIMATION_REFERENCE.hover),
            tooltip: this._tooltip,
            anchor: () => ({
                x: item.x + item.width / 2,
                y: item.y,
            }),
            content: () => `${item.label}: ${formatValue(item.value)}`,
            highlight: { fill: color },
            restore: { fill: setColorAlpha(color, REST_ALPHA) },
            onEnter: point => this.emit('segmententer', payload(point)),
            onLeave: point => this.emit('segmentleave', payload(point)),
            onClick: point => this.emit('segmentclick', payload(point)),
        });
    }

}

/**
 * Factory function that creates a new {@link FunnelChart} instance.
 *
 * @example
 * ```ts
 * createFunnelChart(target, {
 *     data: [
 *         { stage: 'Visited', users: 1000 },
 *         { stage: 'Signed up', users: 420 },
 *         { stage: 'Purchased', users: 130 },
 *     ],
 *     key: 'stage',
 *     label: 'stage',
 *     value: 'users',
 * });
 * ```
 */
export function createFunnelChart<TData = unknown>(target: string | HTMLElement | Context, options: FunnelChartOptions<TData>) {
    return new FunnelChart<TData>(target, options);
}
