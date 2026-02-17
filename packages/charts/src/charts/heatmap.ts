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
    Box,
    Context,
    createGroup,
    createRect,
    easeOutCubic,
    easeOutQuart,
    Group,
    Rect,
    RectState,
    scaleBand,
    scaleContinuous,
} from '@ripl/core';

import {
    arrayForEach,
    arrayJoin,
    arrayMap,
    typeIsFunction,
} from '@ripl/utilities';

export interface HeatmapChartOptions<TData = unknown> extends BaseChartOptions {
    data: TData[];
    xBy: keyof TData | ((item: TData) => string);
    yBy: keyof TData | ((item: TData) => string);
    valueBy: keyof TData | ((item: TData) => number);
    xCategories: string[];
    yCategories: string[];
    colorRange?: [string, string];
    borderRadius?: number;
}

const DEFAULT_LOW_COLOR = '#e0f2fe';
const DEFAULT_HIGH_COLOR = '#0369a1';

function interpolateHexColor(colorA: string, colorB: string, t: number): string {
    const parseHex = (hex: string) => {
        const h = hex.replace('#', '');
        return [
            parseInt(h.substring(0, 2), 16),
            parseInt(h.substring(2, 4), 16),
            parseInt(h.substring(4, 6), 16),
        ];
    };

    const [r1, g1, b1] = parseHex(colorA);
    const [r2, g2, b2] = parseHex(colorB);

    const r = Math.round(r1 + (r2 - r1) * t);
    const g = Math.round(g1 + (g2 - g1) * t);
    const b = Math.round(b1 + (b2 - b1) * t);

    return `#${r.toString(16).padStart(2, '0')}${g.toString(16).padStart(2, '0')}${b.toString(16).padStart(2, '0')}`;
}

export class HeatmapChart<TData = unknown> extends Chart<HeatmapChartOptions<TData>> {

    private cellGroups: Group[] = [];
    private xAxis!: ChartXAxis;
    private yAxis!: ChartYAxis;
    private tooltip!: Tooltip;

