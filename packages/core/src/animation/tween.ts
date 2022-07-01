import {
    min,
} from '../math/number';

import {
    Ease,
    easeLinear,
} from './ease';

export interface TweenOptions {
    duration: number;
    ease: Ease;
    //delay: number | ((index: number) => number);
}

export type TweenCallback = (time: number) => void;

export function tween(callback: TweenCallback, options?: Partial<TweenOptions>): Promise<void> {
    const {
        duration,
        ease,
    } = {
        duration: 1000,
        ease: easeLinear,
        ...options,
    } as TweenOptions;

    return new Promise<void>(resolve => {
        const start = performance.now();

        const tick = () => {
            const current = performance.now();
            const elapsed = current - start;
            const position = min(elapsed / duration, 1);
            const time = ease(position);

            callback(time);

            if (elapsed < duration) {
                requestAnimationFrame(tick);
            } else {
                resolve();
            }
        };

        requestAnimationFrame(tick);
    });
}