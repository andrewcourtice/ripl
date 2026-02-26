import {
    afterEach,
    beforeEach,
    describe,
    expect,
    test,
    vi,
} from 'vitest';

import {
    computeTransitionTime,
    easeInQuad,
    easeLinear,
    TaskAbortError,
    transition,
} from '../../src';

describe('computeTransitionTime', () => {

    test('Should return 0 at elapsed=0 (forward)', () => {
        expect(computeTransitionTime(0, 1000, easeLinear, 'forward')).toBe(0);
    });

    test('Should return 1 at elapsed>=duration (forward)', () => {
        expect(computeTransitionTime(1000, 1000, easeLinear, 'forward')).toBe(1);
        expect(computeTransitionTime(2000, 1000, easeLinear, 'forward')).toBe(1);
    });

    test('Should return 0.5 at halfway (forward, linear)', () => {
        expect(computeTransitionTime(500, 1000, easeLinear, 'forward')).toBeCloseTo(0.5, 5);
    });

    test('Should clamp negative elapsed to 0', () => {
        expect(computeTransitionTime(-100, 1000, easeLinear, 'forward')).toBe(0);
    });

    test('Should apply ease function', () => {
        const time = computeTransitionTime(500, 1000, easeInQuad, 'forward');
        expect(time).toBeCloseTo(easeInQuad(0.5), 5);
    });

    test('Should reverse when direction is reverse', () => {
        expect(computeTransitionTime(0, 1000, easeLinear, 'reverse')).toBeCloseTo(1, 5);
        expect(computeTransitionTime(1000, 1000, easeLinear, 'reverse')).toBeCloseTo(0, 5);
        expect(computeTransitionTime(500, 1000, easeLinear, 'reverse')).toBeCloseTo(0.5, 5);
    });

    test('Should apply ease after reversing position', () => {
        const time = computeTransitionTime(250, 1000, easeInQuad, 'reverse');
        const position = 0.25;
        const reversed = 1 - position;
        expect(time).toBeCloseTo(easeInQuad(reversed), 5);
    });

});

describe('transition', () => {

    beforeEach(() => {
        vi.useFakeTimers();
    });

    afterEach(() => {
        vi.useRealTimers();
    });

    test('Should call callback with increasing values and resolve', async () => {
        const values: number[] = [];

        const t = transition(time => values.push(time), {
            duration: 100,
        });

        // Advance through the transition
        await vi.advanceTimersByTimeAsync(150);

        expect(values.length).toBeGreaterThan(0);
        expect(values[0]).toBeGreaterThanOrEqual(0);
        expect(values[values.length - 1]).toBe(1);

        // Values should be non-decreasing
        for (let i = 1; i < values.length; i++) {
            expect(values[i]).toBeGreaterThanOrEqual(values[i - 1]);
        }

        await t;
    });

    test('Should resolve after duration', async () => {
        let resolved = false;

        const t = transition(() => {}, { duration: 200 });
        t.then(() => { resolved = true; });

        await vi.advanceTimersByTimeAsync(100);
        expect(resolved).toBe(false);

        await vi.advanceTimersByTimeAsync(150);
        expect(resolved).toBe(true);
    });

    test('Should apply custom ease function', async () => {
        const values: number[] = [];

        transition(time => values.push(time), {
            duration: 100,
            ease: easeInQuad,
        });

        await vi.advanceTimersByTimeAsync(150);

        // easeInQuad should produce values below the linear diagonal
        // (except at endpoints 0 and 1)
        const midValues = values.filter(v => v > 0 && v < 1);
        expect(midValues.length).toBeGreaterThan(0);
    });

    test('Should delay before starting', async () => {
        const values: number[] = [];

        transition(time => values.push(time), {
            duration: 100,
            delay: 200,
        });

        // During delay, no callbacks should fire
        await vi.advanceTimersByTimeAsync(100);
        expect(values.length).toBe(0);

        // After delay, callbacks should start
        await vi.advanceTimersByTimeAsync(250);
        expect(values.length).toBeGreaterThan(0);
    });

    test('Should produce decreasing values when direction is reverse', async () => {
        const values: number[] = [];

        transition(time => values.push(time), {
            duration: 100,
            direction: 'reverse',
        });

        await vi.advanceTimersByTimeAsync(150);

        expect(values.length).toBeGreaterThan(0);
        expect(values[0]).toBeCloseTo(1, 0);
        expect(values[values.length - 1]).toBeCloseTo(0, 0);

        // Values should be non-increasing
        for (let i = 1; i < values.length; i++) {
            expect(values[i]).toBeLessThanOrEqual(values[i - 1]);
        }
    });

    test('Should loop when loop is true', async () => {
        const values: number[] = [];

        transition(time => values.push(time), {
            duration: 100,
            loop: true,
        });

        // Run for 3 full cycles
        await vi.advanceTimersByTimeAsync(350);

        // Should have received time=1 at least twice (end of each cycle)
        const completions = values.filter(v => v === 1);
        expect(completions.length).toBeGreaterThanOrEqual(2);
    });

    test('Should not resolve when looping', async () => {
        let resolved = false;

        const t = transition(() => {}, {
            duration: 100,
            loop: true,
        });

        t.then(() => { resolved = true; }).catch(() => {});

        await vi.advanceTimersByTimeAsync(500);
        expect(resolved).toBe(false);

        t.abort();

        await vi.advanceTimersByTimeAsync(0);
    });

    test('Should cancel on abort', async () => {
        const values: number[] = [];

        const t = transition(time => values.push(time), {
            duration: 1000,
        });

        await vi.advanceTimersByTimeAsync(100);
        const countBeforeAbort = values.length;
        expect(countBeforeAbort).toBeGreaterThan(0);

        // Catch the rejection before aborting to prevent unhandled rejection
        const rejection = t.catch(error => error);

        t.abort();

        await vi.advanceTimersByTimeAsync(500);

        // No more callbacks after abort
        expect(values.length).toBe(countBeforeAbort);

        // Should reject with TaskAbortError
        const error = await rejection;
        expect(error).toBeInstanceOf(TaskAbortError);
    });

    test('Should return a Transition (Task) instance', () => {
        const t = transition(() => {}, { duration: 100 });
        expect(t).toBeInstanceOf(Promise);
        expect(typeof t.abort).toBe('function');
        expect(typeof t.signal).toBe('object');
    });

    test('Should use default options when none provided', async () => {
        const values: number[] = [];

        const t = transition(time => values.push(time));

        // Default duration is 1000ms
        await vi.advanceTimersByTimeAsync(500);
        const midCount = values.length;
        expect(midCount).toBeGreaterThan(0);

        // Should not have resolved yet at 500ms with 1000ms duration
        expect(values[values.length - 1]).toBeLessThan(1);

        await vi.advanceTimersByTimeAsync(600);
        expect(values[values.length - 1]).toBe(1);

        await t;
    });

});