    constructor(target: string | HTMLElement | Context, options: HeatmapChartOptions<TData>) {
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
        });

        this.yAxis = new ChartYAxis({
            scene: this.scene,
            renderer: this.renderer,
            bounds: Box.empty(),
            scale: scaleContinuous([0, 1], [0, 1]),
        });

        this.init();
    }

    public async render() {
        return super.render(async (scene) => {
            const {
                data,
                xBy,
                yBy,
                valueBy,
                xCategories,
                yCategories,
                colorRange,
                borderRadius = 2,
            } = this.options;

            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            const getX = typeIsFunction(xBy) ? xBy : (item: any) => item[xBy] as string;
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            const getY = typeIsFunction(yBy) ? yBy : (item: any) => item[yBy] as string;
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            const getValue = typeIsFunction(valueBy) ? valueBy : (item: any) => item[valueBy] as number;

            const [lowColor, highColor] = colorRange ?? [DEFAULT_LOW_COLOR, DEFAULT_HIGH_COLOR];

            // Compute value extent
            let minVal = Infinity;
            let maxVal = -Infinity;

            arrayForEach(data, item => {
                const v = getValue(item);
                minVal = Math.min(minVal, v);
                maxVal = Math.max(maxVal, v);
            });

            const valueRange = maxVal - minVal || 1;
            const padding = this.getPadding();

            // Build scales
            const xScale = scaleBand(xCategories, [padding.left + 60, scene.width - padding.right], {
                innerPadding: 0.05,
            });

            const yScale = scaleBand(yCategories, [padding.top + 20, scene.height - padding.bottom - 30], {
                innerPadding: 0.05,
            });

            // Set up axes
            this.xAxis.scale = Object.assign(
                (value: string) => xScale(value) + xScale.bandwidth / 2,
                {
                    domain: xCategories,
                    range: xScale.range,
                    inverse: xScale.inverse,
                    ticks: () => xCategories,
                    includes: (v: string) => xCategories.includes(v),
                }
            ) as unknown as typeof this.xAxis.scale;

            this.xAxis.bounds = new Box(
                padding.top + 20,
                padding.left + 60,
                scene.height - padding.bottom,
                scene.width - padding.right
            );

            this.yAxis.scale = Object.assign(
                (value: string) => yScale(value) + yScale.bandwidth / 2,
                {
                    domain: yCategories,
                    range: yScale.range,
                    inverse: yScale.inverse,
                    ticks: () => yCategories,
                    includes: (v: string) => yCategories.includes(v),
                }
            ) as unknown as typeof this.yAxis.scale;

            this.yAxis.bounds = new Box(
                padding.top + 20,
                padding.left,
                scene.height - padding.bottom - 30,
                scene.width - padding.right
            );

            // Draw cells
            const cellData = arrayMap(data, item => {
                const xVal = getX(item);
                const yVal = getY(item);
                const value = getValue(item);
                const t = (value - minVal) / valueRange;
                const color = interpolateHexColor(lowColor, highColor, t);

                return {
                    id: `cell-${xVal}-${yVal}`,
                    x: xScale(xVal),
                    y: yScale(yVal),
                    width: xScale.bandwidth,
                    height: yScale.bandwidth,
                    color,
                    value,
                    xLabel: xVal,
                    yLabel: yVal,
                };
            });

            const {
                left: cellEntries,
                inner: cellUpdates,
                right: cellExits,
            } = arrayJoin(cellData, this.cellGroups, (item, group) => item.id === group.id);

            arrayForEach(cellExits, group => group.destroy());

            const entryGroups = arrayMap(cellEntries, cell => {
                const rect = createRect({
                    id: `${cell.id}-rect`,
                    x: cell.x,
                    y: cell.y,
                    width: cell.width,
                    height: cell.height,
                    fillStyle: cell.color,
                    globalAlpha: 0,
                    borderRadius,
                    data: {
                        globalAlpha: 1,
                    },
                });

                rect.on('mouseenter', () => {
                    this.tooltip.show(
                        cell.x + cell.width / 2,
                        cell.y,
                        `${cell.xLabel}, ${cell.yLabel}: ${cell.value}`
                    );

                    this.renderer.transition(rect, {
                        duration: this.getAnimationDuration(200),
                        ease: easeOutQuart,
                        state: {
                            globalAlpha: 0.8,
                        },
                    });

                    rect.once('mouseleave', () => {
                        this.tooltip.hide();

                        this.renderer.transition(rect, {
                            duration: this.getAnimationDuration(200),
                            ease: easeOutQuart,
                            state: {
                                globalAlpha: 1,
                            },
                        });
                    });
                });

                return createGroup({
                    id: cell.id,
                    children: [rect],
                });
            });

            const updateGroups = arrayMap(cellUpdates, ([cell, group]) => {
                const rect = group.getElementsByType('rect')[0] as Rect;

                if (rect) {
                    rect.data = {
                        x: cell.x,
                        y: cell.y,
                        width: cell.width,
                        height: cell.height,
                        fillStyle: cell.color,
                        globalAlpha: 1,
                    } as RectState;
                }

                return group;
            });

            this.scene.add(entryGroups);

            this.cellGroups = [
                ...entryGroups,
                ...updateGroups,
            ];

            // Animate
            const entryRects = entryGroups.flatMap(g => g.getElementsByType('rect')) as Rect[];

            const entriesTransition = this.renderer.transition(entryRects, (element, index, length) => ({
                duration: this.getAnimationDuration(800),
                delay: index * (this.getAnimationDuration(600) / length),
                ease: easeOutCubic,
                state: element.data as RectState,
            }));

            const updateRects = updateGroups.flatMap(g => g.getElementsByType('rect')) as Rect[];

            const updatesTransition = this.renderer.transition(updateRects, element => ({
                duration: this.getAnimationDuration(800),
                ease: easeOutCubic,
                state: element.data as RectState,
            }));

            return Promise.all([
                this.xAxis.render(),
                this.yAxis.render(),
                entriesTransition,
                updatesTransition,
            ]);
        });
    }

}

export function createHeatmapChart<TData = unknown>(target: string | HTMLElement | Context, options: HeatmapChartOptions<TData>) {
    return new HeatmapChart<TData>(target, options);
}
