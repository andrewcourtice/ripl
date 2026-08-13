import {
    afterEach,
    beforeEach,
    describe,
    expect,
    test,
    vi,
} from 'vitest';

import {
    mockCanvasContext,
    polyfillPath2D,
} from '@ripl/test-utils';

import {
    createArcDiagramChart,
    createAreaChart,
    createBarChart,
    createBoxPlotChart,
    createChordChart,
    createForceDirectedChart,
    createFunnelChart,
    createGanttChart,
    createGaugeChart,
    createHeatmapChart,
    createHistogramChart,
    createLineChart,
    createPackedCircleChart,
    createPieChart,
    createPolarAreaChart,
    createPolarScatterChart,
    createRadarChart,
    createRadialBarChart,
    createRealtimeChart,
    createSankeyChart,
    createScatterChart,
    createStockChart,
    createSunburstChart,
    createTreemapChart,
    createTrendChart,
} from '../src';

interface MarkCase {
    name: string;
    create(): {
        chart: {
            render(): Promise<unknown>;
            destroy(): void;
        };
        highlight(): boolean;
    };
}

interface Sample {
    month: string;
    revenue: number;
    cost: number;
}

interface Latency {
    region: string;
    latency: number;
}

interface Task {
    id: string;
    name: string;
    start: Date;
    end: Date;
}

interface Candle {
    date: string;
    open: number;
    high: number;
    low: number;
    close: number;
}

interface Cell {
    day: string;
    hour: string;
    load: number;
}

interface Reading {
    angle: number;
    speed: number;
}

interface Stat {
    axis: string;
    player: number;
}

const SAMPLES: Sample[] = [
    {
        month: 'Jan',
        revenue: 120,
        cost: 80,
    },
    {
        month: 'Feb',
        revenue: 150,
        cost: 90,
    },
    {
        month: 'Mar',
        revenue: 170,
        cost: 110,
    },
];

const LATENCIES: Latency[] = [
    {
        region: 'US',
        latency: 40,
    },
    {
        region: 'US',
        latency: 55,
    },
    {
        region: 'US',
        latency: 60,
    },
    {
        region: 'US',
        latency: 62,
    },
    {
        region: 'US',
        latency: 120,
    },
    {
        region: 'EU',
        latency: 70,
    },
    {
        region: 'EU',
        latency: 82,
    },
    {
        region: 'EU',
        latency: 88,
    },
    {
        region: 'EU',
        latency: 95,
    },
    {
        region: 'EU',
        latency: 130,
    },
];

const TASKS: Task[] = [
    {
        id: 'design',
        name: 'Design',
        start: new Date('2024-01-01'),
        end: new Date('2024-01-10'),
    },
    {
        id: 'build',
        name: 'Build',
        start: new Date('2024-01-08'),
        end: new Date('2024-01-22'),
    },
];

const CANDLES: Candle[] = [
    {
        date: '2024-01-01',
        open: 100,
        high: 110,
        low: 95,
        close: 108,
    },
    {
        date: '2024-01-02',
        open: 108,
        high: 115,
        low: 104,
        close: 106,
    },
];

const HOURS = [
    '9am',
    '10am',
];

const DAYS = [
    'Mon',
    'Tue',
];

const CELLS: Cell[] = DAYS.flatMap((day, dayIndex) => HOURS.map((hour, hourIndex) => ({
    day,
    hour,
    load: dayIndex * 10 + hourIndex,
})));

const READINGS: Reading[] = [
    {
        angle: 30,
        speed: 60,
    },
    {
        angle: 150,
        speed: 80,
    },
];

const STATS: Stat[] = [
    {
        axis: 'Speed',
        player: 80,
    },
    {
        axis: 'Strength',
        player: 55,
    },
    {
        axis: 'Defense',
        player: 70,
    },
];

polyfillPath2D();

/** jsdom measures every element as 0×0; give the canvas a real size so every chart gets a plot to draw in. */
function mockCanvasSize(width: number, height: number): void {
    vi.spyOn(HTMLCanvasElement.prototype, 'getBoundingClientRect').mockReturnValue({
        width,
        height,
        top: 0,
        left: 0,
        right: width,
        bottom: height,
        x: 0,
        y: 0,
        toJSON: () => ({}),
    } as DOMRect);
}

function target(): HTMLElement {
    return document.createElement('div');
}

