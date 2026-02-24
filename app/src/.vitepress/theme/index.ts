import DefaultTheme from 'vitepress/theme';

import 'flex-layout-attribute';
import './style.scss';
import '../../demos/trading-dashboard/styles/dashboard.scss';

import {
    createPinia,
} from 'pinia';

import Example from '../components/example.vue';
import TradingDashboard from '../../demos/trading-dashboard/trading-dashboard.vue';

import {
    enhanceAppWithTabs,
} from 'vitepress-plugin-tabs/client';

import type {
    Theme,
} from 'vitepress';

export default {
    extends: DefaultTheme,
    enhanceApp({ app }) {
        app.use(createPinia());
        app.component('ripl-example', Example);
        app.component('trading-dashboard', TradingDashboard);

        enhanceAppWithTabs(app);
    },
} satisfies Theme;
