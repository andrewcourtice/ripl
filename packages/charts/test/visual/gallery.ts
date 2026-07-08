/**
 * Deterministic chart gallery used for Playwright visual-regression snapshots.
 *
 * Every chart is rendered with `animation: false` and fixed data/size so screenshots are stable.
 * Each chart exercises a title and (where applicable) a legend and axes so the regressions that
 * this audit fixed — missing titles, vertical y-axis titles, legend clipping, plot overlap — are
 * covered across the whole chart catalogue, not just the flagship charts.
 */

// `@ripl/charts` relies on a platform package to register the browser factory (canvas context,
// text measurement, requestAnimationFrame, devicePixelRatio). Importing `@ripl/web` for its
// side-effect wires that up, exactly as a real consumer app would.
import '@ripl/web';

import {
    createArcDiagramChart,
    createAreaChart,
    createBarChart,
    createChordChart,
    createForceDirectedChart,
    createFunnelChart,
    createGanttChart,
    createGaugeChart,
    createHeatmapChart,
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
} from '@ripl/charts';

import {
    CHART_IDS,
} from './chart-ids';

interface Sample {
    month: string;
    revenue: number;
    cost: number;
}

const DATA: Sample[] = [
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
    {
        month: 'Apr',
        revenue: 140,
        cost: 95,
    },
    {
        month: 'May',
        revenue: 200,
        cost: 120,
    },
    {
        month: 'Jun',
        revenue: 230,
        cost: 130,
    },
];

function mount(id: string): HTMLElement {
    const el = document.createElement('div');
    el.id = id;
    el.style.width = '480px';
    el.style.height = '320px';
    el.setAttribute('data-chart', id);
    document.body.appendChild(el);
    return el;
}

const baseSeries = [
    {
        id: 'revenue',
        label: 'Revenue',
        value: 'revenue' as const,
    },
    {
        id: 'cost',
        label: 'Cost',
        value: 'cost' as const,
    },
];

createBarChart(mount('bar'), {
    animation: false,
    title: 'Bar — Revenue vs Cost',
    legend: true,
    data: DATA,
    key: 'month',
    series: baseSeries,
    axis: {
        x: true,
        y: {
            title: 'Amount ($)',
            position: 'left',
        },
    },
});

createLineChart(mount('line'), {
    animation: false,
    title: 'Line — Trend',
    legend: true,
    data: DATA,
    key: 'month',
    series: baseSeries.map(s => ({
        ...s,
        markers: true,
    })),
    axis: {
        x: true,
        y: { title: 'Amount ($)' },
    },
});

createAreaChart(mount('area'), {
    animation: false,
    title: 'Area — Stacked',
    legend: true,
    stacked: true,
    data: DATA,
    key: 'month',
    series: baseSeries,
    axis: {
        x: true,
        y: { title: 'Amount ($)' },
    },
});

createScatterChart(mount('scatter'), {
    animation: false,
    title: 'Scatter — Cost vs Revenue',
    legend: true,
    data: DATA,
    key: 'month',
    series: [{
        id: 'points',
        label: 'Months',
        xBy: 'cost',
        yBy: 'revenue',
        sizeBy: 8,
    }],
    axis: {
        x: { title: 'Cost' },
        y: { title: 'Revenue' },
    },
});

createPieChart(mount('pie'), {
    animation: false,
    title: 'Pie — Revenue share',
    legend: 'right',
    data: DATA,
    key: 'month',
    value: 'revenue',
    label: 'month',
    innerRadius: 0.5,
});

createChordChart(mount('chord'), {
    animation: false,
    title: 'Chord — Team flows',
    legend: true,
    labels: ['Engineering', 'Design', 'Marketing', 'Sales'],
    matrix: [
        [0, 5, 10, 8],
        [5, 0, 6, 4],
        [10, 6, 0, 7],
        [8, 4, 7, 0],
    ],
});

