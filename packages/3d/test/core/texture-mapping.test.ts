import {
    afterEach,
    beforeEach,
    describe,
    expect,
    test,
    vi,
} from 'vitest';

import type {
    Mock,
} from 'vitest';

import {
    mockHostSize,
    mockPaintLog,
} from '../paint-log';

import type {
    PaintLogStub,
    PaintRecord,
} from '../paint-log';

import {
    createContext,
    createCube,
    createPlane,
    createTexture,
    texturePatternRepetition,
} from '../../src';

import type {
    Texture,
} from '../../src';

import {
    createScene,
    matrixApplyToPoint,
    matrixInvert,
} from '@ripl/core';

import type {
    Matrix,
} from '@ripl/core';

import {
    polyfillImageData,
    polyfillPath2D,
} from '@ripl/test-utils';

import type {
    MockCanvasPattern,
} from '@ripl/test-utils';

polyfillPath2D();
polyfillImageData();

const TEXTURE_SIZE = 4;

function createImage(size = TEXTURE_SIZE): Texture {
    return createTexture(new ImageData(new Uint8ClampedArray(size * size * 4), size, size));
}

function patternOf(record: PaintRecord): MockCanvasPattern | undefined {
    return typeof record.fillStyle === 'string' ? undefined : record.fillStyle;
}

function texturedFills(paint: PaintLogStub): PaintRecord[] {
    return paint.records.filter(record => record.op === 'face-fill' && !!patternOf(record));
}

function colorFills(paint: PaintLogStub): PaintRecord[] {
    return paint.records.filter(record => record.op === 'face-fill' && !patternOf(record));
}

// Barycentric samples strictly inside the triangle, so an edge case never decides the result.
const BARYCENTRIC_SAMPLES = [
    [0.6, 0.2, 0.2],
    [0.2, 0.6, 0.2],
    [0.2, 0.2, 0.6],
    [1 / 3, 1 / 3, 1 / 3],
    [0.5, 0.3, 0.2],
    [0.3, 0.5, 0.2],
];

function samplePoints(points: [number, number][]): [number, number][] {
    const [a, b, c] = points;

    return BARYCENTRIC_SAMPLES.map(([wa, wb, wc]) => [
        a[0] * wa + b[0] * wb + c[0] * wc,
        a[1] * wa + b[1] * wb + c[1] * wc,
    ] as [number, number]);
}

/**
 * The fraction of a textured face that actually receives texture paint.
 *
 * Screen-space samples are mapped back through the transform in force at the paint call into the
 * texture's own pixel space, and counted against the region that paint covers — one tile for a
 * single image draw, the whole plane for a pattern repeating on both axes. This is what `repeat`
 * used to shrink: it is folded into the UV mapping, so one image draw covered `1 / (ru * rv)`.
 */
function texturedFraction(paint: PaintLogStub): number {
    const fills = texturedFills(paint);
    const covered: boolean[] = [];

    fills.forEach((record, index) => {
        const pattern = patternOf(record)!;
        const transform = pattern.transforms[index] as Matrix | undefined;
        const inverse = transform && matrixInvert(transform);

        if (!inverse) {
            return;
        }

        const repeatsX = pattern.repetition === 'repeat' || pattern.repetition === 'repeat-x';
        const repeatsY = pattern.repetition === 'repeat' || pattern.repetition === 'repeat-y';

        samplePoints(record.points as [number, number][]).forEach(point => {
            const [x, y] = matrixApplyToPoint(inverse, point);

            covered.push(
                (repeatsX || (x >= 0 && x <= TEXTURE_SIZE))
                && (repeatsY || (y >= 0 && y <= TEXTURE_SIZE))
            );
        });
    });

    return covered.length ? covered.filter(Boolean).length / covered.length : 0;
}

