import {
    afterEach,
    beforeEach,
    describe,
    expect,
    test,
    vi,
} from 'vitest';

import {
    mockCanvasContext,
} from '@ripl/test-utils';

import {
    resolveCanvasGradient,
    setCanvasFill,
    setCanvasStroke,
    toCanvasPattern,
} from '../src';

const BOUNDS = {
    x: 0,
    y: 0,
    width: 100,
    height: 100,
};

const LINEAR = 'linear-gradient(90deg, #ff0000, #0000ff)';
const RADIAL = 'radial-gradient(circle at 50% 50%, #ff0000, #0000ff)';
const PATTERN = 'pattern(diagonal, #1a6, transparent, 8)';

function context() {
    return document.createElement('canvas').getContext('2d')!;
}

// `mockCanvasContext` hands every `getContext` call the same stub, so a second surface needs its own.
function separateContext() {
    return mockCanvasContext() as unknown as CanvasRenderingContext2D;
}

describe('Canvas gradient cache', () => {

    beforeEach(() => mockCanvasContext());
    afterEach(() => vi.restoreAllMocks());

    test('Should build one native gradient for many elements sharing a static paint', () => {
        const ctx = context();
        const createLinearGradient = vi.spyOn(ctx, 'createLinearGradient');

        for (let frame = 0; frame < 10; frame++) {
            for (let element = 0; element < 50; element++) {
                setCanvasFill(ctx, LINEAR, BOUNDS);
            }
        }

        expect(createLinearGradient).toHaveBeenCalledTimes(1);
    });

    test('Should return a reference-identical gradient for the same string and bounds', () => {
        const ctx = context();

        expect(resolveCanvasGradient(ctx, LINEAR, BOUNDS)).toBe(resolveCanvasGradient(ctx, LINEAR, BOUNDS));
    });

    test('Should share one cache between fill and stroke', () => {
        const ctx = context();
        const createLinearGradient = vi.spyOn(ctx, 'createLinearGradient');

        setCanvasFill(ctx, LINEAR, BOUNDS);
        setCanvasStroke(ctx, LINEAR, BOUNDS);

        expect(createLinearGradient).toHaveBeenCalledTimes(1);
    });

    test('Should rebuild when the bounds change', () => {
        const ctx = context();
        const first = resolveCanvasGradient(ctx, LINEAR, BOUNDS);

        const second = resolveCanvasGradient(ctx, LINEAR, {
            ...BOUNDS,
            height: 250,
        });

        expect(second).not.toBe(first);
    });

    // Sub-pixel drift on an animating element would otherwise miss on every frame.
    test('Should tolerate sub-hundredth bounds drift', () => {
        const ctx = context();
        const first = resolveCanvasGradient(ctx, LINEAR, BOUNDS);

        const second = resolveCanvasGradient(ctx, LINEAR, {
            ...BOUNDS,
            width: BOUNDS.width + 0.0001,
        });

        expect(second).toBe(first);
    });

    test('Should key each gradient string separately', () => {
        const ctx = context();

        expect(resolveCanvasGradient(ctx, RADIAL, BOUNDS)).not.toBe(resolveCanvasGradient(ctx, LINEAR, BOUNDS));
    });

    test('Should return undefined for a string that is not a gradient', () => {
        expect(resolveCanvasGradient(context(), '#ff0000', BOUNDS)).toBeUndefined();
    });

    // A CanvasGradient belongs to the surface that created it, so two surfaces must not share one.
    test('Should not share a gradient between two contexts', () => {
        const first = resolveCanvasGradient(separateContext(), LINEAR, BOUNDS);
        const second = resolveCanvasGradient(separateContext(), LINEAR, BOUNDS);

        expect(first).toBeDefined();
        expect(second).not.toBe(first);
    });

    test('Should retain a recently used gradient once the per-context limit is exceeded', () => {
        const ctx = context();
        const first = resolveCanvasGradient(ctx, LINEAR, BOUNDS);

        for (let i = 0; i < 100; i++) {
            resolveCanvasGradient(ctx, `linear-gradient(${i}deg, #ff0000, #0000ff)`, BOUNDS);
            resolveCanvasGradient(ctx, LINEAR, BOUNDS);
        }

        expect(resolveCanvasGradient(ctx, LINEAR, BOUNDS)).toBe(first);
    });

});

describe('Canvas pattern cache', () => {

    beforeEach(() => mockCanvasContext());
    afterEach(() => vi.restoreAllMocks());

    test('Should reuse one pattern per context', () => {
        const ctx = context();
        const createPattern = vi.spyOn(ctx, 'createPattern');

        toCanvasPattern(ctx, PATTERN);
        toCanvasPattern(ctx, PATTERN);

        expect(createPattern).toHaveBeenCalledTimes(1);
    });

    // A CanvasPattern is surface-bound; the tile it is drawn from is not, so only the pattern re-mints.
    test('Should mint a separate pattern per context from the shared tile', () => {
        const first = separateContext();
        const second = separateContext();
        const firstCreate = vi.spyOn(first, 'createPattern');
        const secondCreate = vi.spyOn(second, 'createPattern');

        toCanvasPattern(first, PATTERN);
        toCanvasPattern(second, PATTERN);

        expect(firstCreate).toHaveBeenCalledTimes(1);
        expect(secondCreate).toHaveBeenCalledTimes(1);
        expect(firstCreate.mock.calls[0][0]).toBe(secondCreate.mock.calls[0][0]);
    });

    test('Should cache a failed parse without re-parsing', () => {
        const ctx = context();
        const createPattern = vi.spyOn(ctx, 'createPattern');

        expect(toCanvasPattern(ctx, 'pattern(not-a-motif)')).toBeNull();
        expect(toCanvasPattern(ctx, 'pattern(not-a-motif)')).toBeNull();
        expect(createPattern).not.toHaveBeenCalled();
    });

    test('Should retain a recently used pattern once the per-context limit is exceeded', () => {
        const ctx = context();
        const first = toCanvasPattern(ctx, PATTERN);

        for (let i = 1; i <= 100; i++) {
            toCanvasPattern(ctx, `pattern(dots, red, transparent, ${i})`);
            toCanvasPattern(ctx, PATTERN);
        }

        expect(toCanvasPattern(ctx, PATTERN)).toBe(first);
    });

});