createFunnelChart(mount('funnel'), {
    animation: false,
    title: 'Funnel — Conversion',
    data: [
        {
            stage: 'Visitors',
            value: 10000,
        },
        {
            stage: 'Leads',
            value: 6200,
        },
        {
            stage: 'Prospects',
            value: 3100,
        },
        {
            stage: 'Negotiations',
            value: 1400,
        },
        {
            stage: 'Closed',
            value: 600,
        },
    ],
    key: 'stage',
    value: 'value',
    label: 'stage',
});

createGanttChart(mount('gantt'), {
    animation: false,
    title: 'Gantt — Schedule',
    data: [
        {
            id: 'design',
            name: 'Design',
            start: new Date('2024-01-01'),
            end: new Date('2024-01-10'),
            progress: 1,
        },
        {
            id: 'build',
            name: 'Build',
            start: new Date('2024-01-08'),
            end: new Date('2024-01-22'),
            progress: 0.6,
        },
        {
            id: 'test',
            name: 'Test',
            start: new Date('2024-01-20'),
            end: new Date('2024-01-30'),
            progress: 0.25,
        },
        {
            id: 'launch',
            name: 'Launch',
            start: new Date('2024-01-29'),
            end: new Date('2024-02-05'),
            progress: 0,
        },
    ],
    key: 'id',
    label: 'name',
    start: 'start',
    end: 'end',
    progress: 'progress',
});

createGaugeChart(mount('gauge'), {
    animation: false,
    title: 'Gauge — Performance',
    value: 72,
    min: 0,
    max: 100,
    label: 'Performance',
    formatValue: v => `${v}%`,
    formatTickLabel: v => `${v}%`,
});

const DAYS = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri'];
const HOURS = ['9am', '10am', '11am', '12pm', '1pm'];

createHeatmapChart(mount('heatmap'), {
    animation: false,
    title: 'Heatmap — Activity',
    data: DAYS.flatMap((day, di) => HOURS.map((hour, hi) => ({
        day,
        hour,
        // Deterministic, varied surface so colour intensity is visible.
        value: ((di * 7 + hi * 13) % 100),
    }))),
    xBy: 'hour',
    yBy: 'day',
    value: 'value',
    xCategories: HOURS,
    yCategories: DAYS,
});

createPolarAreaChart(mount('polar-area'), {
    animation: false,
    title: 'Polar Area — Stats',
    data: [
        {
            id: 'speed',
            label: 'Speed',
            value: 70,
        },
        {
            id: 'strength',
            label: 'Strength',
            value: 55,
        },
        {
            id: 'defense',
            label: 'Defense',
            value: 85,
        },
        {
            id: 'magic',
            label: 'Magic',
            value: 40,
        },
        {
            id: 'luck',
            label: 'Luck',
            value: 60,
        },
        {
            id: 'agility',
            label: 'Agility',
            value: 75,
        },
    ],
    key: 'id',
    value: 'value',
    label: 'label',
});

const RADAR_AXES = ['Speed', 'Strength', 'Defense', 'Magic', 'Luck', 'Agility'];

createRadarChart(mount('radar'), {
    animation: false,
    title: 'Radar — Player profiles',
    legend: true,
    axes: RADAR_AXES,
    data: [
        {
            axis: 'Speed',
            player1: 80,
            player2: 65,
        },
        {
            axis: 'Strength',
            player1: 55,
            player2: 90,
        },
        {
            axis: 'Defense',
            player1: 70,
            player2: 60,
        },
        {
            axis: 'Magic',
            player1: 40,
            player2: 85,
        },
        {
            axis: 'Luck',
            player1: 65,
            player2: 50,
        },
        {
            axis: 'Agility',
            player1: 90,
            player2: 70,
        },
    ],
    series: [
        {
            id: 'player1',
            value: 'player1',
            label: 'Player 1',
        },
        {
            id: 'player2',
            value: 'player2',
            label: 'Player 2',
        },
    ],
});

const realtime = createRealtimeChart(mount('realtime'), {
    animation: false,
    title: 'Realtime — System load',
    legend: true,
    windowSize: 40,
    transitionDuration: 0,
    series: [
        {
            id: 'cpu',
            label: 'CPU %',
            showArea: true,
            areaOpacity: 0.15,
        },
        {
            id: 'memory',
            label: 'Memory %',
            showArea: true,
            areaOpacity: 0.15,
        },
        {
            id: 'network',
            label: 'Network MB/s',
            showArea: false,
            lineWidth: 1.5,
        },
    ],
});

