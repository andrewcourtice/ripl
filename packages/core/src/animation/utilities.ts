import {
    AnyFunction,
} from '@ripl/utilities';

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