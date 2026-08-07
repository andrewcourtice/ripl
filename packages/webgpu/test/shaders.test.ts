import {
    describe,
    expect,
    test,
} from 'vitest';

import {
    FRAGMENT_SHADER,
    VERTEX_SHADER,
} from '../src/shaders';

import {
    LIGHT_TYPE_CODE,
    MAX_LIGHTS,
    SCENE_UNIFORM_FIELDS,
    SCENE_UNIFORM_WGSL,
} from '@ripl/3d';

describe('Shaders', () => {

    describe('VERTEX_SHADER', () => {

        test('is a non-empty string', () => {
            expect(typeof VERTEX_SHADER).toBe('string');
            expect(VERTEX_SHADER.length).toBeGreaterThan(0);
        });

        test('declares Uniforms struct', () => {
            expect(VERTEX_SHADER).toContain('struct Uniforms');
        });

        test('declares ModelUniforms struct', () => {
            expect(VERTEX_SHADER).toContain('struct ModelUniforms');
        });

        test('declares VertexInput struct', () => {
            expect(VERTEX_SHADER).toContain('struct VertexInput');
        });

        test('declares VertexOutput struct', () => {
            expect(VERTEX_SHADER).toContain('struct VertexOutput');
        });

        test('binds scene uniforms at group 0, binding 0', () => {
            expect(VERTEX_SHADER).toContain('@group(0) @binding(0)');
        });

        test('binds model uniforms at group 1, binding 0', () => {
            expect(VERTEX_SHADER).toContain('@group(1) @binding(0)');
        });

        test('has a vertex entry point', () => {
            expect(VERTEX_SHADER).toMatch(/@vertex\s+fn main/);
        });

        test('transforms position by model and view-projection matrices', () => {
            expect(VERTEX_SHADER).toContain('model.modelMatrix');
            expect(VERTEX_SHADER).toContain('uniforms.viewProjectionMatrix');
        });

        test('transforms normal by normal matrix', () => {
            expect(VERTEX_SHADER).toContain('model.normalMatrix');
        });

    });

    describe('FRAGMENT_SHADER', () => {

        test('is a non-empty string', () => {
            expect(typeof FRAGMENT_SHADER).toBe('string');
            expect(FRAGMENT_SHADER.length).toBeGreaterThan(0);
        });

        test('declares Uniforms struct', () => {
            expect(FRAGMENT_SHADER).toContain('struct Uniforms');
        });

        test('binds scene uniforms at group 0, binding 0', () => {
            expect(FRAGMENT_SHADER).toContain('@group(0) @binding(0)');
        });

        test('has a fragment entry point', () => {
            expect(FRAGMENT_SHADER).toMatch(/@fragment\s+fn main/);
        });

        test('applies Lambertian diffuse lighting', () => {
            expect(FRAGMENT_SHADER).toContain('dot(normal, toLight)');
        });

        // `point` is the unbranched positional case, so it has no literal to match on; the
        // parity matrix in @ripl/3d is what proves all five types shade identically.
        test('branches on every light type that needs its own case', () => {
            expect(FRAGMENT_SHADER).toContain('fn shadeSurface');
            expect(FRAGMENT_SHADER).toContain('fn distanceAttenuation');
            expect(FRAGMENT_SHADER).toContain('fn spotAttenuation');

            for (const type of ['ambient', 'hemisphere', 'directional', 'spot'] as const) {
                expect(FRAGMENT_SHADER).toContain(`== ${LIGHT_TYPE_CODE[type]}u`);
            }
        });

        test('loops no further than the light array it was given', () => {
            expect(FRAGMENT_SHADER).toContain(`min(u32(uniforms.cameraPosition.w), ${MAX_LIGHTS}u)`);
        });

        test('declares the generated scene uniform struct rather than its own', () => {
            expect(FRAGMENT_SHADER).toContain(SCENE_UNIFORM_WGSL);
        });

        test('outputs color with alpha', () => {
            expect(FRAGMENT_SHADER).toContain('surfaceColor.a');
        });

        test('samples the material texture through its own bind group', () => {
            expect(FRAGMENT_SHADER).toContain('@group(2) @binding(0) var materialTexture: texture_2d<f32>');
            expect(FRAGMENT_SHADER).toContain('@group(2) @binding(1) var materialSampler: sampler');
            expect(FRAGMENT_SHADER).toContain('textureSample(materialTexture, materialSampler');
        });

        test('applies the texture repeat and offset from the model uniform', () => {
            expect(FRAGMENT_SHADER).toContain('model.mapTransform.xy');
            expect(FRAGMENT_SHADER).toContain('model.mapTransform.zw');
        });

    });

    // The struct is generated from the same descriptor the CPU-side packer writes, so a field added
    // to the bytes without a matching shader member fails here rather than corrupting a render.
    describe('Scene uniform drift', () => {

        test.each([
            ['vertex', VERTEX_SHADER],
            ['fragment', FRAGMENT_SHADER],
        ])('the %s stage declares every scene uniform field in offset order', (_stage, shader) => {
            let cursor = shader.indexOf('struct Uniforms');

            expect(cursor).toBeGreaterThanOrEqual(0);

            for (const field of SCENE_UNIFORM_FIELDS) {
                const found = shader.indexOf(`${field.name}: ${field.type},`, cursor);

                expect(found).toBeGreaterThan(cursor);

                cursor = found;
            }
        });

        test('both stages declare the identical struct text', () => {
            expect(VERTEX_SHADER).toContain(SCENE_UNIFORM_WGSL);
            expect(FRAGMENT_SHADER).toContain(SCENE_UNIFORM_WGSL);
        });

    });

});
