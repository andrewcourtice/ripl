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
    ChartAxisInput,
    ChartGridInput,
    ChartTooltipInput,
} from '../core/options';

import {
    normalizeAxis,
    normalizeAxisItem,
    normalizeGrid,
    normalizeTooltip,
    normalizeYAxisItem,
    resolveFormatLabel,
} from '../core/options';

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
    ChartXAxis,
    ChartYAxis,
} from '../components/axis';

import {
    Tooltip,
} from '../components/tooltip';

import {
    Grid,
} from '../components/grid';

import type {
    BandScale,
    Context,
    EventMap,
    Group,
    Line,
    Rect,
    RectState,
} from '@ripl/core';

import {
    Box,
    clamp,
    createGroup,
    createLine,
    createRect,
    easeOutCubic,
    scaleBand,
    scaleContinuous,
    scaleTime,
    setColorAlpha,
} from '@ripl/core';

import {
    arrayJoin,
    typeIsFunction,
} from '@ripl/utilities';

/** Options for configuring a {@link GanttChart}. */
export interface GanttChartOptions<TData = unknown> extends BaseChartOptions {
    /** The tasks rendered as time-spanning bars. */
    data: TData[];
    /** Accessor for each task's unique key (used for colour assignment and data joins). */
    key: keyof TData | ((item: TData) => string);
    /** Accessor for each task's label shown on the category axis. */
    label: keyof TData | ((item: TData) => string);
    /** Accessor for each task's start date. */
    start: keyof TData | ((item: TData) => Date);
    /** Accessor for each task's end date. */
    end: keyof TData | ((item: TData) => Date);
    /** Optional per-item colour accessor; falls back to the generated palette. */
    colorBy?: keyof TData | ((item: TData) => string);
    /** Accessor for each task's completion ratio (0–1), drawn as a progress overlay. */
    progress?: NumericAccessor<TData>;
    /** Background grid configuration (`true`/`false` or detailed grid options). */
    grid?: ChartGridInput;
    /** Hover tooltip configuration (`true`/`false` or detailed tooltip options). */
    tooltip?: ChartTooltipInput;
    /** Axis configuration for the category and time axes. */
    axis?: ChartAxisInput<TData>;
    /** Draw a marker line at the current date. Defaults to true. */
    showToday?: boolean;
    /** Colour of the "today" marker line. */
    todayColor?: string;
    /** Corner radius in pixels applied to each task bar. Defaults to 3. */
    borderRadius?: number;
}

/** Payload emitted for gantt task interaction events. */
export interface GanttChartTaskEvent {
    /** The x coordinate (in chart pixels) of the task bar's top-centre anchor. */
    x: number;
    /** The y coordinate (in chart pixels) of the task bar's top-centre anchor. */
    y: number;
    /** The key of the interacted task. */
    id: string;
    /** The label of the interacted task. */
    label: string;
}

/** Events emitted by a {@link GanttChart} that consumers can subscribe to via `chart.on(...)`. */
export interface GanttChartEventMap extends EventMap {
    /** Emitted when a task bar is clicked. */
    taskclick: GanttChartTaskEvent;
    /** Emitted when the pointer enters a task bar. */
    taskenter: GanttChartTaskEvent;
    /** Emitted when the pointer leaves a task bar. */
    taskleave: GanttChartTaskEvent;
}

const DEFAULT_TODAY_COLOR = '#ef4444';

/**
 * Gantt chart rendering time-based task bars on a categorical y-axis and time x-axis.
 *
 * Each data item is rendered as a horizontal bar spanning its start-to-end date range.
 * Supports optional progress overlays, a "today" marker line, tooltips, grid, and
 * staggered entry animations.
 *
 * @typeParam TData - The type of each data item in the dataset.
 */
export class GanttChart<TData = unknown> extends Chart<GanttChartOptions<TData>, GanttChartEventMap> {

    private _barGroups: Group[] = [];
    private _todayLine?: Line;
    private _xAxis!: ChartXAxis;
    private _yAxis!: ChartYAxis;
    private _tooltip!: Tooltip;
    private _grid?: Grid;

