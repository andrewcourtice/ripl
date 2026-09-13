import type {
    RiplAnyChart,
} from '@ripl/adapters-charts';

import {
    createContext,
} from 'react';

import type {
    Context as ReactContext,
} from 'react';

/** The registry holding every Ripl React context, keyed by name. */
type RiplContextRegistry = Record<string, unknown>;

// Registry-keyed for the same reason `@ripl/react` uses them: the standalone IIFE builds inline
// their workspace dependencies, so a page loading two adapters holds two sets of unequal contexts.
const REGISTRY = ((globalThis as Record<PropertyKey, unknown>)[Symbol.for('ripl.react.contexts')] ??= {}) as RiplContextRegistry;

/** Context carrying the chart a subtree belongs to. */
export const RIPL_CHART: ReactContext<RiplAnyChart | undefined> = (REGISTRY['ripl.reactcharts.chart'] ??= createContext<RiplAnyChart | undefined>(undefined)) as ReactContext<RiplAnyChart | undefined>;
