<template>
    <div class="terminal-demo">
        <div class="terminal-demo__header">
            <h1 class="terminal-demo__title">Interactive Terminal</h1>
            <p class="terminal-demo__subtitle">Explore Ripl's terminal rendering — choose from basic shapes, animations, or full chart demos rendered in Unicode braille</p>
        </div>
        <div class="terminal-demo__viewport">
            <div class="terminal-demo__chrome">
                <span class="terminal-demo__dot terminal-demo__dot--red"></span>
                <span class="terminal-demo__dot terminal-demo__dot--yellow"></span>
                <span class="terminal-demo__dot terminal-demo__dot--green"></span>
            </div>
            <div class="terminal-demo__body" ref="terminalContainer"></div>
        </div>
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

import {
    createBarChart,
    createGanttChart,
    createLineChart,
    createStockChart,
} from '@ripl/charts';

import {
    createCircle,
    createLine,
    createRect,
    createRenderer,
    createScene,
    createText,
    easeInOutQuad,
    easeOutCubic,
} from '@ripl/web';

const terminalContainer = ref<HTMLElement>();

let terminal: any;
let fitAddon: any;
let context: TerminalContext | undefined;
let termOutput: TerminalOutput | undefined;
let rasterizer: BrailleRasterizer | undefined;

type MenuState = 'main' | 'chart' | 'running';
let menuState: MenuState = 'main';
let inputBuffer = '';

function writeLine(term: any, text: string) {
    term.write(text + '\r\n');
}

function showMainMenu(term: any) {
    menuState = 'main';
    inputBuffer = '';
    term.reset();
    writeLine(term, '');
    writeLine(term, '  \x1b[1;36m╔══════════════════════════════════╗\x1b[0m');
    writeLine(term, '  \x1b[1;36m║\x1b[0m   \x1b[1;37mRipl Interactive Terminal\x1b[0m      \x1b[1;36m║\x1b[0m');
    writeLine(term, '  \x1b[1;36m╚══════════════════════════════════╝\x1b[0m');
    writeLine(term, '');
    writeLine(term, '  Select a demo:');
    writeLine(term, '');
    writeLine(term, '    \x1b[1;33m1.\x1b[0m  Basic Demo');
    writeLine(term, '    \x1b[1;33m2.\x1b[0m  Animation');
    writeLine(term, '    \x1b[1;33m3.\x1b[0m  Ripl Chart');
    writeLine(term, '');
    term.write('  \x1b[1;32m>\x1b[0m ');
}

function showChartMenu(term: any) {
    menuState = 'chart';
    inputBuffer = '';
    term.reset();
    writeLine(term, '');
    writeLine(term, '  \x1b[1;36m╔══════════════════════════════════╗\x1b[0m');
    writeLine(term, '  \x1b[1;36m║\x1b[0m   \x1b[1;37mSelect a Chart\x1b[0m                \x1b[1;36m║\x1b[0m');
    writeLine(term, '  \x1b[1;36m╚══════════════════════════════════╝\x1b[0m');
    writeLine(term, '');
    writeLine(term, '    \x1b[1;33m1.\x1b[0m  Line Chart');
    writeLine(term, '    \x1b[1;33m2.\x1b[0m  Bar Chart');
    writeLine(term, '    \x1b[1;33m3.\x1b[0m  Stock Chart');
    writeLine(term, '    \x1b[1;33m4.\x1b[0m  Gantt Chart');
    writeLine(term, '');
    writeLine(term, '    \x1b[2m0. Back\x1b[0m');
    writeLine(term, '');
    term.write('  \x1b[1;32m>\x1b[0m ');
}

function runBasicDemo(ctx: TerminalContext) {
    menuState = 'running';
    const w = ctx.width;
    const h = ctx.height;

    ctx.batch(() => {
        createCircle({
            fill: '#3a86ff',
            cx: w * 0.25,
            cy: h * 0.45,
            radius: Math.min(w, h) / 6,
        }).render(ctx);

        createRect({
            fill: '#ff006e',
            x: w * 0.45,
            y: h * 0.2,
            width: w * 0.2,
            height: h * 0.5,
        }).render(ctx);

        createLine({
            stroke: '#fb5607',
            lineWidth: 2,
            x1: w * 0.75,
            y1: h * 0.15,
            x2: w * 0.85,
            y2: h * 0.75,
        }).render(ctx);

        createText({
            fill: '#e0e0e0',
            x: 8,
            y: 0,
            content: 'Basic Shapes: Circle, Rect, Line',
        }).render(ctx);

        createText({
            fill: '#888',
            x: 8,
            y: h - 16,
            content: 'Press any key to return',
        }).render(ctx);
    });
}