describe('Canvas texture mapping', () => {

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

    function render(element: ReturnType<typeof createPlane> | ReturnType<typeof createCube>) {
        const context = createContext(host);

        context.setCamera([0, 0, 5], [0, 0, 0], [0, 1, 0]);

        createScene(context, {
            children: [element],
        }).render();

        return paint;
    }

    function renderTexturedPlane(texture: Texture) {
        return render(createPlane({
            width: 2,
            height: 2,
            fill: '#ffffff',
            material: {
                map: texture,
            },
        }));
    }

    test('Should tile the texture once per fan triangle of a textured quad', () => {
        renderTexturedPlane(createImage());

        expect(texturedFills(paint)).toHaveLength(2);
    });

    test('Should still fill the shaded colour underneath the texture', () => {
        render(createPlane({
            width: 2,
            height: 2,
            fill: '#ff0000',
            material: {
                map: createImage(),
            },
        }));

        expect(colorFills(paint)).toHaveLength(1);
    });

    /*
     * The affine transform folds `repeat` into the UV mapping, so a single `drawImage` covered only
     * `1 / (ru * rv)` of the surface — a quarter at the docs demo's default of 2, and a
     * thirty-sixth at 6. A repeating pattern covers all of it at every setting.
     */
    test.each([1, 2, 4, 6])('Should cover the whole face at a repeat of %i', repeat => {
        renderTexturedPlane(createTexture(new ImageData(new Uint8ClampedArray(TEXTURE_SIZE * TEXTURE_SIZE * 4), TEXTURE_SIZE, TEXTURE_SIZE), {
            repeat: [repeat, repeat],
        }));

        expect(texturedFraction(paint)).toBe(1);
    });

    test('Should cover the whole face however far the texture is offset', () => {
        renderTexturedPlane(createTexture(new ImageData(new Uint8ClampedArray(TEXTURE_SIZE * TEXTURE_SIZE * 4), TEXTURE_SIZE, TEXTURE_SIZE), {
            repeat: [3, 3],
            offset: [0.35, 0.7],
        }));

        expect(texturedFraction(paint)).toBe(1);
    });

    test('Should draw no texture for a material with no map', () => {
        render(createPlane({
            width: 2,
            height: 2,
            fill: '#ffffff',
        }));

        expect(texturedFills(paint)).toHaveLength(0);
    });

    test('Should draw no texture for a face carrying no UVs', () => {
        const context = createContext(host);

        context.setCamera([0, 0, 5], [0, 0, 0], [0, 1, 0]);

        createScene(context, {
            children: [
                Object.assign(createPlane({
                    width: 2,
                    height: 2,
                    material: {
                        map: createImage(),
                    },
                }), {
                    computeFaces: () => [
                        {
                            vertices: [
                                [-1, -1, 0],
                                [1, -1, 0],
                                [0, 1, 0],
                            ],
                        },
                    ],
                }),
            ],
        }).render();

        expect(texturedFills(paint)).toHaveLength(0);
    });

    test('Should draw no texture for a texture whose source has no pixels', () => {
        const canvas = document.createElement('canvas');

        canvas.width = 0;
        canvas.height = 0;

        render(createPlane({
            width: 2,
            height: 2,
            material: {
                map: createTexture(canvas),
            },
        }));

        expect(texturedFills(paint)).toHaveLength(0);
    });

    test('Should skip the texture entirely for a wireframe material', () => {
        render(createCube({
            size: 1,
            fill: '#ffffff',
            material: {
                map: createImage(),
                wireframe: true,
            },
        }));

        expect(texturedFills(paint)).toHaveLength(0);
    });

    test('Should balance every save it makes with a restore', () => {
        render(createCube({
            size: 1,
            fill: '#ffffff',
            material: {
                map: createImage(),
            },
        }));

        expect(paint.getSaveDepth()).toBe(0);
    });

    /*
     * Texturing runs inside the face flush, and the context's own `drawImage` flushes first — so
     * routing through it would re-enter the flush and split the global back-to-front sort into
     * fragments, producing occlusion errors that are intermittent and orientation-dependent.
     */
    test('Should not re-enter the face flush while texturing', () => {
        const context = createContext(host);
        const flush = vi.spyOn(context, 'flushFaces');

        context.setCamera([2, 2, 4], [0, 0, 0], [0, 1, 0]);

        createScene(context, {
            children: [
                createCube({
                    size: 1,
                    fill: '#ffffff',
                    material: {
                        map: createImage(),
                    },
                }),
            ],
        }).render();

        expect(flush).toHaveBeenCalledTimes(1);
    });

    describe('Wrap modes', () => {

        // The Canvas painter never consulted `wrapS`/`wrapT` at all; every texture tiled on both
        // axes regardless of what the texture — and the documentation — said.
        test.each([
            ['repeat', 'repeat', 'repeat'],
            ['repeat', 'clamp', 'repeat-x'],
            ['clamp', 'repeat', 'repeat-y'],
            ['clamp', 'clamp', 'no-repeat'],
            ['mirror', 'mirror', 'repeat'],
        ] as const)('Should create a %s/%s texture as a "%s" pattern', (wrapS, wrapT, repetition) => {
            renderTexturedPlane(createTexture(new ImageData(new Uint8ClampedArray(TEXTURE_SIZE * TEXTURE_SIZE * 4), TEXTURE_SIZE, TEXTURE_SIZE), {
                wrapS,
                wrapT,
            }));

            expect(patternOf(texturedFills(paint)[0])?.repetition).toBe(repetition);
        });

        test('Should leave a clamped face bare beyond the first tile', () => {
            renderTexturedPlane(createTexture(new ImageData(new Uint8ClampedArray(TEXTURE_SIZE * TEXTURE_SIZE * 4), TEXTURE_SIZE, TEXTURE_SIZE), {
                repeat: [4, 4],
                wrapS: 'clamp',
                wrapT: 'clamp',
            }));

            expect(texturedFraction(paint)).toBeLessThan(1);
        });

        test('Should map every wrap combination to a repetition', () => {
            expect(texturePatternRepetition('mirror', 'clamp')).toBe('repeat-x');
            expect(texturePatternRepetition('clamp', 'mirror')).toBe('repeat-y');
        });

    });

    describe('Pattern caching', () => {

        function patternsCreated(): number {
            return (paint.stub.createPattern as Mock).mock.calls.length;
        }

        function renderTexturedScene(texture: Texture) {
            const context = createContext(host);

            context.setCamera([0, 0, 5], [0, 0, 0], [0, 1, 0]);

            return createScene(context, {
                children: [
                    createPlane({
                        width: 2,
                        height: 2,
                        fill: '#ffffff',
                        material: {
                            map: texture,
                        },
                    }),
                ],
            });
        }

        test('Should create one pattern per texture however many faces it maps', () => {
            render(createCube({
                size: 1,
                fill: '#ffffff',
                material: {
                    map: createImage(),
                },
            }));

            expect(patternsCreated()).toBe(1);
        });

        test('Should reuse the cached pattern across frames', () => {
            const scene = renderTexturedScene(createImage());

            scene.render();

            const before = patternsCreated();

            scene.render();

            expect(patternsCreated()).toBe(before);
        });

        test('Should rebuild the pattern once the texture is invalidated', () => {
            const texture = createImage();
            const scene = renderTexturedScene(texture);

            scene.render();

            const before = patternsCreated();

            texture.invalidate();
            scene.render();

            expect(patternsCreated()).toBe(before + 1);
        });

        // `createPattern` rejects `ImageData` in a browser; only the stubbed `drawImage` let the
        // previous implementation appear to work with one.
        test('Should tile a texture built from ImageData', () => {
            renderTexturedPlane(createImage());

            expect(patternOf(texturedFills(paint)[0])?.source).not.toBeInstanceOf(ImageData);
        });

    });

});
