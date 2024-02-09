import './style.css';
import 'flex-layout-attribute';

import DefaultTheme from 'vitepress/theme';
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
