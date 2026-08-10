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

import type {
    PaintLogStub,
} from '../paint-log';

import {
    createContext,
    createCube,
    createMaterial,
    createMesh,
    createSphere,
    DEFAULT_SURFACE_COLOR,
    MATERIAL_SIDE_CODE,
    materialDrawsFace,
    materialSideCode,
    resolveMaterial,
} from '../../src';

import type {
    Face3D,
    Shape3D,
} from '../../src';

import {
    COLOR_SCHEME_VIRIDIS,
    createScene,
    scaleSequential,
} from '@ripl/core';

import {
    polyfillPath2D,
} from '@ripl/test-utils';

polyfillPath2D();

describe('Material', () => {

    let host: HTMLDivElement;
    let paint: PaintLogStub;

    beforeEach(() => {
        paint = mockPaintLog();
        host = document.createElement('div');
        document.body.appendChild(host);

        mockHostSize(400, 300);
    });

    afterEach(() => {
        host.remove();
        vi.restoreAllMocks();
    });

    describe('resolveMaterial', () => {

        test('Should fall back through material colour, then fill, then a neutral grey', () => {
            expect(resolveMaterial({ color: '#ff0000' }, '#00ff00').colorStyle).toBe('#ff0000');
            expect(resolveMaterial(undefined, '#00ff00').colorStyle).toBe('#00ff00');
            expect(resolveMaterial(undefined, undefined).colorStyle).toBe(DEFAULT_SURFACE_COLOR);
        });

        // An unparseable fill has always been handed to the backend verbatim rather than replaced.
        test('Should leave an unparseable colour for the backend to interpret', () => {
            const resolved = resolveMaterial(undefined, 'some-css-thing');

            expect(resolved.color).toBeUndefined();
            expect(resolved.colorStyle).toBe('some-css-thing');
        });

        test('Should apply opacity to the resolved alpha', () => {
            expect(resolveMaterial({ opacity: 0.5 }, '#ff0000').color![3]).toBe(0.5);
        });

        test('Should default to no specular response and no emission', () => {
            const { surface } = resolveMaterial(undefined, '#ffffff');

            expect(surface.shininess).toBe(0);
            expect(surface.specular).toEqual([0, 0, 0]);
            expect(surface.emissive).toEqual([0, 0, 0]);
        });

        test('Should scale emissive by its intensity', () => {
            const { surface } = resolveMaterial({
                emissive: '#ffffff',
                emissiveIntensity: 0.25,
            }, '#000000');

            expect(surface.emissive).toEqual([0.25, 0.25, 0.25]);
        });

        test('Should default to drawing both sides, matching the unculled model', () => {
            const resolved = resolveMaterial(undefined, '#ffffff');

            expect(resolved.side).toBe('double');
            expect(resolved.wireframe).toBe(false);
            expect(resolved.flatShading).toBe(false);
            expect(resolved.vertexColors).toBe(false);
        });

        test('Should treat an empty material as no material at all', () => {
            expect(resolveMaterial(createMaterial(), '#123456')).toEqual(resolveMaterial(undefined, '#123456'));
        });

    });

    describe('materialDrawsFace', () => {

        test('Should draw everything when double sided', () => {
            expect(materialDrawsFace('double', -1)).toBe(true);
            expect(materialDrawsFace('double', 1)).toBe(true);
        });

        test('Should split the two facings between front and back', () => {
            expect(materialDrawsFace('front', -1)).toBe(true);
            expect(materialDrawsFace('front', 1)).toBe(false);
            expect(materialDrawsFace('back', 1)).toBe(true);
            expect(materialDrawsFace('back', -1)).toBe(false);
        });

        // A zero-area face has no facing to reject on, so dropping it would lose edge-on geometry.
        test('Should draw an edge-on face whichever side is chosen', () => {
            expect(materialDrawsFace('front', 0)).toBe(true);
            expect(materialDrawsFace('back', 0)).toBe(true);
        });

    });

    test('materialSideCode maps each side to its shader discriminator', () => {
        expect(materialSideCode('double')).toBe(MATERIAL_SIDE_CODE.double);
        expect(materialSideCode('front')).toBe(MATERIAL_SIDE_CODE.front);
        expect(materialSideCode('back')).toBe(MATERIAL_SIDE_CODE.back);
    });

    describe('Rendering', () => {

        // Off axis so three faces of a cube are genuinely camera facing; straight on, perspective
        // leaves exactly one, which would not distinguish culling from a coincidence.
        function render(element: Shape3D) {
            const context = createContext(host);

            context.setCamera([4, 3, 5], [0, 0, 0], [0, 1, 0]);

            createScene(context, {
                children: [element],
            }).render();

            return paint.records.filter(record => record.op === 'face-fill');
        }

        test('Should draw every face of a cube by default', () => {
            expect(render(createCube({
                size: 1,
                fill: '#4488cc',
            }))).toHaveLength(6);
        });

        test('Should draw only the camera-facing faces of a cube when front sided', () => {
            expect(render(createCube({
                size: 1,
                fill: '#4488cc',
                material: {
                    side: 'front',
                },
            }))).toHaveLength(3);
        });

        test('Should draw exactly the faces front sided does not when back sided', () => {
            const front = render(createCube({
                size: 1,
                fill: '#4488cc',
                material: {
                    side: 'front',
                },
            })).length;

            paint.records.length = 0;

            const back = render(createCube({
                size: 1,
                fill: '#4488cc',
                material: {
                    side: 'back',
                },
            })).length;

            expect(back).toBe(6 - front);
        });

        // Smooth shading averages each face's vertex normals, so a sphere resolves far more distinct
        // colours than its faceted equivalent, which has one normal per face.
        test('Should resolve more distinct colours with smooth shading than with flat shading', () => {
            const smooth = new Set(render(createSphere({
                radius: 1,
                segments: 16,
                rings: 12,
                fill: '#4488cc',
            })).map(record => record.fillStyle));

            paint.records.length = 0;

            const flat = new Set(render(createSphere({
                radius: 1,
                segments: 16,
                rings: 12,
                fill: '#4488cc',
                material: {
                    flatShading: true,
                },
            })).map(record => record.fillStyle));

            expect(smooth.size).toBeGreaterThan(40);
            expect(smooth.size).toBeGreaterThan(flat.size);
        });

        test('Should stroke without filling when the material is a wireframe', () => {
            const context = createContext(host);

            context.setCamera([0, 0, 5], [0, 0, 0], [0, 1, 0]);

            createScene(context, {
                children: [
                    createCube({
                        size: 1,
                        fill: '#4488cc',
                        material: {
                            wireframe: true,
                        },
                    }),
                ],
            }).render();

            expect(paint.records.filter(record => record.op === 'face-fill')).toHaveLength(0);
            expect(paint.records.filter(record => record.op === 'face-stroke').length).toBeGreaterThan(0);
        });

        test('Should brighten a face with an emissive material', () => {
            const plain = render(createCube({
                size: 1,
                fill: '#202020',
            })).map(record => record.fillStyle);

            paint.records.length = 0;

            const emissive = render(createCube({
                size: 1,
                fill: '#202020',
                material: {
                    emissive: '#ffffff',
                    emissiveIntensity: 0.5,
                },
            })).map(record => record.fillStyle);

            expect(emissive).not.toEqual(plain);
        });

        /*
         * 3D-C1: this asserted a face count, which a cube carrying no vertex colours at all
         * satisfies — so it stayed green while every face resolved to the material's default grey.
         * Colours come from a scale here because a scale is what emits the fractional channels
         * `resolveColor` used to reject.
         */
        test('Should shade from a face vertex colours when the material enables them', () => {
            const scale = scaleSequential(COLOR_SCHEME_VIRIDIS, [0, 8]);
            const strip = Array.from({ length: 8 }, (_, index) => ({
                vertices: [
                    [index - 4, 0, 0],
                    [index - 3, 0, 0],
                    [index - 3, 1, 0],
                    [index - 4, 1, 0],
                ],
                colors: [
                    scale(index + 0.3),
                    scale(index + 0.3),
                    scale(index + 0.7),
                    scale(index + 0.7),
                ],
            })) as Face3D[];

            const fills = new Set(render(createMesh({
                faces: strip,
                fill: '#ffffff',
                material: {
                    vertexColors: true,
                },
            })).map(record => record.fillStyle));

            expect(fills.size).toBe(8);
        });

    });

    describe('Cache invalidation', () => {

        // Rebuilding the mesh for a colour tweak would put every tessellator on the path of a
        // material change, which is the one state key that cannot alter geometry.
        test('Should not rebuild geometry when only the material changes', () => {
            const cube = createCube({
                size: 1,
            });
            const compute = vi.spyOn(cube as unknown as { computeFaces(): unknown }, 'computeFaces');
            const context = createContext(host);

            createScene(context, {
                children: [cube],
            }).render();

            const initial = compute.mock.calls.length;

            cube.material = {
                color: '#ff0000',
            };

            createScene(context, {
                children: [cube],
            }).render();

            expect(compute.mock.calls.length).toBe(initial);
        });

        test('Should rebuild geometry when a geometry property changes', () => {
            const cube = createCube({
                size: 1,
            });
            const compute = vi.spyOn(cube as unknown as { computeFaces(): unknown }, 'computeFaces');
            const context = createContext(host);
            const scene = createScene(context, {
                children: [cube],
            });

            scene.render();

            const initial = compute.mock.calls.length;

            cube.size = 2;
            scene.render();

            expect(compute.mock.calls.length).toBeGreaterThan(initial);
        });

    });

});
