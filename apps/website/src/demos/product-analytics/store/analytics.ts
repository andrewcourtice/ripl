import {
    defineStore,
} from 'pinia';

import {
    computed,
    ref,
} from 'vue';

import {
    generateBrowserShareData,
    generateDAUData,
    generateErrorRate,
    generateFeatureAdoptionData,
    generateFunnelData,
    generatePageLoadData,
    generateRetentionData,
    generateSankeyData,
} from '../data/mock';

import type {
    Period,
} from '../data/mock';

export const useAnalyticsStore = defineStore('product-analytics', () => {
    const period = ref<Period>('1m');

    const dauData = computed(() => generateDAUData(period.value));
    const featureAdoptionData = computed(() => generateFeatureAdoptionData(period.value));
    const browserShareData = computed(() => generateBrowserShareData(period.value));
    const retentionData = computed(() => generateRetentionData(period.value));
    const sankeyData = computed(() => generateSankeyData(period.value));
    const funnelData = computed(() => generateFunnelData(period.value));
    const errorRate = computed(() => generateErrorRate(period.value));
    const pageLoadData = computed(() => generatePageLoadData(period.value));

    return {
        period,
        dauData,
        featureAdoptionData,
        browserShareData,
        retentionData,
        sankeyData,
        funnelData,
        errorRate,
        pageLoadData,
    };
});
