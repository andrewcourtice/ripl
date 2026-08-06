<template>
    <nav class="tab-bar" role="tablist">
        <button
            v-for="tab of TABS"
            :key="tab.id"
            class="tab-bar__tab"
            :class="{ 'tab-bar__tab--active': activeTab === tab.id }"
            type="button"
            role="tab"
            :aria-selected="activeTab === tab.id"
            @click="activeTab = tab.id"
        >{{ tab.label }}</button>
    </nav>
</template>

<script setup lang="ts">
import {
    useTabs,
} from '../composables/use-tabs';

import type {
    PanelTab,
} from '../composables/use-tabs';

const TABS: {
    id: PanelTab;
    label: string;
}[] = [
    {
        id: 'elements',
        label: 'Elements',
    },
    {
        id: 'events',
        label: 'Events',
    },
];

const {
    activeTab,
} = useTabs();
</script>

<style scoped>
.tab-bar {
    display: flex;
    align-items: stretch;
    height: 100%;
}

.tab-bar__tab {
    display: flex;
    align-items: center;
    padding: 0 var(--ripl-space-2);
    border: none;
    border-bottom: 2px solid transparent;
    background: transparent;
    color: var(--ripl-text-dim);
    font-size: 11px;
    cursor: pointer;
}

.tab-bar__tab:hover {
    color: var(--ripl-text);
}

.tab-bar__tab--active,
.tab-bar__tab--active:hover {
    border-bottom-color: var(--ripl-accent);
    color: var(--ripl-text);
}
</style>
