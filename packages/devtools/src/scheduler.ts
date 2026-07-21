import {
    PROPS_FLUSH_INTERVAL,
} from './constants';

type IdleCallbackScheduler = (callback: () => void) => number;
type IdleCallbackCanceller = (handle: number) => void;

/**
 * Debounces full tree snapshots: {@link SnapshotScheduler.markDirty} schedules a single
 * serialize-and-send pass on the next idle period, and the pass's chunk-posting steps run one
 * per macrotask so large trees never block a frame.
 */
export interface SnapshotScheduler {
    /**
     * Requests a fresh snapshot pass. Repeat calls while a pass is already scheduled coalesce
     * into that pass; a call while a previous pass's chunk chain is still posting cancels the
     * in-flight chain so the newer snapshot supersedes it.
     */
    markDirty(): void;
    /** Cancels any scheduled pass and any in-flight chunk chain without disposing the scheduler. */
    cancel(): void;
    /** Cancels all pending work and permanently disables the scheduler. */
    dispose(): void;
}

/**
 * Creates a {@link SnapshotScheduler}. The `produce` callback serializes the tree and sends the
 * snapshot's begin message synchronously, returning the remaining steps (chunk and end message
 * sends) which the scheduler then runs one per macrotask.
 *
 * @param produce - Serializes the current tree, sends the begin message, and returns the follow-up steps.
 * @returns The scheduler.
 */
export function createSnapshotScheduler(produce: () => (() => void)[]): SnapshotScheduler {
    let disposed = false;
    let idleCallbackHandle: number | undefined;
    let idleTimeoutHandle: ReturnType<typeof setTimeout> | undefined;
    let chainHandle: ReturnType<typeof setTimeout> | undefined;
    let queue: (() => void)[] = [];

    const cancelChain = () => {
        if (chainHandle !== undefined) {
            clearTimeout(chainHandle);
            chainHandle = undefined;
        }

        queue = [];
    };

    const cancelScheduled = () => {
        if (idleCallbackHandle !== undefined) {
            const cancelIdle = (globalThis as { cancelIdleCallback?: IdleCallbackCanceller }).cancelIdleCallback;

            cancelIdle?.(idleCallbackHandle);
            idleCallbackHandle = undefined;
        }

        if (idleTimeoutHandle !== undefined) {
            clearTimeout(idleTimeoutHandle);
            idleTimeoutHandle = undefined;
        }
    };

    const runChainStep = () => {
        chainHandle = undefined;

        const step = queue.shift();

        step?.();

        if (queue.length) {
            chainHandle = setTimeout(runChainStep, 0);
        }
    };

    const runPass = () => {
        idleCallbackHandle = undefined;
        idleTimeoutHandle = undefined;

        // Copy so draining the queue never mutates the array the producer returned.
        queue = produce().slice();

        if (queue.length) {
            chainHandle = setTimeout(runChainStep, 0);
        }
    };

    const markDirty = () => {
        if (disposed) {
            return;
        }

        cancelChain();

        if (idleCallbackHandle !== undefined || idleTimeoutHandle !== undefined) {
            return;
        }

        const requestIdle = (globalThis as { requestIdleCallback?: IdleCallbackScheduler }).requestIdleCallback;

        if (requestIdle) {
            idleCallbackHandle = requestIdle(runPass);
        } else {
            idleTimeoutHandle = setTimeout(runPass, 0);
        }
    };

    const cancel = () => {
        cancelScheduled();
        cancelChain();
    };

    return {
        markDirty,
        cancel,
        dispose: () => {
            disposed = true;
            cancel();
        },
    };
}

/**
 * Coalesces per-element property change notifications: pushes buffer element ids, and a timer
 * that only runs while the buffer is non-empty flushes them in a single batch every
 * `PROPS_FLUSH_INTERVAL` milliseconds.
 */
export interface PropsCoalescer {
    /** Buffers an element id for the next flush, starting the flush timer if it isn't running. */
    push(elementId: string): void;
    /** Drops all buffered ids and stops the flush timer without disposing the coalescer. */
    clear(): void;
    /** Clears all pending work and permanently disables the coalescer. */
    dispose(): void;
}

/**
 * Creates a {@link PropsCoalescer} that invokes `flush` with the deduplicated element ids
 * buffered since the previous flush.
 *
 * @param flush - Receives the buffered element ids once per flush interval.
 * @returns The coalescer.
 */
export function createPropsCoalescer(flush: (elementIds: string[]) => void): PropsCoalescer {
    let disposed = false;
    let timerHandle: ReturnType<typeof setTimeout> | undefined;

    const buffer = new Set<string>();

    const flushBuffer = () => {
        timerHandle = undefined;

        const elementIds = Array.from(buffer);

        buffer.clear();

        if (elementIds.length) {
            flush(elementIds);
        }
    };

    const clear = () => {
        buffer.clear();

        if (timerHandle !== undefined) {
            clearTimeout(timerHandle);
            timerHandle = undefined;
        }
    };

    return {
        clear,
        push: elementId => {
            if (disposed) {
                return;
            }

            buffer.add(elementId);

            if (timerHandle === undefined) {
                timerHandle = setTimeout(flushBuffer, PROPS_FLUSH_INTERVAL);
            }
        },
        dispose: () => {
            disposed = true;
            clear();
        },
    };
}
