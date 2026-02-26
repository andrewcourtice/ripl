import {
    easeLinear,
} from './ease';

import {
    clamp,
} from '../math';

import {
    Task,
} from '../task';

import type {
    Ease,
    TransitionCallback,
    TransitionDirection,
    TransitionOptions,
} from './types';

export function computeTransitionTime(elapsed: number, duration: number, ease: Ease, direction: TransitionDirection): number {
    const position = clamp(elapsed / duration, 0, 1);
    const time = ease(direction === 'reverse' ? 1 - position : position);

    return time;
}

export class Transition extends Task {



}

export function transition(callback: TransitionCallback, options?: Partial<TransitionOptions>): Transition {
    const {
        duration,
        ease,
        loop,
        delay,
        direction,
    } = {
        duration: 1000,
        ease: easeLinear,
        loop: false,
        delay: 0,
        direction: 'forward',
        ...options,
    } as TransitionOptions;

    return new Transition((resolve, _reject, onAbort) => {
        let start = performance.now() + delay;
        let handle: number | undefined;

        onAbort(() => {
            if (handle !== undefined) {
                cancelAnimationFrame(handle);
                handle = undefined;
            }
        });

        const tick = () => {
            const current = performance.now();
            const elapsed = current - start;

            if (elapsed < 0) {
                handle = requestAnimationFrame(tick);
                return;
            }

            const time = computeTransitionTime(elapsed, duration, ease, direction);

            callback(time);

            if (elapsed < duration) {
                handle = requestAnimationFrame(tick);
                return;
            }

            if (loop) {
                start = performance.now();
                handle = requestAnimationFrame(tick);
            } else {
                handle = undefined;
                resolve();
            }
        };

        handle = requestAnimationFrame(tick);
    });
}