import { 
    shallowRef 
} from 'vue';

import type {
    Chart
} from '@ripl/charts';

import type {
    Context 
} from '@ripl/core';

export default function useRiplChart<TChart extends Chart<any>>(onContextChanged: (context: Context) => TChart) {
    const chart = shallowRef<TChart>();
    
    function contextChanged(context: Context) {
        chart.value = (chart.value?.destroy(), onContextChanged(context))
    }

    return {
        chart,
        contextChanged
    }
}