// Feed a deterministic window of samples so the streaming chart has a stable shape.
for (let i = 0; i < 40; i++) {
    realtime.push({
        cpu: 50 + 30 * Math.sin(i / 4),
        memory: 60 + 20 * Math.sin(i / 6 + 1),
        network: 30 + 15 * Math.sin(i / 3 + 2),
    });
}

createSankeyChart(mount('sankey'), {
    animation: false,
    title: 'Sankey — Budget',
    padding: {
        top: 20,
        right: 80,
        bottom: 20,
        left: 20,
    },
    nodes: [
        {
            id: 'budget',
            label: 'Budget',
        },
        {
            id: 'engineering',
            label: 'Engineering',
        },
        {
            id: 'marketing',
            label: 'Marketing',
        },
        {
            id: 'frontend',
            label: 'Frontend',
        },
        {
            id: 'backend',
            label: 'Backend',
        },
        {
            id: 'ads',
            label: 'Ads',
        },
    ],
    links: [
        {
            source: 'budget',
            target: 'engineering',
            value: 300,
        },
        {
            source: 'budget',
            target: 'marketing',
            value: 180,
        },
        {
            source: 'engineering',
            target: 'frontend',
            value: 160,
        },
        {
            source: 'engineering',
            target: 'backend',
            value: 140,
        },
        {
            source: 'marketing',
            target: 'ads',
            value: 180,
        },
    ],
});

createStockChart(mount('stock'), {
    animation: false,
    title: 'Stock — OHLC',
    data: [
        {
            date: '2024-01-01',
            open: 100,
            high: 110,
            low: 95,
            close: 108,
            volume: 1200,
        },
        {
            date: '2024-01-02',
            open: 108,
            high: 115,
            low: 104,
            close: 106,
            volume: 1500,
        },
        {
            date: '2024-01-03',
            open: 106,
            high: 109,
            low: 98,
            close: 100,
            volume: 1800,
        },
        {
            date: '2024-01-04',
            open: 100,
            high: 112,
            low: 99,
            close: 111,
            volume: 1400,
        },
        {
            date: '2024-01-05',
            open: 111,
            high: 118,
            low: 110,
            close: 114,
            volume: 1700,
        },
        {
            date: '2024-01-08',
            open: 114,
            high: 116,
            low: 105,
            close: 107,
            volume: 1600,
        },
    ],
    key: 'date',
    open: 'open',
    high: 'high',
    low: 'low',
    close: 'close',
    volume: 'volume',
    showVolume: true,
});

createSunburstChart(mount('sunburst'), {
    animation: false,
    title: 'Sunburst — Portfolio',
    legend: true,
    data: [
        {
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
                {
                    id: 'cloud',
                    label: 'Cloud',
                    value: 60,
                },
            ],
        },
        {
            id: 'finance',
            label: 'Finance',
            value: 300,
            children: [
                {
                    id: 'banking',
                    label: 'Banking',
                    value: 80,
                },
                {
                    id: 'insurance',
                    label: 'Insurance',
                    value: 60,
                },
            ],
        },
        {
            id: 'health',
            label: 'Health',
            value: 200,
        },
    ],
});

createTreemapChart(mount('treemap'), {
    animation: false,
    title: 'Treemap — Revenue by product',
    data: [
        {
            name: 'Search',
            value: 900,
        },
        {
            name: 'Ads',
            value: 620,
        },
        {
            name: 'Cloud',
            value: 480,
        },
        {
            name: 'Hardware',
            value: 300,
        },
        {
            name: 'Other',
            value: 180,
        },
    ],
    key: 'name',
    value: 'value',
    label: 'name',
});

interface TrendRow {
    id: string;
    australia: number;
    sweden: number;
    greatBritain: number;
}

