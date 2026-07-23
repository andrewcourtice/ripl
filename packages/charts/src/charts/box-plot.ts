import type {
    NumericAccessor,
} from '../core/data';

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

import type {
    ResolvedAnimation,
} from '../core/animation';

import {
    applyHoverHighlight,
} from '../core/interaction';

import {
    resolveAccessor,
} from '../core/data';

import {
    axisTickCount,
    createValueScale,
} from '../core/scales';

import {
    boxplotStats,
    rollup,
} from '../core/statistics';

import type {
    BoxplotStats,
} from '../core/statistics';

import type {
    Circle,
    CircleState,
    Context,
    Ease,
    EventMap,
    Group,
    Line,
    LineState,
    Rect,
    RectState,
    Scale,
} from '@ripl/core';

import {
    Box,
    createCircle,
    createGroup,
    createLine,
    createRect,
    setColorAlpha,
} from '@ripl/core';

import {
    arrayJoin,
    numberExtent,
} from '@ripl/utilities';

/** The opacity applied to a box's fill at rest (full opacity on hover). */
const REST_ALPHA = 0.25;

/** Options for configuring a {@link BoxPlotChart}. */
export interface BoxPlotChartOptions<TData = unknown> extends CartesianChartOptions<TData> {
    /** The dataset summarized by the chart. */
    data: TData[];
    /** Accessor for the category each value belongs to. */
    key: keyof TData | ((item: TData) => string);
    /** Accessor for the numeric value to summarize. */
    value: NumericAccessor<TData>;
    /** Explicit category order (defaults to first-seen order in the data). */
    categories?: string[];
    /** Color used for every box; falls back to the first palette color when omitted. */
    color?: string;
    /** Background grid configuration (`true`/`false` or detailed grid options). */
    grid?: ChartGridInput;
    /** Hover tooltip configuration (`true`/`false` or detailed tooltip options). */
    tooltip?: ChartTooltipInput;
    /** Axis configuration for the category and value axes. */
    axis?: ChartAxisInput<TData>;
    /** Format applied to summary values shown in tooltips. */
    format?: ValueFormatInput;
}

/** Payload emitted for box interaction events. */
export interface BoxPlotBoxEvent {
    /** The x coordinate (in chart pixels) of the box's top-center anchor. */
    x: number;
    /** The y coordinate (in chart pixels) of the box's top-center anchor. */
    y: number;
    /** The category the interacted box summarizes. */
    category: string;
    /** The computed five-number summary (quartiles, whiskers, outliers) for the box. */
    stats: BoxplotStats;
}

/** Events emitted by a {@link BoxPlotChart} that consumers can subscribe to via `chart.on(...)`. */
export interface BoxPlotChartEventMap extends EventMap {
    /** Emitted when a box is clicked. */
    boxclick: BoxPlotBoxEvent;
    /** Emitted when the pointer enters a box. */
    boxenter: BoxPlotBoxEvent;
    /** Emitted when the pointer leaves a box. */
    boxleave: BoxPlotBoxEvent;
}

