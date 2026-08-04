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
} from './paint-log';

import type {
    PaintLogStub,
} from './paint-log';

import {
    computeFaceBrightness,
    Context3D,
    createContext,
    createCube,
    mat4TransformDirection,
    mat4TransformDirectionInverse,
    shadeFaceColor,
    vec3Normalize,
} from '../src';

import type {
    Context3DOptions,
    CubeState,
    MeshSubmission,
    Shape3DOptions,
    Vector3,
} from '../src';

import {
    createScene,
    parseColor,
} from '@ripl/core';

import type {
    ColorRGBA,
} from '@ripl/core';

import {
    polyfillPath2D,
} from '@ripl/test-utils';

polyfillPath2D();

const FILL = '#4488cc';
const BASE_RGBA = parseColor(FILL) as ColorRGBA;

// The fragment shader's ambient term, hard-coded into the scene uniform at packages/webgpu/src/context.ts.
const AMBIENT = 0.3;

// Mirrors VERTEX_STRIDE in @ripl/webgpu: position(3), normal(3), colour(4).
const FLOATS_PER_VERTEX = 10;
const NORMAL_OFFSET = 3;

/**
 * A GPU-strategy context that keeps every mesh a shape submits.
 *
 * The WebGPU backend shades in WGSL, which no DOM test environment can run, so the closest
 * observable to its output is the mesh it is handed — the vertex normals and normal matrix the
 * shader derives its world normal from.
 */
class MeshCaptureContext3D extends Context3D {

    public readonly submissions: MeshSubmission[] = [];

    constructor(target: string | HTMLElement, options?: Context3DOptions) {
        super('mesh-capture', target, document.createElement('canvas'), options, 'gpu');

        this.updateProjectionMatrix();
        this.init();
    }

    public override submitMesh(submission: MeshSubmission): void {
        this.submissions.push(submission);
    }

}

function isSameNormal(a: Vector3 | undefined, b: Vector3): boolean {
    return !!a && a[0] === b[0] && a[1] === b[1] && a[2] === b[2];
}

/**
 * Replays the WGSL lighting over a captured mesh, one colour per face.
 *
 * The vertex shader normalizes `normalMatrix * normal` and the fragment shader resolves
 * `ambient + (1 - ambient) * max(dot(normal, normalize(-light)), 0)`, which is
 * {@link computeFaceBrightness} against the same world normal.
 */
function shadeSubmission(submission: MeshSubmission, lightDirection: Vector3): string[] {
    const light = vec3Normalize(lightDirection);
    const colors: string[] = [];

    let previous: Vector3 | undefined;

    for (let offset = 0; offset < submission.vertices.length; offset += FLOATS_PER_VERTEX) {
        const normal: Vector3 = [
            submission.vertices[offset + NORMAL_OFFSET],
            submission.vertices[offset + NORMAL_OFFSET + 1],
            submission.vertices[offset + NORMAL_OFFSET + 2],
        ];

        // Every vertex of a face carries the face normal, so a run of them is one face.
        if (isSameNormal(previous, normal)) {
            continue;
        }

        previous = normal;

        const worldNormal = vec3Normalize(mat4TransformDirection(submission.normalMatrix, normal));
        const brightness = computeFaceBrightness(worldNormal, light, true);

        colors.push(shadeFaceColor(BASE_RGBA, AMBIENT + (1 - AMBIENT) * brightness));
    }

    return colors;
}

