import {
    AnyFunction,
} from '@ripl/utilities';

/** Creates a debounced `requestAnimationFrame` wrapper that cancels any pending frame before scheduling a new one. */
export function createFrameBuffer() {
    let handle: number | undefined;

    return (callback: AnyFunction) => {
        if (handle) {
            cancelAnimationFrame(handle);
            handle = undefined;
        }

        handle = requestAnimationFrame(callback);
    };
}