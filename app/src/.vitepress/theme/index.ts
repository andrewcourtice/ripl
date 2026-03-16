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
import RippleBackground from '../components/ripple-background.vue';
import RiplPlayground from '../components/playground/ripl-playground.vue';
import PlaygroundLayout from '../components/playground/playground-layout.vue';
import RiplButton from '../components/ripl-button.vue';
import RiplButtonGroup from '../components/ripl-button-group.vue';
import RiplControlGroup from '../components/ripl-control-group.vue';
import RiplSwitch from '../components/ripl-switch.vue';
import RiplSelect from '../components/ripl-select.vue';
import RiplInputRange from '../components/ripl-input-range.vue';
import RiplDropdown from '../components/ripl-dropdown.vue';
import RiplDropdownItem from '../components/ripl-dropdown-item.vue';
import RiplDropdownLabel from '../components/ripl-dropdown-label.vue';
import ExampleTerminal from '../components/example-terminal.vue';
import Example3DWebGPU from '../components/example-3d-webgpu.vue';
import ExampleTerminalInteractive from '../components/example-terminal-interactive.vue';

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
        app.component('ripl-playground', RiplPlayground);
        app.component('playground', PlaygroundLayout);
        app.component('trading-dashboard', TradingDashboard);
        app.component('RiplButton', RiplButton);
        app.component('RiplButtonGroup', RiplButtonGroup);
        app.component('RiplControlGroup', RiplControlGroup);
        app.component('RiplSwitch', RiplSwitch);
        app.component('RiplSelect', RiplSelect);
        app.component('RiplInputRange', RiplInputRange);
        app.component('RiplDropdown', RiplDropdown);
        app.component('RiplDropdownItem', RiplDropdownItem);
        app.component('RiplDropdownLabel', RiplDropdownLabel);
        app.component('example-terminal', ExampleTerminal);
        app.component('example-3d-webgpu', Example3DWebGPU);
        app.component('example-terminal-interactive', ExampleTerminalInteractive);

        enhanceAppWithTabs(app);
    },
} satisfies Theme;
