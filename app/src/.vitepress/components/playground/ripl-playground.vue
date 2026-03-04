<template>
    <ClientOnly>
        <div class="playground">
            <div class="playground__left" :style="{ width: leftWidth + 'px' }">
                <PlaygroundEditor
                    v-model="code"
                    v-model:mode="mode"
                    @reset="resetCode"
                />
            </div>
            <div
                class="playground__divider"
                @mousedown="onDividerMouseDown"
            ></div>
            <div class="playground__right">
                <PlaygroundPreview
                    :srcdoc="currentSrcdoc"
                    v-model:context-type="contextType"
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
    DEFAULT_2D_CODE,
    DEFAULT_3D_CODE,
} from './defaults';

import type {
    PlaygroundMode,
    ContextType,
} from './sandbox';

const mode = ref<PlaygroundMode>('2d');
const contextType = ref<ContextType>('canvas');
const code = ref('');
const leftWidth = ref(0);
const currentSrcdoc = ref('');
const riplImportMap = ref<Record<string, string>>({});

let debounceTimer: ReturnType<typeof setTimeout> | undefined;
let renderTimer: ReturnType<typeof setTimeout> | undefined;

function getDefaultCode(m: PlaygroundMode): string {
    return m === '3d' ? DEFAULT_3D_CODE : DEFAULT_2D_CODE;
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

    currentSrcdoc.value = buildSrcdoc(code.value, mode.value, contextType.value, riplImportMap.value, window.location.origin);
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

watch([mode, contextType], () => {
    updateSrcdoc();
});

watch(mode, (newMode) => {
    code.value = getDefaultCode(newMode);
});

function resetCode() {
    code.value = getDefaultCode(mode.value);
    window.history.replaceState(null, '', window.location.pathname + window.location.search);
}

let isDragging = false;

function onDividerMouseDown(event: MouseEvent) {
    event.preventDefault();
    isDragging = true;
    document.addEventListener('mousemove', onMouseMove);
    document.addEventListener('mouseup', onMouseUp);
    document.body.style.cursor = 'col-resize';
    document.body.style.userSelect = 'none';
}

function onMouseMove(event: MouseEvent) {
    if (!isDragging) {
        return;
    }

    const minWidth = 200;
    const maxWidth = window.innerWidth - 200;
    leftWidth.value = Math.min(maxWidth, Math.max(minWidth, event.clientX));
}

function onMouseUp() {
    isDragging = false;
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
.VPDoc .container,
.VPDoc .content,
.VPDoc .content-container {
    max-width: 100% !important;
    padding: 0 !important;
    margin: 0 !important;
}

.VPContent.has-sidebar {
    padding-left: 0 !important;
}

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
}
</style>
