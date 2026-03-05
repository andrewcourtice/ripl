<template>
    <div class="playground-editor">
        <div class="playground-editor__header">
            <RiplButtonGroup :modelValue="mode" @update:modelValue="$emit('update:mode', $event as PlaygroundMode)" :options="[
                { label: '2D', value: '2d' },
                { label: '3D', value: '3d' },
            ]" />
            <RiplDropdown ref="examplesDropdown">
                <template #trigger>
                    <RiplButton><BookOpen :size="14" /> Examples</RiplButton>
                </template>
                <RiplDropdownLabel>2D</RiplDropdownLabel>
                <RiplDropdownItem
                    v-for="example in examples2d"
                    :key="example.label"
                    @click="loadExample(example)"
                >{{ example.label }}</RiplDropdownItem>
                <RiplDropdownLabel>3D</RiplDropdownLabel>
                <RiplDropdownItem
                    v-for="example in examples3d"
                    :key="example.label"
                    @click="loadExample(example)"
                >{{ example.label }}</RiplDropdownItem>
            </RiplDropdown>
            <RiplButton class="playground-editor__reset" :icon="true" @click="$emit('reset')"><RotateCcw :size="14" /></RiplButton>
        </div>
        <div class="playground-editor__tabs">
            <button
                class="playground-editor__tab"
                :class="{ 'playground-editor__tab--active': activeTab === 'code' }"
                @click="activeTab = 'code'"
            ><Code :size="14" /> Code</button>
            <button
                class="playground-editor__tab"
                :class="{ 'playground-editor__tab--active': activeTab === 'importmap' }"
                @click="activeTab = 'importmap'"
            ><FileJson :size="14" /> Import Map</button>
        </div>
        <div v-show="activeTab === 'code'" class="playground-editor__body" ref="editorContainer"></div>
        <div v-show="activeTab === 'importmap'" class="playground-editor__body" ref="importMapContainer"></div>
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

import {
    BookOpen,
    Code,
    FileJson,
    RotateCcw,
} from 'lucide-vue-next';

import RiplButton from '../ripl-button.vue';
import RiplButtonGroup from '../ripl-button-group.vue';
import RiplDropdown from '../ripl-dropdown.vue';
import RiplDropdownItem from '../ripl-dropdown-item.vue';
import RiplDropdownLabel from '../ripl-dropdown-label.vue';

import {
    EXAMPLES,
} from './examples';

import type {
    PlaygroundExample,
} from './examples';

import type {
    PlaygroundMode,
} from './sandbox';

type EditorTab = 'code' | 'importmap';

const props = defineProps<{
    modelValue: string;
    mode: PlaygroundMode;
    importMap: Record<string, string>;
}>();

const emit = defineEmits<{
    'update:modelValue': [value: string];
    'update:mode': [value: PlaygroundMode];
    'update:importMap': [value: Record<string, string>];
    'reset': [];
}>();

const activeTab = ref<EditorTab>('code');

const examplesDropdown = ref<InstanceType<typeof RiplDropdown>>();
const editorContainer = ref<HTMLElement>();
const importMapContainer = ref<HTMLElement>();
const editorInstance = shallowRef<any>();
const importMapEditorInstance = shallowRef<any>();
let monacoModule: typeof import('monaco-editor') | null = null;

const examples2d = EXAMPLES.filter(e => e.mode === '2d');
const examples3d = EXAMPLES.filter(e => e.mode === '3d');

function loadExample(example: PlaygroundExample) {
    emit('update:mode', example.mode);
    emit('update:modelValue', example.code);
    examplesDropdown.value?.close();
}

const GLOBALS_DTS = `
declare const context: import('@ripl/core').Context;
declare const scene: import('@ripl/core').Scene;
declare const renderer: import('@ripl/core').Renderer;
declare const camera: import('@ripl/3d').Camera;
`;

function formatImportMap(map: Record<string, string>): string {
    return JSON.stringify({ imports: map }, null, 4);
}

function parseImportMap(json: string): Record<string, string> | null {
    try {
        const parsed = JSON.parse(json);

        if (parsed && typeof parsed.imports === 'object') {
            return parsed.imports as Record<string, string>;
        }

        return null;
    } catch {
        return null;
    }
}

async function initMonaco() {
    const monaco = await import('monaco-editor');
    monacoModule = monaco;

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

    initImportMapEditor(monaco);
}

function initImportMapEditor(monaco: typeof import('monaco-editor')) {
    if (!importMapContainer.value) {
        return;
    }

    const importMapEditor = monaco.editor.create(importMapContainer.value, {
        value: formatImportMap(props.importMap),
        language: 'json',
        theme: 'vs-light',
        minimap: { enabled: false },
        fontSize: 13,
        lineNumbers: 'on',
        scrollBeyondLastLine: false,
        automaticLayout: true,
        tabSize: 4,
        padding: { top: 12 },
    });

    importMapEditorInstance.value = importMapEditor;

    importMapEditor.onDidChangeModelContent(() => {
        const parsed = parseImportMap(importMapEditor.getValue());

        if (parsed) {
            emit('update:importMap', parsed);
        }
    });
}

watch(() => props.modelValue, (value) => {
    if (editorInstance.value && editorInstance.value.getValue() !== value) {
        editorInstance.value.setValue(value);
    }
});

watch(() => props.importMap, (value) => {
    if (!importMapEditorInstance.value) {
        return;
    }

    const formatted = formatImportMap(value);

    if (importMapEditorInstance.value.getValue() !== formatted) {
        importMapEditorInstance.value.setValue(formatted);
    }
});

onMounted(() => {
    initMonaco();
});

onBeforeUnmount(() => {
    editorInstance.value?.dispose();
    importMapEditorInstance.value?.dispose();
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
    gap: 0.5rem;
    padding: 0.5rem 0.75rem;
    border-bottom: 1px solid var(--vp-c-divider);
    background-color: var(--vp-c-bg);
    flex-shrink: 0;
}

.playground-editor__tabs {
    display: flex;
    border-bottom: 1px solid var(--vp-c-divider);
    background-color: var(--vp-c-bg);
    flex-shrink: 0;
}

.playground-editor__tab {
    display: inline-flex;
    align-items: center;
    gap: 0.375rem;
    padding: 0.5rem 0.875rem;
    font: inherit;
    font-size: 0.8125rem;
    color: var(--vp-c-text-3);
    border: none;
    border-bottom: 2px solid transparent;
    background: none;
    cursor: pointer;
    transition: color 100ms ease-out, border-color 100ms ease-out;

    &:hover {
        color: var(--vp-c-text-2);
    }

    &--active {
        color: var(--vp-c-text-1);
        border-bottom-color: var(--vp-c-brand-1);
    }
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