const TREND_DATA: TrendRow[] = [
    {
        id: '2018',
        australia: 30,
        sweden: 20,
        greatBritain: 45,
    },
    {
        id: '2019',
        australia: 45,
        sweden: 35,
        greatBritain: 50,
    },
    {
        id: '2020',
        australia: 25,
        sweden: 40,
        greatBritain: 38,
    },
    {
        id: '2021',
        australia: 55,
        sweden: 30,
        greatBritain: 60,
    },
    {
        id: '2022',
        australia: 40,
        sweden: 50,
        greatBritain: 52,
    },
];

createTrendChart(mount('trend'), {
    animation: false,
    title: 'Trend — Mixed series',
    legend: true,
    data: TREND_DATA,
    key: 'id',
    series: [
        {
            type: 'bar',
            id: 'australia',
            label: 'Australia',
            value: 'australia',
        },
        {
            type: 'bar',
            id: 'sweden',
            label: 'Sweden',
            value: 'sweden',
        },
        {
            type: 'line',
            id: 'great-britain',
            label: 'Great Britain',
            value: 'greatBritain',
        },
    ],
});

createPolarScatterChart(mount('polar-scatter'), {
    animation: false,
    title: 'Polar Scatter — Wind',
    data: [
        { angle: 30, speed: 60, gust: 70 },
        { angle: 90, speed: 40, gust: 50 },
        { angle: 150, speed: 80, gust: 90 },
        { angle: 220, speed: 55, gust: 60 },
        { angle: 300, speed: 35, gust: 45 },
    ],
    series: [
        { id: 'wind', label: 'Wind', angle: 'angle', radius: 'speed', sizeBy: 'gust' },
    ],
    maxRadiusValue: 100,
});

createRadialBarChart(mount('radial-bar'), {
    animation: false,
    title: 'Radial Bar — Languages',
    data: [
        { language: 'JavaScript', share: 90 },
        { language: 'Python', share: 72 },
        { language: 'Rust', share: 58 },
        { language: 'Go', share: 44 },
    ],
    key: 'language',
    value: 'share',
    maxValue: 100,
});

createPackedCircleChart(mount('packed-circle'), {
    animation: false,
    title: 'Packed Circle — Teams',
    data: [
        { name: 'Alpha', size: 80 },
        { name: 'Bravo', size: 55 },
        { name: 'Charlie', size: 40 },
        { name: 'Delta', size: 30 },
        { name: 'Echo', size: 20 },
    ],
    key: 'name',
    value: 'size',
    label: 'name',
});

createForceDirectedChart(mount('force-directed'), {
    animation: false,
    title: 'Force-Directed — Network',
    nodes: [
        { id: 'a', label: 'A', group: 'x' },
        { id: 'b', label: 'B', group: 'x' },
        { id: 'c', label: 'C', group: 'y' },
        { id: 'd', label: 'D', group: 'y' },
        { id: 'e', label: 'E', group: 'z' },
    ],
    links: [
        { source: 'a', target: 'b', value: 3 },
        { source: 'a', target: 'c', value: 2 },
        { source: 'c', target: 'd', value: 4 },
        { source: 'd', target: 'e', value: 1 },
    ],
});

createArcDiagramChart(mount('arc-diagram'), {
    animation: false,
    title: 'Arc Diagram — Links',
    nodes: [
        { id: 'a', label: 'A' },
        { id: 'b', label: 'B' },
        { id: 'c', label: 'C' },
        { id: 'd', label: 'D' },
        { id: 'e', label: 'E' },
    ],
    links: [
        { source: 'a', target: 'c', value: 3 },
        { source: 'b', target: 'e', value: 2 },
        { source: 'c', target: 'd', value: 4 },
        { source: 'a', target: 'e', value: 1 },
    ],
});

// Signal readiness for the Playwright test to capture screenshots, only once every chart in the
// shared id list has actually been mounted.
const mounted = CHART_IDS.every(id => document.querySelector(`[data-chart="${id}"]`));

requestAnimationFrame(() => {
    if (mounted) {
        document.body.setAttribute('data-ready', 'true');
    }
});
