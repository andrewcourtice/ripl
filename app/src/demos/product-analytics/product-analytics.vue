<template>
    <div class="analytics-dashboard">
        <div class="analytics-dashboard__header">
            <div class="analytics-dashboard__header-text">
                <h1 class="analytics-dashboard__title">Product Analytics</h1>
                <p class="analytics-dashboard__subtitle">Mock data dashboard showcasing Ripl Charts</p>
            </div>
            <div class="analytics-dashboard__period-selector">
                <label
                    v-for="p in periods"
                    :key="p.value"
                    class="analytics-dashboard__period-option"
                >
                    <input type="radio" name="period" :value="p.value" v-model="store.period">
                    {{ p.label }}
                </label>
            </div>
        </div>

        <div class="analytics-dashboard__row analytics-dashboard__row--2-1">
            <active-users-chart />
            <error-rate-gauge />
        </div>

        <div class="analytics-dashboard__row analytics-dashboard__row--1-1">
            <feature-adoption-chart />
            <browser-share-chart />
        </div>

        <div class="analytics-dashboard__row analytics-dashboard__row--full">
            <retention-heatmap />
        </div>

        <div class="analytics-dashboard__row analytics-dashboard__row--full">
            <user-journey-sankey />
        </div>

        <div class="analytics-dashboard__row analytics-dashboard__row--1-1">
            <conversion-funnel />
            <page-load-scatter />
        </div>
    </div>
</template>

<script lang="ts" setup>
import { PERIODS } from './data/mock';
import { useAnalyticsStore } from './store/analytics';

import ActiveUsersChart from './components/active-users-chart.vue';
import BrowserShareChart from './components/browser-share-chart.vue';
import ConversionFunnel from './components/conversion-funnel.vue';
import ErrorRateGauge from './components/error-rate-gauge.vue';
import FeatureAdoptionChart from './components/feature-adoption-chart.vue';
import PageLoadScatter from './components/page-load-scatter.vue';
import RetentionHeatmap from './components/retention-heatmap.vue';
import UserJourneySankey from './components/user-journey-sankey.vue';

const periods = PERIODS;
const store = useAnalyticsStore();
</script>

<style lang="scss">
@use './styles/dashboard.scss';
</style>
