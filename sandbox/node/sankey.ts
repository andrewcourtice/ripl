import '@ripl/node';

import {
    createContext,
    createTerminalOutput,
} from '@ripl/node';

import {
    createSankeyChart,
} from '@ripl/charts';

// A Sankey carries its data entirely in stroke width, so it is the sharpest test of a backend's
// stroke geometry: without it every link renders as the same hairline curve.
const output = createTerminalOutput();
const context = createContext(output);

createSankeyChart(context, {
    animation: false,
    nodes: [
        {
            id: 'coal',
            label: 'Coal',
        },
        {
            id: 'gas',
            label: 'Gas',
        },
        {
            id: 'solar',
            label: 'Solar',
        },
        {
            id: 'grid',
            label: 'Grid',
        },
        {
            id: 'homes',
            label: 'Homes',
        },
        {
            id: 'industry',
            label: 'Industry',
        },
    ],
    links: [
        {
            source: 'coal',
            target: 'grid',
            value: 60,
        },
        {
            source: 'gas',
            target: 'grid',
            value: 25,
        },
        {
            source: 'solar',
            target: 'grid',
            value: 5,
        },
        {
            source: 'grid',
            target: 'homes',
            value: 30,
        },
        {
            source: 'grid',
            target: 'industry',
            value: 60,
        },
    ],
});

process.stdout.write('\n');
