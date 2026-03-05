<template>
    <div class="playground-preview">
        <div class="playground-preview__header">
            <RiplButtonGroup
                v-if="mode === '2d'"
                :modelValue="contextType"
                @update:modelValue="$emit('update:contextType', $event as ContextType)"
                :options="[
                    { label: 'Canvas', value: 'canvas' },
                    { label: 'SVG', value: 'svg' },
                ]"
            />
            <RiplDropdown align="right" ref="settingsDropdown">
                <template #trigger>
                    <RiplButton><Settings2 :size="14" /> Settings</RiplButton>
                </template>
                <template v-if="mode === '3d'">
                    <RiplDropdownLabel>Renderer</RiplDropdownLabel>
                    <RiplSwitch
                        :modelValue="settings.autoStop"
                        @update:modelValue="updateSetting('autoStop', $event)"
                        label="Auto-stop"
                    />
                    <RiplDropdownLabel>Camera</RiplDropdownLabel>
                    <RiplSwitch
                        :modelValue="settings.cameraInteractions"
                        @update:modelValue="updateSetting('cameraInteractions', $event)"
                        label="Interactions"
                    />
                </template>
                <template v-else>
                    <div class="playground-preview__settings-empty">No settings for 2D mode</div>
                </template>
            </RiplDropdown>
        </div>
        <div class="playground-preview__body">
            <iframe
                ref="iframeRef"
                class="playground-preview__iframe"
                sandbox="allow-scripts allow-same-origin"
                :srcdoc="srcdoc"
            ></iframe>
        </div>
        <div v-if="error" class="playground-preview__error">
            {{ error }}
        </div>
    </div>
</template>

<script lang="ts" setup>
import {
    ref,
    watch,
    onMounted,
    onBeforeUnmount,
} from 'vue';

import {
    Settings2,
} from 'lucide-vue-next';

import RiplButton from '../ripl-button.vue';
import RiplButtonGroup from '../ripl-button-group.vue';
import RiplDropdown from '../ripl-dropdown.vue';
import RiplDropdownLabel from '../ripl-dropdown-label.vue';
import RiplSwitch from '../ripl-switch.vue';

import type {
    ContextType,
    PlaygroundMode,
    PlaygroundSettings,
} from './sandbox';

const props = defineProps<{
    srcdoc: string;
    mode: PlaygroundMode;
    contextType: ContextType;
    settings: PlaygroundSettings;
}>();

const emit = defineEmits<{
    'update:contextType': [value: ContextType];
    'update:settings': [value: PlaygroundSettings];
}>();

const iframeRef = ref<HTMLIFrameElement>();
const error = ref('');
const settingsDropdown = ref<InstanceType<typeof RiplDropdown>>();

function updateSetting<K extends keyof PlaygroundSettings>(key: K, value: PlaygroundSettings[K]) {
    emit('update:settings', { ...props.settings, [key]: value });
}

watch(() => props.srcdoc, () => {
    error.value = '';
});

function onMessage(event: MessageEvent) {
    if (event.data?.type === 'playground-error') {
        error.value = event.data.message;
    }
}

onMounted(() => {
    window.addEventListener('message', onMessage);
});

onBeforeUnmount(() => {
    window.removeEventListener('message', onMessage);
});
</script>

<style lang="scss">
.playground-preview {
    display: flex;
    flex-direction: column;
    height: 100%;
    overflow: hidden;
}

.playground-preview__header {
    display: flex;
    align-items: center;
    justify-content: flex-end;
    gap: 0.5rem;
    padding: 0.5rem 0.75rem;
    border-bottom: 1px solid var(--vp-c-divider);
    background-color: var(--vp-c-bg);
    flex-shrink: 0;
}

.playground-preview__settings-empty {
    padding: 0.5rem 0.625rem;
    font-size: 0.8125rem;
    color: var(--vp-c-text-3);
    white-space: nowrap;
}

.playground-preview__body {
    flex: 1;
    min-height: 0;
    overflow: hidden;
    background: #1e1e2e;
}

.playground-preview__iframe {
    width: 100%;
    height: 100%;
    border: none;
    display: block;
}

.playground-preview__error {
    padding: 0.5rem 0.75rem;
    font-size: 0.8125rem;
    font-family: monospace;
    color: var(--vp-c-danger-1);
    background-color: var(--vp-c-danger-soft);
    border-top: 1px solid var(--vp-c-danger-1);
    white-space: pre-wrap;
    word-break: break-all;
    max-height: 6rem;
    overflow-y: auto;
    flex-shrink: 0;
}
</style>
