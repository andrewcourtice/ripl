import {
    describe,
    expect,
    test,
    vi,
} from 'vitest';

import {
    createAmbientLight,
    createDirectionalLight,
    createHemisphereLight,
    createPointLight,
    createSpotLight,
    LIGHT_TYPE_CODE,
    lightIsAmbient,
    lightIsCameraSpace,
    lightIsDirectional,
    lightIsHemisphere,
    lightIsPoint,
    lightIsPositional,
    lightIsSpot,
    LightList,
    resolveLight,
    typeIsLight,
    vec3Length,
} from '../../src';

describe('Lights', () => {

    describe('Construction', () => {

        test('Should default to full-intensity white and enabled', () => {
            const light = createAmbientLight();

            expect(light.color).toBe('#ffffff');
            expect(light.intensity).toBe(1);
            expect(light.enabled).toBe(true);
            expect(light.type).toBe('ambient');
        });

        test('Should normalize a directional light direction on construction and assignment', () => {
            const light = createDirectionalLight({
                direction: [0, -4, 0],
            });

            expect(light.direction).toEqual([0, -1, 0]);

            light.direction = [3, 4, 0];

            expect(vec3Length(light.direction)).toBeCloseTo(1, 12);
        });

        test('Should default a point light to physically plausible falloff', () => {
            const light = createPointLight();

            expect(light.decay).toBe(2);
            expect(light.distance).toBe(0);
            expect(light.position).toEqual([0, 0, 0]);
        });

        // A cone at or past a right angle stops being a cone and its cosine flips sign.
        test('Should clamp a spot light angle below a right angle', () => {
            const light = createSpotLight({
                angle: Math.PI,
            });

            expect(light.angle).toBeLessThan(Math.PI / 2);
            expect(Math.cos(light.angle)).toBeGreaterThan(0);
        });

        test('Should clamp a spot light penumbra to the unit range', () => {
            expect(createSpotLight({ penumbra: 5 }).penumbra).toBe(1);
            expect(createSpotLight({ penumbra: -5 }).penumbra).toBe(0);
        });

    });

    describe('Type guards', () => {

        const lights = {
            ambient: createAmbientLight(),
            hemisphere: createHemisphereLight(),
            directional: createDirectionalLight(),
            point: createPointLight(),
            spot: createSpotLight(),
        };

        test('Should narrow each light to its own type', () => {
            expect(lightIsAmbient(lights.ambient)).toBe(true);
            expect(lightIsHemisphere(lights.hemisphere)).toBe(true);
            expect(lightIsDirectional(lights.directional)).toBe(true);
            expect(lightIsPoint(lights.point)).toBe(true);
            expect(lightIsSpot(lights.spot)).toBe(true);
        });

        test('Should not narrow a light to a type it is not', () => {
            expect(lightIsAmbient(lights.point)).toBe(false);
            expect(lightIsSpot(lights.point)).toBe(false);
            expect(lightIsDirectional(lights.spot)).toBe(false);
        });

        test('Should identify the lights that radiate from a position', () => {
            expect(lightIsPositional(lights.point)).toBe(true);
            expect(lightIsPositional(lights.spot)).toBe(true);
            expect(lightIsPositional(lights.directional)).toBe(false);
            expect(lightIsPositional(lights.ambient)).toBe(false);
        });

        test('Should identify the lights that follow the camera', () => {
            expect(lightIsCameraSpace(createDirectionalLight({ space: 'camera' }))).toBe(true);
            expect(lightIsCameraSpace(createSpotLight({ space: 'camera' }))).toBe(true);
            expect(lightIsCameraSpace(lights.directional)).toBe(false);
            expect(lightIsCameraSpace(lights.point)).toBe(false);
        });

        test('Should identify any light', () => {
            expect(typeIsLight(lights.ambient)).toBe(true);
            expect(typeIsLight({ type: 'ambient' })).toBe(false);
            expect(typeIsLight(null)).toBe(false);
        });

    });

    describe('resolveLight', () => {

        test('Should premultiply the colour by the intensity', () => {
            const resolved = resolveLight(createAmbientLight({
                color: '#ff8000',
                intensity: 0.5,
            }));

            expect(resolved.type).toBe(LIGHT_TYPE_CODE.ambient);
            expect(resolved.color[0]).toBeCloseTo(0.5, 6);
            expect(resolved.color[1]).toBeCloseTo(128 / 255 * 0.5, 6);
            expect(resolved.color[2]).toBe(0);
        });

        test('Should fall back to a white light when the colour is unparseable', () => {
            const resolved = resolveLight(createAmbientLight({
                color: 'not-a-color',
                intensity: 0.25,
            }));

            expect(resolved.color).toEqual([0.25, 0.25, 0.25]);
        });

        test('Should carry a hemisphere light ground colour through', () => {
            const resolved = resolveLight(createHemisphereLight({
                color: '#ffffff',
                groundColor: '#ff0000',
            }));

            expect(resolved.ground).toEqual([1, 0, 0]);
        });

        test('Should resolve a spot cone to its cosines', () => {
            const light = createSpotLight({
                angle: 0.5,
                penumbra: 0.5,
            });
            const resolved = resolveLight(light);

            expect(resolved.cosOuter).toBeCloseTo(Math.cos(0.5), 12);
            expect(resolved.cosInner).toBeCloseTo(Math.cos(0.25), 12);
            expect(resolved.cosInner).toBeGreaterThan(resolved.cosOuter);
        });

        test('Should give a hard-edged spot an inner cone equal to its outer cone', () => {
            const resolved = resolveLight(createSpotLight({
                angle: 0.5,
                penumbra: 0,
            }));

            expect(resolved.cosInner).toBeCloseTo(resolved.cosOuter, 12);
        });

        test('Should not alias the light own vectors', () => {
            const light = createPointLight({
                position: [1, 2, 3],
            });
            const resolved = resolveLight(light);

            resolved.position = [9, 9, 9];

            expect(light.position).toEqual([1, 2, 3]);
        });

    });

    describe('LightList', () => {

        test('Should notify on add, remove and clear', () => {
            const notify = vi.fn();
            const list = new LightList(notify);
            const light = createAmbientLight();

            list.add(light);
            expect(notify).toHaveBeenCalledTimes(1);

            list.remove(light);
            expect(notify).toHaveBeenCalledTimes(2);

            list.clear();
            expect(notify).toHaveBeenCalledTimes(3);
        });

        test('Should notify when a light already in the list changes', () => {
            const notify = vi.fn();
            const list = new LightList(notify);
            const light = createDirectionalLight();

            list.add(light);
            notify.mockClear();

            light.intensity = 0.5;

            expect(notify).toHaveBeenCalledTimes(1);
        });

        test('Should stop notifying once a light is removed', () => {
            const notify = vi.fn();
            const list = new LightList(notify);
            const light = createDirectionalLight();

            list.add(light);
            list.remove(light);
            notify.mockClear();

            light.intensity = 0.5;

            expect(notify).not.toHaveBeenCalled();
        });

        test('Should ignore a light added twice', () => {
            const list = new LightList(() => undefined);
            const light = createAmbientLight();

            list.add(light, light);
            list.add(light);

            expect(list.length).toBe(1);
        });

        test('Should ignore removing a light it does not hold', () => {
            const list = new LightList(() => undefined);

            list.remove(createAmbientLight());

            expect(list.length).toBe(0);
        });

        test('Should bump its version on every mutation', () => {
            const list = new LightList(() => undefined);
            const light = createAmbientLight();
            const initial = list.version;

            list.add(light);

            const afterAdd = list.version;

            expect(afterAdd).toBeGreaterThan(initial);

            light.color = '#ff0000';

            expect(list.version).toBeGreaterThan(afterAdd);
        });

        test('Should be iterable in insertion order', () => {
            const list = new LightList(() => undefined);
            const first = createAmbientLight();
            const second = createDirectionalLight();

            list.add(first, second);

            expect([...list]).toEqual([first, second]);
            expect(list.toArray()).toEqual([first, second]);
        });

        test('Should find the first light of a type', () => {
            const list = new LightList(() => undefined);
            const directional = createDirectionalLight();

            list.add(createAmbientLight(), directional);

            expect(list.find('directional')).toBe(directional);
            expect(list.find('spot')).toBeUndefined();
        });

    });

});
