import DefaultTheme from 'vitepress/theme';

import 'flex-layout-attribute';
import './style.scss';

import Example from '../components/example.vue';
import Example3D from '../components/example-3d.vue';

import {
    enhanceAppWithTabs,
} from 'vitepress-plugin-tabs/client';

import type {
    Theme,
} from 'vitepress';

export default {
    extends: DefaultTheme,
    enhanceApp({ app }) {
        app.component('ripl-example', Example);
        app.component('ripl-3d-example', Example3D);

        enhanceAppWithTabs(app);
    },
} satisfies Theme;
