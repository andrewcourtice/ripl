<template>
    <div class="ripl-example">
        <div class="ripl-example__header">
            <RiplButtonGroup v-model="type" :options="[
                { label: 'Canvas', value: 'canvas' },
                { label: 'SVG', value: 'svg' },
                { label: 'Terminal', value: 'terminal' },
            ]" />
            <slot name="header"></slot>
            <div class="ripl-example__actions">
                <button
                    v-if="$slots.config"
                    class="ripl-example__config-button"
                    type="button"
                    aria-label="Customize chart"
                    @click="configOpen = true"
                >
                    <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                        <circle cx="12" cy="12" r="3" />
                        <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 1 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 1 1-2.83-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 1 1 2.83-2.83l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 1 1 2.83 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z" />
                    </svg>
                    <span>Customize</span>
                </button>
                <RiplExportButton v-if="context" :context="context" />
            </div>
        </div>
        <div class="ripl-example__root">
            <div class="ripl-example__mount" self="size-x1" ref="root"></div>
            <RiplSpinner v-if="loading" overlay label="Loading terminal…" />
        </div>
        <div class="ripl-example__footer" v-if="$slots.footer">
            <slot name="footer"></slot>
        </div>
        <RiplConfigDrawer v-if="$slots.config" v-model="configOpen">
            <slot name="config"></slot>
        </RiplConfigDrawer>
    </div>
</template>

<script lang="ts" setup>
import {
    onUnmounted,
    ref,
    shallowRef,
    watch,
} from 'vue';

import RiplButtonGroup from './ripl-button-group.vue';
import RiplConfigDrawer from './ripl-config-drawer.vue';
import RiplExportButton from './ripl-export-button.vue';
import RiplSpinner from './ripl-spinner.vue';

import type {
    Context,
} from '@ripl/web';

import {
    createContext as createCanvasContext,
} from '@ripl/web';

import {
    createContext as createSVGContext,
} from '@ripl/svg';

import {
    createContext as createTerminalContext,
} from '@ripl/terminal';

import type {
    TerminalOutput,
} from '@ripl/terminal';

type ContextType = 'canvas' | 'svg' | 'terminal';

const CONTEXT_MAP = {
    canvas: createCanvasContext,
    svg: createSVGContext,
} as Record<'canvas' | 'svg', typeof createCanvasContext | typeof createSVGContext>;

const emit = defineEmits<{
    'ready': [context: Context];
    'context-changed': [context: Context];
}>();

const type = ref<ContextType>('canvas');
const context = shallowRef<Context>();
const root = ref<HTMLElement>();
const configOpen = ref(false);
const loading = ref(false);

// Terminal rendering runs through an xterm.js emulator that is loaded on demand; keep a handle so it
// can be disposed when the context switches away from Terminal.
let terminalDispose: (() => void) | undefined;
let generation = 0;

/** Loads xterm.js, mounts it into the demo root, and builds a Ripl terminal context bound to it. */
async function createTerminal(element: HTMLElement): Promise<{ context: Context;
    dispose: () => void; }> {
    const [{ Terminal }, { FitAddon }] = await Promise.all([
        import('@xterm/xterm'),
        import('@xterm/addon-fit'),
    ]);

    await import('@xterm/xterm/css/xterm.css');

    const terminal = new Terminal({
        convertEol: true,
        cursorBlink: false,
        disableStdin: true,
        fontFamily: 'monospace',
        fontSize: 13,
        theme: {
            background: '#1b1b1f',
            foreground: '#e6e6e6',
        },
    });

    const fitAddon = new FitAddon();

    terminal.loadAddon(fitAddon);
    terminal.open(element);
    fitAddon.fit();

    const output: TerminalOutput = {
        write: data => terminal.write(data),
        get columns() {
            return terminal.cols;
        },
        get rows() {
            return terminal.rows;
        },
        onResize(callback) {
            const subscription = terminal.onResize(({ cols, rows }) => callback(cols, rows));
            return () => subscription.dispose();
        },
    };

    // Author the scene against the host box size (like Canvas/SVG); the terminal context scales that
    // logical space into the braille grid so demos render with the same proportions.
    const terminalContext = createTerminalContext(output, {
        logicalWidth: element.clientWidth,
        logicalHeight: element.clientHeight,
    });

    const observer = new ResizeObserver(() => fitAddon.fit());
    observer.observe(element);

    return {
        context: terminalContext,
        dispose: () => {
            observer.disconnect();
            terminal.dispose();
        },
    };
}

function cleanup(): void {
    context.value?.destroy();
    context.value = undefined;
    terminalDispose?.();
    terminalDispose = undefined;
}

async function initContext(): Promise<void> {
    const element = root.value;
    const currentType = type.value;
    const token = ++generation;

    cleanup();

    if (!element) {
        return;
    }

    if (currentType !== 'terminal') {
        const created = CONTEXT_MAP[currentType](element);
        context.value = created;
        emit('context-changed', created);
        return;
    }

    loading.value = true;

    try {
        const { context: created, dispose } = await createTerminal(element);

        // A newer toggle may have superseded this one while xterm was loading.
        if (token !== generation) {
            created.destroy();
            dispose();
            return;
        }

        terminalDispose = dispose;
        context.value = created;
        emit('context-changed', created);
    } finally {
        if (token === generation) {
            loading.value = false;
        }
    }
}

watch([type, root], initContext, {
    immediate: true,
});

onUnmounted(cleanup);
</script>

<style lang="scss">

    .ripl-example {
        position: relative;
        margin: 1rem 0;
        border: 1px solid var(--vp-c-divider);
        border-radius: 0.5rem;
        overflow: hidden;
    }

    .ripl-example__header,
    .ripl-example__footer {
        padding: 1rem;
        //background-color: var(--vp-sidebar-bg-color);
    }

    .ripl-example__header {
        display: flex;
        flex-wrap: wrap;
        align-items: center;
        gap: 0.75rem;
        border-bottom: 1px solid var(--vp-c-divider);
    }

    .ripl-example__actions {
        display: inline-flex;
        align-items: center;
        gap: 0.5rem;
        margin-left: auto;
    }

    .ripl-example__config-button {
        display: inline-flex;
        align-items: center;
        gap: 0.375rem;
        padding: 0.35rem 0.75rem;
        font-size: 0.8125rem;
        line-height: 1.5;
        color: var(--vp-button-alt-text);
        border: 1px solid var(--vp-c-divider);
        border-radius: 0.375rem;
        background-color: var(--vp-button-alt-bg);
        cursor: pointer;
        transition: color 150ms ease-out, background-color 150ms ease-out, border-color 150ms ease-out;
    }

    .ripl-example__config-button:hover {
        border-color: var(--vp-c-gray-2);
        background-color: var(--vp-button-alt-hover-bg);
    }

    .ripl-example__footer {
        border-top: 1px solid var(--vp-c-divider);
    }

    .ripl-example__root {
        position: relative;
        aspect-ratio: 4 / 3;
    }

    @media (min-width: 640px) {
        .ripl-example__root {
            aspect-ratio: 16 / 9;
        }
    }

    .ripl-example__mount {
        width: 100%;
        height: 100%;
    }

    .plugin-tabs--content > .ripl-example {
        margin: 0;
        border: none;
        background-color: var(--vp-c-bg);
    }

</style>
