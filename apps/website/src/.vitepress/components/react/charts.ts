import {
    RiplBarChart,
} from '@ripl/react-charts';

import {
    createElement,
} from 'react';

import type {
    ReactElement,
} from 'react';

/** One month's revenue and costs. */
export interface ChartsDatum {
    /** The month the figures are for. */
    month: string;
    /** Revenue for the month. */
    revenue: number;
    /** Costs for the month. */
    costs: number;
}

/** Props accepted by {@link ChartsDemo}. */
export interface ChartsDemoProps {
    /** The months to plot. */
    data: ChartsDatum[];
    /** Whether the series stack rather than sitting side by side. */
    stacked: boolean;
    /** Called with the month of the bar that was clicked. */
    onSelect(month: string): void;
}

const SERIES = [
    {
        id: 'revenue',
        label: 'Revenue',
        value: 'revenue',
    },
    {
        id: 'costs',
        label: 'Costs',
        value: 'costs',
    },
];

// `narrowSymbol`, or a non-US reader gets `US$7.4k`: the default currency display is locale-derived.
const FORMAT = {
    style: 'currency',
    currency: 'USD',
    currencyDisplay: 'narrowSymbol',
    notation: 'compact',
    maximumFractionDigits: 1,
} as const;

const STYLE = {
    width: '100%',
    height: '100%',
};

/** The React charts demo: a bar chart driven entirely by props. */
export function ChartsDemo(props: ChartsDemoProps): ReactElement {
    return createElement(RiplBarChart, {
        style: STYLE,
        data: props.data,
        series: SERIES,
        keyBy: 'month',
        title: 'Monthly breakdown',
        legend: true,
        stacked: props.stacked,
        borderRadius: 4,
        format: FORMAT,
        onBarclick: (payload: { xValue: string }) => props.onSelect(payload.xValue),
    });
}
