import {
    useEffect,
    useRef,
} from 'react';

import type {
    Context,
} from '@ripl/core';

import {
    useRiplContext,
} from '../hooks/use-ripl-context';

import type {
    RiplContextHandle,
    UseRiplContextOptions,
} from '../hooks/use-ripl-context';

/** The minimal surface of a Ripl chart the React Native wrappers drive. */
export interface RiplChartInstance<TOptions> {
    /** Merges partial options and re-renders (see `Chart.update`). */
    update(options: Partial<TOptions>): void;
    /** Destroys the chart, its scene, and its context subscriptions. */
    destroy(): void;
}

/**
 * A Ripl chart factory (e.g. `createBarChart`) accepting a rendering {@link Context} instance and the
 * chart's options.
 *
 * @typeParam TOptions - The chart's options type.
 * @typeParam TChart - The chart instance type.
 */
export type RiplChartFactory<TOptions, TChart extends RiplChartInstance<TOptions>> = (target: Context, options: TOptions) => TChart;

/**
 * Instantiates a Ripl chart against a React Native Skia context and keeps it in sync with `options`.
 * The chart builds its own scene and renderer from the context, so this uses {@link useRiplContext}
 * (not {@link useRiplScene}). The chart is created once per context and destroyed on unmount;
 * subsequent `options` changes are applied via the chart's `update`.
 *
 * @param factory - The chart factory (e.g. `createBarChart`).
 * @param options - The chart options; changes are merged via `update`.
 * @param contextOptions - Context and interaction options for the surface.
 * @returns The context handle to wire into a Skia surface.
 */
export function useRiplChart<TOptions, TChart extends RiplChartInstance<TOptions>>(
    factory: RiplChartFactory<TOptions, TChart>,
    options: TOptions,
    contextOptions?: UseRiplContextOptions
): RiplContextHandle {
    const handle = useRiplContext(contextOptions);
    const chartRef = useRef<TChart | undefined>(undefined);

    useEffect(() => {
        const chart = factory(handle.context, options);

        chartRef.current = chart;

        return () => {
            chart.destroy();
            chartRef.current = undefined;
        };
        // The chart is created once per context; option changes flow through the update effect below.
    }, [handle.context]);

    useEffect(() => {
        chartRef.current?.update(options);
    }, [options]);

    return handle;
}
