import type {
    BaseState,
} from '@ripl/core';

/**
 * Returns the default drawing state a fresh {@link ReactNativeSkiaContext} starts from.
 *
 * React Native has no DOM `CanvasRenderingContext2D` to read live defaults from (the way the browser
 * backend does), so — like `@ripl/node` — the canonical Canvas 2D defaults are spelled out here and
 * also registered on the platform {@link factory} as `getDefaultState`.
 *
 * @returns A complete {@link BaseState} with canvas-standard defaults.
 */
export function getDefaultState(): BaseState {
    return {
        fill: '#000000',
        filter: 'none',
        direction: 'inherit',
        font: '12px sans-serif',
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