function runAnimationDemo(ctx: TerminalContext) {
    menuState = 'running';
    const w = ctx.width;
    const h = ctx.height;

    const circle = createCircle({
        fill: '#3a86ff',
        cx: w * 0.15,
        cy: h / 2,
        radius: Math.min(w, h) / 8,
    });

    const label = createText({
        fill: '#e0e0e0',
        x: 8,
        y: 0,
        content: 'Animated Circle Traversal',
    });

    const hint = createText({
        fill: '#888',
        x: 8,
        y: h - 16,
        content: 'Press any key to return',
    });

    const scene = createScene(ctx, {
        children: [circle, label, hint],
    });

    const renderer = createRenderer(scene);

    (async () => {
        await renderer.transition(circle, {
            duration: 1200,
            ease: easeOutCubic,
            state: {
                cx: w * 0.85,
                fill: '#ff006e',
            },
        });

        await renderer.transition(circle, {
            duration: 1200,
            ease: easeInOutQuad,
            state: {
                cx: w * 0.5,
                cy: h * 0.3,
                fill: '#8338ec',
            },
        });

        await renderer.transition(circle, {
            duration: 1000,
            ease: easeOutCubic,
            state: {
                cx: w * 0.5,
                cy: h / 2,
                radius: Math.min(w, h) / 5,
                fill: '#06d6a0',
            },
        });
    })();
}

function runLineChart(ctx: TerminalContext) {
    menuState = 'running';

    createLineChart(ctx, {
        data: [
            { day: 'Mon', high: 24, low: 14 },
            { day: 'Tue', high: 27, low: 16 },
            { day: 'Wed', high: 22, low: 12 },
            { day: 'Thu', high: 29, low: 18 },
            { day: 'Fri', high: 31, low: 20 },
            { day: 'Sat', high: 26, low: 15 },
            { day: 'Sun', high: 23, low: 13 },
        ],
        key: 'day',
        series: [
            { id: 'high', label: 'High', value: 'high', markers: true },
            { id: 'low', label: 'Low', value: 'low', markers: true },
        ],
        grid: true,
        tooltip: false,
        animation: { duration: 2000 },
        padding: { top: 10, right: 10, bottom: 10, left: 10 },
    });
}

function runBarChart(ctx: TerminalContext) {
    menuState = 'running';

    createBarChart(ctx, {
        data: [
            { day: 'Mon', sales: 42, returns: 8 },
            { day: 'Tue', sales: 78, returns: 12 },
            { day: 'Wed', sales: 55, returns: 5 },
            { day: 'Thu', sales: 91, returns: 15 },
            { day: 'Fri', sales: 63, returns: 9 },
            { day: 'Sat', sales: 35, returns: 4 },
            { day: 'Sun', sales: 48, returns: 7 },
        ],
        key: 'day',
        series: [
            { id: 'sales', label: 'Sales', value: 'sales' },
            { id: 'returns', label: 'Returns', value: 'returns' },
        ],
        grid: true,
        tooltip: false,
        animation: { duration: 2000 },
        padding: { top: 10, right: 10, bottom: 10, left: 10 },
    });
}

function runStockChart(ctx: TerminalContext) {
    menuState = 'running';

    createStockChart(ctx, {
        data: [
            { date: 'Mar 3', open: 171, high: 175, low: 169, close: 174, vol: 48000 },
            { date: 'Mar 4', open: 174, high: 178, low: 172, close: 176, vol: 52000 },
            { date: 'Mar 5', open: 176, high: 180, low: 174, close: 178, vol: 61000 },
            { date: 'Mar 6', open: 178, high: 179, low: 170, close: 172, vol: 73000 },
            { date: 'Mar 7', open: 172, high: 174, low: 168, close: 170, vol: 65000 },
            { date: 'Mar 10', open: 170, high: 176, low: 169, close: 175, vol: 58000 },
            { date: 'Mar 11', open: 175, high: 182, low: 174, close: 181, vol: 71000 },
            { date: 'Mar 12', open: 181, high: 185, low: 179, close: 183, vol: 67000 },
        ],
        key: 'date',
        open: 'open',
        high: 'high',
        low: 'low',
        close: 'close',
        volume: 'vol',
        showVolume: true,
        grid: true,
        tooltip: false,
        animation: { duration: 2000 },
        padding: { top: 10, right: 10, bottom: 10, left: 10 },
    });
}

function runGanttChart(ctx: TerminalContext) {
    menuState = 'running';

    const now = new Date();
    const day = (offset: number) => {
        const d = new Date(now);
        d.setDate(d.getDate() + offset);
        return d;
    };

    createGanttChart(ctx, {
        data: [
            { id: '1', task: 'Research', start: day(-5), end: day(-1), progress: 1 },
            { id: '2', task: 'Design', start: day(-2), end: day(3), progress: 0.6 },
            { id: '3', task: 'Develop', start: day(1), end: day(10), progress: 0.2 },
            { id: '4', task: 'Testing', start: day(8), end: day(14), progress: 0 },
            { id: '5', task: 'Deploy', start: day(13), end: day(16), progress: 0 },
        ],
        key: 'id',
        label: 'task',
        start: 'start',
        end: 'end',
        progress: 'progress',
        tooltip: false,
        animation: { duration: 2000 },
        padding: { top: 10, right: 10, bottom: 10, left: 10 },
    });
}

