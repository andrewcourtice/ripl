import {
    factory,
} from '@ripl/core';

import type {
    BaseState,
} from '@ripl/core';

import {
    createContext,
} from '@ripl/terminal';

import type {
    TerminalContextOptions,
} from '@ripl/terminal';

import {
    createTerminalOutput,
} from './output';

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

function nodeMeasureText(value: string): TextMetrics {
    return {
        width: value.length * 8,
        actualBoundingBoxAscent: 8,
        actualBoundingBoxDescent: 2,
        actualBoundingBoxLeft: 0,
        actualBoundingBoxRight: value.length * 8,
        fontBoundingBoxAscent: 10,
        fontBoundingBoxDescent: 2,
        alphabeticBaseline: 0,
        emHeightAscent: 8,
        emHeightDescent: 2,
        hangingBaseline: 8,
        ideographicBaseline: -2,
    } as TextMetrics;
}

factory.set({
    requestAnimationFrame: (cb) => setTimeout(cb, 16) as unknown as number,
    cancelAnimationFrame: (handle) => clearTimeout(handle),
    now: () => performance.now(),
    devicePixelRatio: 1,
    getDefaultState,
    measureText: nodeMeasureText,
    createContext: (target, options) => createContext(
        createTerminalOutput(),
        options as TerminalContextOptions
    ),
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    getComputedStyle: () => ({ font: '10px monospace' } as any),
    createElement: () => ({}) as HTMLElement,
    createElementNS: () => ({}) as Element,
});

export { createTerminalOutput };

export * from '@ripl/core';
export * from '@ripl/terminal';
