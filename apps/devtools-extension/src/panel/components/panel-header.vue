<script setup lang="ts">
import SettingsPopover from './settings-popover.vue';

import {
    RIPL_LOGO_PATH,
    RIPL_LOGO_VIEWBOX,
} from '../../shared/logo';

import {
    ref,
} from 'vue';

const settingsOpen = ref(false);
</script>

<template>
    <header class="panel-header">
        <div class="panel-header__brand">
            <svg class="panel-header__logo" :viewBox="RIPL_LOGO_VIEWBOX" aria-hidden="true">
                <path :d="RIPL_LOGO_PATH" fill="currentColor" />
            </svg>
            <span class="panel-header__title">Ripl</span>
        </div>
        <div class="panel-header__actions">
            <button
                class="panel-header__settings"
                type="button"
                title="Settings"
                aria-label="Settings"
                @click.stop="settingsOpen = !settingsOpen"
            >
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
                    <circle cx="12" cy="12" r="3" />
                    <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 1 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 1 1-4 0v-.09a1.65 1.65 0 0 0-1-1.51 1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 1 1-2.83-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 1 1 0-4h.09a1.65 1.65 0 0 0 1.51-1 1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 1 1 2.83-2.83l.06.06a1.65 1.65 0 0 0 1.82.33h.01a1.65 1.65 0 0 0 1-1.51V3a2 2 0 1 1 4 0v.09a1.65 1.65 0 0 0 1 1.51h.01a1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 1 1 2.83 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82v.01a1.65 1.65 0 0 0 1.51 1H21a2 2 0 1 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z" />
                </svg>
            </button>
            <SettingsPopover v-if="settingsOpen" @close="settingsOpen = false" />
        </div>
    </header>
</template>

<style scoped>
.panel-header {
    display: flex;
    align-items: center;
    justify-content: space-between;
    height: 32px;
    padding: 0 var(--ripl-section-pad-x);
    border-bottom: 1px solid var(--ripl-border);
    background: var(--ripl-bg-raised);
    flex: none;
}

.panel-header__brand {
    display: flex;
    align-items: center;
    gap: var(--ripl-space-2);
}

.panel-header__logo {
    width: 16px;
    height: 16px;
    color: var(--ripl-accent);
}

.panel-header__title {
    font-size: 12px;
    font-weight: 600;
    letter-spacing: 0.02em;
}

.panel-header__actions {
    position: relative;
    display: flex;
    align-items: center;
}

.panel-header__settings {
    display: flex;
    align-items: center;
    justify-content: center;
    width: 24px;
    height: 24px;
    padding: 0;
    border: none;
    border-radius: 4px;
    background: transparent;
    color: var(--ripl-text-dim);
    cursor: pointer;
}

.panel-header__settings:hover {
    background: var(--ripl-hover);
    color: var(--ripl-text);
}

.panel-header__settings svg {
    width: 14px;
    height: 14px;
}
</style>
