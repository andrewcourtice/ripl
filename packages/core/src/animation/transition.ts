import {
    easeLinear,
} from './ease';

import {
    min,
} from '../math';

import {
    Task,
} from '../task';

import type {
    TransitionCallback,
    TransitionOptions,
} from './types';

export class Transition extends Task {



}

export function transition(callback: TransitionCallback, options?: Partial<TransitionOptions>): Promise<void> {
    const {
        duration,
        ease,
        loop,
    } = {
        duration: 1000,
        ease: easeLinear,
        loop: false,
        ...options,
    } as TransitionOptions;

    return new Promise<void>(resolve => {
        let start = performance.now();

        const tick = () => {
            const current = performance.now();
            const elapsed = current - start;
            const position = min(elapsed / duration, 1);
            const time = ease(position);

            callback(time);

            if (elapsed < duration) {
                return requestAnimationFrame(tick);
            }

            if (loop) {
                start = performance.now();
                requestAnimationFrame(tick);
            } else {
                resolve();
            }
        };

        requestAnimationFrame(tick);
    });
}