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
    composeSurfaceColor,
    Context3D,
    createAmbientLight,
    createContext,
    createCube,
    createDirectionalLight,
    createHemisphereLight,
    createPointLight,
    createSpotLight,
    createSurfaceIllumination,
    LIGHT_DIRECTION,
    mat4TransformDirection,
    mat4TransformDirectionInverse,
    mat4TransformPoint,
    MAX_LIGHTS,
    PLAIN_SURFACE,
    shadeFaceColor,
    shadeSurface,
    vec3Normalize,
    vec3Sub,
} from '../src';

import type {
    Context3DOptions,
    CubeState,
    Light,
    MeshSubmission,
    ResolvedLight,
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

// The default rig's ambient intensity, which the directional light's 0.7 completes.
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

interface CapturedFace {
    /** The face's world-space normal, as the vertex shader resolves it. */
    normal: Vector3;
    /** The face's world-space centroid. */
    centroid: Vector3;
}

/** Walks a submitted mesh back into faces, mirroring what the vertex shader hands the fragment stage. */
function capturedFaces(submission: MeshSubmission): CapturedFace[] {
    const faces: CapturedFace[] = [];

    let previous: Vector3 | undefined;
    let sum: Vector3 = [0, 0, 0];
    let count = 0;

    const flush = () => {
        if (count > 0 && previous) {
            faces.push({
                normal: vec3Normalize(mat4TransformDirection(submission.normalMatrix, previous)),
                centroid: [sum[0] / count, sum[1] / count, sum[2] / count],
            });
        }
    };

    for (let offset = 0; offset < submission.vertices.length; offset += FLOATS_PER_VERTEX) {
        const normal: Vector3 = [
            submission.vertices[offset + NORMAL_OFFSET],
            submission.vertices[offset + NORMAL_OFFSET + 1],
            submission.vertices[offset + NORMAL_OFFSET + 2],
        ];

        // Every vertex of a face carries the face normal, so a run of them is one face.
        if (!isSameNormal(previous, normal)) {
            flush();

            previous = normal;
            sum = [0, 0, 0];
            count = 0;
        }

        const world = mat4TransformPoint(submission.modelMatrix, [
            submission.vertices[offset],
            submission.vertices[offset + 1],
            submission.vertices[offset + 2],
        ]);

        sum = [sum[0] + world[0], sum[1] + world[1], sum[2] + world[2]];
        count++;
    }

    flush();

    return faces;
}

/**
 * Replays the WGSL lighting over a captured mesh, one colour per face.
 *
 * The shader resolves `color.rgb * illumination.diffuse + illumination.additive` from the same
 * `shadeSurface` this calls, against the world normal and position the vertex stage hands it. The
 * fragment stage evaluates per pixel where this evaluates once per face, so for a positional light
 * the two agree exactly only at the face centroid — which is precisely where the CPU painter, which
 * can only fill a flat polygon, evaluates it too.
 */
function shadeSubmission(submission: MeshSubmission, lights: ResolvedLight[], cameraPosition: Vector3): string[] {
    const illumination = createSurfaceIllumination();

    return capturedFaces(submission).map(({ normal, centroid }) => composeSurfaceColor(
        BASE_RGBA,
        shadeSurface(
            normal,
            centroid,
            vec3Normalize(vec3Sub(cameraPosition, centroid)),
            PLAIN_SURFACE,
            lights,
            illumination
        )
    ));
}

/** Regression tests for the CPU/WebGPU shading divergence: an exchanged light mode and an untransformed declared normal. */
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
        /** Replaces the default rig entirely, when given. */
        lights?: () => Light[];
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
        // Rebuilt per context: a light carries a back-reference to the list it was added to.
        const options = () => shadingCase.lights && {
            lights: shadingCase.lights(),
        };

        const cpuContext = createContext(host, options());

        render(cpuContext, shadingCase);

        const cpu = paint.records
            .filter(record => record.op === 'face-fill')
            .map(record => record.fillStyle);

        const gpuHost = document.createElement('div');

        document.body.appendChild(gpuHost);

        const gpuContext = new MeshCaptureContext3D(gpuHost, options());

        render(gpuContext, shadingCase);
        gpuHost.remove();

        const expectedLight = shadingCase.worldLight(gpuContext);

        return {
            cpu: cpu.sort(),
            gpu: shadeSubmission(
                gpuContext.submissions[0],
                gpuContext.resolveLights(),
                gpuContext.cameraPosition
            ).sort(),
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

    /**
     * One row per lighting rig, each asserting the CPU painter's fills equal the WGSL replay.
     *
     * The rigs replace the default ambient-plus-directional pair entirely, so `lightDirection` and
     * `lightMode` are inert here — that detachment is itself covered below.
     */
    describe('Light rigs', () => {

        function shadeWithLights(lights: () => Light[], cube?: Shape3DOptions<CubeState>): ShadingResult {
            return shade({
                lights,
                configure: context => context.setCamera([3, 2, 4], [0, 0, 0], [0, 1, 0]),
                worldLight: context => context.lightDirection,
                cube: {
                    rotationY: Math.PI / 5,
                    rotationX: 0.4,
                    ...cube,
                },
            });
        }

        const rigs: [name: string, lights: () => Light[]][] = [
            ['an ambient light alone', () => [createAmbientLight({
                color: '#ff8800',
                intensity: 0.6,
            })]],
            ['a hemisphere light alone', () => [createHemisphereLight({
                color: '#88ccff',
                groundColor: '#442200',
                intensity: 0.9,
            })]],
            ['a directional light alone', () => [createDirectionalLight({
                direction: [1, -1, -0.5],
                color: '#ffddaa',
            })]],
            ['a point light alone', () => [createPointLight({
                position: [2, 2, 2],
                color: '#ff4444',
                intensity: 8,
                decay: 2,
            })]],
            ['a point light with a finite range', () => [createPointLight({
                position: [1.2, 1.2, 1.2],
                distance: 3,
                decay: 1,
                intensity: 4,
            })]],
            ['a point light the geometry sits beyond', () => [createPointLight({
                position: [40, 40, 40],
                distance: 5,
                intensity: 10,
            })]],
            ['a spot light with the cube inside its cone', () => [createSpotLight({
                position: [0, 3, 0],
                direction: [0, -1, 0],
                angle: 0.9,
                intensity: 12,
            })]],
            ['a spot light with the cube outside its cone', () => [createSpotLight({
                position: [0, 3, 0],
                direction: [0, -1, 0],
                angle: 0.05,
                intensity: 12,
            })]],
            ['a spot light with a soft penumbra', () => [createSpotLight({
                position: [0, 3, 0],
                direction: [0, -1, 0],
                angle: 0.6,
                penumbra: 0.8,
                intensity: 12,
            })]],
            ['two directional lights of different colours', () => [
                createDirectionalLight({
                    direction: [1, -1, 0],
                    color: '#ff0000',
                    intensity: 0.6,
                }),
                createDirectionalLight({
                    direction: [-1, -1, 0],
                    color: '#0000ff',
                    intensity: 0.6,
                }),
            ]],
            ['an ambient light plus a point light', () => [
                createAmbientLight({ intensity: 0.2 }),
                createPointLight({
                    position: [0, 3, 3],
                    intensity: 9,
                }),
            ]],
            ['every light type at once', () => [
                createAmbientLight({ intensity: 0.1 }),
                createHemisphereLight({
                    color: '#a0c8ff',
                    groundColor: '#302010',
                    intensity: 0.3,
                }),
                createDirectionalLight({
                    direction: [-1, -1, -1],
                    intensity: 0.4,
                }),
                createPointLight({
                    position: [3, 1, 2],
                    intensity: 5,
                    distance: 12,
                }),
                createSpotLight({
                    position: [-2, 3, 1],
                    direction: [0.4, -1, -0.2],
                    angle: 0.8,
                    penumbra: 0.4,
                    intensity: 8,
                }),
            ]],
            ['a disabled light contributing nothing', () => [
                createAmbientLight({ intensity: 0.3 }),
                createDirectionalLight({
                    direction: [1, -1, 0],
                    intensity: 5,
                    enabled: false,
                }),
            ]],
            ['the maximum number of lights', () => Array.from({ length: MAX_LIGHTS }, (_value, index) => createDirectionalLight({
                direction: [Math.cos(index), -1, Math.sin(index)],
                intensity: 0.1,
            }))],
        ];

        test.each(rigs)('Should shade every face the same under %s', (_name, lights) => {
            const result = shadeWithLights(lights);

            expect(result.gpu).toHaveLength(6);
            expect(result.cpu).toEqual(result.gpu);
        });

        test('Should drop lights beyond the supported maximum on both backends', () => {
            const warn = vi.spyOn(console, 'warn').mockImplementation(() => undefined);

            const result = shadeWithLights(() => Array.from({ length: MAX_LIGHTS + 1 }, () => createDirectionalLight({
                direction: [0, -1, -1],
                intensity: 0.1,
            })));

            expect(result.cpu).toEqual(result.gpu);
            expect(warn).toHaveBeenCalledWith(expect.stringContaining('up to 8 lights'));
        });

        test('Should shade a camera-space directional light the same on both backends', () => {
            const result = shadeWithLights(() => [
                createAmbientLight({ intensity: 0.2 }),
                createDirectionalLight({
                    direction: [0, 0, -1],
                    space: 'camera',
                    intensity: 0.8,
                }),
            ]);

            expect(result.cpu).toEqual(result.gpu);
        });

        test('Should shade a camera-space spot light the same on both backends', () => {
            const result = shadeWithLights(() => [
                createSpotLight({
                    position: [0, 0, 0],
                    direction: [0, 0, -1],
                    space: 'camera',
                    angle: 1,
                    intensity: 20,
                }),
            ]);

            expect(result.cpu).toEqual(result.gpu);
        });

        // A collapsed face has no facing to shade by, and the two backends once disagreed on what to
        // do about it: the CPU painter returned a zero normal and drew it black.
        test('Should shade a degenerate face the same on both backends', () => {
            const result = shade({
                lights: () => [createDirectionalLight({ direction: [0, -1, -1] })],
                configure: context => context.setCamera([3, 2, 4], [0, 0, 0], [0, 1, 0]),
                worldLight: context => context.lightDirection,
                cube: {
                    size: 0,
                },
            });

            expect(result.cpu).toEqual(result.gpu);
            expect(result.cpu.length).toBeGreaterThan(0);
        });

    });

    describe('The default rig', () => {

        test('Should leave lightDirection and lightMode inert once replaced', () => {
            const warn = vi.spyOn(console, 'warn').mockImplementation(() => undefined);
            const context = createContext(host, {
                lights: [createAmbientLight()],
            });

            context.lightDirection = [1, 0, 0];
            context.lightMode = 'camera';

            expect(context.lightDirection).toEqual([...LIGHT_DIRECTION.topLeftFront]);
            expect(context.lightMode).toBe('world');
            expect(warn).toHaveBeenCalledTimes(1);
        });

        test('Should resolve to an ambient light plus a directional light', () => {
            const context = createContext(host);
            const lights = context.lights.toArray();

            expect(lights).toHaveLength(2);
            expect(lights[0].type).toBe('ambient');
            expect(lights[0].intensity).toBe(AMBIENT);
            expect(lights[1].type).toBe('directional');
            expect(lights[1].intensity).toBeCloseTo(1 - AMBIENT, 12);
        });

    });

});
