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
    createRay,
    createSphere,
    createTorus,
    vec3Length,
    vec3Sub,
} from '../../src';

import {
    createScene,
} from '@ripl/core';

import {
    polyfillPath2D,
} from '@ripl/test-utils';

polyfillPath2D();

describe('Raycasting', () => {

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

    describe('Shape3D.raycast', () => {

        test('Should report the distance to the near face of a cube', () => {
            const cube = createCube({
                size: 2,
            });
            const hit = cube.raycast(createRay([0, 0, 10], [0, 0, -1]))!;

            expect(hit).not.toBeNull();
            expect(hit.distance).toBeCloseTo(9, 10);
            expect(hit.point[2]).toBeCloseTo(1, 10);
            expect(hit.element).toBe(cube);
        });

        test('Should miss a shape the ray passes beside', () => {
            const cube = createCube({
                size: 1,
            });

            expect(cube.raycast(createRay([5, 5, 10], [0, 0, -1]))).toBeNull();
        });

        test('Should miss a shape behind the ray origin', () => {
            const cube = createCube({
                size: 1,
            });

            expect(cube.raycast(createRay([0, 0, 10], [0, 0, 1]))).toBeNull();
        });

        test('Should return the nearest hit rather than the first', () => {
            const cube = createCube({
                size: 2,
            });
            const hit = cube.raycast(createRay([0, 0, 10], [0, 0, -1]))!;

            expect(hit.distance).toBeCloseTo(9, 10);
            expect(hit.backFacing).toBe(false);
        });

        test('Should skip back faces when asked to', () => {
            const cube = createCube({
                size: 2,
            });
            const inside = createRay([0, 0, 0], [0, 0, -1]);

            expect(cube.raycast(inside)).not.toBeNull();
            expect(cube.raycast(inside, { backFaces: false })).toBeNull();
        });

        test('Should follow the shape transform', () => {
            const cube = createCube({
                size: 2,
                x: 5,
            });

            expect(cube.raycast(createRay([0, 0, 10], [0, 0, -1]))).toBeNull();
            expect(cube.raycast(createRay([5, 0, 10], [0, 0, -1]))).not.toBeNull();
        });

        test('Should follow a scale', () => {
            const cube = createCube({
                size: 1,
                scale: 8,
            });

            expect(cube.raycast(createRay([3, 0, 10], [0, 0, -1]))).not.toBeNull();
        });

        test('Should report the surface normal at the hit', () => {
            const cube = createCube({
                size: 2,
            });
            const hit = cube.raycast(createRay([0, 0, 10], [0, 0, -1]))!;

            expect(hit.normal[2]).toBeCloseTo(1, 6);
        });

        test('Should interpolate the normal across a face carrying vertex normals', () => {
            const sphere = createSphere({
                radius: 2,
                segments: 12,
                rings: 8,
            });
            const hit = sphere.raycast(createRay([0, 0, 10], [0, 0, -1]))!;
            const outward = hit.point.map(component => component / vec3Length(hit.point));
            const alignment = hit.normal[0] * outward[0] + hit.normal[1] * outward[1] + hit.normal[2] * outward[2];

            expect(alignment).toBeGreaterThan(0.99);
        });

        test('Should report the texture coordinate at the hit', () => {
            const cube = createCube({
                size: 2,
            });
            const hit = cube.raycast(createRay([0, 0, 10], [0, 0, -1]))!;

            expect(hit.uv).toBeDefined();
            expect(hit.uv![0]).toBeGreaterThanOrEqual(0);
            expect(hit.uv![0]).toBeLessThanOrEqual(1);
        });

        test('Should report which face was hit', () => {
            const cube = createCube({
                size: 2,
            });
            const hit = cube.raycast(createRay([0, 0, 10], [0, 0, -1]))!;

            expect(hit.faceIndex).toBeGreaterThanOrEqual(0);
            expect(hit.face.vertices).toHaveLength(4);
        });

        // Walking the triangles is the whole point: any test that flattens a shape to its outline
        // reports a hit straight through the hole.
        test('Should pass through the hole of a torus rather than hitting its silhouette', () => {
            const torus = createTorus({
                radius: 2,
                tube: 0.4,
                radialSegments: 16,
                tubularSegments: 32,
            });

            // The hole runs along Y: the ring lies in the XZ plane.
            expect(torus.raycast(createRay([0, 10, 0], [0, -1, 0]))).toBeNull();
            expect(torus.raycast(createRay([2, 10, 0], [0, -1, 0]))).not.toBeNull();
        });

    });

    describe('Context3D.raycast', () => {

        function createSceneContext(children: Parameters<typeof createScene>[1] extends { children?: infer T } ? T : never) {
            const context = createContext(host);

            context.setCamera([0, 0, 10], [0, 0, 0], [0, 1, 0]);

            return {
                context,
                scene: createScene(context, {
                    children,
                }),
            };
        }

        test('Should build a ray through the centre of the viewport', () => {
            const { context } = createSceneContext([]);
            const ray = context.raycast(200, 150)!;

            expect(ray).not.toBeNull();
            expect(vec3Length(ray.direction)).toBeCloseTo(1, 10);
            expect(ray.direction[2]).toBeLessThan(0);
        });

        test('Should hit a shape under the centre of the viewport', () => {
            const cube = createCube({
                size: 2,
            });
            const { context, scene } = createSceneContext([cube]);
            const [hit] = context.raycastAll(scene, 200, 150);

            expect(hit?.element).toBe(cube);
        });

        test('Should return nothing where no shape sits', () => {
            const { context, scene } = createSceneContext([
                createCube({
                    size: 0.2,
                }),
            ]);

            expect(context.raycastAll(scene, 5, 5)).toEqual([]);
        });

        test('Should order hits nearest first', () => {
            const near = createCube({
                size: 1,
                z: 3,
            });
            const far = createCube({
                size: 1,
                z: -3,
            });
            const { context, scene } = createSceneContext([far, near]);
            const hits = context.raycastAll(scene, 200, 150);

            expect(hits).toHaveLength(2);
            expect(hits[0].element).toBe(near);
            expect(hits[1].element).toBe(far);
        });

        test('Should reach shapes nested inside groups', () => {
            const cube = createCube({
                size: 2,
            });
            const group = createGroup3D({
                children: [cube],
            });
            const { context, scene } = createSceneContext([group]);

            expect(context.raycastAll(scene, 200, 150)[0]?.element).toBe(cube);
        });

        test('Should account for a group transform when hitting', () => {
            const cube = createCube({
                size: 2,
            });
            const group = createGroup3D({
                x: 40,
                children: [cube],
            });
            const { context, scene } = createSceneContext([group]);

            expect(context.raycastAll(scene, 200, 150)).toEqual([]);
        });

        test('Should place the hit point on the ray it cast', () => {
            const cube = createCube({
                size: 2,
            });
            const { context, scene } = createSceneContext([cube]);
            const ray = context.raycast(200, 150)!;
            const [hit] = context.raycastAll(scene, 200, 150);
            const offset = vec3Sub(hit.point, ray.origin);

            expect(vec3Length(offset)).toBeCloseTo(hit.distance, 6);
        });

    });

});
