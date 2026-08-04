// @vitest-environment node

import {
    afterEach,
    describe,
    expect,
    test,
    vi,
} from 'vitest';

// Side-effect import: registers node factory bindings (overrides vitest.setup.ts)
import '../src/index';

import {
    factory,
} from '@ripl/core';

describe('Node runtime bindings', () => {

    afterEach(() => {
        vi.restoreAllMocks();
    });

    // jsdom's numeric timer handle cannot express this, hence the node environment.
    test('Should schedule frames on a timer that does not hold the process open', () => {
        const handle = factory.requestAnimationFrame(() => undefined) as unknown as NodeJS.Timeout;

        expect(handle.hasRef()).toBe(false);

        factory.cancelAnimationFrame(handle as unknown as number);
    });

    test('Should pass a timestamp to the frame callback', async () => {
        const timestamp = await new Promise<number>(resolve => factory.requestAnimationFrame(resolve));

        expect(typeof timestamp).toBe('number');
        expect(timestamp).toBeGreaterThan(0);
    });

    test('Should share one terminal output across contexts rather than one SIGWINCH handler each', () => {
        vi.spyOn(console, 'warn').mockImplementation(() => undefined);

        const before = process.listenerCount('SIGWINCH');

        const first = factory.createContext('#one');
        const second = factory.createContext('#two');

        expect(process.listenerCount('SIGWINCH') - before).toBeLessThanOrEqual(1);

        first.destroy();
        second.destroy();
    });

    test('Should warn that a DOM target cannot be honoured', () => {
        const warn = vi.spyOn(console, 'warn').mockImplementation(() => undefined);

        factory.createContext('#chart').destroy();

        expect(warn).toHaveBeenCalledOnce();
    });

});
