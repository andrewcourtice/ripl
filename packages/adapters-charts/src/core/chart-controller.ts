import type {
    RiplAnyChart,
    RiplResolvedChartDefinition,
} from './chart-definition';

import {
    collectChangedProps,
    readBoundProps,
} from '@ripl/adapters';

import type {
    RiplWritable,
} from '@ripl/adapters';

import type {
    Disposable,
} from '@ripl/utilities';

import type {
    Context,
} from '@ripl/core';

/** How a component builds its chart and hands the lifecycle to the controller. */
export interface RiplChartControllerOptions {
    /** The chart definition, with its prop names already resolved. */
    definition: RiplResolvedChartDefinition;
    /** The context or host element the chart draws onto. */
    target: Context | HTMLElement;
    /**
     * Whether the chart owns its context. A chart bound to a context someone else created must not
     * destroy it on the way out.
     */
    owned: boolean;
    /** The props bound on the component when it was created. */
    props: RiplWritable;
}

/** Owns one chart across its lifecycle: construction, its first paint, updates and teardown. */
export interface RiplChartController {
    /** The chart this controller owns. */
    readonly chart: RiplAnyChart;
    /** Hands rendering back to the chart once its surface has a size. */
    attach(): void;
    /**
     * Folds the props that differ from those last written into a changed batch, or returns
     * `undefined` when none changed, so a tick that changed nothing costs no allocation.
     *
     * @param props - The component's current props.
     * @returns The changed props, or `undefined` when none changed.
     */
    collect(props: RiplWritable): RiplWritable | undefined;
    /** Pushes a changed batch through the chart's own `update`, rather than rebuilding it. */
    update(changed: RiplWritable): void;
    /** Tears the chart down, destroying only what it owns. */
    destroy(): void;
}

/**
 * Builds a chart from a component's props and keeps it in sync with them.
 *
 * Props are the chart's options: each one maps to a top-level option, an unbound prop is never
 * written so the chart's own defaults survive, and a changed prop is pushed through `update()`
 * rather than rebuilding the chart.
 *
 * @param options - The chart definition, its target, and the props to build from.
 * @returns The controller, for a component to drive from its own lifecycle hooks.
 * @example
 * const controller = createChartController({
 *     definition: resolveChartDefinition(barChartDefinition),
 *     target: host,
 *     owned: true,
 *     props,
 * });
 */
export function createChartController(options: RiplChartControllerOptions): RiplChartController {
    const {
        definition,
        target,
        owned,
        props,
    } = options;

    const applied = readBoundProps(props, definition.propKeys);

    // A chart renders itself on construction, but its surface may still be detached at that point
    // and therefore 0x0 — scales collapse and the first frame never recovers. Hold the first paint
    // until the surface has a size, which is what `resize` announces.
    const chart = definition.create(target, {
        ...definition.toOptions(applied),
        autoRender: false,
    });

    let repaint: Disposable | undefined;

    /** Hands rendering back to the chart now that it has a surface to render onto. */
    const release = () => {
        (chart as unknown as RiplWritable).autoRender = true;
        void chart.render();
    };

    const attach = () => {
        if (applied.autoRender === false) {
            return;
        }

        // The surface may already have its size, in which case the resize that would announce one
        // has come and gone — a framework that commits its host element before the chart is built
        // would otherwise wait for an event that never fires again.
        if (chart.context.width > 0 && chart.context.height > 0) {
            release();
            return;
        }

        repaint = chart.context.once('resize', release);
    };

    const collect = (next: RiplWritable) => collectChangedProps(next, definition.propKeys, applied);

    const update = (changed: RiplWritable) => chart.update(definition.toOptions(changed));

    const destroy = () => {
        repaint?.dispose();
        repaint = undefined;

        if (owned) {
            chart.destroy();
            return;
        }

        // `destroy` would take the context with it, and that one is not this chart's.
        chart.renderer.destroy();
        chart.scene.destroy(false);
    };

    return {
        chart,
        attach,
        collect,
        update,
        destroy,
    };
}