    constructor(target: string | HTMLElement | Context, options: GanttChartOptions<TData>) {
        super(target, options);

        const axisOpts = normalizeAxis(options.axis);
        const xAxis = normalizeAxisItem(axisOpts.x);
        const yAxis = normalizeYAxisItem(
            Array.isArray(axisOpts.y) ? axisOpts.y[0] : axisOpts.y
        );
        const gridOpts = normalizeGrid(options.grid);
        const tooltipOpts = normalizeTooltip(options.tooltip);

        if (tooltipOpts.visible) {
            this._tooltip = new Tooltip({
                scene: this.scene,
                renderer: this.renderer,
                font: tooltipOpts.font,
                fontColor: tooltipOpts.fontColor,
                backgroundColor: tooltipOpts.backgroundColor,
            });
        }

        this._xAxis = new ChartXAxis({
            scene: this.scene,
            renderer: this.renderer,
            bounds: Box.empty(),
            scale: scaleContinuous([0, 1], [0, 1]),
            labelFont: xAxis.font,
            labelColor: xAxis.fontColor,
            formatLabel: resolveFormatLabel(xAxis.format),
            title: xAxis.title,
        });

        this._yAxis = new ChartYAxis({
            scene: this.scene,
            renderer: this.renderer,
            bounds: Box.empty(),
            scale: scaleContinuous([0, 1], [0, 1]),
            labelFont: yAxis.font,
            labelColor: yAxis.fontColor,
            formatLabel: resolveFormatLabel(yAxis.format),
            title: yAxis.title,
        });

        if (gridOpts.visible) {
            this._grid = new Grid({
                scene: this.scene,
                renderer: this.renderer,
                horizontal: true,
                vertical: false,
                stroke: gridOpts.lineColor,
                lineWidth: gridOpts.lineWidth,
                lineDash: gridOpts.lineDash,
            });
        }

        this.init();
    }

    private _getAccessor<TReturn>(accessor: keyof TData | ((item: TData) => TReturn)): (item: TData) => TReturn {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        return typeIsFunction(accessor) ? accessor : (item: any) => item[accessor] as TReturn;
    }

    private _formatDate(date: Date): string {
        const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
        return `${months[date.getMonth()]} ${date.getDate()}`;
    }

    private async _drawBars(
        categoryScale: BandScale<string>,
        timeScale: ReturnType<typeof scaleTime>,
        getKey: (item: TData) => string,
        getLabel: (item: TData) => string
    ) {
        const {
            data,
            start: startAccessor,
            end: endAccessor,
            colorBy,
            progress: progressAccessor,
        } = this.options;

        const getStart = this._getAccessor<Date>(startAccessor);
        const getEnd = this._getAccessor<Date>(endAccessor);
        const getColor = resolveColorBy<TData>(colorBy);
        const getProgress = progressAccessor ? this._getAccessor<number>(progressAccessor) : undefined;
        const borderRadius = this.options.borderRadius ?? 3;

        const getBarState = (item: TData) => {
            const key = getKey(item);
            const label = getLabel(item);
            const start = getStart(item);
            const end = getEnd(item);

            const color = getColor(item) ?? this.getSeriesColor(key);

            const x = timeScale(start);
            const width = Math.max(timeScale(end) - timeScale(start), 2);
            const y = categoryScale(label);
            const height = categoryScale.bandwidth;

            const progress = getProgress ? clamp(getProgress(item), 0, 1) : undefined;

            return {
                id: key,
                label,
                start,
                end,
                color,
                progress,
                state: {
                    fill: setColorAlpha(color, 0.7),
                    x,
                    y,
                    width,
                    height,
                    borderRadius,
                } as RectState,
            };
        };

        const {
            left: entries,
            inner: updates,
            right: exits,
        } = arrayJoin(
            data,
            this._barGroups,
            (item, group) => group.id === getKey(item)
        );

        exits.forEach(el => el.destroy());

        const entryGroups = entries.map(item => {
            const barState = getBarState(item);
            const { id, color, progress, state } = barState;

            const bar = createRect({
                id: `${id}-bar`,
                ...state,
                x: state.x,
                width: 0,
                data: {
                    ...state,
                },
            });

            const children: (Rect)[] = [bar];

            // Progress overlay
            if (progress !== undefined) {
                const progressBar = createRect({
                    id: `${id}-progress`,
                    fill: setColorAlpha(color, 0.95),
                    x: state.x,
                    y: state.y,
                    width: 0,
                    height: state.height,
                    borderRadius,
                    data: {
                        fill: setColorAlpha(color, 0.95),
                        x: state.x,
                        y: state.y,
                        width: (state.width as number) * progress,
                        height: state.height,
                        borderRadius,
                    } as RectState,
                });

                children.push(progressBar);
            }

            const group = createGroup({
                id,
                children,
            });

            this._attachTaskHover(bar, barState);

            return group;
        });

        const updateGroups = updates.map(([item, group]) => {
            const barState = getBarState(item);
            const { color, progress, state } = barState;

            const bar = group.getElementsByType('rect')[0] as Rect;

            if (bar) {
                bar.data = {
                    ...state,
                };

                this._attachTaskHover(bar, barState);
            }

            // Update progress bar
            if (progress !== undefined) {
                const rects = group.getElementsByType('rect') as Rect[];
                const progressBar = rects[1];

                if (progressBar) {
                    progressBar.data = {
                        fill: setColorAlpha(color, 0.95),
                        x: state.x,
                        y: state.y,
                        width: (state.width as number) * progress,
                        height: state.height,
                        borderRadius: this.options.borderRadius ?? 3,
                    } as RectState;
                }
            }

            return group;
        });

        this.scene.add(entryGroups);

        this._barGroups = [
            ...entryGroups,
            ...updateGroups,
        ];

        // Animate entry bars
        const entryBars = entryGroups.flatMap(g => g.getElementsByType('rect') as Rect[]);
        const sortedEntryBars = entryBars.sort((a, b) => a.y - b.y);

        const entriesTransition = this.renderer.transition(sortedEntryBars, (element, index, length) => ({
            duration: this.getAnimationDuration(1000),
            delay: index * (this.getAnimationDuration(800) / Math.max(1, length)),
            ease: easeOutCubic,
            state: element.data as RectState,
        }));

        // Animate update bars
        const updateBars = updateGroups.flatMap(g => g.getElementsByType('rect') as Rect[]);

        const updatesTransition = this.renderer.transition(updateBars, element => ({
            duration: this.getAnimationDuration(1000),
            ease: easeOutCubic,
            state: element.data as RectState,
        }));

        return Promise.all([
            entriesTransition,
            updatesTransition,
        ]);
    }

