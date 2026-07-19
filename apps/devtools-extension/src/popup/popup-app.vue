<script setup lang="ts">
import {
    RIPL_LOGO_PATH,
    RIPL_LOGO_VIEWBOX,
} from '../shared/logo';

import {
    computed,
    onMounted,
    reactive,
} from 'vue';

import type {
    BridgeMessage,
    ContextInfo,
} from '@ripl/devtools';

const contexts = reactive(new Map<string, ContextInfo>());

const contextList = computed(() => Array.from(contexts.values()));

function handleMessage(message: BridgeMessage): void {
    switch (message.kind) {
        case 'context:added':
        case 'context:updated':
            contexts.set(message.context.contextId, message.context);
            break;
        case 'context:removed':
            contexts.delete(message.contextId);
            break;
        case 'bridge:bye':
            contexts.clear();
            break;
    }
}

onMounted(() => {
    chrome.tabs.query({
        active: true,
        currentWindow: true,
    }, tabs => {
        const tabId = tabs[0]?.id;

        if (typeof tabId !== 'number') {
            return;
        }

        const port = chrome.runtime.connect({
            name: `ripl-popup:${tabId}`,
        });

        port.onMessage.addListener(message => handleMessage(message as BridgeMessage));
    });
});
</script>

<template>
    <div class="popup-app">
        <header class="popup-app__header">
            <svg class="popup-app__logo" :viewBox="RIPL_LOGO_VIEWBOX" aria-hidden="true">
                <path :d="RIPL_LOGO_PATH" fill="currentColor" />
            </svg>
            <span class="popup-app__title">Ripl Devtools</span>
        </header>
        <ul v-if="contextList.length" class="popup-app__list">
            <li v-for="context of contextList" :key="context.contextId" class="popup-app__item">
                <span class="popup-app__badge" :data-type="context.contextType">{{ context.contextType }}</span>
                <span class="popup-app__label" :title="context.label">{{ context.label }}</span>
                <span class="popup-app__size">{{ Math.round(context.width) }}×{{ Math.round(context.height) }}</span>
                <span class="popup-app__chips">
                    <span v-if="context.hasScene" class="popup-app__chip">scene</span>
                    <span v-if="context.hasRenderer" class="popup-app__chip">renderer</span>
                </span>
            </li>
        </ul>
        <div v-else class="popup-app__empty">
            <svg class="popup-app__empty-logo" :viewBox="RIPL_LOGO_VIEWBOX" aria-hidden="true">
                <path :d="RIPL_LOGO_PATH" fill="currentColor" />
            </svg>
            <p>No Ripl detected on this page</p>
        </div>
    </div>
</template>

<style>
:root {
    --popup-bg: #ffffff;
    --popup-text: #202124;
    --popup-text-dim: #5f6368;
    --popup-border: rgba(0, 0, 0, 0.1);
    --popup-accent: #459bf1;
    --popup-chip-bg: rgba(69, 155, 241, 0.12);
}

@media (prefers-color-scheme: dark) {
    :root {
        --popup-bg: #202124;
        --popup-text: #e8eaed;
        --popup-text-dim: #9aa0a6;
        --popup-border: rgba(255, 255, 255, 0.1);
        --popup-chip-bg: rgba(69, 155, 241, 0.2);
    }
}

body {
    margin: 0;
    background: var(--popup-bg);
    color: var(--popup-text);
    font-family: system-ui, -apple-system, 'Segoe UI', Roboto, Ubuntu, sans-serif;
    font-size: 12px;
}
</style>

<style scoped>
.popup-app {
    width: 300px;
}

.popup-app__header {
    display: flex;
    align-items: center;
    gap: 7px;
    padding: 9px 12px;
    border-bottom: 1px solid var(--popup-border);
}

.popup-app__logo {
    width: 15px;
    height: 15px;
    color: var(--popup-accent);
}

.popup-app__title {
    font-weight: 600;
    letter-spacing: 0.02em;
}

.popup-app__list {
    margin: 0;
    padding: 6px 0;
    list-style: none;
    max-height: 320px;
    overflow-y: auto;
}

.popup-app__item {
    display: flex;
    align-items: center;
    gap: 8px;
    padding: 5px 12px;
    min-width: 0;
}

.popup-app__badge {
    flex: none;
    padding: 1px 7px;
    border-radius: 9px;
    font-size: 10px;
    font-weight: 600;
    text-transform: uppercase;
    letter-spacing: 0.05em;
    color: #ffffff;
    background: var(--popup-accent);
}

.popup-app__badge[data-type='svg'] {
    background: #e8710a;
}

.popup-app__badge[data-type='webgpu'] {
    background: #9334e6;
}

.popup-app__label {
    flex: 1;
    min-width: 0;
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
}

.popup-app__size {
    flex: none;
    color: var(--popup-text-dim);
    font-size: 11px;
    font-variant-numeric: tabular-nums;
}

.popup-app__chips {
    flex: none;
    display: flex;
    gap: 3px;
}

.popup-app__chip {
    padding: 0 5px;
    border-radius: 7px;
    font-size: 9.5px;
    line-height: 14px;
    color: var(--popup-accent);
    background: var(--popup-chip-bg);
}

.popup-app__empty {
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 4px;
    padding: 24px 16px;
    color: var(--popup-text-dim);
}

.popup-app__empty-logo {
    width: 36px;
    height: 36px;
    opacity: 0.25;
}

.popup-app__empty p {
    margin: 4px 0 0;
}
</style>
