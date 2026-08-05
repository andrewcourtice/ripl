import {
    factory,
} from '../core/factory';

import type {
    AnyFunction,
} from '@ripl/utilities';

/**
 * A debounced `requestAnimationFrame` scheduler. Calling it schedules a callback for the next
 * frame, replacing any frame already pending, so a burst of calls within one frame collapses
 * into a single callback.
 */
export interface FrameBuffer {
    /**
     * Schedules a callback for the next animation frame, cancelling any frame already pending.
     * @param callback - The function to run on the next frame.
     */
    (callback: AnyFunction): void;
    /**
     * Cancels the pending frame, if any, without scheduling a replacement. Call this on teardown
     * so work scheduled by the last interaction cannot run against a destroyed target.
     */
    cancel(): void;
}

/**
 * Creates a debounced `requestAnimationFrame` wrapper that cancels any pending frame before
 * scheduling a new one. The returned scheduler carries a {@link FrameBuffer.cancel} handle so a
 * pending frame can be dropped outright.
 */
export function createFrameBuffer(): FrameBuffer {
    let handle: number | undefined;

    const cancel = () => {
        if (handle) {
            factory.cancelAnimationFrame(handle);
            handle = undefined;
        }
    };

    const schedule = (callback: AnyFunction) => {
        cancel();

        handle = factory.requestAnimationFrame(callback);
    };

    return Object.assign(schedule, { cancel });
}