    private _drawTodayMarker(
        timeScale: ReturnType<typeof scaleTime>,
        chartTop: number,
        chartBottom: number
    ) {
        const {
            showToday = true,
            todayColor = DEFAULT_TODAY_COLOR,
        } = this.options;

        if (!showToday) {
            if (this._todayLine) {
                this.scene.remove(this._todayLine);
                this._todayLine = undefined;
            }
            return;
        }

        const today = new Date();
        const [domainStart, domainEnd] = timeScale.domain;

        // Only draw if today is within the visible range
        if (today < domainStart || today > domainEnd) {
            if (this._todayLine) {
                this.scene.remove(this._todayLine);
                this._todayLine = undefined;
            }
            return;
        }

        const x = timeScale(today);

        // The marker is a single line, so it lives directly in the scene (no wrapping group).
        if (!this._todayLine) {
            this._todayLine = createLine({
                id: 'today-marker',
                zIndex: 500,
                x1: x,
                y1: chartTop,
                x2: x,
                y2: chartBottom,
                stroke: todayColor,
                lineWidth: 1.5,
                lineDash: [6, 4],
            });

            this.scene.add(this._todayLine);
        } else {
            this._todayLine.x1 = x;
            this._todayLine.x2 = x;
            this._todayLine.y1 = chartTop;
            this._todayLine.y2 = chartBottom;
            this._todayLine.stroke = todayColor;
        }
    }

