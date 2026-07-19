<script setup lang="ts">
import {
    POLL_RATES,
    useSettings,
} from '../composables/use-settings';

import {
    onBeforeUnmount,
    onMounted,
    ref,
} from 'vue';

const emit = defineEmits<{
    (event: 'close'): void;
}>();

const {
    theme,
    pollRate,
} = useSettings();

const root = ref<HTMLElement | null>(null);

function onDocumentPointerDown(event: PointerEvent): void {
    if (root.value && !root.value.contains(event.target as Node)) {
        emit('close');
    }
}

onMounted(() => document.addEventListener('pointerdown', onDocumentPointerDown, true));
onBeforeUnmount(() => document.removeEventListener('pointerdown', onDocumentPointerDown, true));
</script>

<template>
    <div ref="root" class="settings-popover">
        <div class="settings-popover__title">Settings</div>
        <label class="settings-popover__field">
            <span>Theme</span>
            <select v-model="theme">
                <option value="auto">Auto</option>
                <option value="light">Light</option>
                <option value="dark">Dark</option>
            </select>
        </label>
        <label class="settings-popover__field">
            <span>Poll rate</span>
            <select v-model.number="pollRate">
                <option v-for="rate of POLL_RATES" :key="rate" :value="rate">{{ rate }} Hz</option>
            </select>
        </label>
    </div>
</template>

<style scoped>
.settings-popover {
    position: absolute;
    top: 26px;
    right: 0;
    z-index: 10;
    min-width: 160px;
    padding: 8px;
    border: 1px solid var(--ripl-border);
    border-radius: 6px;
    background: var(--ripl-bg-raised);
    box-shadow: 0 4px 16px var(--ripl-shadow);
}

.settings-popover__title {
    font-size: 11px;
    font-weight: 600;
    color: var(--ripl-text-dim);
    text-transform: uppercase;
    letter-spacing: 0.06em;
    margin-bottom: 8px;
}

.settings-popover__field {
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 12px;
    margin-bottom: 6px;
    font-size: 11px;
}

.settings-popover__field:last-child {
    margin-bottom: 0;
}
</style>
