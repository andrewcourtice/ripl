<template>
    <div class="panel-app">
        <PanelHeader />
        <template v-if="store.hasContexts.value">
            <SplitPane v-if="activeTab === 'elements'" class="panel-app__body">
                <template #left>
                    <ElementsPane />
                </template>
                <template #right>
                    <PropertiesPanel />
                </template>
            </SplitPane>
            <EventsPane v-else class="panel-app__body" />
        </template>
        <div v-else class="panel-app__empty">
            <svg class="panel-app__empty-logo" :viewBox="RIPL_LOGO_VIEWBOX" aria-hidden="true">
                <path :d="RIPL_LOGO_PATH" fill="currentColor" />
            </svg>
            <p class="panel-app__empty-title">No Ripl detected</p>
            <p class="panel-app__empty-hint">
                Is <code>@ripl/devtools</code> installed and <code>createDevtools</code> called?
            </p>
        </div>
    </div>
</template>

<script setup lang="ts">
import EventsPane from './components/events/events-pane.vue';
import PanelHeader from './components/panel-header.vue';
import PropertiesPanel from './components/properties/properties-panel.vue';
import SplitPane from './components/split-pane.vue';
import ElementsPane from './components/tree/elements-pane.vue';

import {
    useDevtoolsStore,
} from './composables/use-devtools-store';

import {
    useSettings,
} from './composables/use-settings';

import {
    useTabs,
} from './composables/use-tabs';

import {
    useTheme,
} from './composables/use-theme';

import {
    RIPL_LOGO_PATH,
    RIPL_LOGO_VIEWBOX,
} from '../shared/logo';

import {
    watchEffect,
} from 'vue';

const store = useDevtoolsStore();
const settings = useSettings();

const {
    activeTab,
} = useTabs();

useTheme();

// Poll so animation-driven property changes show without extra page-side work; paused while hidden.
watchEffect(onCleanup => {
    const selection = store.selection.value;
    const rate = settings.pollRate.value;

    if (!selection || activeTab.value !== 'elements') {
        return;
    }

    const handle = window.setInterval(() => {
        if (!document.hidden) {
            store.inspectSelected();
        }
    }, Math.round(1000 / rate));

    onCleanup(() => window.clearInterval(handle));
});
</script>

<style scoped>
.panel-app {
    display: flex;
    flex-direction: column;
    height: 100%;
}

.panel-app__body {
    flex: 1;
    min-height: 0;
}


.panel-app__empty {
    flex: 1;
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    gap: 4px;
    color: var(--ripl-text-dim);
}

.panel-app__empty-logo {
    width: 48px;
    height: 48px;
    opacity: 0.3;
    margin-bottom: 8px;
}

.panel-app__empty-title {
    margin: 0;
    font-size: 13px;
    font-weight: 500;
}

.panel-app__empty-hint {
    margin: 0;
    font-size: 11px;
}
</style>
