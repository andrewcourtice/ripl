<script setup lang="ts">
import {
    useDevtoolsStore,
} from '../../composables/use-devtools-store';

import {
    computed,
} from 'vue';

import type {
    ContextInfo,
    RendererDebugInfo,
} from '@ripl/devtools';

const props = defineProps<{
    context: ContextInfo;
}>();

const store = useDevtoolsStore();

const debug = computed<RendererDebugInfo>(() => ({
    fps: props.context.rendererDebug?.fps ?? false,
    elementCount: props.context.rendererDebug?.elementCount ?? false,
    boundingBoxes: props.context.rendererDebug?.boundingBoxes ?? false,
}));

const toggles: {
    key: keyof RendererDebugInfo;
    label: string;
}[] = [
    {
        key: 'fps',
        label: 'FPS counter',
    },
    {
        key: 'elementCount',
        label: 'Element count',
    },
    {
        key: 'boundingBoxes',
        label: 'Show bounding boxes',
    },
];

// Always send the full debug triple so the page applies a consistent state.
function setDebugFlag(key: keyof RendererDebugInfo, value: boolean): void {
    store.setRendererDebug(props.context.contextId, {
        ...debug.value,
        [key]: value,
    });
}

function onToggle(key: keyof RendererDebugInfo, event: Event): void {
    setDebugFlag(key, (event.target as HTMLInputElement).checked);
}
</script>

<template>
    <section class="context-section">
        <h3 class="context-section__heading">Context</h3>
        <div class="context-section__rows">
            <div class="context-section__row">
                <span class="context-section__label">Type</span>
                <span class="context-section__badge" :data-type="context.contextType">{{ context.contextType }}</span>
            </div>
            <div class="context-section__row">
                <span class="context-section__label">Size</span>
                <span>{{ Math.round(context.width) }} × {{ Math.round(context.height) }}</span>
            </div>
            <div class="context-section__row">
                <span class="context-section__label">Bound</span>
                <span class="context-section__chips">
                    <span class="context-section__chip" :class="{ 'context-section__chip--on': context.hasScene }">scene</span>
                    <span class="context-section__chip" :class="{ 'context-section__chip--on': context.hasRenderer }">renderer</span>
                </span>
            </div>
            <template v-if="context.hasRenderer">
                <label v-for="toggle of toggles" :key="toggle.key" class="context-section__row context-section__toggle">
                    <span class="context-section__label">{{ toggle.label }}</span>
                    <span class="context-section__switch">
                        <input
                            type="checkbox"
                            :checked="debug[toggle.key]"
                            @change="onToggle(toggle.key, $event)"
                        >
                        <span class="context-section__slider"></span>
                    </span>
                </label>
            </template>
        </div>
    </section>
</template>

<style scoped>
.context-section {
    flex: none;
    border-bottom: 1px solid var(--ripl-border-soft);
}

.context-section__heading {
    margin: 0;
    padding: var(--ripl-section-pad-y) var(--ripl-section-pad-x);
    font-size: 11px;
    font-weight: 600;
    color: var(--ripl-text-dim);
    text-transform: uppercase;
    letter-spacing: 0.06em;
}

.context-section__rows {
    padding: 0 var(--ripl-section-pad-x) var(--ripl-space-3);
}

.context-section__row {
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: var(--ripl-space-2);
    min-height: var(--ripl-row-height);
    font-size: 11px;
}

.context-section__label {
    color: var(--ripl-text-dim);
}

.context-section__badge {
    padding: 0 6px;
    border-radius: 8px;
    font-size: 10px;
    line-height: 15px;
    text-transform: uppercase;
    letter-spacing: 0.04em;
    background: var(--ripl-selected);
    color: var(--ripl-accent);
}

.context-section__chips {
    display: flex;
    gap: 4px;
}

.context-section__chip {
    padding: 0 6px;
    border: 1px solid var(--ripl-border);
    border-radius: 8px;
    font-size: 10px;
    line-height: 14px;
    color: var(--ripl-text-dim);
    opacity: 0.55;
}

.context-section__chip--on {
    border-color: var(--ripl-accent);
    color: var(--ripl-accent);
    opacity: 1;
}

.context-section__toggle {
    cursor: pointer;
}

.context-section__switch {
    position: relative;
    display: inline-block;
    width: 24px;
    height: 13px;
    flex: none;
}

.context-section__switch input {
    position: absolute;
    opacity: 0;
    width: 100%;
    height: 100%;
    margin: 0;
    cursor: pointer;
}

.context-section__slider {
    position: absolute;
    inset: 0;
    border-radius: 7px;
    background: var(--ripl-border);
    transition: background 0.15s ease;
    pointer-events: none;
}

.context-section__slider::before {
    content: '';
    position: absolute;
    top: 2px;
    left: 2px;
    width: 9px;
    height: 9px;
    border-radius: 50%;
    background: var(--ripl-bg);
    transition: transform 0.15s ease;
}

.context-section__switch input:checked + .context-section__slider {
    background: var(--ripl-accent);
}

.context-section__switch input:checked + .context-section__slider::before {
    transform: translateX(11px);
}
</style>
