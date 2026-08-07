import {
    describe,
    expect,
    test,
} from 'vitest';

import {
    composeSurfaceColor,
    computeDistanceAttenuation,
    computeFaceBrightness,
    computeFaceNormal,
    computeSpotAttenuation,
    createAmbientLight,
    createDirectionalLight,
    createHemisphereLight,
    createPointLight,
    createSurfaceIllumination,
    PLAIN_SURFACE,
    resolveLight,
    resolveLightColor,
    shadeFaceColor,
    shadeSurface,
} from '../src';

import type {
    Vector3,
} from '../src';

describe('Shading', () => {

    test('computeFaceNormal returns correct normal for XY plane triangle', () => {
        const vertices: Vector3[] = [
            [0, 0, 0],
            [1, 0, 0],
            [0, 1, 0],
        ];

        const normal = computeFaceNormal(vertices);

        expect(normal[0]).toBeCloseTo(0);
        expect(normal[1]).toBeCloseTo(0);
        expect(normal[2]).toBeCloseTo(1);
    });

    test('computeFaceBrightness: face facing light returns 1', () => {
        const normal: Vector3 = [0, 0, -1];
        const light: Vector3 = [0, 0, 1];
        expect(computeFaceBrightness(normal, light)).toBeCloseTo(1);
    });

    test('computeFaceBrightness: face facing away returns 0', () => {
        const normal: Vector3 = [0, 0, 1];
        const light: Vector3 = [0, 0, 1];
        expect(computeFaceBrightness(normal, light)).toBeCloseTo(0);
    });

    test('computeFaceBrightness: 45 degree angle', () => {
        const s = Math.SQRT1_2;
        const normal: Vector3 = [0, -s, -s];
        const light: Vector3 = [0, 0, 1];
        const brightness = computeFaceBrightness(normal, light);
        expect(brightness).toBeCloseTo(Math.SQRT1_2, 4);
    });

    test('shadeFaceColor: brightness 1 returns base color', () => {
        const result = shadeFaceColor('rgb(100, 200, 50)', 1);
        expect(result).toContain('100');
        expect(result).toContain('200');
        expect(result).toContain('50');
    });

    test('shadeFaceColor: brightness 0 returns black', () => {
        const result = shadeFaceColor('rgb(100, 200, 50)', 0);
        expect(result).toContain('0');
    });

    test('shadeFaceColor: invalid color returns original string', () => {
        expect(shadeFaceColor('not-a-color', 0.5)).toBe('not-a-color');
    });

    describe('computeDistanceAttenuation', () => {

        test('Should follow an inverse-square law when unbounded', () => {
            expect(computeDistanceAttenuation(1, 0, 2)).toBeCloseTo(1, 12);
            expect(computeDistanceAttenuation(2, 0, 2)).toBeCloseTo(0.25, 12);
            expect(computeDistanceAttenuation(4, 0, 2)).toBeCloseTo(1 / 16, 12);
        });

        test('Should not fall off at all with zero decay', () => {
            expect(computeDistanceAttenuation(10, 0, 0)).toBeCloseTo(1, 12);
        });

        test('Should reach exactly zero at a finite range', () => {
            expect(computeDistanceAttenuation(10, 10, 2)).toBe(0);
            expect(computeDistanceAttenuation(20, 10, 2)).toBe(0);
        });

        test('Should decrease monotonically towards a finite range', () => {
            let previous = Infinity;

            for (let distance = 1; distance <= 10; distance++) {
                const attenuation = computeDistanceAttenuation(distance, 10, 2);

                expect(attenuation).toBeLessThan(previous);
                previous = attenuation;
            }
        });

        test('Should stay finite at zero distance', () => {
            expect(Number.isFinite(computeDistanceAttenuation(0, 0, 2))).toBe(true);
        });

    });

    describe('computeSpotAttenuation', () => {

        const cosOuter = Math.cos(1);
        const cosInner = Math.cos(0.5);

        test('Should be dark outside the cone and full inside it', () => {
            expect(computeSpotAttenuation(Math.cos(1.5), cosOuter, cosInner)).toBe(0);
            expect(computeSpotAttenuation(Math.cos(0.2), cosOuter, cosInner)).toBe(1);
        });

        test('Should ease smoothly across the penumbra', () => {
            const middle = computeSpotAttenuation((cosOuter + cosInner) / 2, cosOuter, cosInner);

            expect(middle).toBeCloseTo(0.5, 6);
        });

        test('Should be a hard edge when the cones coincide', () => {
            const cone = Math.cos(0.5);

            expect(computeSpotAttenuation(Math.cos(0.6), cone, cone)).toBe(0);
            expect(computeSpotAttenuation(Math.cos(0.4), cone, cone)).toBe(1);
        });

    });

    describe('resolveLightColor', () => {

        test('Should premultiply by intensity', () => {
            expect(resolveLightColor('#ffffff', 0.5)).toEqual([0.5, 0.5, 0.5]);
            expect(resolveLightColor('#000000', 1)).toEqual([0, 0, 0]);
        });

        test('Should treat an unparseable colour as white', () => {
            expect(resolveLightColor('nope', 0.75)).toEqual([0.75, 0.75, 0.75]);
        });

    });

    describe('shadeSurface', () => {

        const up: Vector3 = [0, 1, 0];
        const origin: Vector3 = [0, 0, 0];
        const toCamera: Vector3 = [0, 0, 1];

        function shade(lights: Parameters<typeof shadeSurface>[4], normal = up, position = origin) {
            return shadeSurface(normal, position, toCamera, PLAIN_SURFACE, lights, createSurfaceIllumination());
        }

        test('Should reproduce the ambient-plus-directional model the single light replaced', () => {
            const lights = [
                resolveLight(createAmbientLight({ intensity: 0.3 })),
                resolveLight(createDirectionalLight({
                    direction: [0, -1, 0],
                    intensity: 0.7,
                })),
            ];

            const { diffuse } = shade(lights);

            expect(diffuse[0]).toBeCloseTo(1, 12);

            const grazing = shade(lights, [1, 0, 0]);

            expect(grazing.diffuse[0]).toBeCloseTo(0.3, 12);
        });

        test('Should light a surface regardless of orientation with an ambient light', () => {
            const lights = [resolveLight(createAmbientLight({ intensity: 0.4 }))];

            expect(shade(lights, up).diffuse[0]).toBeCloseTo(0.4, 12);
            expect(shade(lights, [0, -1, 0]).diffuse[0]).toBeCloseTo(0.4, 12);
        });

        test('Should fade a hemisphere light from sky to ground across the normal', () => {
            const lights = [resolveLight(createHemisphereLight({
                color: '#ffffff',
                groundColor: '#000000',
            }))];

            expect(shade(lights, [0, 1, 0]).diffuse[0]).toBeCloseTo(1, 12);
            expect(shade(lights, [0, -1, 0]).diffuse[0]).toBeCloseTo(0, 12);
            expect(shade(lights, [1, 0, 0]).diffuse[0]).toBeCloseTo(0.5, 12);
        });

        test('Should leave a surface facing away from a directional light unlit', () => {
            const lights = [resolveLight(createDirectionalLight({ direction: [0, -1, 0] }))];

            expect(shade(lights, [0, -1, 0]).diffuse[0]).toBe(0);
        });

        test('Should dim a point light with distance', () => {
            const near = [resolveLight(createPointLight({
                position: [0, 1, 0],
                decay: 2,
            }))];
            const far = [resolveLight(createPointLight({
                position: [0, 4, 0],
                decay: 2,
            }))];

            expect(shade(near).diffuse[0]).toBeGreaterThan(shade(far).diffuse[0]);
            expect(shade(far).diffuse[0]).toBeCloseTo(1 / 16, 12);
        });

        test('Should skip a light sitting exactly on the surface', () => {
            const lights = [resolveLight(createPointLight({ position: [0, 0, 0] }))];

            expect(shade(lights).diffuse[0]).toBe(0);
        });

        test('Should carry a coloured light into the per-channel multiplier', () => {
            const lights = [resolveLight(createAmbientLight({ color: '#ff0000' }))];
            const { diffuse } = shade(lights);

            expect(diffuse[0]).toBeCloseTo(1, 12);
            expect(diffuse[1]).toBe(0);
            expect(diffuse[2]).toBe(0);
        });

        test('Should add an emissive term regardless of lighting', () => {
            const illumination = shadeSurface(up, origin, toCamera, {
                specular: [0, 0, 0],
                shininess: 0,
                emissive: [0.25, 0, 0],
            }, [], createSurfaceIllumination());

            expect(illumination.diffuse).toEqual([0, 0, 0]);
            expect(illumination.additive[0]).toBeCloseTo(0.25, 12);
        });

        test('Should add a specular highlight only where the surface faces the camera and the light', () => {
            const surface = {
                specular: [1, 1, 1] as [number, number, number],
                shininess: 32,
                emissive: [0, 0, 0] as [number, number, number],
            };
            const lights = [resolveLight(createDirectionalLight({
                direction: [0, 0, -1],
                intensity: 1,
            }))];

            const facing = shadeSurface([0, 0, 1], origin, toCamera, surface, lights, createSurfaceIllumination());
            const away = shadeSurface([0, 0, -1], origin, toCamera, surface, lights, createSurfaceIllumination());

            expect(facing.additive[0]).toBeGreaterThan(0.9);
            expect(away.additive[0]).toBe(0);
        });

        test('Should write into the illumination it is given rather than allocating', () => {
            const out = createSurfaceIllumination();
            const result = shadeSurface(up, origin, toCamera, PLAIN_SURFACE, [], out);

            expect(result).toBe(out);
        });

    });

    describe('composeSurfaceColor', () => {

        // The single-light model resolved `round(channel * brightness)`; anything else would move
        // every pixel of every existing scene.
        test('Should reduce to the expression the single-light model used', () => {
            const illumination = createSurfaceIllumination();

            for (const brightness of [0, 0.3, 0.5, 0.77, 1]) {
                illumination.diffuse = [brightness, brightness, brightness];
                illumination.additive = [0, 0, 0];

                expect(composeSurfaceColor([200, 100, 50, 1], illumination)).toBe(
                    shadeFaceColor([200, 100, 50, 1], brightness)
                );
            }
        });

        test('Should clamp an over-bright channel rather than wrapping it', () => {
            const illumination = createSurfaceIllumination();

            illumination.diffuse = [4, 4, 4];
            illumination.additive = [2, 2, 2];

            expect(composeSurfaceColor([200, 100, 50, 1], illumination)).toBe('rgba(255, 255, 255, 1)');
        });

        test('Should preserve the surface alpha', () => {
            const illumination = createSurfaceIllumination();

            illumination.diffuse = [1, 1, 1];

            expect(composeSurfaceColor([10, 20, 30, 0.5], illumination)).toBe('rgba(10, 20, 30, 0.5)');
        });

    });

});
