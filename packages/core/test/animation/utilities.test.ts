import {
    afterEach,
    beforeEach,
    describe,
    expect,
    test,
    vi,
} from 'vitest';

import {
    createFrameBuffer,
} from '../../src';

describe('createFrameBuffer', () => {

    beforeEach(() => {
        vi.useFakeTimers();
    });

    afterEach(() => {
        vi.useRealTimers();
    });

    test('Should schedule callback via requestAnimationFrame', () => {
        const buffer = createFrameBuffer();
        const callback = vi.fn();

        buffer(callback);
        vi.advanceTimersToNextTimer();

        expect(callback).toHaveBeenCalledTimes(1);
    });

    test('Should cancel previous frame when called again', () => {
        const buffer = createFrameBuffer();
        const first = vi.fn();
        const second = vi.fn();

        buffer(first);
        buffer(second);
        vi.advanceTimersToNextTimer();

        expect(first).not.toHaveBeenCalled();
        expect(second).toHaveBeenCalledTimes(1);
    });

    test('Should cancel a pending frame', () => {
        const buffer = createFrameBuffer();
        const callback = vi.fn();

        buffer(callback);
        buffer.cancel();
        vi.advanceTimersToNextTimer();

        expect(callback).not.toHaveBeenCalled();
    });

    test('Should schedule again after a cancel', () => {
        const buffer = createFrameBuffer();
        const callback = vi.fn();

        buffer.cancel();
        buffer(callback);
        vi.advanceTimersToNextTimer();

        expect(callback).toHaveBeenCalledTimes(1);
    });

    test('Should tolerate a cancel with nothing pending', () => {
        const buffer = createFrameBuffer();

        expect(() => buffer.cancel()).not.toThrow();
    });

    test('Should allow multiple sequential calls after frames complete', () => {
        const buffer = createFrameBuffer();
        const first = vi.fn();
        const second = vi.fn();

        buffer(first);
        vi.advanceTimersToNextTimer();
        expect(first).toHaveBeenCalledTimes(1);

        buffer(second);
        vi.advanceTimersToNextTimer();
        expect(second).toHaveBeenCalledTimes(1);
    });

});
