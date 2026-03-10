import {
    describe,
    expect,
    test,
    vi,
} from 'vitest';

import {
    Task,
    TaskAbortError,
} from '../../src';

describe('TaskAbortError', () => {

    test('Should be an instance of Error', () => {
        const error = new TaskAbortError();
        expect(error).toBeInstanceOf(Error);
    });

    test('Should have message "Task aborted"', () => {
        const error = new TaskAbortError();
        expect(error.message).toBe('Task aborted');
    });

    test('Should store the abort reason', () => {
        const reason = { code: 42 };
        const error = new TaskAbortError(reason);
        expect(error.reason).toBe(reason);
    });

    test('Should default reason to undefined', () => {
        const error = new TaskAbortError();
        expect(error.reason).toBeUndefined();
    });

});

describe('Task', () => {

    test('Should construct and resolve', async () => {
        const task = new Task<number>((resolve) => {
            resolve(42);
        });

        await expect(task).resolves.toBe(42);
    });

    test('Should construct and reject', async () => {
        const task = new Task((_, reject) => {
            reject(new Error('fail'));
        });

        await expect(task).rejects.toThrow('fail');
    });

    test('Should expose signal from controller', () => {
        const task = new Task(() => {});
        expect(task.signal).toBeInstanceOf(AbortSignal);
        expect(task.signal.aborted).toBe(false);
    });

    test('Should report hasAborted as false initially', () => {
        const task = new Task(() => {});
        expect(task.hasAborted).toBe(false);
    });

    test('Should abort and reject with TaskAbortError', async () => {
        const task = new Task(() => {});

        const rejection = task.catch(error => error);
        task.abort();

        const error = await rejection;
        expect(error).toBeInstanceOf(TaskAbortError);
        expect(task.hasAborted).toBe(true);
    });

    test('Should pass abort reason to TaskAbortError', async () => {
        const task = new Task(() => {});

        const rejection = task.catch(error => error);
        task.abort('cancelled');

        const error = await rejection;
        expect(error).toBeInstanceOf(TaskAbortError);
        expect(error.reason).toBe('cancelled');
    });

    test('Should fire onAbort callback on abort', async () => {
        const onAbortSpy = vi.fn();

        const task = new Task((_, __, onAbort) => {
            onAbort(onAbortSpy);
        });

        const rejection = task.catch(() => {});
        task.abort('reason');

        await rejection;
        expect(onAbortSpy).toHaveBeenCalledOnce();
        expect(onAbortSpy).toHaveBeenCalledWith('reason');
    });

    test('Should fire multiple onAbort callbacks', async () => {
        const spy1 = vi.fn();
        const spy2 = vi.fn();

        const task = new Task((_, __, onAbort) => {
            onAbort(spy1);
            onAbort(spy2);
        });

        const rejection = task.catch(() => {});
        task.abort();

        await rejection;
        expect(spy1).toHaveBeenCalledOnce();
        expect(spy2).toHaveBeenCalledOnce();
    });

    test('Should return this from abort() for chaining', () => {
        const task = new Task(() => {});
        task.catch(() => {});

        const result = task.abort();
        expect(result).toBe(task);
    });

    test('Should accept an external AbortController', async () => {
        const controller = new AbortController();

        const task = new Task(() => {}, controller);

        const rejection = task.catch(error => error);
        controller.abort();

        const error = await rejection;
        expect(error).toBeInstanceOf(TaskAbortError);
    });

    test('Should throw if controller is already aborted', () => {
        const controller = new AbortController();
        controller.abort();

        expect(() => new Task(() => {}, controller)).toThrow(
            'Cannot attach task to an already aborted controller'
        );
    });

    test('Should use executor resolve over abort rejection when resolve is called during abort', async () => {
        const task = new Task<string>((resolve, _, onAbort) => {
            onAbort(() => resolve('resolved-during-abort'));
        });

        const rejection = task.catch(error => error);
        task.abort();

        const result = await rejection;
        // When resolve is called in onAbort, the finaliser captures it and uses it instead of rejecting
        expect(result).toBe('resolved-during-abort');
    });

    test('Should not fire abort callbacks after resolve', async () => {
        const onAbortSpy = vi.fn();

        const task = new Task<number>((resolve, _, onAbort) => {
            onAbort(onAbortSpy);
            resolve(1);
        });

        await task;

        // Aborting after resolution — the abort listener has been removed
        task.abort();
        expect(onAbortSpy).not.toHaveBeenCalled();
    });

    test('Should not fire abort callbacks after reject', async () => {
        const onAbortSpy = vi.fn();

        const task = new Task((_, reject, onAbort) => {
            onAbort(onAbortSpy);
            reject(new Error('fail'));
        });

        await task.catch(() => {});

        task.abort();
        expect(onAbortSpy).not.toHaveBeenCalled();
    });

    test('Should expose controller to executor', () => {
        let capturedController: AbortController | undefined;

        const task = new Task((_, __, ___, controller) => {
            capturedController = controller;
        });

        expect(capturedController).toBeInstanceOf(AbortController);
        expect(capturedController?.signal).toBe(task.signal);
    });

});
