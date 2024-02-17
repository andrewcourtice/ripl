import DefaultTheme from 'vitepress/theme';

import 'flex-layout-attribute';
import './style.scss';

import Example from '../components/example.vue';

import type {
    Theme
} from 'vitepress';

export default {
    extends: DefaultTheme,
    enhanceApp({ app, router, siteData }) {
        app.component('ripl-example', Example);
    }
} satisfies Theme
