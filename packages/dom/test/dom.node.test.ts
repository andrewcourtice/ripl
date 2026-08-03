// @vitest-environment node

import {
    describe,
    expect,
    test,
} from 'vitest';

import {
    hasWindow,
    onDOMElementResize,
} from '../src/dom';

describe('onDOMElementResize outside a browser', () => {

    test('Should report no window', () => {
        expect(hasWindow).toBe(false);
    });

    // `@ripl/dom` is published with `sideEffects: false`, so an SSR consumer can reach this helper.
    test('Should degrade to an inert disposable rather than throwing', () => {
        const disposable = onDOMElementResize({} as HTMLElement, () => undefined);

        expect(() => disposable.dispose()).not.toThrow();
    });

});
