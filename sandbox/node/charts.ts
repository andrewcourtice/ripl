import '@ripl/node';

import readline from 'node:readline';

import {
    createContext,
    createTerminalOutput,
} from '@ripl/node';

import {
    createBarChart,
    createLineChart,
    createPieChart,
    createStockChart,
} from '@ripl/charts';

function runBarChart() {
    const output = createTerminalOutput();
    const context = createContext(output);

    createBarChart(context, {
        data: [
            {
                day: 'Mon',
                sales: 42,
                returns: 8,
            },
            {
                day: 'Tue',
                sales: 78,
                returns: 12,
            },
            {
                day: 'Wed',
                sales: 55,
                returns: 5,
            },
            {
                day: 'Thu',
                sales: 91,
                returns: 15,
            },
            {
                day: 'Fri',
                sales: 63,
                returns: 9,
            },
            {
                day: 'Sat',
                sales: 35,
                returns: 4,
            },
            {
                day: 'Sun',
                sales: 48,
                returns: 7,
            },
        ],
        key: 'day',
        series: [
            {
                id: 'sales',
                label: 'Sales',
                value: 'sales',
            },
            {
                id: 'returns',
                label: 'Returns',
                value: 'returns',
            },
        ],
        tooltip: false,
        grid: true,
        animation: { duration: 2000 },
        padding: {
            top: 10,
            right: 10,
            bottom: 10,
            left: 10,
        },
    });
}

function runPieChart() {
    const output = createTerminalOutput();
    const context = createContext(output);

    createPieChart(context, {
        data: [
            {
                name: 'Chrome',
                share: 65,
            },
            {
                name: 'Safari',
                share: 18,
            },
            {
                name: 'Firefox',
                share: 7,
            },
            {
                name: 'Edge',
                share: 5,
            },
            {
                name: 'Other',
                share: 5,
            },
        ],
        key: 'name',
        value: 'share',
        label: 'name',
        innerRadius: 0.35,
        animation: { duration: 2000 },
        padding: {
            top: 10,
            right: 10,
            bottom: 10,
            left: 10,
        },
    });
}

function runStockChart() {
    const output = createTerminalOutput();
    const context = createContext(output);

    createStockChart(context, {
        data: [
            {
                date: 'Mar 3',
                open: 171,
                high: 175,
                low: 169,
                close: 174,
                vol: 48000,
            },
            {
                date: 'Mar 4',
                open: 174,
                high: 178,
                low: 172,
                close: 176,
                vol: 52000,
            },
            {
                date: 'Mar 5',
                open: 176,
                high: 180,
                low: 174,
                close: 178,
                vol: 61000,
            },
            {
                date: 'Mar 6',
                open: 178,
                high: 179,
                low: 170,
                close: 172,
                vol: 73000,
            },
            {
                date: 'Mar 7',
                open: 172,
                high: 174,
                low: 168,
                close: 170,
                vol: 65000,
            },
            {
                date: 'Mar 10',
                open: 170,
                high: 176,
                low: 169,
                close: 175,
                vol: 58000,
            },
            {
                date: 'Mar 11',
                open: 175,
                high: 182,
                low: 174,
                close: 181,
                vol: 71000,
            },
            {
                date: 'Mar 12',
                open: 181,
                high: 185,
                low: 179,
                close: 183,
                vol: 67000,
            },
            {
                date: 'Mar 13',
                open: 183,
                high: 184,
                low: 176,
                close: 177,
                vol: 59000,
            },
            {
                date: 'Mar 14',
                open: 177,
                high: 180,
                low: 175,
                close: 179,
                vol: 44000,
            },
        ],
        key: 'date',
        open: 'open',
        high: 'high',
        low: 'low',
        close: 'close',
        volume: 'vol',
        showVolume: true,
        grid: true,
        tooltip: false,
        animation: { duration: 2000 },
        padding: {
            top: 10,
            right: 10,
            bottom: 10,
            left: 10,
        },
    });
}

function runLineChart() {
    const output = createTerminalOutput();
    const context = createContext(output);

    createLineChart(context, {
        data: [
            {
                day: 'Mon',
                high: 24,
                low: 14,
            },
            {
                day: 'Tue',
                high: 27,
                low: 16,
            },
            {
                day: 'Wed',
                high: 22,
                low: 12,
            },
            {
                day: 'Thu',
                high: 29,
                low: 18,
            },
            {
                day: 'Fri',
                high: 31,
                low: 20,
            },
            {
                day: 'Sat',
                high: 26,
                low: 15,
            },
            {
                day: 'Sun',
                high: 23,
                low: 13,
            },
        ],
        key: 'day',
        series: [
            {
                id: 'high',
                label: 'High',
                value: 'high',
                markers: true,
            },
            {
                id: 'low',
                label: 'Low',
                value: 'low',
                markers: true,
            },
        ],
        grid: true,
        tooltip: false,
        animation: { duration: 2000 },
        padding: {
            top: 10,
            right: 10,
            bottom: 10,
            left: 10,
        },
    });
}

const charts: Record<string, { label: string;
    run: () => void; }> = {
    '1': {
        label: 'Bar Chart',
        run: runBarChart,
    },
    '2': {
        label: 'Pie Chart',
        run: runPieChart,
    },
    '3': {
        label: 'Stock Chart',
        run: runStockChart,
    },
    '4': {
        label: 'Line Chart',
        run: runLineChart,
    },
};

const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout,
});

process.stdout.write('\nRipl Terminal Charts\n\n');

for (const [key, { label }] of Object.entries(charts)) {
    process.stdout.write(`  ${key}. ${label}\n`);
}

process.stdout.write('\n');

rl.question('Select a chart: ', (answer) => {
    rl.close();

    const selected = charts[answer.trim()];

    if (!selected) {
        process.stderr.write('Invalid selection\n');
        process.exit(1);
    }

    // Enter alternate screen buffer and hide cursor
    //process.stdout.write('\x1b[?1049h\x1b[?25l');

    selected.run();

    // Wait for the animated entry to complete, then exit
    // setTimeout(() => {
    //     process.stdout.write('\x1b[?25h\x1b[?1049l');
    //     process.exit(0);
    // }, 4000);
});
