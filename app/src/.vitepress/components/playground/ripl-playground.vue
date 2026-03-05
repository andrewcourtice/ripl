<template>
    <ClientOnly>
        <div class="playground">
            <div class="playground__left" :style="{ width: leftWidth + 'px' }">
                <PlaygroundEditor
                    v-model="code"
                    v-model:mode="mode"
                    v-model:import-map="riplImportMap"
                    @reset="resetCode"
                    @load-example="onLoadExample"
                />
            </div>
            <div
                class="playground__divider"
                @mousedown="onDividerMouseDown"
            ></div>
            <div class="playground__right" :class="{ 'playground__right--dragging': isDragging }">
                <PlaygroundPreview
                    :srcdoc="currentSrcdoc"
                    :mode="mode"
                    v-model:context-type="contextType"
                    v-model:settings="settings"
                />
            </div>
        </div>
    </ClientOnly>
</template>

<script lang="ts" setup>
import {
    ref,
    watch,
    onMounted,
    onBeforeUnmount,
} from 'vue';

import PlaygroundEditor from './playground-editor.vue';
import PlaygroundPreview from './playground-preview.vue';

import {
    buildSrcdoc,
    encodeCode,
    decodeCode,
} from './sandbox';

import {
    EXAMPLES,
} from './examples';

import type {
    PlaygroundMode,
    ContextType,
    PlaygroundSettings,
} from './sandbox';

const mode = ref<PlaygroundMode>('2d');
const contextType = ref<ContextType>('canvas');
const code = ref('');
const leftWidth = ref(0);
const currentSrcdoc = ref('');
const riplImportMap = ref<Record<string, string>>({});
const settings = ref<PlaygroundSettings>({
    autoStop: false,
    cameraInteractions: true,
});

let debounceTimer: ReturnType<typeof setTimeout> | undefined;
let renderTimer: ReturnType<typeof setTimeout> | undefined;
let loadingExample = false;

function getDefaultCode(m: PlaygroundMode): string {
    return EXAMPLES.find(e => e.mode === m)!.code;
}

function loadFromHash(): string {
    if (typeof window === 'undefined') {
        return '';
    }

    const hash = window.location.hash.slice(1);

    if (!hash) {
        return '';
    }

    return decodeCode(hash);
}

function saveToHash(value: string) {
    if (typeof window === 'undefined') {
        return;
    }

    const encoded = encodeCode(value);

    if (encoded) {
        window.history.replaceState(null, '', '#' + encoded);
    }
}

function updateSrcdoc() {
    if (!Object.keys(riplImportMap.value).length) {
        return;
    }

    currentSrcdoc.value = buildSrcdoc(code.value, mode.value, contextType.value, riplImportMap.value, window.location.origin, settings.value);
}

function debouncedUpdate() {
    clearTimeout(renderTimer);
    renderTimer = setTimeout(updateSrcdoc, 300);
}

watch(code, () => {
    debouncedUpdate();

    clearTimeout(debounceTimer);
    debounceTimer = setTimeout(() => saveToHash(code.value), 500);
});

watch([contextType, settings, riplImportMap], () => {
    updateSrcdoc();
}, { deep: true });

watch(mode, (newMode) => {
    if (loadingExample) {
        loadingExample = false;
        return;
    }

    code.value = getDefaultCode(newMode);
    updateSrcdoc();
});

function onLoadExample(example: { mode: string; code: string }) {
    loadingExample = true;
    mode.value = example.mode as PlaygroundMode;
    code.value = example.code;
    updateSrcdoc();
}

function resetCode() {
    code.value = getDefaultCode(mode.value);
    window.history.replaceState(null, '', window.location.pathname + window.location.search);
}

const isDragging = ref(false);

function onDividerMouseDown(event: MouseEvent) {
    event.preventDefault();
    isDragging.value = true;
    document.addEventListener('mousemove', onMouseMove);
    document.addEventListener('mouseup', onMouseUp);
    document.body.style.cursor = 'col-resize';
    document.body.style.userSelect = 'none';
}

function onMouseMove(event: MouseEvent) {
    if (!isDragging.value) {
        return;
    }

    const minWidth = 200;
    const maxWidth = window.innerWidth - 200;
    leftWidth.value = Math.min(maxWidth, Math.max(minWidth, event.clientX));
}

function onMouseUp() {
    isDragging.value = false;
    document.removeEventListener('mousemove', onMouseMove);
    document.removeEventListener('mouseup', onMouseUp);
    document.body.style.cursor = '';
    document.body.style.userSelect = '';
}

async function loadImportMap() {
    try {
        const base = import.meta.env.BASE_URL || '/';
        const response = await fetch(base + '_playground/manifest.json');
        const manifest = await response.json();
        const importMap: Record<string, string> = {};

        for (const [pkg, entry] of Object.entries(manifest)) {
            const esm = (entry as { esm: string | null }).esm;

            if (esm) {
                importMap[pkg] = esm;
            }
        }

        riplImportMap.value = importMap;
        updateSrcdoc();
    } catch {
        // manifest not available
    }
}

onMounted(() => {
    leftWidth.value = Math.round(window.innerWidth / 2);

    const hashCode = loadFromHash();
    code.value = hashCode || getDefaultCode(mode.value);

    loadImportMap();
});

onBeforeUnmount(() => {
    clearTimeout(debounceTimer);
    clearTimeout(renderTimer);
    document.removeEventListener('mousemove', onMouseMove);
    document.removeEventListener('mouseup', onMouseUp);
});
</script>

<style lang="scss">
.playground {
    display: flex;
    height: calc(100vh - var(--vp-nav-height));
    overflow: hidden;
}

.playground__left {
    flex-shrink: 0;
    overflow: hidden;
}

.playground__divider {
    width: 4px;
    cursor: col-resize;
    background-color: var(--vp-c-divider);
    flex-shrink: 0;
    transition: background-color 150ms ease-out;

    &:hover {
        background-color: var(--vp-c-brand-1);
    }
}

.playground__right {
    flex: 1;
    min-width: 0;
    overflow: hidden;

    &--dragging {
        pointer-events: none;
    }
}
</style>
