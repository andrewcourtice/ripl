import {
    afterEach,
    beforeEach,
    describe,
    expect,
    test,
    vi,
} from 'vitest';

import {
    PROPS_FLUSH_INTERVAL,
} from '../src/constants';

import {
    createPropsCoalescer,
    createSnapshotScheduler,
} from '../src/scheduler';

describe('Scheduler', () => {

    beforeEach(() => {
        vi.useFakeTimers();
    });

    afterEach(() => {
        vi.useRealTimers();
        vi.unstubAllGlobals();
    });

    describe('Snapshot scheduler', () => {

        test('Should coalesce repeated markDirty calls into one pass', () => {
            const stepA = vi.fn();
            const stepB = vi.fn();
            const produce = vi.fn(() => [stepA, stepB]);
            const scheduler = createSnapshotScheduler(produce);

            scheduler.markDirty();
            scheduler.markDirty();
            scheduler.markDirty();

            vi.runAllTimers();

            expect(produce).toHaveBeenCalledTimes(1);
            expect(stepA).toHaveBeenCalledTimes(1);
            expect(stepB).toHaveBeenCalledTimes(1);
            expect(stepA.mock.invocationCallOrder[0]).toBeLessThan(stepB.mock.invocationCallOrder[0]);

            scheduler.dispose();
        });

        test('Should run chunk steps one per macrotask', () => {
            const stepA = vi.fn();
            const stepB = vi.fn();
            const scheduler = createSnapshotScheduler(() => [stepA, stepB]);

            scheduler.markDirty();

            vi.advanceTimersToNextTimer();

            expect(stepA).not.toHaveBeenCalled();

            vi.advanceTimersToNextTimer();

            expect(stepA).toHaveBeenCalledTimes(1);
            expect(stepB).not.toHaveBeenCalled();

            vi.advanceTimersToNextTimer();

            expect(stepB).toHaveBeenCalledTimes(1);

            scheduler.dispose();
        });

        test('Should cancel an in-flight chunk chain when marked dirty again', () => {
            const firstSteps = [vi.fn(), vi.fn(), vi.fn()];
            const secondSteps = [vi.fn(), vi.fn()];
            const produce = vi.fn()
                .mockReturnValueOnce(firstSteps)
                .mockReturnValueOnce(secondSteps);

            const scheduler = createSnapshotScheduler(produce);

            scheduler.markDirty();

            // Run the pass, then the first chunk step only.
            vi.advanceTimersToNextTimer();
            vi.advanceTimersToNextTimer();

            expect(firstSteps[0]).toHaveBeenCalledTimes(1);
            expect(firstSteps[1]).not.toHaveBeenCalled();

            scheduler.markDirty();

            vi.runAllTimers();

            expect(produce).toHaveBeenCalledTimes(2);
            expect(firstSteps[1]).not.toHaveBeenCalled();
            expect(firstSteps[2]).not.toHaveBeenCalled();
            expect(secondSteps[0]).toHaveBeenCalledTimes(1);
            expect(secondSteps[1]).toHaveBeenCalledTimes(1);

            scheduler.dispose();
        });

        test('Should use requestIdleCallback when available', () => {
            const requestIdleCallback = vi.fn((callback: () => void) => window.setTimeout(callback, 1));
            const cancelIdleCallback = vi.fn((handle: number) => window.clearTimeout(handle));

            vi.stubGlobal('requestIdleCallback', requestIdleCallback);
            vi.stubGlobal('cancelIdleCallback', cancelIdleCallback);

            const produce = vi.fn(() => []);
            const scheduler = createSnapshotScheduler(produce);

            scheduler.markDirty();

            expect(requestIdleCallback).toHaveBeenCalledTimes(1);

            vi.runAllTimers();

            expect(produce).toHaveBeenCalledTimes(1);

            scheduler.markDirty();
            scheduler.dispose();

            expect(cancelIdleCallback).toHaveBeenCalledTimes(1);

            vi.runAllTimers();

            expect(produce).toHaveBeenCalledTimes(1);
        });

        test('Should cancel all pending work on dispose', () => {
            const produce = vi.fn(() => [vi.fn()]);
            const scheduler = createSnapshotScheduler(produce);

            scheduler.markDirty();
            scheduler.dispose();

            vi.runAllTimers();

            expect(produce).not.toHaveBeenCalled();

            scheduler.markDirty();

            vi.runAllTimers();

            expect(produce).not.toHaveBeenCalled();
        });

    });

    describe('Props coalescer', () => {

        test('Should coalesce rapid pushes for one element into a single flush', () => {
            const flush = vi.fn();
            const coalescer = createPropsCoalescer(flush);

            for (let index = 0; index < 50; index++) {
                coalescer.push('element-a');
            }

            vi.advanceTimersByTime(PROPS_FLUSH_INTERVAL);

            expect(flush).toHaveBeenCalledTimes(1);
            expect(flush).toHaveBeenCalledWith(['element-a']);

            coalescer.dispose();
        });

        test('Should batch multiple elements into one flush', () => {
            const flush = vi.fn();
            const coalescer = createPropsCoalescer(flush);

            coalescer.push('element-a');
            coalescer.push('element-b');
            coalescer.push('element-a');

            vi.advanceTimersByTime(PROPS_FLUSH_INTERVAL);

            expect(flush).toHaveBeenCalledTimes(1);
            expect(flush).toHaveBeenCalledWith(['element-a', 'element-b']);

            coalescer.dispose();
        });

        test('Should only run the timer while the buffer is non-empty', () => {
            const flush = vi.fn();
            const coalescer = createPropsCoalescer(flush);

            coalescer.push('element-a');

            vi.advanceTimersByTime(PROPS_FLUSH_INTERVAL * 5);

            expect(flush).toHaveBeenCalledTimes(1);

            coalescer.push('element-b');

            vi.advanceTimersByTime(PROPS_FLUSH_INTERVAL);

            expect(flush).toHaveBeenCalledTimes(2);
            expect(flush).toHaveBeenLastCalledWith(['element-b']);

            coalescer.dispose();
        });

        test('Should drop buffered ids on clear', () => {
            const flush = vi.fn();
            const coalescer = createPropsCoalescer(flush);

            coalescer.push('element-a');
            coalescer.clear();

            vi.advanceTimersByTime(PROPS_FLUSH_INTERVAL);

            expect(flush).not.toHaveBeenCalled();

            coalescer.dispose();
        });

        test('Should cancel timers on dispose', () => {
            const flush = vi.fn();
            const coalescer = createPropsCoalescer(flush);

            coalescer.push('element-a');
            coalescer.dispose();

            vi.advanceTimersByTime(PROPS_FLUSH_INTERVAL);

            expect(flush).not.toHaveBeenCalled();

            coalescer.push('element-b');

            vi.advanceTimersByTime(PROPS_FLUSH_INTERVAL);

            expect(flush).not.toHaveBeenCalled();
        });

    });

});
