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
    BarChart,
} from '@ripl/charts';

import type {
    Context,
} from '@ripl/web';

import {
    RiplContext,
    useRiplContext,
} from '@ripl/react';

import {
    RiplBarChart,
    useRiplChart,
} from '@ripl/react-charts';

import {
    render,
} from '@testing-library/react';

import {
    createElement,
    createRef,
} from 'react';

const DATA = [
    {
        month: 'Jan',
        revenue: 10,
    },
    {
        month: 'Feb',
        revenue: 20,
    },
];

const SERIES = [
    {
        id: 'revenue',
        label: 'Revenue',
        value: 'revenue',
    },
];

/** The props every bar chart in these tests binds. */
function barProps(extra: Record<string, unknown> = {}) {
    return {
        data: DATA,
        keyBy: 'month',
        series: SERIES,
        animation: false,
        ...extra,
    };
}

describe('@ripl/react-charts', () => {

    beforeEach(() => {
        mockCanvasContext();
        polyfillPath2D();
    });

    afterEach(() => vi.restoreAllMocks());

    describe('Standalone', () => {

        test('Should build a chart and render its own host element', () => {
            const chart = createRef<BarChart>();

            const view = render(createElement(RiplBarChart, {
                ref: chart,
                ...barProps(),
            }));

            expect(chart.current).toBeInstanceOf(BarChart);
            expect(view.container.querySelector('canvas')).not.toBeNull();

            view.unmount();
        });

        test('Should resolve the chart from a hook in a descendant', () => {
            const captured: { chart?: unknown } = {};

            const Probe = () => {
                captured.chart = useRiplChart();
                return null;
            };

            const view = render(createElement(RiplBarChart, barProps(), createElement(Probe)));

            expect(captured.chart).toBeInstanceOf(BarChart);

            view.unmount();
        });

    });

    describe('Inside a context', () => {

        test('Should bind to an enclosing context rather than creating one', () => {
            const captured: { context?: Context } = {};
            const chart = createRef<BarChart>();

            const Probe = () => {
                captured.context = useRiplContext();
                return null;
            };

            const view = render(createElement(RiplContext, null,
                createElement(Probe),
                createElement(RiplBarChart, {
                    ref: chart,
                    ...barProps(),
                })));

            expect(chart.current?.context).toBe(captured.context);

            view.unmount();
        });

        test('Should leave an enclosing context alive when it unmounts', () => {
            const captured: { context?: Context } = {};

            const Probe = () => {
                captured.context = useRiplContext();
                return null;
            };

            const build = (visible: boolean) => createElement(RiplContext, null,
                createElement(Probe),
                visible ? createElement(RiplBarChart, barProps()) : null);

            const view = render(build(true));
            const destroyed = vi.fn();

            captured.context?.once('destroyed', destroyed);

            view.rerender(build(false));

            expect(destroyed).not.toHaveBeenCalled();

            view.unmount();
        });

        test('Should destroy the context it made itself', () => {
            const chart = createRef<BarChart>();
            const destroyed = vi.fn();

            const view = render(createElement(RiplBarChart, {
                ref: chart,
                ...barProps(),
            }));

            chart.current?.context.once('destroyed', destroyed);

            view.unmount();

            expect(destroyed).toHaveBeenCalled();
        });

    });

    describe('Options', () => {

        test('Should push a changed prop through update rather than rebuilding the chart', () => {
            const chart = createRef<BarChart>();

            const build = (data: typeof DATA) => createElement(RiplBarChart, {
                ref: chart,
                ...barProps({
                    data,
                }),
            });

            const view = render(build(DATA));
            const first = chart.current;
            const update = vi.spyOn(BarChart.prototype, 'update');

            view.rerender(build([
                ...DATA,
                {
                    month: 'Mar',
                    revenue: 30,
                },
            ]));

            expect(update).toHaveBeenCalledTimes(1);
            expect(chart.current).toBe(first);

            view.unmount();
        });

        test('Should rename keyBy onto the chart key option', () => {
            const create = vi.spyOn(BarChart.prototype, 'update');
            const chart = createRef<BarChart>();

            const view = render(createElement(RiplBarChart, {
                ref: chart,
                ...barProps(),
            }));

            // The option the chart reads is `key`; React consumes a `key` prop as the element key,
            // so it arrives as `keyBy` and is renamed on the way in.
            expect((chart.current as unknown as Record<string, unknown>).options).toMatchObject({
                key: 'month',
            });

            create.mockRestore();
            view.unmount();
        });

        test('Should leave an unbound option at the chart default', () => {
            const chart = createRef<BarChart>();

            const view = render(createElement(RiplBarChart, {
                ref: chart,
                ...barProps(),
            }));

            expect((chart.current as unknown as { options: Record<string, unknown> }).options)
                .not.toHaveProperty('borderRadius');

            view.unmount();
        });

    });

    describe('Events', () => {

        test('Should subscribe only to events a listener is bound to', () => {
            const chart = createRef<BarChart>();

            const view = render(createElement(RiplBarChart, {
                ref: chart,
                ...barProps({
                    onBarclick: vi.fn(),
                }),
            }));

            expect(chart.current?.has('barclick')).toBe(true);
            expect(chart.current?.has('barenter')).toBe(false);

            view.unmount();
        });

        test('Should forward an event payload to its listener prop', () => {
            const onBarclick = vi.fn();
            const chart = createRef<BarChart>();

            const view = render(createElement(RiplBarChart, {
                ref: chart,
                ...barProps({
                    onBarclick,
                }),
            }));

            chart.current?.emit('barclick', {
                x: 1,
                y: 2,
            } as never);

            expect(onBarclick).toHaveBeenCalledTimes(1);

            view.unmount();
        });

    });

});
