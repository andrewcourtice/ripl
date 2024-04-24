import { 
    shallowRef,
} from 'vue';

import {
    pauseTracking,
    enableTracking
} from '@vue/reactivity';

import type {
    Chart
} from '@ripl/charts';

import type {
    Context 
} from '@ripl/core';

export function useRiplExample(onContextChanged?: (context: Context) => void) {
    const context = shallowRef<Context>();

    function contextChanged(ctx: Context) {
        context.value?.destroy()
        context.value = ctx;
        
        pauseTracking();
        onContextChanged?.(context.value);
        enableTracking();
    }

    return {
        context,
        contextChanged
    }
}

export function useRiplChart<TChart extends Chart<any>>(onContextChanged: (context: Context) => TChart) {
    const chart = shallowRef<TChart>();
    
    function contextChanged(context: Context) {
        chart.value = (chart.value?.destroy(), onContextChanged(context))
    }

    return {
        chart,
        contextChanged
    }
}