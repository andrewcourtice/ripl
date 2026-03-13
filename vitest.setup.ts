import {
    factory,
} from './packages/core/src/core/factory';

factory.set({
    requestAnimationFrame: (cb: FrameRequestCallback) => window.requestAnimationFrame(cb),
    cancelAnimationFrame: (handle: number) => window.cancelAnimationFrame(handle),
    now: () => performance.now(),
    get devicePixelRatio() {
        return window.devicePixelRatio ?? 1;
    },
    getComputedStyle: (el: unknown) => window.getComputedStyle(el as Element),
    createElement: (tagName: string) => document.createElement(tagName),
    createElementNS: (namespace: string, tagName: string) => document.createElementNS(namespace, tagName),
    getDefaultState: () => {
        const canvas = document.createElement('canvas');
        const ctx = canvas.getContext('2d')!;

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
        } as ReturnType<typeof factory.getDefaultState>;
    },
    measureText: (text, options) => {
        const canvas = document.createElement('canvas');
        const ctx = canvas.getContext('2d')!;

        ctx.save();
        ctx.font = options?.font ?? ctx.font;

        const result = ctx.measureText(text);

        ctx.restore();

        return result;
    },
});
