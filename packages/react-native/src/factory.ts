import {
    factory,
} from '@ripl/core';

import {
    getDefaultState,
} from './defaults';

import {
    measureSkiaText,
} from './font';

import {
    ReactNativeSkiaContext,
} from './context';

/**
 * Registers React Native implementations of every platform primitive Ripl's core needs on the global
 * {@link factory} — the animation clock, device pixel ratio, default drawing state, text measurement,
 * and context construction. Mirrors `@ripl/node`/`@ripl/web`, adapted for React Native (Skia).
 *
 * `devicePixelRatio` is fixed at `1` because Skia's `<Canvas>` renders at device resolution itself, so
 * Ripl works entirely in logical pixels. The binding is applied unconditionally so it overrides the
 * canvas `createContext` that `@ripl/charts` self-registers at import.
 */
export function bindReactNativeFactory(): void {
    factory.set({
        requestAnimationFrame: callback => globalThis.requestAnimationFrame(callback),
        cancelAnimationFrame: handle => globalThis.cancelAnimationFrame(handle),
        now: () => (typeof performance !== 'undefined' && performance.now ? performance.now() : Date.now()),
        devicePixelRatio: 1,
        getDefaultState,
        measureText: (text, options) => measureSkiaText(text, {
            font: options?.font,
        }),
        createContext: (_target, options) => new ReactNativeSkiaContext(options),
        getComputedStyle: () => ({
            font: getDefaultState().font,
        }),
        createElement: () => ({}) as HTMLElement,
        createElementNS: () => ({}) as Element,
    });
}
