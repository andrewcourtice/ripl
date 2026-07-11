import {
    easeLinear,
} from './ease';

import {
    clamp,
} from '../math';

import {
    factory,
} from '../core/factory';

import {
    Task,
} from '../task';

import type {
    TaskExecutor,
} from '../task';

import type {
    Ease,
    TransitionCallback,
    TransitionDirection,
    TransitionOptions,
} from './types';

interface TransitionHooks {
    onPause: () => void;
    onPlay: () => void;
    onSeek: (position: number) => void;
}

/** Computes the eased time value for a transition given elapsed time, duration, easing function, and direction. */
export function computeTransitionTime(elapsed: number, duration: number, ease: Ease, direction: TransitionDirection): number {
    const position = clamp(elapsed / duration, 0, 1);
    const time = ease(direction === 'reverse' ? 1 - position : position);

    return time;
}

/** A `Task`-based animation that drives a callback over time with easing, looping, and abort support. */
export class Transition extends Task {

    private _paused = false;
    private _hooks?: TransitionHooks;

    /** A factory function that creates a new `Transition` running in the opposite direction. Set by the transition mechanism that created this instance. */
    public inverse!: () => Transition;

    constructor(executor: TaskExecutor<void>, hooks?: TransitionHooks) {
        super(executor);
        this._hooks = hooks;
    }

    /** Whether the transition is currently paused. */
    public get paused(): boolean {
        return this._paused;
    }

    /** Pauses the transition without resolving the promise. */
    public pause(): this {
        if (!this._paused) {
            this._paused = true;
            this._hooks?.onPause();
        }

        return this;
    }

    /** Resumes a paused transition from where it left off. */
    public play(): this {
        if (this._paused) {
            this._paused = false;
            this._hooks?.onPlay();
        }

        return this;
    }

    /** Seeks to a normalised position (0–1) and pauses. */
    public seek(position: number): this {
        const clamped = clamp(position, 0, 1);

        this._paused = true;
        this._hooks?.onSeek(clamped);

        return this;
    }

}

/** Creates and starts a frame-driven transition that invokes the callback with the eased time on each animation frame. */
export function transition(callback: TransitionCallback, options?: Partial<TransitionOptions>): Transition {
    const resolved = {
        duration: 1000,
        ease: easeLinear,
        loop: false,
        delay: 0,
        direction: 'forward',
        ...options,
    } as TransitionOptions;

    const {
        duration,
        ease,
        loop,
        delay,
        direction,
    } = resolved;

    let start = 0;
    let handle: number | undefined;
    let pausedElapsed = 0;
    let currentDirection = direction;

    let tick: () => void;

    const hooks: TransitionHooks = {
        onPause() {
            pausedElapsed = factory.now() - start;

            if (handle !== undefined) {
                factory.cancelAnimationFrame(handle);
                handle = undefined;
            }
        },
        onPlay() {
            start = factory.now() - pausedElapsed;
            handle = factory.requestAnimationFrame(tick);
        },
        onSeek(position) {
            pausedElapsed = position * duration;

            const time = computeTransitionTime(pausedElapsed, duration, ease, currentDirection);

            callback(time);

            if (handle !== undefined) {
                factory.cancelAnimationFrame(handle);
                handle = undefined;
            }
        },
    };

    const instance = new Transition((resolve, _reject, onAbort) => {
        start = factory.now() + delay;

        onAbort(() => {
            if (handle !== undefined) {
                factory.cancelAnimationFrame(handle);
                handle = undefined;
            }
        });

        tick = () => {
            const current = factory.now();
            const elapsed = current - start;

            if (elapsed < 0) {
                handle = factory.requestAnimationFrame(tick);
                return;
            }

            const time = computeTransitionTime(elapsed, duration, ease, currentDirection);

            callback(time);

            if (elapsed < duration) {
                handle = factory.requestAnimationFrame(tick);
                return;
            }

            if (loop) {
                if (loop === 'alternate') {
                    currentDirection = currentDirection === 'forward' ? 'reverse' : 'forward';
                }

                start = factory.now();
                handle = factory.requestAnimationFrame(tick);
            } else {
                handle = undefined;
                resolve();
            }
        };

        handle = factory.requestAnimationFrame(tick);
    }, hooks);

    instance.inverse = () => transition(
        callback,
        {
            ...resolved,
            direction: direction === 'reverse' ? 'forward' : 'reverse',
        }
    );

    return instance;
}