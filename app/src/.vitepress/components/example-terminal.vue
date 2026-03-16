<template>
    <div class="ripl-terminal-example">
        <div class="ripl-terminal-example__header">
            <span class="ripl-terminal-example__label">Terminal</span>
            <slot name="header"></slot>
        </div>
        <div class="ripl-terminal-example__body" ref="terminalContainer"></div>
    </div>
</template>

<script lang="ts" setup>
import {
    onMounted,
    onUnmounted,
    ref,
} from 'vue';

import {
    BrailleRasterizer,
    TerminalContext,
} from '@ripl/terminal';

import type {
    TerminalOutput,
} from '@ripl/terminal';

const emit = defineEmits<{
    ready: [context: TerminalContext];
}>();

const terminalContainer = ref<HTMLElement>();

let terminal: any;
let fitAddon: any;
let context: TerminalContext | undefined;

onMounted(async () => {
    if (!terminalContainer.value) {
        return;
    }

    const [{ default: xterm }, { default: xtermFit }] = await Promise.all([
        import('@xterm/xterm'),
        import('@xterm/addon-fit'),
    ]);

    import('@xterm/xterm/css/xterm.css');

    const { Terminal } = xterm;
    const { FitAddon } = xtermFit;

    terminal = new Terminal({
        cursorBlink: false,
        cursorStyle: 'underline',
        disableStdin: true,
        fontFamily: 'monospace',
        fontSize: 14,
        theme: {
            background: '#1a1a2e',
            foreground: '#e0e0e0',
        },
    });

    fitAddon = new FitAddon();
    terminal.loadAddon(fitAddon);
    terminal.open(terminalContainer.value);
    fitAddon.fit();

    const term = terminal;

    const state = {
        columns: term.cols,
        rows: term.rows,
    };

    const output: TerminalOutput = {
        write(data: string) {
            term.write(data);
        },
        get columns() {
            return state.columns;
        },
        get rows() {
            return state.rows;
        },
        onResize(callback: (c: number, r: number) => void) {
            const disposable = term.onResize(({ cols: nc, rows: nr }: { cols: number; rows: number }) => callback(nc, nr));

            return () => disposable.dispose();
        },
    };

    const rasterizer = new BrailleRasterizer(state.columns, state.rows);

    context = new TerminalContext(output, { rasterizer });

    emit('ready', context);

    const observer = new ResizeObserver(() => {
        fitAddon?.fit();

        state.columns = term.cols;
        state.rows = term.rows;

        rasterizer.resize(state.columns, state.rows);
        emit('ready', context!);
    });

    observer.observe(terminalContainer.value);
});

onUnmounted(() => {
    context?.destroy();
    terminal?.dispose();
});
</script>

<style lang="scss">
.ripl-terminal-example {
    margin: 1rem 0;
    border: 1px solid var(--vp-c-divider);
    border-radius: 0.5rem;
    overflow: hidden;
}

.ripl-terminal-example__header {
    padding: 0.75rem 1rem;
    border-bottom: 1px solid var(--vp-c-divider);
    display: flex;
    align-items: center;
    gap: 0.5rem;
}

.ripl-terminal-example__label {
    font-size: 0.85rem;
    font-weight: 600;
    color: var(--vp-c-text-2);
    font-family: monospace;
}

.ripl-terminal-example__body {
    height: 400px;
    background: #1a1a2e;

    .xterm {
        padding: 0.5rem;
        height: 100%;
    }
}
</style>
