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
    createPlane,
    createTexture,
} from '../../src';

import type {
    Texture,
} from '../../src';

import {
    createScene,
} from '@ripl/core';

import {
    polyfillImageData,
    polyfillPath2D,
} from '@ripl/test-utils';

polyfillPath2D();
polyfillImageData();

function createImage(size = 4): Texture {
    return createTexture(new ImageData(new Uint8ClampedArray(size * size * 4), size, size));
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

    test('Should draw the image once per fan triangle of a textured quad', () => {
        render(createPlane({
            width: 2,
            height: 2,
            fill: '#ffffff',
            material: {
                map: createImage(),
            },
        }));

        expect(paint.records.filter(record => record.op === 'image')).toHaveLength(2);
    });

    test('Should clip each triangle before drawing into it', () => {
        const before = paint.clipCount();

        render(createPlane({
            width: 2,
            height: 2,
            fill: '#ffffff',
            material: {
                map: createImage(),
            },
        }));

        expect(paint.clipCount() - before).toBeGreaterThanOrEqual(2);
    });

    test('Should still fill the shaded colour underneath the image', () => {
        render(createPlane({
            width: 2,
            height: 2,
            fill: '#ff0000',
            material: {
                map: createImage(),
            },
        }));

        expect(paint.records.filter(record => record.op === 'face-fill')).toHaveLength(1);
    });

    test('Should draw no image for a material with no map', () => {
        render(createPlane({
            width: 2,
            height: 2,
            fill: '#ffffff',
        }));

        expect(paint.records.filter(record => record.op === 'image')).toHaveLength(0);
    });

    test('Should draw no image for a face carrying no UVs', () => {
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

        expect(paint.records.filter(record => record.op === 'image')).toHaveLength(0);
    });

    test('Should draw no image for a texture whose source has no pixels', () => {
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

        expect(paint.records.filter(record => record.op === 'image')).toHaveLength(0);
    });

    test('Should skip the image entirely for a wireframe material', () => {
        render(createCube({
            size: 1,
            fill: '#ffffff',
            material: {
                map: createImage(),
                wireframe: true,
            },
        }));

        expect(paint.records.filter(record => record.op === 'image')).toHaveLength(0);
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

});
