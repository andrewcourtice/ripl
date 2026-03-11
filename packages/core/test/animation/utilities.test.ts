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
