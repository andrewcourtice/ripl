import {
    describe,
    expect,
    test,
} from 'vitest';

import {
    createCube,
    createSphere,
    Shape3D,
} from '../../src';

describe('Shape3D defaults', () => {

    test('Should default each axis to the shared scale default', () => {
        const cube = createCube({ size: 1 });

        expect(cube.scaleX).toBe(1);
        expect(cube.scaleZ).toBe(1);
    });

    test('Should let the scale option beat the defaults', () => {
        const cube = createCube({
            size: 1,
            scale: 2,
        });

        expect(cube.scaleX).toBe(2);
        expect(cube.scaleY).toBe(2);
        expect(cube.scaleZ).toBe(2);
    });

    test('Should let an explicit axis beat the scale option', () => {
        const cube = createCube({
            size: 1,
            scale: 2,
            scaleX: 4,
        });

        expect(cube.scaleX).toBe(4);
        expect(cube.scaleY).toBe(2);
    });

    test('Should let a subclass state default beat the Shape3D defaults', () => {
        const sphere = createSphere({ radius: 1 });

        expect(sphere.segments).toBe(16);
        expect(sphere.rings).toBe(12);
        expect(sphere.x).toBe(0);
    });

    test('Should let the caller beat a subclass state default', () => {
        const sphere = createSphere({
            radius: 1,
            segments: 32,
        });

        expect(sphere.segments).toBe(32);
        expect(sphere.rings).toBe(12);
    });

    test('Should let a bespoke subclass supply its own defaults through Shape3D', () => {
        class Anchored extends Shape3D {

            constructor() {
                super('anchored', {}, { x: 7 });
            }

        }

        const element = new Anchored();

        expect(element.x).toBe(7);
        expect(element.y).toBe(0);
    });


});
