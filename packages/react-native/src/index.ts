import {
    bindReactNativeFactory,
} from './factory';

export * from '@ripl/core';
export * from '@ripl/charts';

export * from './context';
export * from './path';
export * from './font';
export * from './interaction';
export * from './gestures';
export * from './types';
export * from './hooks';
export * from './components';

export {
    createChartComponent,
    useRiplChart,
} from './charts';

export type {
    RiplChartFactory,
    RiplChartInstance,
    RiplChartProps,
} from './charts';

// The React Native chart components share names with `@ripl/charts`' chart classes, so they are
// re-exported explicitly (an explicit re-export wins over the `@ripl/charts` star export above),
// making `BarChart`/`PieChart`/etc. resolve to the React Native components.
export {
    AreaChart,
    BarChart,
    LineChart,
    PieChart,
    ScatterChart,
} from './charts';

// Register the React Native platform bindings on import (`sideEffects: true` keeps this from being
// tree-shaken). This runs after the `@ripl/charts` re-export above has evaluated — ES imports are
// hoisted and evaluated before the module body — so it overrides the canvas `createContext` that
// `@ripl/charts` self-registers, making the Skia context the platform default.
bindReactNativeFactory();
