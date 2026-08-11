import {
    afterEach,
    beforeEach,
    describe,
    expect,
    test,
    vi,
} from 'vitest';

import {
    mockHostSize,
    mockPaintLog,
} from '../paint-log';

import {
    createContext,
    createCube,
    createGroup3D,
    elementIsGroup3D,
    Group3D,
    mat4Compose,
    mat4Multiply,
    mat4TransformPoint,
} from '../../src';

import {
    createGroup,
    createScene,
} from '@ripl/core';

import {
    polyfillPath2D,
} from '@ripl/test-utils';

polyfillPath2D();

/** Reaches the protected `getModelMatrix` the way the element tests reach `computeFaces`. */
function modelMatrix(element: unknown) {
    return (element as { getModelMatrix(): Float64Array }).getModelMatrix();
}

describe('Group3D', () => {

    let host: HTMLDivElement;

    beforeEach(() => {
        mockPaintLog();
        host = document.createElement('div');
        document.body.appendChild(host);

        mockHostSize(400, 300);
    });

    afterEach(() => {
        host.remove();
        vi.restoreAllMocks();
    });

    describe('Construction', () => {

        test('Should default to an identity transform', () => {
            const group = createGroup3D();

            expect(group.x).toBe(0);
            expect(group.rotationY).toBe(0);
            expect(group.scale).toBe(1);
        });

        test('Should apply a uniform scale to every axis', () => {
            const group = createGroup3D({
                scale: 3,
            });

            expect(group.scaleX).toBe(3);
            expect(group.scaleY).toBe(3);
            expect(group.scaleZ).toBe(3);
        });

        test('Should let a per-axis scale override the uniform one', () => {
            const group = createGroup3D({
                scale: 3,
                scaleY: 5,
            });

            expect(group.scaleX).toBe(3);
            expect(group.scaleY).toBe(5);
        });

        test('Should accept children like a plain group', () => {
            const child = createCube({
                size: 1,
            });

            expect(createGroup3D({
                children: [child],
            }).children).toEqual([child]);
        });

        test('Should identify 3D groups', () => {
            expect(elementIsGroup3D(createGroup3D())).toBe(true);
            expect(elementIsGroup3D(createGroup())).toBe(false);
            expect(elementIsGroup3D({})).toBe(false);
        });

        test('Should be constructible directly as well as through the factory', () => {
            expect(new Group3D()).toBeInstanceOf(Group3D);
        });

    });

    describe('Transform composition', () => {

        function attach(group: ReturnType<typeof createGroup3D>, cube: ReturnType<typeof createCube>) {
            const context = createContext(host);

            createScene(context, {
                children: [group],
            });

            group.add(cube);

            return context;
        }

        test('Should compose its transform into a child model matrix', () => {
            const group = createGroup3D({
                x: 5,
            });
            const cube = createCube({
                size: 1,
                x: 2,
            });

            attach(group, cube);

            expect(mat4TransformPoint(modelMatrix(cube), [0, 0, 0])[0]).toBeCloseTo(7, 12);
        });

        test('Should rotate a child about the group origin rather than its own', () => {
            const group = createGroup3D({
                rotationY: Math.PI / 2,
            });
            const cube = createCube({
                size: 1,
                x: 2,
            });

            attach(group, cube);

            const [px, , pz] = mat4TransformPoint(modelMatrix(cube), [0, 0, 0]);

            expect(px).toBeCloseTo(0, 10);
            expect(pz).toBeCloseTo(-2, 10);
        });

        test('Should compose nested groups outermost first', () => {
            const outer = createGroup3D({
                x: 10,
            });
            const inner = createGroup3D({
                scale: 2,
            });
            const cube = createCube({
                size: 1,
                x: 3,
            });
            const context = createContext(host);

            createScene(context, {
                children: [outer],
            });

            outer.add(inner);
            inner.add(cube);

            const expected = mat4Multiply(
                mat4Multiply(outer.getGroupMatrix3D(), inner.getGroupMatrix3D()),
                mat4Compose([3, 0, 0], [0, 0, 0], [1, 1, 1])
            );
            const actual = modelMatrix(cube);

            for (let index = 0; index < 16; index++) {
                expect(actual[index]).toBeCloseTo(expected[index], 12);
            }
        });

        // A flat scene nests elements in plain groups, which must keep behaving exactly as before.
        test('Should leave a shape under a plain 2D group untransformed', () => {
            const group = createGroup();
            const cube = createCube({
                size: 1,
                x: 2,
            });
            const context = createContext(host);

            createScene(context, {
                children: [group],
            });

            group.add(cube);

            expect(mat4TransformPoint(modelMatrix(cube), [0, 0, 0])[0]).toBeCloseTo(2, 12);
        });

        test('Should follow a group transform changed after the child was added', () => {
            const group = createGroup3D();
            const cube = createCube({
                size: 1,
            });

            attach(group, cube);
            group.z = -4;

            expect(mat4TransformPoint(modelMatrix(cube), [0, 0, 0])[2]).toBeCloseTo(-4, 12);
        });

    });

});
