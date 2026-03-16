import {
    describe,
    expect,
    test,
} from 'vitest';

import {
    FRAGMENT_SHADER,
    VERTEX_SHADER,
} from '../src/shaders';

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
            expect(FRAGMENT_SHADER).toContain('dot(normal, light)');
        });

        test('includes ambient term', () => {
            expect(FRAGMENT_SHADER).toContain('uniforms.ambient');
        });

        test('outputs color with alpha', () => {
            expect(FRAGMENT_SHADER).toContain('color.a');
        });

    });

});
