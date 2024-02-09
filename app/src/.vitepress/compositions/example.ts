import { Chart } from '@ripl/charts';
import { Context } from '@ripl/core';
import { shallowRef } from 'vue';

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