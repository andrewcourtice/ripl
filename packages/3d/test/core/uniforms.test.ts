import {
    describe,
    expect,
    test,
} from 'vitest';

import {
    createDirectionalLight,
    createHemisphereLight,
    createPointLight,
    createSpotLight,
    FOG_MODE_CODE,
    LIGHT_STRUCT_SIZE,
    LIGHT_TYPE_CODE,
    LIGHT_UNIFORM_FIELDS,
    mat4Identity,
    MAX_LIGHTS,
    packSceneUniform,
    resolveLight,
    SCENE_CAMERA_POSITION_OFFSET,
    SCENE_FOG_COLOR_OFFSET,
    SCENE_FOG_PARAMS_OFFSET,
    SCENE_LIGHT_COUNT_OFFSET,
    SCENE_LIGHTS_OFFSET,
    SCENE_UNIFORM_BYTES,
    SCENE_UNIFORM_FIELDS,
    SCENE_UNIFORM_FLOATS,
    SCENE_UNIFORM_WGSL,
} from '../../src';

describe('Scene uniform', () => {

    function pack(lights = [] as ReturnType<typeof resolveLight>[], fog?: Parameters<typeof packSceneUniform>[1]['fog']) {
        return packSceneUniform(new Float32Array(SCENE_UNIFORM_FLOATS), {
            viewProjectionMatrix: mat4Identity(),
            cameraPosition: [1, 2, 3],
            lights,
            fog,
        });
    }

    describe('Layout', () => {

        test('Should size the buffer to a multiple of the 16-byte uniform alignment', () => {
            expect(SCENE_UNIFORM_BYTES).toBe(SCENE_UNIFORM_FLOATS * 4);
            expect(SCENE_UNIFORM_BYTES % 16).toBe(0);
        });

        test('Should lay every field out contiguously and in order', () => {
            let cursor = 0;

            for (const field of SCENE_UNIFORM_FIELDS) {
                expect(field.offset).toBe(cursor);
                cursor += field.size;
            }

            expect(cursor).toBe(SCENE_UNIFORM_FLOATS);
        });

        test('Should keep every light field 16-byte aligned', () => {
            for (const field of LIGHT_UNIFORM_FIELDS) {
                expect(field.offset % 4).toBe(0);
            }

            expect(LIGHT_STRUCT_SIZE % 4).toBe(0);
        });

        test('Should name the same fields in the WGSL struct as in the descriptor', () => {
            for (const field of SCENE_UNIFORM_FIELDS) {
                expect(SCENE_UNIFORM_WGSL).toContain(`${field.name}: ${field.type},`);
            }

            for (const field of LIGHT_UNIFORM_FIELDS) {
                expect(SCENE_UNIFORM_WGSL).toContain(`${field.name}: ${field.type},`);
            }
        });

        test('Should declare Light before the struct that holds an array of it', () => {
            expect(SCENE_UNIFORM_WGSL.indexOf('struct Light')).toBeLessThan(SCENE_UNIFORM_WGSL.indexOf('struct Uniforms'));
        });

    });

    describe('packSceneUniform', () => {

        test('Should write the view projection matrix first', () => {
            const packed = pack();

            expect(Array.from(packed.slice(0, 16))).toEqual(Array.from(mat4Identity()));
        });

        test('Should write the camera position with the light count in its unused component', () => {
            const packed = pack([resolveLight(createDirectionalLight())]);

            expect(packed[SCENE_CAMERA_POSITION_OFFSET]).toBe(1);
            expect(packed[SCENE_CAMERA_POSITION_OFFSET + 1]).toBe(2);
            expect(packed[SCENE_CAMERA_POSITION_OFFSET + 2]).toBe(3);
            expect(packed[SCENE_LIGHT_COUNT_OFFSET]).toBe(1);
        });

        test('Should write a directional light type, colour and direction', () => {
            const light = resolveLight(createDirectionalLight({
                color: '#ff0000',
                direction: [0, -1, 0],
                intensity: 0.5,
            }));
            const packed = pack([light]);

            expect(packed[SCENE_LIGHTS_OFFSET]).toBeCloseTo(0.5, 6);
            expect(packed[SCENE_LIGHTS_OFFSET + 3]).toBe(LIGHT_TYPE_CODE.directional);
            expect(packed[SCENE_LIGHTS_OFFSET + 8]).toBe(0);
            expect(packed[SCENE_LIGHTS_OFFSET + 9]).toBe(-1);
        });

        test('Should fold a point light range and decay into the unused components', () => {
            const light = resolveLight(createPointLight({
                position: [4, 5, 6],
                distance: 20,
                decay: 1.5,
            }));
            const packed = pack([light]);

            expect(packed[SCENE_LIGHTS_OFFSET + 4]).toBe(4);
            expect(packed[SCENE_LIGHTS_OFFSET + 7]).toBe(20);
            expect(packed[SCENE_LIGHTS_OFFSET + 11]).toBe(1.5);
        });

        test('Should write a spot cone into the params slot', () => {
            const light = resolveLight(createSpotLight({
                angle: 0.5,
                penumbra: 0.5,
            }));
            const packed = pack([light]);

            expect(packed[SCENE_LIGHTS_OFFSET + 12]).toBeCloseTo(Math.cos(0.5), 6);
            expect(packed[SCENE_LIGHTS_OFFSET + 13]).toBeCloseTo(Math.cos(0.25), 6);
        });

        test('Should write a hemisphere ground colour into the ground slot', () => {
            const light = resolveLight(createHemisphereLight({
                groundColor: '#0000ff',
            }));
            const packed = pack([light]);

            expect(packed[SCENE_LIGHTS_OFFSET + 16]).toBe(0);
            expect(packed[SCENE_LIGHTS_OFFSET + 18]).toBe(1);
        });

        test('Should stride each light by the declared struct size', () => {
            const packed = pack([
                resolveLight(createPointLight({ position: [1, 0, 0] })),
                resolveLight(createPointLight({ position: [2, 0, 0] })),
            ]);

            expect(packed[SCENE_LIGHTS_OFFSET + 4]).toBe(1);
            expect(packed[SCENE_LIGHTS_OFFSET + LIGHT_STRUCT_SIZE + 4]).toBe(2);
        });

        test('Should cap the light count at the supported maximum', () => {
            const lights = Array.from({ length: MAX_LIGHTS + 3 }, () => resolveLight(createDirectionalLight()));
            const packed = pack(lights);

            expect(packed[SCENE_LIGHT_COUNT_OFFSET]).toBe(MAX_LIGHTS);
        });

        test('Should default to no fog', () => {
            expect(pack()[SCENE_FOG_COLOR_OFFSET + 3]).toBe(FOG_MODE_CODE.none);
        });

        test('Should write fog when given', () => {
            const packed = pack([], {
                mode: FOG_MODE_CODE.linear,
                color: [1, 0.5, 0],
                near: 2,
                far: 40,
                density: 0.1,
            });

            expect(packed[SCENE_FOG_COLOR_OFFSET]).toBe(1);
            expect(packed[SCENE_FOG_COLOR_OFFSET + 3]).toBe(FOG_MODE_CODE.linear);
            expect(packed[SCENE_FOG_PARAMS_OFFSET]).toBe(2);
            expect(packed[SCENE_FOG_PARAMS_OFFSET + 1]).toBe(40);
        });

        // The scratch array is reused every frame, so a removed light must not leave its bytes behind.
        test('Should clear a previously packed light when the rig shrinks', () => {
            const target = new Float32Array(SCENE_UNIFORM_FLOATS);
            const input = {
                viewProjectionMatrix: mat4Identity(),
                cameraPosition: [0, 0, 0] as [number, number, number],
                lights: [resolveLight(createPointLight({ position: [7, 7, 7] }))],
            };

            packSceneUniform(target, input);
            expect(target[SCENE_LIGHTS_OFFSET + 4]).toBe(7);

            packSceneUniform(target, {
                ...input,
                lights: [],
            });

            expect(target[SCENE_LIGHTS_OFFSET + 4]).toBe(0);
            expect(target[SCENE_LIGHT_COUNT_OFFSET]).toBe(0);
        });

    });

});
