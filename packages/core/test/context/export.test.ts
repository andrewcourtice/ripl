import {
    beforeEach,
    describe,
    expect,
    test,
} from 'vitest';

import {
    mockCanvasContext,
    polyfillPath2D,
} from '@ripl/test-utils';

import {
    Context,
} from '../../src';

polyfillPath2D();

/** Minimal concrete context with no export override, exercising the base default. */
class BareContext extends Context {
}

describe('Context.export', () => {

    beforeEach(() => {
        mockCanvasContext();
    });

    test('Should throw an unsupported error by default', () => {
        const context = new BareContext('bare', {} as Element);

        expect(() => context.export()).toThrowError(/not supported/);
    });

    test('Should name the context type in the error', () => {
        const context = new BareContext('bare', {} as Element);

        expect(() => context.export()).toThrowError(/bare/);
    });

});
