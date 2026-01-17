import DefaultTheme from 'vitepress/theme';

import 'flex-layout-attribute';
import './style.scss';

import Example from '../components/example.vue';

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

        enhanceAppWithTabs(app);
    },
} satisfies Theme;
