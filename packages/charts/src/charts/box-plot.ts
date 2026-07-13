import type {
    CartesianChartOptions,
} from '../core/cartesian';

import {
    CartesianChart,
} from '../core/cartesian';

import type {
    ChartAxisInput,
    ChartGridInput,
    ChartTooltipInput,
    ValueFormatInput,
} from '../core/options';

import {
    resolveValueFormat,
} from '../core/options';

import {
    ANIMATION_REFERENCE,
    exitElement,
    stagger,
} from '../core/animation';

import {
    applyHoverHighlight,
} from '../core/interaction';

import {
    resolveAccessor,
} from '../core/data';

import {
    boxplotStats,
    rollup,
} from '../core/statistics';

import type {
    BoxplotStats,
} from '../core/statistics';

import type {
    Context,
    EventMap,
    Group,
    Rect,
    Scale,
} from '@ripl/core';

import {
    Box,
    createCircle,
    createGroup,
    createLine,
    createRect,
    getExtent,
    scaleContinuous,
    setColorAlpha,
} from '@ripl/core';

import {
    arrayJoin,
} from '@ripl/utilities';

/** The opacity applied to a box's fill at rest (full opacity on hover). */
const REST_ALPHA = 0.25;

/** Options for configuring a {@link BoxPlotChart}. */
export interface BoxPlotChartOptions<TData = unknown> extends CartesianChartOptions<TData> {
    data: TData[];
    /** Accessor for the category each value belongs to. */
    group: keyof TData | ((item: TData) => string);
    /** Accessor for the numeric value to summarise. */
    value: keyof TData | ((item: TData) => number);
    /** Explicit category order (defaults to first-seen order in the data). */
    categories?: string[];
    color?: string;
    grid?: ChartGridInput;
    tooltip?: ChartTooltipInput;
    axis?: ChartAxisInput<TData>;
    /** Format applied to summary values shown in tooltips. */
    format?: ValueFormatInput;
}

/** Payload emitted for box interaction events. */
export interface BoxPlotBoxEvent {
    x: number;
    y: number;
    category: string;
    stats: BoxplotStats;
}

/** Events emitted by a {@link BoxPlotChart} that consumers can subscribe to via `chart.on(...)`. */
export interface BoxPlotChartEventMap extends EventMap {
    boxclick: BoxPlotBoxEvent;
    boxenter: BoxPlotBoxEvent;
    boxleave: BoxPlotBoxEvent;
}

/**
 * Box-plot chart: summarises a numeric field per category with the shared {@link boxplotStats}
 * transform and draws a box (Q1–Q3) with a median line, whiskers to the 1.5×IQR fences, and outlier
 * points. Boxes fade/grow in on entry and animate out on exit.
 *
 * @typeParam TData - The type of each data item in the dataset.
 */
export class BoxPlotChart<TData = unknown> extends CartesianChart<BoxPlotChartOptions<TData>, TData, BoxPlotChartEventMap> {

    private _groups: Group[] = [];

    constructor(target: string | HTMLElement | Context, options: BoxPlotChartOptions<TData>) {
        super(target, options);

        this.setupCartesian({
            grid: {
                horizontal: true,
                vertical: false,
            },
        });

        this.init();
    }

    private _attachBoxHover(rect: Rect, category: string, stats: BoxplotStats): void {
        const restFill = rect.fill as string;
        const hover = this.resolveAnimation(ANIMATION_REFERENCE.hover);
        const formatValue = resolveValueFormat(this.options.format);

        const payload = (point: {
            x: number;
            y: number;
        }): BoxPlotBoxEvent => ({
            x: point.x,
            y: point.y,
            category,
            stats,
        });

        applyHoverHighlight(rect, {
            renderer: this.renderer,
            duration: hover.duration,
            ease: hover.ease,
            tooltip: this.tooltip,
            anchor: () => ({
                x: rect.x + rect.width / 2,
                y: rect.y,
            }),
            content: () => `${category} — median ${formatValue(stats.median)} (Q1 ${formatValue(stats.q1)}, Q3 ${formatValue(stats.q3)})`,
            highlight: {
                fill: setColorAlpha(restFill, 0.5),
            },
            restore: {
                fill: restFill,
            },
            onEnter: point => this.emit('boxenter', payload(point)),
            onLeave: point => this.emit('boxleave', payload(point)),
            onClick: point => this.emit('boxclick', payload(point)),
        });
    }

    private _createBox(category: string, stats: BoxplotStats, centre: number, boxWidth: number, valueScale: Scale<number>, color: string): Group {
        const left = centre - boxWidth / 2;
        const capWidth = boxWidth * 0.5;

        const box = createRect({
            id: `${category}-box`,
            x: left,
            y: valueScale(stats.q3),
            width: boxWidth,
            height: Math.max(0, valueScale(stats.q1) - valueScale(stats.q3)),
            fill: setColorAlpha(color, REST_ALPHA),
            stroke: color,
            lineWidth: 1.5,
        });

        this._attachBoxHover(box, category, stats);

        const median = createLine({
            id: `${category}-median`,
            x1: left,
            y1: valueScale(stats.median),
            x2: left + boxWidth,
            y2: valueScale(stats.median),
            stroke: color,
            lineWidth: 2,
        });

        const whiskerHigh = createLine({
            id: `${category}-whisker-high`,
            x1: centre,
            y1: valueScale(stats.q3),
            x2: centre,
            y2: valueScale(stats.max),
            stroke: color,
            lineWidth: 1,
        });

        const whiskerLow = createLine({
            id: `${category}-whisker-low`,
            x1: centre,
            y1: valueScale(stats.q1),
            x2: centre,
            y2: valueScale(stats.min),
            stroke: color,
            lineWidth: 1,
        });

        const capHigh = createLine({
            id: `${category}-cap-high`,
            x1: centre - capWidth / 2,
            y1: valueScale(stats.max),
            x2: centre + capWidth / 2,
            y2: valueScale(stats.max),
            stroke: color,
            lineWidth: 1,
        });

        const capLow = createLine({
            id: `${category}-cap-low`,
            x1: centre - capWidth / 2,
            y1: valueScale(stats.min),
            x2: centre + capWidth / 2,
            y2: valueScale(stats.min),
            stroke: color,
            lineWidth: 1,
        });

        const outliers = stats.outliers.map((outlier, index) => createCircle({
            id: `${category}-outlier-${index}`,
            cx: centre,
            cy: valueScale(outlier),
            radius: 2.5,
            fill: color,
        }));

        return createGroup({
            id: category,
            children: [
                whiskerHigh,
                whiskerLow,
                capHigh,
                capLow,
                box,
                median,
                ...outliers,
            ],
        });
    }

