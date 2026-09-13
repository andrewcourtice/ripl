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
    createBarChart,
} from '@ripl/charts';

import type {
    BarChartOptions,
} from '@ripl/charts';

import {
    CHART_OPTION_KEYS,
    chartFactory,
    createChartController,
    resolveChartDefinition,
} from '@ripl/adapters-charts';

import type {
    RiplWritable,
} from '@ripl/adapters';

import {
    createContext,
} from '@ripl/web';

const DEFINITION = resolveChartDefinition({
    name: 'RiplBarChart',
    optionKeys: CHART_OPTION_KEYS.bar,
    events: BarChart.prototype.$events as string[],
    create: chartFactory<BarChartOptions<unknown>>(createBarChart),
});

const DATA = [
    {
        month: 'Jan',
        revenue: 10,
    },
];

const SERIES = [
    {
        id: 'revenue',
        label: 'Revenue',
        value: 'revenue',
    },
];

/** The props every chart in these tests binds. */
function chartProps(extra: RiplWritable = {}): RiplWritable {
    return {
        data: DATA,
        keyBy: 'month',
        series: SERIES,
        animation: false,
        ...extra,
    };
}

describe('@ripl/adapters-charts', () => {

    beforeEach(() => {
        mockCanvasContext();
        polyfillPath2D();
    });

    afterEach(() => vi.restoreAllMocks());

    describe('Prop aliases', () => {

        // Both Vue and React consume a `key` prop as the element key, so it never reaches the
        // component and the option would silently arrive unset.
        test('Should bind the reserved key option as keyBy and rename it back', () => {
            expect(DEFINITION.propKeys).toContain('keyBy');
            expect(DEFINITION.propKeys).not.toContain('key');

            expect(DEFINITION.toOptions({
                keyBy: 'month',
            })).toEqual({
                key: 'month',
            });
        });

    });

    describe('First paint', () => {

        // A chart renders itself on construction, and a surface with no size collapses its scales
        // permanently, so the first paint is held until `resize` announces one.
        test('Should hold the first render until the surface has a size', () => {
            const host = document.createElement('div');

            document.body.append(host);

            const render = vi.spyOn(BarChart.prototype, 'render');

            const controller = createChartController({
                definition: DEFINITION,
                target: host,
                owned: true,
                props: chartProps(),
            });

            expect((controller.chart as unknown as RiplWritable).autoRender).toBe(false);
            expect(render).not.toHaveBeenCalled();

            controller.attach();
            controller.chart.context.emit('resize', null);

            expect(render).toHaveBeenCalled();

            controller.destroy();
            host.remove();
        });

        // A framework that commits its host element before the chart is built hands it a surface
        // that is already sized, so the resize announcing one has come and gone.
        test('Should render straight away when the surface already has a size', () => {
            const host = document.createElement('div');

            document.body.append(host);

            const render = vi.spyOn(BarChart.prototype, 'render');

            const controller = createChartController({
                definition: DEFINITION,
                target: host,
                owned: true,
                props: chartProps(),
            });

            controller.chart.context.width = 640;
            controller.chart.context.height = 360;

            controller.attach();

            expect(render).toHaveBeenCalled();

            controller.destroy();
            host.remove();
        });

        test('Should leave rendering off when the consumer asked for it', () => {
            const host = document.createElement('div');

            document.body.append(host);

            const render = vi.spyOn(BarChart.prototype, 'render');

            const controller = createChartController({
                definition: DEFINITION,
                target: host,
                owned: true,
                props: chartProps({
                    autoRender: false,
                }),
            });

            controller.attach();
            controller.chart.context.emit('resize', null);

            expect(render).not.toHaveBeenCalled();

            controller.destroy();
            host.remove();
        });

    });

    describe('Updates', () => {

        test('Should push only the changed options through update', () => {
            const host = document.createElement('div');

            document.body.append(host);

            const controller = createChartController({
                definition: DEFINITION,
                target: host,
                owned: true,
                props: chartProps(),
            });

            const update = vi.spyOn(BarChart.prototype, 'update');

            expect(controller.collect(chartProps())).toBeUndefined();

            const next = [
                ...DATA,
                {
                    month: 'Feb',
                    revenue: 20,
                },
            ];

            const changed = controller.collect(chartProps({
                data: next,
            }));

            expect(changed).toEqual({
                data: next,
            });

            controller.update(changed!);

            expect(update).toHaveBeenCalledWith({
                data: next,
            });

            controller.destroy();
            host.remove();
        });

    });

    describe('Teardown', () => {

        test('Should destroy the context it made itself', () => {
            const host = document.createElement('div');

            document.body.append(host);

            const controller = createChartController({
                definition: DEFINITION,
                target: host,
                owned: true,
                props: chartProps(),
            });

            const destroyed = vi.fn();

            controller.chart.context.once('destroyed', destroyed);
            controller.destroy();

            expect(destroyed).toHaveBeenCalled();

            host.remove();
        });

        // `Chart.destroy` takes the context with it, and a chart drawn into someone else's context
        // has no business doing that.
        test('Should leave a context it was handed alive', () => {
            const host = document.createElement('div');

            document.body.append(host);

            const context = createContext(host);

            const controller = createChartController({
                definition: DEFINITION,
                target: context,
                owned: false,
                props: chartProps(),
            });

            const destroyed = vi.fn();

            context.once('destroyed', destroyed);
            controller.destroy();

            expect(destroyed).not.toHaveBeenCalled();

            context.destroy();
            host.remove();
        });

    });

});