/** Regression tests for the CPU/WebGPU shading divergence in `docs/audits/3d-webgpu.md`. */
describe('CPU and WebGPU shading parity', () => {

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

    interface ShadingCase {
        /** Applied to both contexts before the cube renders. */
        configure: (context: Context3D) => void;
        /** The world-space light both backends are required to shade against. */
        worldLight: (context: Context3D) => Vector3;
        /** Options for the cube under test, on top of a unit cube filled with {@link FILL}. */
        cube?: Shape3DOptions<CubeState>;
    }

    interface ShadingResult {
        /** The fill colour of every face the CPU painter actually drew, sorted. */
        cpu: string[];
        /** The colour the WGSL lighting resolves for every submitted face, sorted. */
        gpu: string[];
        /** The light direction the GPU context feeds its scene uniform. */
        uniformLight: Vector3;
        /** The light direction the case requires, derived independently of the context. */
        expectedLight: Vector3;
    }

    function render(context: Context3D, shadingCase: ShadingCase): void {
        shadingCase.configure(context);

        createScene(context, {
            children: [
                createCube({
                    size: 1,
                    fill: FILL,
                    ...shadingCase.cube,
                }),
            ],
        }).render();
    }

    function shade(shadingCase: ShadingCase): ShadingResult {
        const cpuContext = createContext(host);

        render(cpuContext, shadingCase);

        const cpu = paint.records
            .filter(record => record.op === 'face-fill')
            .map(record => record.fillStyle);

        const gpuHost = document.createElement('div');

        document.body.appendChild(gpuHost);

        const gpuContext = new MeshCaptureContext3D(gpuHost);

        render(gpuContext, shadingCase);
        gpuHost.remove();

        const expectedLight = shadingCase.worldLight(gpuContext);

        return {
            cpu: cpu.sort(),
            gpu: shadeSubmission(gpuContext.submissions[0], expectedLight).sort(),
            uniformLight: gpuContext.getLightDirectionForRender(),
            expectedLight,
        };
    }

    describe('Face colours', () => {

        // 3D-3: the CPU painter lit a face by its local normal, so a rotated shape shaded as unturned.
        test('Should shade every face of a rotated cube the same on both backends', () => {
            const result = shade({
                configure: context => context.setCamera([0, 0, 5], [0, 0, 0], [0, 1, 0]),
                worldLight: context => context.lightDirection,
                cube: {
                    rotationY: Math.PI / 4,
                    rotationX: 0.3,
                },
            });

            expect(result.gpu).toHaveLength(6);
            expect(result.cpu).toEqual(result.gpu);
        });

        // 3D-5: both backends share one light accessor, so the expected light is derived without it.
        test('Should shade every face the same with the camera orbited off axis', () => {
            const result = shade({
                configure: context => {
                    context.lightDirection = [0, 0, -1];
                    context.setCamera([5, 2, 5], [0, 0, 0], [0, 1, 0]);
                },
                worldLight: context => context.lightDirection,
                cube: {
                    rotationY: Math.PI / 4,
                    rotationX: 0.3,
                },
            });

            expect(result.gpu).toHaveLength(6);
            expect(result.cpu).toEqual(result.gpu);
            expect(result.uniformLight).toEqual(result.expectedLight);
        });

        test('Should shade every face the same under a camera-mode light', () => {
            const result = shade({
                configure: context => {
                    context.lightMode = 'camera';
                    context.lightDirection = [0, 0, -1];
                    context.setCamera([5, 2, 5], [0, 0, 0], [0, 1, 0]);
                },
                worldLight: context => mat4TransformDirectionInverse(context.viewMatrix, context.lightDirection),
                cube: {
                    rotationY: Math.PI / 4,
                    rotationX: 0.3,
                },
            });

            expect(result.gpu).toHaveLength(6);
            expect(result.cpu).toEqual(result.gpu);
            expect(result.uniformLight).toEqual(result.expectedLight);
        });

    });

    describe('World-space light', () => {

        test('Should fully light the face a world light faces head on, wherever the camera is', () => {
            const result = shade({
                configure: context => {
                    context.lightDirection = [0, 0, -1];
                    context.setCamera([5, 2, 5], [0, 0, 0], [0, 1, 0]);
                },
                worldLight: context => context.lightDirection,
            });

            const lit = shadeFaceColor(BASE_RGBA, 1);

            expect(result.cpu).toContain(lit);
            expect(result.gpu).toContain(lit);
        });

        // A quarter turn only permutes a cube's normals, so the turn has to break that symmetry.
        test('Should leave no face fully lit once the shape turns out of that light', () => {
            const result = shade({
                configure: context => {
                    context.lightDirection = [0, 0, -1];
                    context.setCamera([5, 2, 5], [0, 0, 0], [0, 1, 0]);
                },
                worldLight: context => context.lightDirection,
                cube: {
                    rotationY: Math.PI / 4,
                },
            });

            const lit = shadeFaceColor(BASE_RGBA, 1);

            expect(result.cpu).not.toContain(lit);
            expect(result.gpu).not.toContain(lit);
        });

    });

});