    public async render() {
        return super.render(async () => {
            const {
                data,
                group,
                value,
                categories,
            } = this.options;

            this.resolveSeriesColors([
                {
                    id: 'boxplot',
                    color: this.options.color,
                },
            ]);
            this.prepareAxes();

            const getGroup = resolveAccessor<TData, string>(group);
            const getValue = resolveAccessor<TData, number>(value);
            const color = this.getSeriesColor('boxplot');

            const grouped = rollup(data, getGroup, items => boxplotStats(items.map(getValue)));
            const keys = categories ?? [...new Set(data.map(getGroup))];
            const valueExtent = getExtent(data, getValue);

            const layout = this.createLayout();
            this.reserveTitle(layout);

            const area = layout.area;
            const left = area.x;
            const top = area.y;
            const right = area.x + area.width;
            const bottom = area.y + area.height;

            const valueScale = scaleContinuous(valueExtent, [bottom, top], {
                nice: true,
            });

            this.yAxis.scale = valueScale;
            this.yAxis.bounds = new Box(top, left, bottom, right);

            const yAxisBox = this.yAxis.getBoundingBox();

            const categoryScale = this.pointScale(keys, yAxisBox.right + 30, right - 30);
            this.xAxis.scale = categoryScale;
            this.xAxis.bounds = new Box(top, yAxisBox.right, bottom, right);

            const xAxisBox = this.xAxis.getBoundingBox();

            const adjustedValueScale = scaleContinuous(valueExtent, [xAxisBox.top, top], {
                nice: true,
            });
            this.yAxis.scale = adjustedValueScale;
            this.yAxis.bounds = new Box(top, left, xAxisBox.top, right);

            this.renderGrid(
                [],
                adjustedValueScale.ticks(10).map(tick => adjustedValueScale(tick)),
                {
                    x: yAxisBox.right,
                    y: top,
                    width: right - yAxisBox.right,
                    height: xAxisBox.top - top,
                }
            );

            const step = keys.length > 1
                ? categoryScale(keys[1]) - categoryScale(keys[0])
                : right - yAxisBox.right;
            const boxWidth = Math.min(Math.abs(step) * 0.6, 60);

            return Promise.all([
                this.xAxis.visible ? this.xAxis.render() : Promise.resolve(),
                this.yAxis.visible ? this.yAxis.render() : Promise.resolve(),
                this._drawBoxes(keys, grouped, categoryScale, adjustedValueScale, boxWidth, color),
            ]);
        });
    }

    private async _drawBoxes(
        keys: string[],
        grouped: Map<string, BoxplotStats>,
        categoryScale: Scale<string>,
        valueScale: Scale<number>,
        boxWidth: number,
        color: string
    ) {
        const items = keys
            .filter(key => grouped.has(key))
            .map(key => ({
                id: key,
                stats: grouped.get(key)!,
                centre: categoryScale(key),
            }));

        const {
            left: entries,
            inner: updates,
            right: exits,
        } = arrayJoin(items, this._groups, (item, group) => group.id === item.id);

        const exitAnimation = this.resolveAnimation(ANIMATION_REFERENCE.exit);

        exits.forEach(group => {
            void Promise.all(group.children.map(child => exitElement(this.renderer, child, exitAnimation, {
                opacity: 0,
            }))).then(() => group.destroy());
        });

        // Updated categories are rebuilt in place at their new positions (composite geometry).
        updates.forEach(([item, group]) => {
            group.clear();
            group.add(this._createBox(item.id, item.stats, item.centre, boxWidth, valueScale, color).children);
        });

        const entryGroups = entries.map(item => {
            const group = this._createBox(item.id, item.stats, item.centre, boxWidth, valueScale, color);

            group.children.forEach(child => {
                child.opacity = 0;
            });

            this.scene.add(group);

            return group;
        });

        this._groups = [
            ...entryGroups,
            ...updates.map(([, group]) => group),
        ];

        const enter = this.resolveAnimation(ANIMATION_REFERENCE.enter);

        const entryChildren = entryGroups.flatMap(group => group.children);

        const entriesTransition = entryChildren.length
            ? this.renderer.transition(entryChildren, (element, index, length) => ({
                duration: enter.duration,
                delay: stagger(index, length, enter.duration, 0.3),
                state: {
                    opacity: 1,
                },
            }))
            : Promise.resolve();

        return Promise.all([
            entriesTransition,
        ]);
    }

}

/** Factory function that creates a new {@link BoxPlotChart}. */
export function createBoxPlotChart<TData = unknown>(target: string | HTMLElement | Context, options: BoxPlotChartOptions<TData>) {
    return new BoxPlotChart<TData>(target, options);
}
