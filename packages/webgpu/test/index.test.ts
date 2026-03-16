import {
    describe,
    expect,
    test,
} from 'vitest';

import * as webgpu from '../src/index';

describe('Index re-exports', () => {

    test('exports triangulatefaces from geometry', () => {
        expect(webgpu.triangulatefaces).toBeTypeOf('function');
    });

    test('exports VERTEX_SHADER from shaders', () => {
        expect(webgpu.VERTEX_SHADER).toBeTypeOf('string');
    });

    test('exports FRAGMENT_SHADER from shaders', () => {
        expect(webgpu.FRAGMENT_SHADER).toBeTypeOf('string');
    });

    test('exports VERTEX_STRIDE from pipeline', () => {
        expect(webgpu.VERTEX_STRIDE).toBeTypeOf('number');
    });

    test('exports SCENE_UNIFORM_SIZE from pipeline', () => {
        expect(webgpu.SCENE_UNIFORM_SIZE).toBeTypeOf('number');
    });

    test('exports MODEL_UNIFORM_SIZE from pipeline', () => {
        expect(webgpu.MODEL_UNIFORM_SIZE).toBeTypeOf('number');
    });

    test('exports VERTEX_BUFFER_LAYOUT from pipeline', () => {
        expect(webgpu.VERTEX_BUFFER_LAYOUT).toBeDefined();
    });

    test('exports createPipeline from pipeline', () => {
        expect(webgpu.createPipeline).toBeTypeOf('function');
    });

    test('exports WebGPUContext3D class from context', () => {
        expect(webgpu.WebGPUContext3D).toBeTypeOf('function');
    });

    test('exports createContext from context', () => {
        expect(webgpu.createContext).toBeTypeOf('function');
    });

    test('exports requestDevice from context', () => {
        expect(webgpu.requestDevice).toBeTypeOf('function');
    });

});