/**
 * Box-plot chart: summarizes a numeric field per category with the shared {@link boxplotStats}
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
            animation: () => this.resolveAnimation(ANIMATION_REFERENCE.hover),
            tooltip: this.tooltip,
            anchor: () => ({
                x: rect.x + rect.width / 2,
                y: rect.y,
            }),
            content: () => `${category}: median ${formatValue(stats.median)} (Q1 ${formatValue(stats.q1)}, Q3 ${formatValue(stats.q3)})`,
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

    /** Computes the final geometry of every box element (the target the entry/update transitions animate to). */
    private _boxTargets(stats: BoxplotStats, center: number, boxWidth: number, valueScale: Scale<number>) {
        const left = center - boxWidth / 2;
        const capWidth = boxWidth * 0.5;
        const yQ3 = valueScale(stats.q3);
        const yQ1 = valueScale(stats.q1);
        const yMedian = valueScale(stats.median);
        const yMax = valueScale(stats.max);
        const yMin = valueScale(stats.min);

        return {
            center,
            yMedian,
            box: {
                x: left,
                y: yQ3,
                width: boxWidth,
                height: Math.max(0, yQ1 - yQ3),
            } as RectState,
            median: {
                x1: left,
                y1: yMedian,
                x2: left + boxWidth,
                y2: yMedian,
            } as LineState,
            whiskerHigh: {
                x1: center,
                y1: yQ3,
                x2: center,
                y2: yMax,
            } as LineState,
            whiskerLow: {
                x1: center,
                y1: yQ1,
                x2: center,
                y2: yMin,
            } as LineState,
            capHigh: {
                x1: center - capWidth / 2,
                y1: yMax,
                x2: center + capWidth / 2,
                y2: yMax,
            } as LineState,
            capLow: {
                x1: center - capWidth / 2,
                y1: yMin,
                x2: center + capWidth / 2,
                y2: yMin,
            } as LineState,
        };
    }

    /**
     * Builds a box group with every element **collapsed toward the median** (box height 0 at the
     * median line, whiskers/caps collapsed at their box edge/center, outliers at radius 0) and its
     * final geometry stashed on `data`, so the entry transition grows it out like a candlestick.
     */
    private _createBox(category: string, stats: BoxplotStats, center: number, boxWidth: number, valueScale: Scale<number>, color: string): Group {
        const target = this._boxTargets(stats, center, boxWidth, valueScale);
        const restFill = setColorAlpha(color, REST_ALPHA);

        const box = createRect({
            id: `${category}-box`,
            x: target.box.x,
            y: target.yMedian,
            width: target.box.width,
            height: 0,
            fill: restFill,
            stroke: color,
            lineWidth: 1.5,
            data: {
                ...target.box,
                fill: restFill,
            } as RectState,
        });

        this._attachBoxHover(box, category, stats);

        const median = createLine({
            id: `${category}-median`,
            x1: center,
            y1: target.yMedian,
            x2: center,
            y2: target.yMedian,
            stroke: color,
            lineWidth: 2,
            data: target.median,
        });

        const whiskerHigh = createLine({
            id: `${category}-whisker-high`,
            x1: center,
            y1: target.whiskerHigh.y1,
            x2: center,
            y2: target.whiskerHigh.y1,
            stroke: color,
            lineWidth: 1,
            data: target.whiskerHigh,
        });

        const whiskerLow = createLine({
            id: `${category}-whisker-low`,
            x1: center,
            y1: target.whiskerLow.y1,
            x2: center,
            y2: target.whiskerLow.y1,
            stroke: color,
            lineWidth: 1,
            data: target.whiskerLow,
        });

        const capHigh = createLine({
            id: `${category}-cap-high`,
            x1: center,
            y1: target.capHigh.y1,
            x2: center,
            y2: target.capHigh.y2,
            stroke: color,
            lineWidth: 1,
            data: target.capHigh,
        });

        const capLow = createLine({
            id: `${category}-cap-low`,
            x1: center,
            y1: target.capLow.y1,
            x2: center,
            y2: target.capLow.y2,
            stroke: color,
            lineWidth: 1,
            data: target.capLow,
        });

        const outliers = stats.outliers.map((outlier, index) => createCircle({
            id: `${category}-outlier-${index}`,
            cx: center,
            cy: valueScale(outlier),
            radius: 0,
            fill: color,
            data: {
                cx: center,
                cy: valueScale(outlier),
                radius: 2.5,
            } as CircleState,
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
                key,
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

            const getGroup = resolveAccessor<TData, string>(key);
            const getValue = resolveAccessor<TData, number>(value);
            const color = this.getSeriesColor('boxplot');

            const grouped = rollup(data, getGroup, items => boxplotStats(items.map(getValue)));
            const keys = categories ?? [...new Set(data.map(getGroup))];
            const valueExtent = numberExtent(data, getValue);

            const layout = this.createLayout();
            this.reserveTitle(layout);

            const area = layout.area;
            const left = area.x;
            const top = area.y;
            const right = area.x + area.width;
            const bottom = area.y + area.height;

            const valueScale = createValueScale(this.yAxisOptions, valueExtent, [bottom, top]);

            this.yAxis.scale = valueScale;
            this.yAxis.bounds = new Box(top, left, bottom, right);

            const yAxisBox = this.yAxis.getBoundingBox();

            const categoryScale = this.pointScale(keys, yAxisBox.right + 30, right - 30);
            this.xAxis.scale = categoryScale;
            this.xAxis.bounds = new Box(top, yAxisBox.right, bottom, right);

            const xAxisBox = this.xAxis.getBoundingBox();

            const adjustedValueScale = createValueScale(this.yAxisOptions, valueExtent, [xAxisBox.top, top]);
            this.yAxis.scale = adjustedValueScale;
            this.yAxis.bounds = new Box(top, left, xAxisBox.top, right);

            // Rescale to the navigator view (no-op at rest): value (y) via domain rescale, category
            // (x) via a pixel-space transform, so boxes and axes track the pan/zoom together.
            const viewedValueScale = this.applyView(adjustedValueScale, 'y');
            const viewedCategoryScale = this.applyViewToScale(categoryScale, 'x');
            this.yAxis.scale = viewedValueScale;
            this.xAxis.scale = viewedCategoryScale;

            const plot = {
                x: yAxisBox.right,
                y: top,
                width: right - yAxisBox.right,
                height: xAxisBox.top - top,
            };

            this.clipPlot(plot);

            this.renderGrid(
                [],
                this.gridTicks(viewedValueScale, axisTickCount(this.yAxisOptions)),
                plot
            );

            const step = keys.length > 1
                ? viewedCategoryScale(keys[1]) - viewedCategoryScale(keys[0])
                : right - yAxisBox.right;
            const boxWidth = Math.min(Math.abs(step) * 0.6, 60);

            return Promise.all([
                this.xAxis.visible ? this.xAxis.render() : Promise.resolve(),
                this.yAxis.visible ? this.yAxis.render() : Promise.resolve(),
                this._drawBoxes(keys, grouped, viewedCategoryScale, viewedValueScale, boxWidth, color),
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
                center: categoryScale(key),
            }));

        const {
            left: entries,
            inner: updates,
            right: exits,
        } = arrayJoin(items, this._groups, (item, group) => group.id === item.id);

        const exitAnimation = this.resolveAnimation(ANIMATION_REFERENCE.exit);
        const enter = this.resolveAnimation(ANIMATION_REFERENCE.enter);
        const update = this.resolveAnimation(ANIMATION_REFERENCE.update);

        // Exit: fade the box's marks out, then destroy the group.
        exits.forEach(group => {
            void Promise.all(group.children.map(child => exitElement(this.renderer, child, exitAnimation, {
                opacity: 0,
            }))).then(() => group.destroy());
        });

        const entryGroups = entries.map(item => {
            const group = this._createBox(item.id, item.stats, item.center, boxWidth, valueScale, color);
            this.addPlotContent(group);
            return group;
        });

        // Update: reconcile geometry in place and transition to it, rather than clearing + rebuilding,
        // which teleported the boxes to their new positions with no animation.
        const updateResults = updates.map(([item, group]) => ({
            group,
            marks: this._reconcileBox(item, group, boxWidth, valueScale, color, exitAnimation),
        }));

        this._groups = [
            ...entryGroups,
            ...updateResults.map(result => result.group),
        ];

        const categoryCount = Math.max(1, entryGroups.length);

        // Entry: grow each box out from the median (like a candlestick body), staggered left-to-right.
        const entryTransitions = entryGroups.flatMap((group, index) => {
            const box = group.getElementsByType('rect')[0] as Rect | undefined;
            const lines = group.getElementsByType('line') as Line[];
            const circles = group.getElementsByType('circle') as Circle[];
            const delay = stagger(index, categoryCount, enter.duration, 0.6);

            return this._transitionMarks(box, lines, circles, enter.duration, delay, enter.ease);
        });

        const updateTransitions = updateResults.flatMap(result =>
            this._transitionMarks(result.marks.box, result.marks.lines, result.marks.circles, update.duration, 0, update.ease));

        return Promise.all([
            ...entryTransitions,
            ...updateTransitions,
        ]);
    }

    /** Sets each box element's target `data` for an update, reconciling outliers by id, and returns the living marks to transition. */
    private _reconcileBox(
        item: {
            id: string;
            stats: BoxplotStats;
            center: number;
        },
        group: Group,
        boxWidth: number,
        valueScale: Scale<number>,
        color: string,
        exitAnimation: ResolvedAnimation
    ): {
        box?: Rect;
        lines: Line[];
        circles: Circle[];
    } {
        const target = this._boxTargets(item.stats, item.center, boxWidth, valueScale);
        const restFill = setColorAlpha(color, REST_ALPHA);

        const box = group.getElementById(`${item.id}-box`) as Rect | undefined;

        if (box) {
            box.data = {
                ...target.box,
                fill: restFill,
            } as RectState;
            this._attachBoxHover(box, item.id, item.stats);
        }

        const lineTargets: Record<string, LineState> = {
            [`${item.id}-median`]: target.median,
            [`${item.id}-whisker-high`]: target.whiskerHigh,
            [`${item.id}-whisker-low`]: target.whiskerLow,
            [`${item.id}-cap-high`]: target.capHigh,
            [`${item.id}-cap-low`]: target.capLow,
        };

        const lines = group.getElementsByType('line') as Line[];
        lines.forEach(line => {
            const lineTarget = lineTargets[line.id];

            if (lineTarget) {
                line.data = lineTarget;
            }
        });

        // Reconcile outliers by id: exit removed points, grow in new ones, move existing ones.
        const existing = group.getElementsByType('circle') as Circle[];
        const outlierItems = item.stats.outliers.map((value, index) => ({
            id: `${item.id}-outlier-${index}`,
            value,
        }));

        const {
            left: outlierEntries,
            inner: outlierUpdates,
            right: outlierExits,
        } = arrayJoin(outlierItems, existing, (outlier, circle) => circle.id === outlier.id);

        outlierExits.forEach(circle => exitElement(this.renderer, circle, exitAnimation, {
            radius: 0,
            opacity: 0,
        }));

        const circles: Circle[] = [];

        outlierEntries.forEach(outlier => {
            const circle = createCircle({
                id: outlier.id,
                cx: item.center,
                cy: valueScale(outlier.value),
                radius: 0,
                fill: color,
                data: {
                    cx: item.center,
                    cy: valueScale(outlier.value),
                    radius: 2.5,
                } as CircleState,
            });

            group.add(circle);
            circles.push(circle);
        });

        outlierUpdates.forEach(([outlier, circle]) => {
            circle.data = {
                cx: item.center,
                cy: valueScale(outlier.value),
                radius: 2.5,
            } as CircleState;
            circles.push(circle);
        });

        return {
            box,
            lines,
            circles,
        };
    }

    /** Transitions a box's rect + lines + circles to the target geometry stashed on their `data`. */
    private _transitionMarks(
        box: Rect | undefined,
        lines: Line[],
        circles: Circle[],
        duration: number,
        delay: number,
        ease: Ease
    ): Promise<unknown>[] {
        const transitions: Promise<unknown>[] = [];

        if (box) {
            transitions.push(this.renderer.transition(box, {
                duration,
                delay,
                ease,
                state: box.data as RectState,
            }));
        }

        if (lines.length > 0) {
            transitions.push(this.renderer.transition(lines, element => ({
                duration,
                delay,
                ease,
                state: element.data as LineState,
            })));
        }

        if (circles.length > 0) {
            transitions.push(this.renderer.transition(circles, element => ({
                duration,
                delay,
                ease,
                state: element.data as CircleState,
            })));
        }

        return transitions;
    }

}

/**
 * Factory function that creates a new {@link BoxPlotChart}.
 *
 * @example
 * ```ts
 * createBoxPlotChart(target, {
 *     data: [
 *         { team: 'A', score: 82 },
 *         { team: 'A', score: 91 },
 *         { team: 'B', score: 74 },
 *     ],
 *     key: 'team',
 *     value: 'score',
 * });
 * ```
 */
export function createBoxPlotChart<TData = unknown>(target: string | HTMLElement | Context, options: BoxPlotChartOptions<TData>) {
    return new BoxPlotChart<TData>(target, options);
}