function handleInput(term: any, ctx: TerminalContext, key: string) {
    if (menuState === 'running') {
        // Any key returns to main menu
        ctx.destroy();
        rebuildContext();
        if (terminal && context) {
            showMainMenu(terminal);
        }
        return;
    }

    // Handle backspace
    if (key === '\x7f') {
        if (inputBuffer.length > 0) {
            inputBuffer = inputBuffer.slice(0, -1);
            term.write('\b \b');
        }
        return;
    }

    // Handle Enter
    if (key === '\r') {
        const choice = inputBuffer.trim();
        term.write('\r\n');

        if (menuState === 'main') {
            switch (choice) {
                case '1':
                    runBasicDemo(ctx);
                    return;
                case '2':
                    runAnimationDemo(ctx);
                    return;
                case '3':
                    showChartMenu(term);
                    return;
                default:
                    writeLine(term, '  \x1b[31mInvalid selection\x1b[0m');
                    writeLine(term, '');
                    term.write('  \x1b[1;32m>\x1b[0m ');
                    inputBuffer = '';
                    return;
            }
        }

        if (menuState === 'chart') {
            switch (choice) {
                case '0':
                    showMainMenu(term);
                    return;
                case '1':
                    runLineChart(ctx);
                    return;
                case '2':
                    runBarChart(ctx);
                    return;
                case '3':
                    runStockChart(ctx);
                    return;
                case '4':
                    runGanttChart(ctx);
                    return;
                default:
                    writeLine(term, '  \x1b[31mInvalid selection\x1b[0m');
                    writeLine(term, '');
                    term.write('  \x1b[1;32m>\x1b[0m ');
                    inputBuffer = '';
                    return;
            }
        }
    }

    // Regular character
    if (key >= ' ' && key <= '~') {
        inputBuffer += key;
        term.write(key);
    }
}

function rebuildContext() {
    if (!terminal) return;

    const term = terminal;

    const state = {
        columns: term.cols,
        rows: term.rows,
    };

    termOutput = {
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

    rasterizer = new BrailleRasterizer(state.columns, state.rows);
    context = new TerminalContext(termOutput, { rasterizer });
}

onMounted(async () => {
    if (!terminalContainer.value) return;

    const [{ Terminal }, { FitAddon }] = await Promise.all([
        import('@xterm/xterm'),
        import('@xterm/addon-fit'),
    ]);

    import('@xterm/xterm/css/xterm.css');

    terminal = new Terminal({
        cursorBlink: true,
        cursorStyle: 'underline',
        disableStdin: false,
        fontFamily: 'monospace',
        fontSize: 14,
        theme: {
            background: '#000000',
            foreground: '#e0e0e0',
        },
    });

    fitAddon = new FitAddon();
    terminal.loadAddon(fitAddon);
    terminal.open(terminalContainer.value);
    fitAddon.fit();

    rebuildContext();

    const term = terminal;

    term.onData((data: string) => {
        if (context) {
            handleInput(term, context, data);
        }
    });

    showMainMenu(term);

    const observer = new ResizeObserver(() => {
        fitAddon?.fit();
    });

    observer.observe(terminalContainer.value);
});

onUnmounted(() => {
    context?.destroy();
    terminal?.dispose();
});
</script>

<style lang="scss">
.terminal-demo {
    display: flex;
    flex-direction: column;
    gap: 1.5rem;
    width: 100%;
    max-width: 100%;
    padding: 2rem 2.5rem;
    margin: 0 auto;
    box-sizing: border-box;
}

.terminal-demo__header {
    margin-bottom: 0.5rem;
}

.terminal-demo__title {
    margin: 0;
    font-size: 1.75rem;
    font-weight: 700;
    color: var(--vp-c-text-1);
    line-height: 1.2;
}

.terminal-demo__subtitle {
    margin: 0.375rem 0 0;
    font-size: 0.9375rem;
    color: var(--vp-c-text-2);
}

.terminal-demo__viewport {
    border: 1px solid var(--vp-c-divider);
    border-radius: 12px;
    overflow: hidden;
}

.terminal-demo__chrome {
    display: flex;
    align-items: center;
    gap: 6px;
    padding: 10px 14px;
    background: #1a1a1a;
    border-bottom: 1px solid #333;
}

.terminal-demo__dot {
    width: 12px;
    height: 12px;
    border-radius: 50%;

    &--red {
        background: #ff5f56;
    }

    &--yellow {
        background: #ffbd2e;
    }

    &--green {
        background: #27c93f;
    }
}

.terminal-demo__body {
    height: 600px;
    background: #000000;

    .xterm {
        padding: 0.5rem;
        height: 100%;
    }
}
</style>
