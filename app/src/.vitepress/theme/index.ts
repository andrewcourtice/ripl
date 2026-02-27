import DefaultTheme from 'vitepress/theme';

import 'flex-layout-attribute';
import './style.scss';
import '../../demos/trading-dashboard/styles/dashboard.scss';
import '../../demos/jet-engine/styles/jet-engine.scss';
import '../../demos/mermaid-diagram/styles/mermaid-diagram.scss';

import {
    createPinia,
} from 'pinia';

import {
    h,
} from 'vue';

import {
    useData,
} from 'vitepress';

import Example from '../components/example.vue';
import TradingDashboard from '../../demos/trading-dashboard/trading-dashboard.vue';
import Example3D from '../components/example-3d.vue';
import RippleBackground from '../components/RippleBackground.vue';

import {
    enhanceAppWithTabs,
} from 'vitepress-plugin-tabs/client';

import type {
    Theme,
} from 'vitepress';

export default {
    extends: DefaultTheme,
    Layout() {
        const { frontmatter } = useData();
        const isHome = frontmatter.value.layout === 'home';

        return h(DefaultTheme.Layout, null, {
            'layout-top': () => isHome ? h(RippleBackground) : null,
        });
    },
    enhanceApp({ app }) {
        app.use(createPinia());
        app.component('ripl-example', Example);
        app.component('ripl-3d-example', Example3D);
        app.component('trading-dashboard', TradingDashboard);

        enhanceAppWithTabs(app);
    },
} satisfies Theme;