const CASES: MarkCase[] = [
    {
        name: 'arc diagram node',
        create() {
            const chart = createArcDiagramChart(target(), {
                autoRender: false,
                animation: false,
                nodes: [
                    {
                        id: 'a',
                        label: 'A',
                    },
                    {
                        id: 'b',
                        label: 'B',
                    },
                    {
                        id: 'c',
                        label: 'C',
                    },
                ],
                links: [
                    {
                        source: 'a',
                        target: 'b',
                        value: 3,
                    },
                    {
                        source: 'b',
                        target: 'c',
                        value: 2,
                    },
                ],
            });

            return {
                chart,
                highlight: () => chart.highlightNode('a'),
            };
        },
    },
    {
        name: 'arc diagram link',
        create() {
            const chart = createArcDiagramChart(target(), {
                autoRender: false,
                animation: false,
                nodes: [
                    {
                        id: 'a',
                        label: 'A',
                    },
                    {
                        id: 'b',
                        label: 'B',
                    },
                ],
                links: [{
                    source: 'a',
                    target: 'b',
                    value: 3,
                }],
            });

            return {
                chart,
                highlight: () => chart.highlightLink({
                    source: 'a',
                    target: 'b',
                }),
            };
        },
    },
    {
        name: 'area marker',
        create() {
            const chart = createAreaChart<Sample>(target(), {
                autoRender: false,
                animation: false,
                data: SAMPLES,
                key: 'month',
                series: [{
                    id: 'revenue',
                    label: 'Revenue',
                    value: 'revenue',
                }],
            });

            return {
                chart,
                highlight: () => chart.highlightMarker('Feb'),
            };
        },
    },
    {
        name: 'bar',
        create() {
            const chart = createBarChart<Sample>(target(), {
                autoRender: false,
                animation: false,
                data: SAMPLES,
                key: 'month',
                series: [{
                    id: 'revenue',
                    label: 'Revenue',
                    value: 'revenue',
                }],
            });

            return {
                chart,
                highlight: () => chart.highlightBar('Feb'),
            };
        },
    },
    {
        name: 'box plot box',
        create() {
            const chart = createBoxPlotChart<Latency>(target(), {
                autoRender: false,
                animation: false,
                data: LATENCIES,
                key: 'region',
                value: 'latency',
            });

            return {
                chart,
                highlight: () => chart.highlightBox('US'),
            };
        },
    },
    {
        name: 'chord segment',
        create() {
            const chart = createChordChart(target(), {
                autoRender: false,
                animation: false,
                groups: [
                    'Engineering',
                    'Design',
                ],
                matrix: [
                    [0, 5],
                    [5, 0],
                ],
            });

            return {
                chart,
                highlight: () => chart.highlightSegment('Engineering'),
            };
        },
    },
    {
        name: 'chord link',
        create() {
            const chart = createChordChart(target(), {
                autoRender: false,
                animation: false,
                groups: [
                    'Engineering',
                    'Design',
                ],
                matrix: [
                    [0, 5],
                    [5, 0],
                ],
            });

            return {
                chart,
                highlight: () => chart.highlightLink({
                    source: 'Engineering',
                    target: 'Design',
                }),
            };
        },
    },
    {
        name: 'force-directed node',
        create() {
            const chart = createForceDirectedChart(target(), {
                autoRender: false,
                animation: false,
                nodes: [
                    {
                        id: 'a',
                        label: 'A',
                    },
                    {
                        id: 'b',
                        label: 'B',
                    },
                ],
                links: [{
                    source: 'a',
                    target: 'b',
                    value: 3,
                }],
            });

            return {
                chart,
                highlight: () => chart.highlightNode('a'),
            };
        },
    },
    {
        name: 'force-directed link',
        create() {
            const chart = createForceDirectedChart(target(), {
                autoRender: false,
                animation: false,
                nodes: [
                    {
                        id: 'a',
                        label: 'A',
                    },
                    {
                        id: 'b',
                        label: 'B',
                    },
                ],
                links: [{
                    source: 'a',
                    target: 'b',
                    value: 3,
                }],
            });

            return {
                chart,
                highlight: () => chart.highlightLink({
                    source: 'a',
                    target: 'b',
                }),
            };
        },
    },
    {
        name: 'funnel segment',
        create() {
            const chart = createFunnelChart<Sample>(target(), {
                autoRender: false,
                animation: false,
                data: SAMPLES,
                key: 'month',
                value: 'revenue',
                label: 'month',
            });

            return {
                chart,
                highlight: () => chart.highlightSegment('Feb'),
            };
        },
    },
    {
        name: 'gantt task',
        create() {
            const chart = createGanttChart<Task>(target(), {
                autoRender: false,
                animation: false,
                data: TASKS,
                key: 'id',
                label: 'name',
                start: 'start',
                end: 'end',
            });

            return {
                chart,
                highlight: () => chart.highlightTask('design'),
            };
        },
    },
    {
        name: 'gauge value',
        create() {
            const chart = createGaugeChart(target(), {
                autoRender: false,
                animation: false,
                value: 72,
                min: 0,
                max: 100,
                label: 'Performance',
            });

            return {
                chart,
                highlight: () => chart.highlightValue(),
            };
        },
    },
    {
        name: 'heatmap cell',
        create() {
            const chart = createHeatmapChart<Cell>(target(), {
                autoRender: false,
                animation: false,
                data: CELLS,
                keyX: 'hour',
                keyY: 'day',
                value: 'load',
                xCategories: HOURS,
                yCategories: DAYS,
            });

            return {
                chart,
                highlight: () => chart.highlightCell({
                    x: '9am',
                    y: 'Mon',
                }),
            };
        },
    },
    {
        name: 'histogram bin',
        create() {
            const chart = createHistogramChart<Sample>(target(), {
                autoRender: false,
                animation: false,
                data: SAMPLES,
                value: 'revenue',
                bins: 3,
            });

            return {
                chart,
                highlight: () => chart.highlightBin(0),
            };
        },
    },
    {
        name: 'line marker',
        create() {
            const chart = createLineChart<Sample>(target(), {
                autoRender: false,
                animation: false,
                data: SAMPLES,
                key: 'month',
                series: [{
                    id: 'revenue',
                    label: 'Revenue',
                    value: 'revenue',
                }],
            });

            return {
                chart,
                highlight: () => chart.highlightMarker('Feb'),
            };
        },
    },
    {
        name: 'packed circle node',
        create() {
            const chart = createPackedCircleChart<Sample>(target(), {
                autoRender: false,
                animation: false,
                data: SAMPLES,
                key: 'month',
                value: 'revenue',
                label: 'month',
            });

            return {
                chart,
                highlight: () => chart.highlightNode('Feb'),
            };
        },
    },
    {
        name: 'pie segment',
        create() {
            const chart = createPieChart<Sample>(target(), {
                autoRender: false,
                animation: false,
                data: SAMPLES,
                key: 'month',
                value: 'revenue',
                label: 'month',
            });

            return {
                chart,
                highlight: () => chart.highlightSegment('Feb'),
            };
        },
    },
    {
        name: 'polar area segment',
        create() {
            const chart = createPolarAreaChart<Sample>(target(), {
                autoRender: false,
                animation: false,
                data: SAMPLES,
                key: 'month',
                value: 'revenue',
                label: 'month',
            });

            return {
                chart,
                highlight: () => chart.highlightSegment('Feb'),
            };
        },
    },
    {
        name: 'polar scatter marker',
        create() {
            const chart = createPolarScatterChart<Reading>(target(), {
                autoRender: false,
                animation: false,
                data: READINGS,
                max: 100,
                series: [{
                    id: 'wind',
                    label: 'Wind',
                    angleBy: 'angle',
                    radiusBy: 'speed',
                }],
            });

            return {
                chart,
                highlight: () => chart.highlightMarker('0'),
            };
        },
    },
    {
        name: 'radar marker',
        create() {
            const chart = createRadarChart<Stat>(target(), {
                autoRender: false,
                animation: false,
                categories: STATS.map(stat => stat.axis),
                data: STATS,
                series: [{
                    id: 'player',
                    label: 'Player',
                    value: 'player',
                }],
            });

            return {
                chart,
                highlight: () => chart.highlightMarker('Speed'),
            };
        },
    },
    {
        name: 'radial bar',
        create() {
            const chart = createRadialBarChart<Sample>(target(), {
                autoRender: false,
                animation: false,
                data: SAMPLES,
                key: 'month',
                value: 'revenue',
                max: 200,
            });

            return {
                chart,
                highlight: () => chart.highlightBar('Feb'),
            };
        },
    },
    {
        name: 'realtime series',
        create() {
            const chart = createRealtimeChart(target(), {
                autoRender: false,
                animation: false,
                windowSize: 10,
                transitionDuration: 0,
                series: [
                    {
                        id: 'cpu',
                        label: 'CPU',
                    },
                    {
                        id: 'memory',
                        label: 'Memory',
                    },
                ],
            });

            chart.push({
                cpu: 10,
                memory: 20,
            });

            chart.push({
                cpu: 20,
                memory: 30,
            });

            return {
                chart,
                highlight: () => chart.highlightSeries('cpu'),
            };
        },
    },
    {
        name: 'sankey node',
        create() {
            const chart = createSankeyChart(target(), {
                autoRender: false,
                animation: false,
                nodes: [
                    {
                        id: 'budget',
                        label: 'Budget',
                    },
                    {
                        id: 'engineering',
                        label: 'Engineering',
                    },
                ],
                links: [{
                    source: 'budget',
                    target: 'engineering',
                    value: 300,
                }],
            });

            return {
                chart,
                highlight: () => chart.highlightNode('budget'),
            };
        },
    },
    {
        name: 'sankey link',
        create() {
            const chart = createSankeyChart(target(), {
                autoRender: false,
                animation: false,
                nodes: [
                    {
                        id: 'budget',
                        label: 'Budget',
                    },
                    {
                        id: 'engineering',
                        label: 'Engineering',
                    },
                ],
                links: [{
                    source: 'budget',
                    target: 'engineering',
                    value: 300,
                }],
            });

            return {
                chart,
                highlight: () => chart.highlightLink({
                    source: 'budget',
                    target: 'engineering',
                }),
            };
        },
    },
    {
        name: 'scatter marker',
        create() {
            const chart = createScatterChart<Sample>(target(), {
                autoRender: false,
                animation: false,
                data: SAMPLES,
                key: 'month',
                series: [{
                    id: 'points',
                    label: 'Months',
                    xBy: 'cost',
                    yBy: 'revenue',
                }],
            });

            return {
                chart,
                highlight: () => chart.highlightMarker('Feb'),
            };
        },
    },
    {
        name: 'stock candle',
        create() {
            const chart = createStockChart<Candle>(target(), {
                autoRender: false,
                animation: false,
                data: CANDLES,
                key: 'date',
                open: 'open',
                high: 'high',
                low: 'low',
                close: 'close',
            });

            return {
                chart,
                highlight: () => chart.highlightCandle('2024-01-01'),
            };
        },
    },
    {
        name: 'sunburst node',
        create() {
            const chart = createSunburstChart(target(), {
                autoRender: false,
                animation: false,
                data: [{
                    id: 'tech',
                    label: 'Technology',
                    value: 400,
                    children: [
                        {
                            id: 'web',
                            label: 'Web',
                            value: 120,
                        },
                        {
                            id: 'mobile',
                            label: 'Mobile',
                            value: 90,
                        },
                    ],
                }],
            });

            return {
                chart,
                highlight: () => chart.highlightNode('web'),
            };
        },
    },
    {
        name: 'treemap node',
        create() {
            const chart = createTreemapChart<Sample>(target(), {
                autoRender: false,
                animation: false,
                data: SAMPLES,
                key: 'month',
                value: 'revenue',
                label: 'month',
            });

            return {
                chart,
                highlight: () => chart.highlightNode('Feb'),
            };
        },
    },
    {
        name: 'trend bar',
        create() {
            const chart = createTrendChart<Sample>(target(), {
                autoRender: false,
                animation: false,
                data: SAMPLES,
                key: 'month',
                series: [{
                    type: 'bar',
                    id: 'cost',
                    label: 'Cost',
                    value: 'cost',
                }],
            });

            return {
                chart,
                highlight: () => chart.highlightBar('Feb'),
            };
        },
    },
    {
        name: 'trend marker',
        create() {
            const chart = createTrendChart<Sample>(target(), {
                autoRender: false,
                animation: false,
                data: SAMPLES,
                key: 'month',
                series: [{
                    type: 'line',
                    id: 'revenue',
                    label: 'Revenue',
                    value: 'revenue',
                }],
            });

            return {
                chart,
                highlight: () => chart.highlightMarker('Feb'),
            };
        },
    },
];

describe('mark registry', () => {

    beforeEach(() => {
        mockCanvasContext();
        mockCanvasSize(640, 400);
    });

    afterEach(() => {
        vi.restoreAllMocks();
    });

    for (const markCase of CASES) {
        test(`${markCase.name} resolves its registered key after a render`, async () => {
            const {
                chart,
                highlight,
            } = markCase.create();

            await chart.render();

            expect(highlight()).toBe(true);

            chart.destroy();
        });
    }

});
