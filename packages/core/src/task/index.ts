import {
    AnyFunction,
    setForEach,
} from '@ripl/utilities';

export type TaskResolve<TResult> = (value: TResult | PromiseLike<TResult>) => void;
export type TaskReject = (reason?: unknown) => unknown;
export type TaskAbortCallback = (reason?: unknown) => void;

export type TaskExecutor<TResult> = (
    resolve: TaskResolve<TResult>,
    reject: TaskReject,
    onAbort: (callback: TaskAbortCallback) => void,
    controller: AbortController
) => void;

export class TaskAbortError extends Error {

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    public reason: any;

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    constructor(reason?: any) {
        super('Task aborted');
        this.reason = reason;
    }

}

export class Task<TResult = void> extends Promise<TResult> {

    private controller: AbortController;
    private abortReason: unknown;

    constructor(executor: TaskExecutor<TResult>, controller: AbortController = new AbortController()) {
        if (controller.signal.aborted) {
            throw new Error('Cannot attach task to an already aborted controller');
        }

        const listeners = new Set<TaskAbortCallback>();

        let isAborting = false;
        let finaliser: AnyFunction | undefined;

        super((_resolve, _reject) => {
            const resolve = (value: TResult | PromiseLike<TResult>) => execResolution(() => _resolve(value));
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            const reject = (reason?: any) => execResolution(() => _reject(reason));
            const onAbort = (callback: TaskAbortCallback) => listeners.add(callback);
            const dispose = () => controller.signal.removeEventListener('abort', abort);

            const execResolution = (resolution: AnyFunction) => {
                if (isAborting) {
                    finaliser = finaliser || resolution;
                } else {
                    dispose();
                    resolution();
                }
            };

            const abort = () => {
                isAborting = true;

                setForEach(listeners, listener => {
                    try {
                        listener(this.abortReason);
                    } finally {
                        listeners.delete(listener);
                    }
                });

                isAborting = false;

                const finalise = finaliser || (reason => _reject(new TaskAbortError(reason)));

                dispose();
                finalise(this.abortReason);
            };

            controller.signal.addEventListener('abort', abort);

            executor(resolve, reject, onAbort, controller);
        });

        this.controller = controller;
    }

    public get signal(): AbortSignal {
        return this.controller.signal;
    }

    public get hasAborted(): boolean {
        return this.signal.aborted;
    }

    public abort(reason?: unknown): this {
        this.abortReason = reason;
        this.controller.abort();

        return this;
    }

}
