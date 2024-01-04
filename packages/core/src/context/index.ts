import {
    CanvasContext,
} from './canvas';

import type {
    Context,
    ContextOptions,
} from './types';

export * from './canvas';
export * from './types';

export function createContext(target: string | Element, options?: ContextOptions): Context {
    const {
        type = 'canvas',
    } = options || {};

    return new CanvasContext(target);
}