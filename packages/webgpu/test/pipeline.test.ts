import {
    describe,
    expect,
    test,
} from 'vitest';

import {
    MODEL_BIND_GROUP_LAYOUT_ENTRIES,
    MODEL_UNIFORM_SIZE,
    SCENE_BIND_GROUP_LAYOUT_ENTRIES,
    SCENE_UNIFORM_SIZE,
    VERTEX_BUFFER_LAYOUT,
    VERTEX_STRIDE,
} from '../src/pipeline';

describe('Pipeline constants', () => {

    test('VERTEX_STRIDE is 40 bytes (10 floats × 4)', () => {
        expect(VERTEX_STRIDE).toBe(10 * 4);
    });

    test('SCENE_UNIFORM_SIZE is 80 bytes (mat4 + vec3 + f32, aligned)', () => {
        expect(SCENE_UNIFORM_SIZE).toBe(80);
    });

    test('MODEL_UNIFORM_SIZE is 128 bytes (2 × mat4)', () => {
        expect(MODEL_UNIFORM_SIZE).toBe(128);
    });

});

describe('VERTEX_BUFFER_LAYOUT', () => {

    test('arrayStride matches VERTEX_STRIDE', () => {
        expect(VERTEX_BUFFER_LAYOUT.arrayStride).toBe(VERTEX_STRIDE);
    });

    test('has 3 attributes', () => {
        expect(VERTEX_BUFFER_LAYOUT.attributes).toHaveLength(3);
    });

    test('position attribute at location 0, offset 0, float32x3', () => {
        const attr = (VERTEX_BUFFER_LAYOUT.attributes as GPUVertexAttribute[])[0];
        expect(attr.shaderLocation).toBe(0);
        expect(attr.offset).toBe(0);
        expect(attr.format).toBe('float32x3');
    });

    test('normal attribute at location 1, offset 12, float32x3', () => {
        const attr = (VERTEX_BUFFER_LAYOUT.attributes as GPUVertexAttribute[])[1];
        expect(attr.shaderLocation).toBe(1);
        expect(attr.offset).toBe(12);
        expect(attr.format).toBe('float32x3');
    });

    test('color attribute at location 2, offset 24, float32x4', () => {
        const attr = (VERTEX_BUFFER_LAYOUT.attributes as GPUVertexAttribute[])[2];
        expect(attr.shaderLocation).toBe(2);
        expect(attr.offset).toBe(24);
        expect(attr.format).toBe('float32x4');
    });

});

describe('Bind group layout entries', () => {

    test('SCENE_BIND_GROUP_LAYOUT_ENTRIES has 1 entry', () => {
        expect(SCENE_BIND_GROUP_LAYOUT_ENTRIES).toHaveLength(1);
    });

    test('scene entry is at binding 0 with vertex+fragment visibility', () => {
        const entry = SCENE_BIND_GROUP_LAYOUT_ENTRIES[0];
        expect(entry.binding).toBe(0);
        expect(entry.visibility).toBe(0x3);
        expect(entry.buffer?.type).toBe('uniform');
    });

    test('MODEL_BIND_GROUP_LAYOUT_ENTRIES has 1 entry', () => {
        expect(MODEL_BIND_GROUP_LAYOUT_ENTRIES).toHaveLength(1);
    });

    test('model entry is at binding 0 with vertex-only visibility', () => {
        const entry = MODEL_BIND_GROUP_LAYOUT_ENTRIES[0];
        expect(entry.binding).toBe(0);
        expect(entry.visibility).toBe(0x1);
        expect(entry.buffer?.type).toBe('uniform');
    });

});
