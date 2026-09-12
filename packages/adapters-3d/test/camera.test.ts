import {
    describe,
    expect,
    test,
} from 'vitest';

import {
    collectChangedCameraProps,
} from '@ripl/adapters-3d';

import type {
    RiplWritable,
} from '@ripl/adapters';

describe('@ripl/adapters-3d camera', () => {

    describe('Changed props', () => {

        test('Should report every bound prop the first time it is read', () => {
            const applied: RiplWritable = {};

            expect(collectChangedCameraProps({
                position: [0, 2, 5],
                fov: 45,
            }, applied)).toEqual({
                position: [0, 2, 5],
                fov: 45,
            });
        });

        test('Should leave an unbound prop out so a camera default survives', () => {
            const applied: RiplWritable = {};

            expect(collectChangedCameraProps({
                fov: undefined,
                position: [0, 2, 5],
            }, applied)).toEqual({
                position: [0, 2, 5],
            });
        });

        // The whole point: a vector written as a literal is a new array on every render.
        test('Should report nothing when a vector is rebuilt with the same values', () => {
            const applied: RiplWritable = {};

            collectChangedCameraProps({
                position: [0, 2, 5],
            }, applied);

            expect(collectChangedCameraProps({
                position: [0, 2, 5],
            }, applied)).toBeUndefined();
        });

        test('Should report a vector whose component changed', () => {
            const applied: RiplWritable = {};

            collectChangedCameraProps({
                position: [0, 2, 5],
            }, applied);

            expect(collectChangedCameraProps({
                position: [0, 2, 6],
            }, applied)).toEqual({
                position: [0, 2, 6],
            });
        });

        // The snapshot is a copy, so the comparison is against what was written rather than the
        // caller's live array.
        test('Should report a vector that was mutated in place', () => {
            const applied: RiplWritable = {};
            const position = [0, 2, 5];

            collectChangedCameraProps({
                position,
            }, applied);

            position[1] = 4;

            expect(collectChangedCameraProps({
                position,
            }, applied)).toEqual({
                position: [0, 4, 5],
            });
        });

        test('Should report a scalar that changed and nothing else', () => {
            const applied: RiplWritable = {};

            collectChangedCameraProps({
                position: [0, 2, 5],
                fov: 45,
            }, applied);

            expect(collectChangedCameraProps({
                position: [0, 2, 5],
                fov: 60,
            }, applied)).toEqual({
                fov: 60,
            });
        });

        test('Should ignore interactions, which are read once at construction', () => {
            const applied: RiplWritable = {};

            expect(collectChangedCameraProps({
                interactions: true,
            }, applied)).toBeUndefined();
        });

    });

});
