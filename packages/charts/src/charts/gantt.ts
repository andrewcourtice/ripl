import {
    BaseChartOptions,
    Chart,
} from '../core/chart';

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

import {
    BandScale,
    Box,
    Context,
    createGroup,
    createLine,
    createRect,
    easeOutCubic,
    easeOutQuart,
    Group,
    Rect,
    RectState,
    scaleBand,
    scaleContinuous,
    scaleTime,
    setColorAlpha,
} from '@ripl/core';

import {
    arrayForEach,
    arrayJoin,
    arrayMap,
    arrayReduce,
    typeIsFunction,
} from '@ripl/utilities';

export interface GanttChartOptions<TData = unknown> extends BaseChartOptions {
    data: TData[];
    keyBy: keyof TData | ((item: TData) => string);
    labelBy: keyof TData | ((item: TData) => string);
    startBy: keyof TData | ((item: TData) => Date);
    endBy: keyof TData | ((item: TData) => Date);
    colorBy?: keyof TData | ((item: TData) => string);
    progressBy?: keyof TData | ((item: TData) => number);
    showGrid?: boolean;
    showToday?: boolean;
    todayColor?: string;
    borderRadius?: number;
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    formatXLabel?: (value: any) => string;
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    formatYLabel?: (value: any) => string;
}

const DEFAULT_TODAY_COLOR = '#ef4444';

export class GanttChart<TData = unknown> extends Chart<GanttChartOptions<TData>> {

    private barGroups: Group[] = [];
    private todayLine?: Group;
    private xAxis!: ChartXAxis;
    private yAxis!: ChartYAxis;
    private tooltip!: Tooltip;
    private grid?: Grid;

    constructor(target: string | HTMLElement | Context, options: GanttChartOptions<TData>) {
        super(target, options);

        this.tooltip = new Tooltip({
            scene: this.scene,
            renderer: this.renderer,
        });

        this.xAxis = new ChartXAxis({
            scene: this.scene,
            renderer: this.renderer,
            bounds: Box.empty(),
            scale: scaleContinuous([0, 1], [0, 1]),
            formatLabel: options.formatXLabel,
        });

        this.yAxis = new ChartYAxis({
            scene: this.scene,
            renderer: this.renderer,
            bounds: Box.empty(),
            scale: scaleContinuous([0, 1], [0, 1]),
            formatLabel: options.formatYLabel,
        });

        if (options.showGrid !== false) {
            this.grid = new Grid({
                scene: this.scene,
                renderer: this.renderer,
                horizontal: true,
                vertical: false,
            });
        }

        this.init();
    }

    private getAccessor<TReturn>(accessor: keyof TData | ((item: TData) => TReturn)): (item: TData) => TReturn {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        return typeIsFunction(accessor) ? accessor : (item: any) => item[accessor] as TReturn;
    }

    private formatDate(date: Date): string {
        const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
        return `${months[date.getMonth()]} ${date.getDate()}`;
    }

