import {
    CanvasContext,
} from './canvas';

import {
    SVGContext,
} from './svg';

import type {
    Context,
    ContextOptions,
} from './types';

export * from './canvas';
export * from './types';

export function createContext(target: string | HTMLElement, options?: ContextOptions): Context {
    const {
        type = 'canvas',
    } = options || {};

    if (type === 'svg') {
        return new SVGContext(target);
    }

    return new CanvasContext(target);
}