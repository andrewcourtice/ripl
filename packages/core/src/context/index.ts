import {
    CanvasContext,
} from './canvas';

import {
    SVGContext,
} from './svg';

import type {
    Context,
    ContextOptions,
} from './base';

export * from './base';
export * from './canvas';
export * from './svg';

export function createContext(target: string | HTMLElement, options?: ContextOptions): Context {
    const {
        type = 'canvas',
    } = options || {};

    if (type === 'svg') {
        return new SVGContext(target);
    }

    return new CanvasContext(target);
}