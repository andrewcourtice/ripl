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

import {
    MODEL_UNIFORM_BYTES,
    SCENE_UNIFORM_BYTES,
    VERTEX_FLOATS,
} from '@ripl/3d';

describe('Pipeline constants', () => {

    test('VERTEX_STRIDE matches the interleaved layout in @ripl/3d', () => {
        expect(VERTEX_STRIDE).toBe(VERTEX_FLOATS * 4);
    });

    test('SCENE_UNIFORM_SIZE matches the shared layout descriptor', () => {
        expect(SCENE_UNIFORM_SIZE).toBe(SCENE_UNIFORM_BYTES);
        expect(SCENE_UNIFORM_SIZE % 16).toBe(0);
    });

    test('MODEL_UNIFORM_SIZE matches the shared layout descriptor', () => {
        expect(MODEL_UNIFORM_SIZE).toBe(MODEL_UNIFORM_BYTES);
        expect(MODEL_UNIFORM_SIZE % 16).toBe(0);
    });

});

describe('VERTEX_BUFFER_LAYOUT', () => {

    test('arrayStride matches VERTEX_STRIDE', () => {
        expect(VERTEX_BUFFER_LAYOUT.arrayStride).toBe(VERTEX_STRIDE);
    });

    test('has one attribute per interleaved channel', () => {
        expect(VERTEX_BUFFER_LAYOUT.attributes).toHaveLength(4);
    });

    // The attributes must together account for exactly the stride, or the GPU reads a vertex the
    // CPU-side writer never wrote.
    test('covers the whole stride with no gaps', () => {
        const attributes = [...VERTEX_BUFFER_LAYOUT.attributes as GPUVertexAttribute[]]
            .sort((left, right) => left.offset - right.offset);
        const sizes: Record<string, number> = {
            float32x2: 8,
            float32x3: 12,
            float32x4: 16,
        };

        let cursor = 0;

        for (const attribute of attributes) {
            expect(attribute.offset).toBe(cursor);
            cursor += sizes[attribute.format];
        }

        expect(cursor).toBe(VERTEX_STRIDE);
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

    // The fragment stage reads the material terms the model uniform carries, so it is no longer
    // vertex-only.
    test('model entry is at binding 0 and visible to both stages', () => {
        const entry = MODEL_BIND_GROUP_LAYOUT_ENTRIES[0];
        expect(entry.binding).toBe(0);
        expect(entry.visibility).toBe(0x3);
        expect(entry.buffer?.type).toBe('uniform');
    });

});
