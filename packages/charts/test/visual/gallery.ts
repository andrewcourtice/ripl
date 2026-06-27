/**
 * Deterministic chart gallery used for Playwright visual-regression snapshots.
 *
 * Every chart is rendered with `animation: false` and fixed data/size so screenshots are stable.
 * Each chart exercises a title, a legend and (where applicable) axes so the regressions that this
 * audit fixed — missing titles, vertical y-axis titles, legend clipping — are covered.
 */

import {
    createAreaChart,
    createBarChart,
    createLineChart,
    createPieChart,
    createScatterChart,
} from '@ripl/charts';

interface Sample {
    month: string;
    revenue: number;
    cost: number;
}

const DATA: Sample[] = [
    { month: 'Jan', revenue: 120, cost: 80 },
    { month: 'Feb', revenue: 150, cost: 90 },
    { month: 'Mar', revenue: 170, cost: 110 },
    { month: 'Apr', revenue: 140, cost: 95 },
    { month: 'May', revenue: 200, cost: 120 },
    { month: 'Jun', revenue: 230, cost: 130 },
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
    { id: 'revenue', label: 'Revenue', value: 'revenue' as const },
    { id: 'cost', label: 'Cost', value: 'cost' as const },
];

createBarChart(mount('bar'), {
    animation: false,
    title: 'Bar — Revenue vs Cost',
    legend: true,
    data: DATA,
    key: 'month',
    series: baseSeries,
    axis: { x: true, y: { title: 'Amount ($)', position: 'left' } },
});

createLineChart(mount('line'), {
    animation: false,
    title: 'Line — Trend',
    legend: true,
    data: DATA,
    key: 'month',
    series: baseSeries.map(s => ({ ...s, markers: true })),
    axis: { x: true, y: { title: 'Amount ($)' } },
});

createAreaChart(mount('area'), {
    animation: false,
    title: 'Area — Stacked',
    legend: true,
    stacked: true,
    data: DATA,
    key: 'month',
    series: baseSeries,
    axis: { x: true, y: { title: 'Amount ($)' } },
});

createScatterChart(mount('scatter'), {
    animation: false,
    title: 'Scatter — Cost vs Revenue',
    legend: true,
    data: DATA,
    key: 'month',
    series: [{ id: 'points', label: 'Months', xBy: 'cost', yBy: 'revenue', sizeBy: 8 }],
    axis: { x: { title: 'Cost' }, y: { title: 'Revenue' } },
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

// Signal readiness for the Playwright test to capture screenshots.
requestAnimationFrame(() => {
    document.body.setAttribute('data-ready', 'true');
});
