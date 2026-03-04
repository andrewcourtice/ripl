<template>
    <div class="playground-editor">
        <div class="playground-editor__header">
            <RiplButtonGroup>
                <RiplButton :active="mode === '2d'" @click="$emit('update:mode', '2d')">2D</RiplButton>
                <RiplButton :active="mode === '3d'" @click="$emit('update:mode', '3d')">3D</RiplButton>
            </RiplButtonGroup>
            <RiplButton class="playground-editor__reset" @click="$emit('reset')">Reset</RiplButton>
        </div>
        <div class="playground-editor__body" ref="editorContainer"></div>
    </div>
</template>

<script lang="ts" setup>
import {
    ref,
    onMounted,
    onBeforeUnmount,
    watch,
    shallowRef,
} from 'vue';

import RiplButton from '../ripl-button.vue';
import RiplButtonGroup from '../ripl-button-group.vue';

import type {
    PlaygroundMode,
} from './sandbox';

const props = defineProps<{
    modelValue: string;
    mode: PlaygroundMode;
}>();

const emit = defineEmits<{
    'update:modelValue': [value: string];
    'update:mode': [value: PlaygroundMode];
    'reset': [];
}>();

const editorContainer = ref<HTMLElement>();
const editorInstance = shallowRef<any>();

const GLOBALS_DTS = `
declare const context: import('@ripl/core').Context;
declare const scene: import('@ripl/core').Scene;
declare const renderer: import('@ripl/core').Renderer;
declare const camera: import('@ripl/3d').Camera;
`;

async function initMonaco() {
    const monaco = await import('monaco-editor');

    self.MonacoEnvironment = {
        getWorker(_: string, label: string) {
            if (label === 'typescript' || label === 'javascript') {
                return new Worker(
                    new URL('monaco-editor/esm/vs/language/typescript/ts.worker.js', import.meta.url),
                    { type: 'module' }
                );
            }

            if (label === 'css' || label === 'scss' || label === 'less') {
                return new Worker(
                    new URL('monaco-editor/esm/vs/language/css/css.worker.js', import.meta.url),
                    { type: 'module' }
                );
            }

            if (label === 'json') {
                return new Worker(
                    new URL('monaco-editor/esm/vs/language/json/json.worker.js', import.meta.url),
                    { type: 'module' }
                );
            }

            if (label === 'html' || label === 'handlebars' || label === 'razor') {
                return new Worker(
                    new URL('monaco-editor/esm/vs/language/html/html.worker.js', import.meta.url),
                    { type: 'module' }
                );
            }

            return new Worker(
                new URL('monaco-editor/esm/vs/editor/editor.worker.js', import.meta.url),
                { type: 'module' }
            );
        },
    };

    monaco.languages.typescript.javascriptDefaults.setDiagnosticsOptions({
        noSemanticValidation: true,
        noSyntaxValidation: false,
    });

    monaco.languages.typescript.javascriptDefaults.setCompilerOptions({
        target: monaco.languages.typescript.ScriptTarget.ES2020,
        allowNonTsExtensions: true,
        moduleResolution: monaco.languages.typescript.ModuleResolutionKind.NodeJs,
        module: monaco.languages.typescript.ModuleKind.ESNext,
        allowJs: true,
        checkJs: false,
    });

    monaco.languages.typescript.javascriptDefaults.addExtraLib(
        GLOBALS_DTS,
        'file:///globals.d.ts'
    );

    try {
        const base = import.meta.env.BASE_URL || '/';
        const response = await fetch(base + '_playground/manifest.json');
        const manifest = await response.json();

        for (const [pkg, entry] of Object.entries(manifest)) {
            const typesUrl = (entry as { types: string | null }).types;

            if (!typesUrl) {
                continue;
            }

            const dtsResponse = await fetch(base + typesUrl.replace(/^\//, ''));
            const dts = await dtsResponse.text();
            const wrapped = `declare module '${pkg}' {\n${dts}\n}`;

            monaco.languages.typescript.javascriptDefaults.addExtraLib(
                wrapped,
                `file:///node_modules/${pkg}/index.d.ts`
            );
        }
    } catch {
        // types not available
    }

    if (!editorContainer.value) {
        return;
    }

    const editor = monaco.editor.create(editorContainer.value, {
        value: props.modelValue,
        language: 'javascript',
        theme: 'vs-light',
        minimap: { enabled: false },
        fontSize: 13,
        lineNumbers: 'on',
        scrollBeyondLastLine: false,
        automaticLayout: true,
        tabSize: 4,
        padding: { top: 12 },
        suggestOnTriggerCharacters: true,
        quickSuggestions: true,
    });

    editorInstance.value = editor;

    editor.onDidChangeModelContent(() => {
        const value = editor.getValue();
        emit('update:modelValue', value);
    });
}

watch(() => props.modelValue, (value) => {
    if (editorInstance.value && editorInstance.value.getValue() !== value) {
        editorInstance.value.setValue(value);
    }
});

onMounted(() => {
    initMonaco();
});

onBeforeUnmount(() => {
    editorInstance.value?.dispose();
});
</script>

<style lang="scss">
.playground-editor {
    display: flex;
    flex-direction: column;
    height: 100%;
    overflow: hidden;
}

.playground-editor__header {
    display: flex;
    align-items: center;
    padding: 0.5rem 0.75rem;
    border-bottom: 1px solid var(--vp-c-divider);
    background-color: var(--vp-c-bg);
    flex-shrink: 0;
}

.playground-editor__reset {
    margin-left: auto;
}

.playground-editor__body {
    flex: 1;
    min-height: 0;
    overflow: hidden;
}
</style>
