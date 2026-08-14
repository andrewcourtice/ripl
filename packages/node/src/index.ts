import {
    factory,
    Navigator,
} from '@ripl/core';

import type {
    BaseState,
    MeasureTextOptions,
} from '@ripl/core';

import {
    BRAILLE_CELL_HEIGHT,
    BRAILLE_CELL_WIDTH,
    createContext,
} from '@ripl/terminal';

import type {
    TerminalContextOptions,
    TerminalOutput,
} from '@ripl/terminal';

import {
    functionCache,
    typeIsFunction,
} from '@ripl/utilities';

import {
    createTerminalOutput,
} from './output';

const DEFAULT_FONT_SIZE = 10;
const FRAME_INTERVAL = 16;
const FONT_SIZE_PATTERN = /(\d*\.?\d+)px/;

const TEXT_ALIGN_ANCHORS: Record<string, number> = {
    start: 0,
    left: 0,
    center: 0.5,
    end: 1,
    right: 1,
};

// One per process, not one per context: each `createTerminalOutput` registers its own `SIGWINCH` handler.
const getDefaultOutput = functionCache(createTerminalOutput);

function getDefaultState(): BaseState {
    return {
        fill: '#000000',
        filter: 'none',
        direction: 'inherit',
        font: '10px monospace',
        fontKerning: 'auto',
        opacity: 1,
        globalCompositeOperation: 'source-over',
        lineCap: 'butt',
        lineDash: [],
        lineDashOffset: 0,
        lineJoin: 'miter',
        lineWidth: 1,
        miterLimit: 10,
        shadowBlur: 0,
        shadowColor: 'rgba(0, 0, 0, 0)',
        shadowOffsetX: 0,
        shadowOffsetY: 0,
        stroke: '#000000',
        textAlign: 'start',
        textBaseline: 'alphabetic',
        zIndex: 0,
        translateX: 0,
        translateY: 0,
        transformScaleX: 1,
        transformScaleY: 1,
        rotation: 0,
        transformOriginX: 0,
        transformOriginY: 0,
    };
}

function getFontSize(font: string | undefined): number {
    const match = font ? FONT_SIZE_PATTERN.exec(font) : null;

    return match ? parseFloat(match[1]) : DEFAULT_FONT_SIZE;
}

/**
 * Measures text as the terminal paints it — one braille cell per character — scaled by the
 * requested font size.
 *
 * `TerminalContext.measureText` is the authority for anything already rendered; this is the
 * fallback core falls back to before an element's first paint, so the two have to agree at the
 * default font or every box jumps on the first frame. `textBaseline` is deliberately not modelled:
 * the terminal paints one cell per glyph with no baseline variation, so honouring it here would
 * manufacture a disagreement.
 */
function nodeMeasureText(value: string, options?: MeasureTextOptions): TextMetrics {
    const scale = getFontSize(options?.font) / DEFAULT_FONT_SIZE;
    const width = value.length * BRAILLE_CELL_WIDTH * scale;
    const height = BRAILLE_CELL_HEIGHT * scale;

    // `actualBoundingBox*` is measured from the alignment point, not from the start of the run.
    const anchor = TEXT_ALIGN_ANCHORS[options?.textAlign ?? 'start'] ?? 0;

    return {
        width,
        actualBoundingBoxAscent: height,
        actualBoundingBoxDescent: 0,
        actualBoundingBoxLeft: width * anchor,
        actualBoundingBoxRight: width * (1 - anchor),
        fontBoundingBoxAscent: height,
        fontBoundingBoxDescent: 0,
        alphabeticBaseline: 0,
        emHeightAscent: height,
        emHeightDescent: 0,
        hangingBaseline: height,
        ideographicBaseline: 0,
    } as TextMetrics;
}

function isTerminalOutput(target: unknown): target is TerminalOutput {
    return !!target && typeIsFunction((target as TerminalOutput).write);
}

function resolveOutput(target: unknown): TerminalOutput {
    if (isTerminalOutput(target)) {
        return target;
    }

    if (target) {
        console.warn('createContext: @ripl/node renders to the terminal, so the provided target is ignored. Pass a TerminalOutput to choose one.');
    }

    return getDefaultOutput();
}

/**
 * Minimal duck-typed element for the DOM helpers core reaches for off-platform. Core is written to
 * degrade — `interpolateImage` checks `getContext()` and the path helpers read a length — so the
 * stub answers those probes rather than throwing a raw `TypeError` at the first property access.
 */
function createNodeElement(tagName: string) {
    const attributes = new Map<string, string>();

    return {
        tagName,
        style: {},
        setAttribute: (name: string, value: string) => void attributes.set(name, value),
        getAttribute: (name: string) => attributes.get(name) ?? null,
        removeAttribute: (name: string) => void attributes.delete(name),
        getContext: () => null,
        getTotalLength: () => 0,
        getPointAtLength: () => ({
            x: 0,
            y: 0,
        }),
    };
}

factory.set({
    // Unref'd: the render loop re-arms every frame, so a ref'd timer keeps a static chart's process alive forever.
    requestAnimationFrame: (callback) => setTimeout(() => callback(performance.now()), FRAME_INTERVAL).unref() as unknown as number,
    cancelAnimationFrame: (handle) => clearTimeout(handle),
    now: () => performance.now(),
    devicePixelRatio: 1,
    getDefaultState,
    measureText: nodeMeasureText,
    createContext: (target, options) => createContext(
        resolveOutput(target),
        options as TerminalContextOptions
    ),
    // The terminal has no pointer, so the base navigator's view model is the whole of what it can offer.
    createNavigator: (_context, options) => new Navigator(options),
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    getComputedStyle: () => ({ font: '10px monospace' } as any),
    createElement: (tagName) => createNodeElement(tagName) as unknown as HTMLElement,
    createElementNS: (_namespace, tagName) => createNodeElement(tagName) as unknown as Element,
});

export { createTerminalOutput };

export * from '@ripl/core';
export * from '@ripl/terminal';
