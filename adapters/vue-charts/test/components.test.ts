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
    Chart,
} from '@ripl/charts';

import type {
    Context,
} from '@ripl/web';

import {
    createRipl,
    RiplContext,
    useRiplContext,
} from '@ripl/vue';

import {
    createRipl3D,
} from '@ripl/vue-3d';

import {
    createRiplCharts,
    RiplBarChart,
    useRiplChart,
} from '@ripl/vue-charts';

import {
    mount,
} from '@vue/test-utils';

import {
    createApp,
    defineComponent,
    h,
    nextTick,
    ref,
    shallowRef,
} from 'vue';

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

describe('@ripl/vue-charts', () => {

    beforeEach(() => {
        mockCanvasContext();
        polyfillPath2D();
    });

    afterEach(() => vi.restoreAllMocks());

    describe('Standalone', () => {

        test('Should build a chart and render its own host element', () => {
            const chart = shallowRef<BarChart>();

            const Harness = defineComponent({
                setup() {
                    return () => h(RiplBarChart, {
                        ref: chart,
                        ...barProps(),
                    });
                },
            });

            const wrapper = mount(Harness);

            expect(chart.value).toBeInstanceOf(BarChart);
            expect(wrapper.find('canvas').exists()).toBe(true);

            wrapper.unmount();
        });

        test('Should resolve the chart from a composition in a descendant setup', () => {
            let seen: unknown;

            const Probe = defineComponent({
                setup() {
                    seen = useRiplChart().value;
                    return () => null;
                },
            });

            const Harness = defineComponent({
                setup() {
                    return () => h(RiplBarChart, barProps(), {
                        default: () => h(Probe),
                    });
                },
            });

            const wrapper = mount(Harness);

            expect(seen).toBeInstanceOf(BarChart);

            wrapper.unmount();
        });

    });

    describe('Inside a context', () => {

        test('Should bind to an enclosing context rather than creating one', () => {
            let provided: Context | undefined;

            const chart = shallowRef<BarChart>();

            const Probe = defineComponent({
                setup() {
                    provided = useRiplContext().value;
                    return () => null;
                },
            });

            const Harness = defineComponent({
                setup() {
                    return () => h(RiplContext, null, {
                        default: () => [
                            h(Probe),
                            h(RiplBarChart, {
                                ref: chart,
                                ...barProps(),
                            }),
                        ],
                    });
                },
            });

            const wrapper = mount(Harness);

            expect(chart.value?.context).toBe(provided);

            wrapper.unmount();
        });

        // `chart.destroy()` destroys the scene *and* its context, so a chart handed a context by a
        // parent must tear down only what it made itself.
        test('Should leave an enclosing context alive when it unmounts', async () => {
            const context = shallowRef<Context>();
            const visible = ref(true);

            const Harness = defineComponent({
                setup() {
                    return () => h(RiplContext, {
                        ref: context,
                    }, {
                        default: () => visible.value
                            ? h(RiplBarChart, barProps())
                            : null,
                    });
                },
            });

            const wrapper = mount(Harness);
            const destroy = vi.spyOn(context.value!, 'destroy');

            visible.value = false;
            await nextTick();

            expect(destroy).not.toHaveBeenCalled();

            wrapper.unmount();
        });

        test('Should destroy the context it made itself', () => {
            const chart = shallowRef<BarChart>();

            const Harness = defineComponent({
                setup() {
                    return () => h(RiplBarChart, {
                        ref: chart,
                        ...barProps(),
                    });
                },
            });

            const wrapper = mount(Harness);
            const destroy = vi.spyOn(chart.value!.context, 'destroy');

            wrapper.unmount();

            expect(destroy).toHaveBeenCalled();
        });

    });

    describe('Options', () => {

        test('Should push a changed prop through update rather than rebuilding the chart', async () => {
            const update = vi.spyOn(Chart.prototype, 'update');
            const data = ref(DATA);
            const chart = shallowRef<BarChart>();

            const Harness = defineComponent({
                setup() {
                    return () => h(RiplBarChart, {
                        ref: chart,
                        ...barProps(),
                        data: data.value,
                    });
                },
            });

            const wrapper = mount(Harness);
            const before = chart.value;

            data.value = [
                ...DATA,
                {
                    month: 'Mar',
                    revenue: 30,
                },
            ];

            await nextTick();

            expect(update).toHaveBeenCalledTimes(1);
            expect(update.mock.calls[0][0]).toHaveProperty('data');
            expect(chart.value).toBe(before);

            wrapper.unmount();
        });

        // Vue consumes a `key` attribute as the vnode key, so the chart's `key` option is bound as
        // `keyBy` and renamed on the way in; bound as `key` it would never arrive.
        test('Should rename keyBy onto the chart key option', () => {
            const chart = shallowRef<BarChart>();

            const Harness = defineComponent({
                setup() {
                    return () => h(RiplBarChart, {
                        ref: chart,
                        ...barProps(),
                    });
                },
            });

            const wrapper = mount(Harness);
            const options = (chart.value as unknown as { options: Record<string, unknown> }).options;

            expect(options.key).toBe('month');
            expect(options).not.toHaveProperty('keyBy');

            wrapper.unmount();
        });

        test('Should leave an unbound option at the chart default', () => {
            const chart = shallowRef<BarChart>();

            const Harness = defineComponent({
                setup() {
                    return () => h(RiplBarChart, {
                        ref: chart,
                        ...barProps(),
                    });
                },
            });

            const wrapper = mount(Harness);

            expect((chart.value as unknown as { options: Record<string, unknown> }).options)
                .not.toHaveProperty('borderRadius');

            wrapper.unmount();
        });

    });

    describe('Events', () => {

        // The forwarded names come from the chart's own `$events`, so a chart that gains an event
        // gains a listener prop without the adapter changing.
        test('Should subscribe only to events a listener is bound to', () => {
            const chart = shallowRef<BarChart>();

            const Harness = defineComponent({
                setup() {
                    return () => h(RiplBarChart, {
                        ref: chart,
                        ...barProps(),
                        onBarclick: () => undefined,
                    });
                },
            });

            const wrapper = mount(Harness);

            expect(chart.value?.has('barclick')).toBe(true);
            expect(chart.value?.has('barenter')).toBe(false);

            wrapper.unmount();
        });

        test('Should forward an event payload to its Vue listener', () => {
            const onBarclick = vi.fn();
            const chart = shallowRef<BarChart>();

            const Harness = defineComponent({
                setup() {
                    return () => h(RiplBarChart, {
                        ref: chart,
                        ...barProps(),
                        onBarclick,
                    });
                },
            });

            const wrapper = mount(Harness);

            chart.value?.emit('barclick', {
                x: 1,
                y: 2,
                xValue: 'Jan',
                yValue: 10,
                seriesId: 'revenue',
            });

            expect(onBarclick).toHaveBeenCalled();
            expect(onBarclick.mock.calls[0][0]).toMatchObject({
                seriesId: 'revenue',
            });

            wrapper.unmount();
        });

    });

    describe('Plugin composition', () => {

        // Vue de-duplicates plugins by object identity, and each factory returns a fresh object, so
        // without a name-level guard every adapter plugin would re-register the core components.
        test('Should register every component once across all three plugins', () => {
            const warn = vi.spyOn(console, 'warn').mockImplementation(() => undefined);
            const app = createApp(defineComponent({
                render: () => null,
            }));

            app.use(createRipl());
            app.use(createRipl3D());
            app.use(createRiplCharts());

            expect(warn).not.toHaveBeenCalled();
            expect(app.component('RiplCircle')).toBeDefined();
            expect(app.component('RiplCube')).toBeDefined();
            expect(app.component('RiplBarChart')).toBeDefined();
        });

        test('Should register the core components through the charts plugin alone', () => {
            const app = createApp(defineComponent({
                render: () => null,
            }));

            app.use(createRiplCharts());

            expect(app.component('RiplContext')).toBeDefined();
        });

    });

});
