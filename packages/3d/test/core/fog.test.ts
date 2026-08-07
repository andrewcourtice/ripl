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
    composeSurfaceColor,
    computeFogFactor,
    createContext,
    createCube,
    createSurfaceIllumination,
    FOG_MODE_CODE,
    resolveFog,
} from '../../src';

import {
    createScene,
} from '@ripl/core';

import {
    polyfillPath2D,
} from '@ripl/test-utils';

polyfillPath2D();

describe('Fog', () => {

    describe('resolveFog', () => {

        test('Should resolve nothing for no fog', () => {
            expect(resolveFog(undefined)).toBeNull();
            expect(resolveFog(null)).toBeNull();
        });

        test('Should default to a white linear fog', () => {
            const resolved = resolveFog({})!;

            expect(resolved.mode).toBe(FOG_MODE_CODE.linear);
            expect(resolved.color).toEqual([1, 1, 1]);
            expect(resolved.near).toBe(1);
            expect(resolved.far).toBe(100);
        });

        test('Should resolve an exponential fog', () => {
            expect(resolveFog({ mode: 'exponential' })!.mode).toBe(FOG_MODE_CODE.exponential);
        });

        test('Should resolve the colour to unit range', () => {
            expect(resolveFog({ color: '#ff0000' })!.color).toEqual([1, 0, 0]);
        });

    });

    describe('computeFogFactor', () => {

        const linear = resolveFog({
            near: 10,
            far: 20,
        })!;

        test('Should leave geometry nearer than the start unfogged', () => {
            expect(computeFogFactor(linear, 5)).toBe(0);
            expect(computeFogFactor(linear, 10)).toBe(0);
        });

        test('Should fully obscure geometry beyond the end', () => {
            expect(computeFogFactor(linear, 20)).toBe(1);
            expect(computeFogFactor(linear, 100)).toBe(1);
        });

        test('Should ramp linearly between the two', () => {
            expect(computeFogFactor(linear, 15)).toBeCloseTo(0.5, 12);
        });

        test('Should stay finite when the range collapses', () => {
            const collapsed = resolveFog({
                near: 5,
                far: 5,
            })!;

            expect(Number.isFinite(computeFogFactor(collapsed, 5))).toBe(true);
        });

        test('Should ramp exponentially with the square of distance', () => {
            const exponential = resolveFog({
                mode: 'exponential',
                density: 0.1,
            })!;

            expect(computeFogFactor(exponential, 0)).toBe(0);
            expect(computeFogFactor(exponential, 10)).toBeCloseTo(1 - Math.exp(-1), 12);
            expect(computeFogFactor(exponential, 100)).toBeCloseTo(1, 6);
        });

        test('Should increase monotonically with distance', () => {
            let previous = -1;

            for (let distance = 0; distance <= 30; distance += 2) {
                const factor = computeFogFactor(linear, distance);

                expect(factor).toBeGreaterThanOrEqual(previous);
                previous = factor;
            }
        });

    });

    describe('composeSurfaceColor', () => {

        const illumination = createSurfaceIllumination();

        illumination.diffuse = [1, 1, 1];

        test('Should leave the colour untouched without fog', () => {
            expect(composeSurfaceColor([100, 150, 200, 1], illumination)).toBe('rgba(100, 150, 200, 1)');
        });

        test('Should blend fully to the fog colour beyond its range', () => {
            const fog = resolveFog({
                color: '#000000',
                near: 1,
                far: 2,
            })!;

            expect(composeSurfaceColor([100, 150, 200, 1], illumination, fog, 10)).toBe('rgba(0, 0, 0, 1)');
        });

        test('Should leave the colour untouched inside the fog start', () => {
            const fog = resolveFog({
                color: '#000000',
                near: 5,
                far: 10,
            })!;

            expect(composeSurfaceColor([100, 150, 200, 1], illumination, fog, 1)).toBe('rgba(100, 150, 200, 1)');
        });

        test('Should preserve alpha through the blend', () => {
            const fog = resolveFog({
                near: 0,
                far: 1,
            })!;

            expect(composeSurfaceColor([10, 20, 30, 0.5], illumination, fog, 1)).toContain('0.5');
        });

    });

    describe('Rendering', () => {

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

        function render(fog?: Parameters<typeof resolveFog>[0]) {
            const context = createContext(host);

            context.setCamera([0, 0, 10], [0, 0, 0], [0, 1, 0]);

            if (fog) {
                context.fog = fog;
            }

            createScene(context, {
                children: [
                    createCube({
                        size: 2,
                        fill: '#4488cc',
                    }),
                ],
            }).render();

            return paint.records.filter(record => record.op === 'face-fill').map(record => record.fillStyle);
        }

        test('Should change the rendered colours once fog is applied', () => {
            const unfogged = render();

            paint.records.length = 0;

            const fogged = render({
                color: '#ffffff',
                near: 0,
                far: 20,
            });

            expect(fogged).not.toEqual(unfogged);
        });

        test('Should render a fully obscuring fog in the fog colour', () => {
            const fogged = render({
                color: '#ff0000',
                near: 0,
                far: 1,
            });

            expect(fogged.every(style => style === 'rgba(255, 0, 0, 1)')).toBe(true);
        });

        test('Should leave rendering untouched when fog is cleared', () => {
            const unfogged = render();

            paint.records.length = 0;

            const context = createContext(host);

            context.setCamera([0, 0, 10], [0, 0, 0], [0, 1, 0]);
            context.fog = {
                near: 0,
                far: 1,
            };
            context.fog = null;

            createScene(context, {
                children: [
                    createCube({
                        size: 2,
                        fill: '#4488cc',
                    }),
                ],
            }).render();

            const cleared = paint.records.filter(record => record.op === 'face-fill').map(record => record.fillStyle);

            expect(cleared).toEqual(unfogged);
        });

        test('Should expose the resolved fog for the GPU backend to pack', () => {
            const context = createContext(host);

            expect(context.resolvedFog).toBeNull();

            context.fog = {
                mode: 'exponential',
            };

            expect(context.resolvedFog?.mode).toBe(FOG_MODE_CODE.exponential);
        });

    });

});
