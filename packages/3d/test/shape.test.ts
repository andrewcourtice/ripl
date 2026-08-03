import {
    afterEach,
    beforeEach,
    describe,
    expect,
    test,
    vi,
} from 'vitest';

import {
    createContext,
    createCube,
} from '../src';

import type {
    CanvasContext3D,
} from '../src';

import {
    createScene,
} from '@ripl/core';

import {
    mockCanvasContext,
    polyfillPath2D,
} from '@ripl/test-utils';

polyfillPath2D();

describe('Shape3D', () => {

    let host: HTMLDivElement;

    beforeEach(() => {
        mockCanvasContext();
        host = document.createElement('div');
        document.body.appendChild(host);

        vi.spyOn(HTMLElement.prototype, 'getBoundingClientRect').mockImplementation(() => ({
            left: 0,
            top: 0,
            right: 400,
            bottom: 300,
            width: 400,
            height: 300,
            x: 0,
            y: 0,
            toJSON: () => ({}),
        }) as DOMRect);
    });

    afterEach(() => {
        host.remove();
        vi.restoreAllMocks();
    });

    function createFixture() {
        const context = createContext(host) as CanvasContext3D;

        context.setCamera([0, 0, 5], [0, 0, 0], [0, 1, 0]);

        return context;
    }

    describe('Fill parsing', () => {

        // 3D-1: `parseColor` returns undefined for anything but hex/rgb/hsl, and the unguarded
        // `triangulateFacesFlat` then threw out of the whole render pass.
        test('Should render a shape whose fill is a named colour', () => {
            const context = createFixture();
            const scene = createScene(context, {
                children: [
                    createCube({
                        size: 1,
                        fill: 'red',
                    }),
                ],
            });

            expect(() => scene.render()).not.toThrow();
            expect(context.faceBuffer).toHaveLength(6);
        });

        test('Should degrade an unparseable fill to the raw style string', () => {
            const context = createFixture();
            const scene = createScene(context, {
                children: [
                    createCube({
                        size: 1,
                        fill: 'red',
                    }),
                ],
            });

            scene.render();

            expect(context.faceBuffer[0].fillColor).toBe('red');
        });

        test('Should render a shape whose fill is a gradient', () => {
            const context = createFixture();
            const scene = createScene(context, {
                children: [
                    createCube({
                        size: 1,
                        fill: 'linear-gradient(#ff0000, #0000ff)',
                    }),
                ],
            });

            expect(() => scene.render()).not.toThrow();
            expect(context.faceBuffer).toHaveLength(6);
        });

        test('Should still shade a parseable fill', () => {
            const context = createFixture();
            const scene = createScene(context, {
                children: [
                    createCube({
                        size: 1,
                        fill: '#ff0000',
                    }),
                ],
            });

            scene.render();

            expect(context.faceBuffer[0].fillColor).toMatch(/^rgba\(/);
        });

    });

});