    public async render() {
        return super.render(async () => {
            const {
                data,
                key: keyAccessor,
                label: labelAccessor,
                start: startAccessor,
                end: endAccessor,
            } = this.options;

            const getKey = this._getAccessor<string>(keyAccessor);
            const getLabel = this._getAccessor<string>(labelAccessor);
            const getStart = this._getAccessor<Date>(startAccessor);
            const getEnd = this._getAccessor<Date>(endAccessor);

            const labels = data.map(getLabel);

            // Resolve series colors for each task
            this.resolveSeriesColors(data.map(item => ({
                id: getKey(item),
            })));

            // Compute time extent
            const allStarts = data.map(getStart);
            const allEnds = data.map(getEnd);

            const minDate = allStarts.reduce((min, d) => d < min ? d : min, allStarts[0]);
            const maxDate = allEnds.reduce((max, d) => d > max ? d : max, allEnds[0]);

            // Add some padding to the time range
            const timeRange = maxDate.getTime() - minDate.getTime();
            const timePadding = timeRange * 0.05;
            const paddedMin = new Date(minDate.getTime() - timePadding);
            const paddedMax = new Date(maxDate.getTime() + timePadding);

            const layout = this.createLayout();
            this.reserveTitle(layout);
            const area = layout.area;
            const left = area.x;
            const right = area.x + area.width;
            const bottom = area.y + area.height;
            const chartTop = area.y + 10;

            // Setup y-axis with task labels
            const categoryScale = scaleBand(labels, [chartTop, bottom], {
                outerPadding: 0.15,
                innerPadding: 0.25,
            });

            this._yAxis.scale = Object.assign(
                (value: string) => categoryScale(value) + categoryScale.bandwidth / 2,
                {
                    domain: labels,
                    range: categoryScale.range,
                    inverse: categoryScale.inverse,
                    ticks: () => labels,
                    includes: (v: string) => labels.includes(v),
                }
            ) as unknown as typeof this._yAxis.scale;

            this._yAxis.bounds = new Box(
                chartTop,
                left,
                bottom,
                right
            );

            const yAxisBoundingBox = this._yAxis.getBoundingBox();

            // Setup x-axis with time scale
            const timeScale = scaleTime(
                [paddedMin, paddedMax],
                [yAxisBoundingBox.right + 10, right]
            );

            this._xAxis.scale = timeScale;

            if (!this._xAxis.formatLabel) {
                this._xAxis.formatLabel = (value: Date) => this._formatDate(value);
            }

            this._xAxis.bounds = new Box(
                chartTop,
                yAxisBoundingBox.right,
                bottom,
                right
            );

            const xAxisBoundingBox = this._xAxis.getBoundingBox();

            // Recalculate category scale with final bounds
            const adjustedCategoryScale = scaleBand(labels, [chartTop, xAxisBoundingBox.top], {
                outerPadding: 0.15,
                innerPadding: 0.25,
            });

            // Update y-axis scale with adjusted bounds
            this._yAxis.scale = Object.assign(
                (value: string) => adjustedCategoryScale(value) + adjustedCategoryScale.bandwidth / 2,
                {
                    domain: labels,
                    range: adjustedCategoryScale.range,
                    inverse: adjustedCategoryScale.inverse,
                    ticks: () => labels,
                    includes: (v: string) => labels.includes(v),
                }
            ) as unknown as typeof this._yAxis.scale;

            this._yAxis.bounds.bottom = xAxisBoundingBox.top;

            // Render grid
            if (this._grid) {
                const yTickPositions = labels.map(label =>
                    adjustedCategoryScale(label) + adjustedCategoryScale.bandwidth / 2
                );

                this._grid.render(
                    [],
                    yTickPositions,
                    yAxisBoundingBox.right,
                    chartTop,
                    right - yAxisBoundingBox.right,
                    xAxisBoundingBox.top - chartTop
                );
            }

            // Draw today marker
            this._drawTodayMarker(timeScale, chartTop, xAxisBoundingBox.top);

            return Promise.all([
                this._xAxis.render(),
                this._yAxis.render(),
                this._drawBars(adjustedCategoryScale, timeScale, getKey, getLabel),
            ]);
        });
    }

    private _attachTaskHover(bar: Rect, task: { id: string;
        label: string;
        start: Date;
        end: Date;
        color: string;
        progress?: number;
        state: RectState; }) {
        const progressStr = task.progress !== undefined ? ` (${Math.round(task.progress * 100)}%)` : '';
        const tooltipText = `${task.label}: ${this._formatDate(task.start)} – ${this._formatDate(task.end)}${progressStr}`;

        const payload = (point: { x: number;
            y: number; }): GanttChartTaskEvent => ({
            x: point.x,
            y: point.y,
            id: task.id,
            label: task.label,
        });

        applyHoverHighlight(bar, {
            renderer: this.renderer,
            animation: () => this.resolveAnimation(ANIMATION_REFERENCE.hover),
            tooltip: this._tooltip,
            anchor: () => ({
                x: (task.state.x as number) + (task.state.width as number) / 2,
                y: task.state.y as number,
            }),
            content: () => tooltipText,
            highlight: { fill: task.color },
            restore: { fill: setColorAlpha(task.color, 0.7) },
            onEnter: point => this.emit('taskenter', payload(point)),
            onLeave: point => this.emit('taskleave', payload(point)),
            onClick: point => this.emit('taskclick', payload(point)),
        });
    }

}

/**
 * Factory function that creates a new {@link GanttChart} instance.
 *
 * @example
 * ```ts
 * createGanttChart(target, {
 *     data: [
 *         { id: 'design', name: 'Design', from: new Date('2026-01-01'), to: new Date('2026-01-10') },
 *         { id: 'build', name: 'Build', from: new Date('2026-01-08'), to: new Date('2026-01-24') },
 *     ],
 *     key: 'id',
 *     label: 'name',
 *     start: 'from',
 *     end: 'to',
 * });
 * ```
 */
export function createGanttChart<TData = unknown>(target: string | HTMLElement | Context, options: GanttChartOptions<TData>) {
    return new GanttChart<TData>(target, options);
}
