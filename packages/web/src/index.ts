import {
    createContext,
} from '@ripl/canvas';

import {
    factory,
} from '@ripl/core';

import type {
    BaseState,
    MeasureTextOptions,
} from '@ripl/core';

import {
    functionCache,
} from '@ripl/utilities';

const getRefContext = functionCache(() => {
    return document.createElement('canvas').getContext('2d')!;
});

function getDefaultState(): BaseState {
    const ctx = getRefContext();

    return {
        fill: ctx.fillStyle,
        filter: ctx.filter,
        direction: ctx.direction,
        font: ctx.font,
        fontKerning: ctx.fontKerning,
        opacity: ctx.globalAlpha,
        globalCompositeOperation: ctx.globalCompositeOperation,
        lineCap: ctx.lineCap,
        lineDash: ctx.getLineDash(),
        lineDashOffset: ctx.lineDashOffset,
        lineJoin: ctx.lineJoin,
        lineWidth: ctx.lineWidth,
        miterLimit: ctx.miterLimit,
        shadowBlur: ctx.shadowBlur,
        shadowColor: ctx.shadowColor,
        shadowOffsetX: ctx.shadowOffsetX,
        shadowOffsetY: ctx.shadowOffsetY,
        stroke: ctx.strokeStyle,
        textAlign: ctx.textAlign,
        textBaseline: ctx.textBaseline,
        zIndex: 0,
        translateX: 0,
        translateY: 0,
        transformScaleX: 1,
        transformScaleY: 1,
        rotation: 0,
        transformOriginX: 0,
        transformOriginY: 0,
    } as BaseState;
}

function domMeasureText(value: string, options?: MeasureTextOptions): TextMetrics {
    const context = getRefContext();

    context.save();
    context.font = options?.font ?? context.font;

    const result = context.measureText(value);

    context.restore();

    return result;
}

factory.set({
    requestAnimationFrame: (cb) => window.requestAnimationFrame(cb),
    cancelAnimationFrame: (handle) => window.cancelAnimationFrame(handle),
    now: () => performance.now(),
    get devicePixelRatio() {
        return window.devicePixelRatio;
    },
    getComputedStyle: (el) => window.getComputedStyle(el as Element),
    createContext,
    createElement: (tagName) => document.createElement(tagName),
    createElementNS: (namespace, tagName) => document.createElementNS(namespace, tagName),
    getDefaultState,
    measureText: domMeasureText,
});

export * from '@ripl/core';
export * from '@ripl/canvas';