    private async drawBars(
        categoryScale: BandScale<string>,
        timeScale: ReturnType<typeof scaleTime>,
        getKey: (item: TData) => string,
        getLabel: (item: TData) => string
    ) {
        const {
            data,
            startBy,
            endBy,
            colorBy,
            progressBy,
        } = this.options;

        const getStart = this.getAccessor<Date>(startBy);
        const getEnd = this.getAccessor<Date>(endBy);
        const getColor = colorBy ? this.getAccessor<string>(colorBy) : undefined;
        const getProgress = progressBy ? this.getAccessor<number>(progressBy) : undefined;
        const borderRadius = this.options.borderRadius ?? 3;

        const getBarState = (item: TData) => {
            const key = getKey(item);
            const label = getLabel(item);
            const start = getStart(item);
            const end = getEnd(item);

            const color = getColor
                ? getColor(item)
                : this.getSeriesColor(key);

            const x = timeScale(start);
            const width = Math.max(timeScale(end) - timeScale(start), 2);
            const y = categoryScale(label);
            const height = categoryScale.bandwidth;

            const progress = getProgress ? Math.max(0, Math.min(1, getProgress(item))) : undefined;

            return {
                id: key,
                label,
                start,
                end,
                color,
                progress,
                state: {
                    fillStyle: setColorAlpha(color, 0.7),
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
            this.barGroups,
            (item, group) => group.id === getKey(item)
        );

        arrayForEach(exits, group => group.destroy());

        const entryGroups = arrayMap(entries, item => {
            const { id, label, start, end, color, progress, state } = getBarState(item);

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
                    fillStyle: setColorAlpha(color, 0.95),
                    x: state.x,
                    y: state.y,
                    width: 0,
                    height: state.height,
                    borderRadius,
                    data: {
                        fillStyle: setColorAlpha(color, 0.95),
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

            bar.on('mouseenter', () => {
                const startStr = this.formatDate(start);
                const endStr = this.formatDate(end);
                const progressStr = progress !== undefined ? ` (${Math.round(progress * 100)}%)` : '';
                this.tooltip.show(
                    (state.x as number) + (state.width as number) / 2,
                    state.y as number,
                    `${label}: ${startStr} – ${endStr}${progressStr}`
                );

                this.renderer.transition(bar, {
                    duration: this.getAnimationDuration(300),
                    ease: easeOutQuart,
                    state: {
                        fillStyle: color,
                    },
                });

                bar.on('mouseleave', () => {
                    this.tooltip.hide();

                    this.renderer.transition(bar, {
                        duration: this.getAnimationDuration(300),
                        ease: easeOutQuart,
                        state: {
                            fillStyle: setColorAlpha(color, 0.7),
                        },
                    });
                });
            });

            return group;
        });

        const updateGroups = arrayMap(updates, ([item, group]) => {
            const { label, start, end, color, progress, state } = getBarState(item);

            const bar = group.getElementsByType('rect')[0] as Rect;

            if (bar) {
                bar.data = {
                    ...state,
                };

                bar.on('mouseenter', () => {
                    const startStr = this.formatDate(start);
                    const endStr = this.formatDate(end);
                    const progressStr = progress !== undefined ? ` (${Math.round(progress * 100)}%)` : '';
                    this.tooltip.show(
                        (state.x as number) + (state.width as number) / 2,
                        state.y as number,
                        `${label}: ${startStr} – ${endStr}${progressStr}`
                    );

                    this.renderer.transition(bar, {
                        duration: this.getAnimationDuration(300),
                        ease: easeOutQuart,
                        state: {
                            fillStyle: color,
                        },
                    });

                    bar.on('mouseleave', () => {
                        this.tooltip.hide();

                        this.renderer.transition(bar, {
                            duration: this.getAnimationDuration(300),
                            ease: easeOutQuart,
                            state: {
                                fillStyle: setColorAlpha(color, 0.7),
                            },
                        });
                    });
                });
            }

            // Update progress bar
            if (progress !== undefined) {
                const rects = group.getElementsByType('rect') as Rect[];
                const progressBar = rects[1];

                if (progressBar) {
                    progressBar.data = {
                        fillStyle: setColorAlpha(color, 0.95),
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

        this.barGroups = [
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

    private drawTodayMarker(
        timeScale: ReturnType<typeof scaleTime>,
        chartTop: number,
        chartBottom: number
    ) {
        const {
            showToday = true,
            todayColor = DEFAULT_TODAY_COLOR,
        } = this.options;

        if (!showToday) {
            if (this.todayLine) {
                this.scene.remove(this.todayLine);
                this.todayLine = undefined;
            }
            return;
        }

        const today = new Date();
        const [domainStart, domainEnd] = timeScale.domain;

        // Only draw if today is within the visible range
        if (today < domainStart || today > domainEnd) {
            if (this.todayLine) {
                this.scene.remove(this.todayLine);
                this.todayLine = undefined;
            }
            return;
        }

        const x = timeScale(today);

        if (this.todayLine) {
            this.todayLine.clear();
            this.scene.remove(this.todayLine);
        }

        this.todayLine = createGroup({
            id: 'today-marker',
            zIndex: 500,
            children: [
                createLine({
                    id: 'today-line',
                    x1: x,
                    y1: chartTop,
                    x2: x,
                    y2: chartBottom,
                    strokeStyle: todayColor,
                    lineWidth: 1.5,
                    lineDash: [6, 4],
                }),
            ],
        });

        this.scene.add(this.todayLine);
    }

    public async render() {
        return super.render(async (scene) => {
            const {
                data,
                keyBy,
                labelBy,
                startBy,
                endBy,
            } = this.options;

            const getKey = this.getAccessor<string>(keyBy);
            const getLabel = this.getAccessor<string>(labelBy);
            const getStart = this.getAccessor<Date>(startBy);
            const getEnd = this.getAccessor<Date>(endBy);

            const labels = arrayMap(data, getLabel);

            // Resolve series colors for each task
            this.resolveSeriesColors(arrayMap(data, item => ({
                id: getKey(item),
            })));

            // Compute time extent
            const allStarts = arrayMap(data, getStart);
            const allEnds = arrayMap(data, getEnd);

            const minDate = arrayReduce(allStarts, (min, d) => d < min ? d : min, allStarts[0]);
            const maxDate = arrayReduce(allEnds, (max, d) => d > max ? d : max, allEnds[0]);

            // Add some padding to the time range
            const timeRange = maxDate.getTime() - minDate.getTime();
            const timePadding = timeRange * 0.05;
            const paddedMin = new Date(minDate.getTime() - timePadding);
            const paddedMax = new Date(maxDate.getTime() + timePadding);

            const padding = this.getPadding();
            const chartTop = padding.top + 10;

            // Setup y-axis with task labels
            const categoryScale = scaleBand(labels, [chartTop, scene.height - padding.bottom], {
                outerPadding: 0.15,
                innerPadding: 0.25,
            });

            this.yAxis.scale = Object.assign(
                (value: string) => categoryScale(value) + categoryScale.bandwidth / 2,
                {
                    domain: labels,
                    range: categoryScale.range,
                    inverse: categoryScale.inverse,
                    ticks: () => labels,
                    includes: (v: string) => labels.includes(v),
                }
            ) as unknown as typeof this.yAxis.scale;

            this.yAxis.bounds = new Box(
                chartTop,
                padding.left,
                scene.height - padding.bottom,
                scene.width - padding.right
            );

            const yAxisBoundingBox = this.yAxis.getBoundingBox();

            // Setup x-axis with time scale
            const timeScale = scaleTime(
                [paddedMin, paddedMax],
                [yAxisBoundingBox.right + 10, scene.width - padding.right]
            );

            this.xAxis.scale = timeScale;

            if (!this.options.formatXLabel) {
                this.xAxis.formatLabel = (value: Date) => this.formatDate(value);
            }

            this.xAxis.bounds = new Box(
                chartTop,
                yAxisBoundingBox.right,
                scene.height - padding.bottom,
                scene.width - padding.right
            );

            const xAxisBoundingBox = this.xAxis.getBoundingBox();

            // Recalculate category scale with final bounds
            const adjustedCategoryScale = scaleBand(labels, [chartTop, xAxisBoundingBox.top], {
                outerPadding: 0.15,
                innerPadding: 0.25,
            });

            // Update y-axis scale with adjusted bounds
            this.yAxis.scale = Object.assign(
                (value: string) => adjustedCategoryScale(value) + adjustedCategoryScale.bandwidth / 2,
                {
                    domain: labels,
                    range: adjustedCategoryScale.range,
                    inverse: adjustedCategoryScale.inverse,
                    ticks: () => labels,
                    includes: (v: string) => labels.includes(v),
                }
            ) as unknown as typeof this.yAxis.scale;

            this.yAxis.bounds.bottom = xAxisBoundingBox.top;

            // Render grid
            if (this.grid) {
                const yTickPositions = arrayMap(labels, label =>
                    adjustedCategoryScale(label) + adjustedCategoryScale.bandwidth / 2
                );

                this.grid.render(
                    [],
                    yTickPositions,
                    yAxisBoundingBox.right,
                    chartTop,
                    scene.width - padding.right - yAxisBoundingBox.right,
                    xAxisBoundingBox.top - chartTop
                );
            }

            // Draw today marker
            this.drawTodayMarker(timeScale, chartTop, xAxisBoundingBox.top);

            return Promise.all([
                this.xAxis.render(),
                this.yAxis.render(),
                this.drawBars(adjustedCategoryScale, timeScale, getKey, getLabel),
            ]);
        });
    }

}

export function createGanttChart<TData = unknown>(target: string | HTMLElement | Context, options: GanttChartOptions<TData>) {
    return new GanttChart<TData>(target, options);
}
