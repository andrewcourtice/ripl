import {
    describe,
    expect,
    test,
} from 'vitest';

import {
    registerInterpolator,
} from '../../src';

import {
    getInterpolator,
} from '../../src/core/interpolation';

import type {
    InterpolatorFactory,
} from '../../src';

/** A factory matching a tagged object no built-in interpolator recognises. */
function createTaggedInterpolator(tag: string): InterpolatorFactory<{ tag: string;
    value: number; }> {
    return Object.assign(
        (from: { tag: string;
            value: number; }, to: { tag: string;
            value: number; }) => (time: number) => ({
            tag,
            value: from.value + (to.value - from.value) * time,
        }),
        {
            test: (value: unknown) => !!value && (value as { tag?: string }).tag === tag,
        }
    );
}

describe('Interpolator registry', () => {

    test('Should select a registered interpolator for a value it claims', () => {
        const interpolator = createTaggedInterpolator('registry-basic');

        registerInterpolator(interpolator);

        expect(getInterpolator({
            tag: 'registry-basic',
            value: 1,
        })).toBe(interpolator);
    });

    test('Should leave values it does not claim to the built-ins', () => {
        registerInterpolator(createTaggedInterpolator('registry-unclaimed'));

        expect(getInterpolator(5)).not.toBe(undefined);
        expect(getInterpolator(5).test?.(5)).toBe(true);
    });

    /*
     * Registered factories are consulted before the built-ins because a built-in predicate can be
     * broader than a package's own: interpolateBorderRadius matches any array of up to four numbers,
     * which would claim a 3D vector before its own interpolator ever saw it.
     */
    test('Should take precedence over a built-in whose predicate is broader', () => {
        const vectorLike = Object.assign(
            (from: number[], to: number[]) => (time: number) => from.map((value, index) => value + (to[index] - value) * time),
            {
                test: (value: unknown) => Array.isArray(value) && value.length === 3 && value.every(entry => typeof entry === 'number'),
            }
        ) as unknown as InterpolatorFactory<number[]>;

        registerInterpolator(vectorLike);

        expect(getInterpolator([1, 2, 3])).toBe(vectorLike);
    });

    test('Should ignore a factory with no predicate', () => {
        const withoutTest = ((from: number, to: number) => (time: number) => from + (to - from) * time) as InterpolatorFactory<number>;

        registerInterpolator(withoutTest);

        expect(getInterpolator(1)).not.toBe(withoutTest);
    });

    test('Should ignore a repeated registration of the same factory', () => {
        const interpolator = createTaggedInterpolator('registry-duplicate');

        registerInterpolator(interpolator);
        registerInterpolator(interpolator);

        expect(getInterpolator({
            tag: 'registry-duplicate',
            value: 1,
        })).toBe(interpolator);
    });

    test('Should still honour an explicit transform key over anything registered', () => {
        registerInterpolator(createTaggedInterpolator('registry-key'));

        expect(getInterpolator(0, 'rotation').test?.(0)).toBe(true);
    });

});
