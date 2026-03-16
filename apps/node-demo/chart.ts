import '@ripl/node';

import {
    createContext,
    createLine,
    createRect,
    createTerminalOutput,
    createText,
    scaleBand,
    scaleContinuous,
} from '@ripl/node';

const output = createTerminalOutput();
const context = createContext(output);

const w = context.width;
const h = context.height;

// Sample data
const data = [
    {
        label: 'Mon',
        value: 42,
    },
    {
        label: 'Tue',
        value: 78,
    },
    {
        label: 'Wed',
        value: 55,
    },
    {
        label: 'Thu',
        value: 91,
    },
    {
        label: 'Fri',
        value: 63,
    },
    {
        label: 'Sat',
        value: 35,
    },
    {
        label: 'Sun',
        value: 48,
    },
];

const padding = {
    top: 40,
    right: 20,
    bottom: 40,
    left: 60,
};

const chartWidth = w - padding.left - padding.right;
const chartHeight = h - padding.top - padding.bottom;
const maxValue = Math.max(...data.map(d => d.value));

const xScale = scaleBand(
    data.map(d => d.label),
    [0, chartWidth],
    { innerPadding: 0.2 }
);

const yScale = scaleContinuous(
    [0, maxValue],
    [chartHeight, 0]
);

const barColors = [
    '#3a86ff',
    '#8338ec',
    '#ff006e',
    '#fb5607',
    '#ffbe0b',
    '#06d6a0',
    '#118ab2',
];

context.batch(() => {
    // Title
    createText({
        fill: '#ffffff',
        x: 8,
        y: 0,
        content: 'Ripl Terminal Context — Bar Chart',
    }).render(context);

    // Y-axis
    createLine({
        stroke: '#666666',
        x1: padding.left,
        y1: padding.top,
        x2: padding.left,
        y2: padding.top + chartHeight,
    }).render(context);

    // X-axis
    createLine({
        stroke: '#666666',
        x1: padding.left,
        y1: padding.top + chartHeight,
        x2: padding.left + chartWidth,
        y2: padding.top + chartHeight,
    }).render(context);

    // Y-axis tick labels
    const tickCount = 5;

    for (let i = 0; i <= tickCount; i++) {
        const value = Math.round((maxValue / tickCount) * i);
        const yPos = padding.top + yScale(value);

        // Grid line
        createLine({
            stroke: '#333333',
            x1: padding.left + 1,
            y1: yPos,
            x2: padding.left + chartWidth,
            y2: yPos,
        }).render(context);

        // Label
        createText({
            fill: '#999999',
            x: 0,
            y: yPos - 8,
            content: String(value).padStart(4),
        }).render(context);
    }

    // Bars
    data.forEach((item, index) => {
        const barX = padding.left + (xScale(item.label) ?? 0);
        const barWidth = xScale.bandwidth;
        const barHeight = chartHeight - yScale(item.value);
        const barY = padding.top + yScale(item.value);
        const color = barColors[index % barColors.length];

        createRect({
            fill: color,
            x: barX,
            y: barY,
            width: barWidth,
            height: barHeight,
        }).render(context);

        // X-axis label
        createText({
            fill: '#999999',
            x: barX,
            y: padding.top + chartHeight + 8,
            content: item.label,
        }).render(context);
    });
});

// Move cursor below output
process.stdout.write(`\x1b[${output.rows + 1};1H\n`);
