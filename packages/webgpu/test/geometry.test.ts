import {
    describe,
    expect,
    test,
} from 'vitest';

import {
    GeometryManager,
    triangulatefaces,
} from '../src/geometry';

import {
    VERTEX_STRIDE,
} from '../src/pipeline';

import {
    asMockBuffer,
    createMockGPUDevice,
    createMockPipelineState,
    GPU_BUFFER_USAGE,
} from './mock-gpu';

import type {
    Face3D,
    MeshSubmission,
} from '@ripl/3d';

import type {
    ColorRGBA,
} from '@ripl/core';

describe('triangulatefaces', () => {

    /* eslint-disable @stylistic/array-element-newline */
    const identity = new Float64Array([
        1, 0, 0, 0,
        0, 1, 0, 0,
        0, 0, 1, 0,
        0, 0, 0, 1,
    ]);
    /* eslint-enable @stylistic/array-element-newline */

    const white: ColorRGBA = [255, 255, 255, 1];

    test('single triangle produces 3 vertices and 3 indices', () => {
        const faces: Face3D[] = [
            {
                vertices: [
                    [0, 0, 0],
                    [1, 0, 0],
                    [0, 1, 0],
                ],
            },
        ];

        const result = triangulatefaces(faces, identity, white);

        // 3 vertices × 10 floats each = 30
        expect(result.vertices).toHaveLength(30);
        // 1 triangle = 3 indices
        expect(result.indices).toHaveLength(3);
        expect(result.indices[0]).toBe(0);
        expect(result.indices[1]).toBe(1);
        expect(result.indices[2]).toBe(2);
    });

    test('quad face produces 4 vertices and 6 indices (fan triangulation)', () => {
        const faces: Face3D[] = [
            {
                vertices: [
                    [0, 0, 0],
                    [1, 0, 0],
                    [1, 1, 0],
                    [0, 1, 0],
                ],
            },
        ];

        const result = triangulatefaces(faces, identity, white);

        // 4 vertices × 10 floats = 40
        expect(result.vertices).toHaveLength(40);
        // 2 triangles = 6 indices
        expect(result.indices).toHaveLength(6);
        // First triangle: 0, 1, 2
        expect(result.indices[0]).toBe(0);
        expect(result.indices[1]).toBe(1);
        expect(result.indices[2]).toBe(2);
        // Second triangle: 0, 2, 3
        expect(result.indices[3]).toBe(0);
        expect(result.indices[4]).toBe(2);
        expect(result.indices[5]).toBe(3);
    });

    test('interleaves position, normal, and color per vertex', () => {
        const faces: Face3D[] = [
            {
                vertices: [
                    [1, 2, 3],
                    [4, 5, 6],
                    [7, 8, 9],
                ],
            },
        ];

        const color: ColorRGBA = [255, 128, 0, 0.5];
        const result = triangulatefaces(faces, identity, color);

        // First vertex: position
        expect(result.vertices[0]).toBe(1);
        expect(result.vertices[1]).toBe(2);
        expect(result.vertices[2]).toBe(3);

        // First vertex: normal (auto-computed) at indices 3-5
        expect(typeof result.vertices[3]).toBe('number');
        expect(typeof result.vertices[4]).toBe('number');
        expect(typeof result.vertices[5]).toBe('number');

        // First vertex: color at indices 6-9
        expect(result.vertices[6]).toBeCloseTo(1); // 255/255
        expect(result.vertices[7]).toBeCloseTo(128 / 255); // ~0.502
        expect(result.vertices[8]).toBeCloseTo(0); // 0/255
        expect(result.vertices[9]).toBeCloseTo(0.5); // alpha passed through
    });

    test('normalizes RGBA color channels correctly', () => {
        const faces: Face3D[] = [
            {
                vertices: [
                    [0, 0, 0],
                    [1, 0, 0],
                    [0, 1, 0],
                ],
            },
        ];

        const color: ColorRGBA = [51, 102, 204, 0.8];
        const result = triangulatefaces(faces, identity, color);

        // Check color of first vertex (indices 6-9)
        expect(result.vertices[6]).toBeCloseTo(51 / 255);
        expect(result.vertices[7]).toBeCloseTo(102 / 255);
        expect(result.vertices[8]).toBeCloseTo(204 / 255);
        expect(result.vertices[9]).toBeCloseTo(0.8);
    });

    test('uses provided face.normal when present', () => {
        const customNormal: [number, number, number] = [0, 0, -1];
        const faces: Face3D[] = [
            {
                vertices: [
                    [0, 0, 0],
                    [1, 0, 0],
                    [0, 1, 0],
                ],
                normal: customNormal,
            },
        ];

        const result = triangulatefaces(faces, identity, white);

        // All 3 vertices should have the custom normal
        for (let vi = 0; vi < 3; vi++) {
            const base = vi * 10;
            expect(result.vertices[base + 3]).toBe(0);
            expect(result.vertices[base + 4]).toBe(0);
            expect(result.vertices[base + 5]).toBe(-1);
        }
    });

    test('computes normal when face.normal is undefined', () => {
        // XY-plane triangle: normal should point in +Z
        const faces: Face3D[] = [
            {
                vertices: [
                    [0, 0, 0],
                    [1, 0, 0],
                    [0, 1, 0],
                ],
            },
        ];

        const result = triangulatefaces(faces, identity, white);

        expect(result.vertices[3]).toBeCloseTo(0);
        expect(result.vertices[4]).toBeCloseTo(0);
        expect(result.vertices[5]).toBeCloseTo(1);
    });

    test('degenerate face (collinear vertices) uses fallback normal [0, 1, 0]', () => {
        const faces: Face3D[] = [
            {
                vertices: [
                    [0, 0, 0],
                    [1, 0, 0],
                    [2, 0, 0],
                ],
            },
        ];

        const result = triangulatefaces(faces, identity, white);

        expect(result.vertices[3]).toBe(0);
        expect(result.vertices[4]).toBe(1);
        expect(result.vertices[5]).toBe(0);
    });

    test('multiple faces accumulate correct vertex and index counts', () => {
        const faces: Face3D[] = [
            {
                vertices: [
                    [0, 0, 0],
                    [1, 0, 0],
                    [0, 1, 0],
                ],
            },
            {
                vertices: [
                    [2, 0, 0],
                    [3, 0, 0],
                    [3, 1, 0],
                    [2, 1, 0],
                ],
            },
        ];

        const result = triangulatefaces(faces, identity, white);

        // 3 + 4 = 7 vertices × 10 = 70 floats
        expect(result.vertices).toHaveLength(70);
        // 1 triangle + 2 triangles = 3 + 6 = 9 indices (wait: 3 + 6 = 9)
        // Actually: first face: 3 indices, second face (quad): 6 indices = 9
        // Wait, first face (tri): (3-2)*3 = 3, second face (quad): (4-2)*3 = 6 → total 9
        expect(result.indices).toHaveLength(9);
    });

    test('indices for second face are offset by first face vertex count', () => {
        const faces: Face3D[] = [
            {
                vertices: [
                    [0, 0, 0],
                    [1, 0, 0],
                    [0, 1, 0],
                ],
            },
            {
                vertices: [
                    [2, 0, 0],
                    [3, 0, 0],
                    [2, 1, 0],
                ],
            },
        ];

        const result = triangulatefaces(faces, identity, white);

        // First face indices: 0, 1, 2
        expect(result.indices[0]).toBe(0);
        expect(result.indices[1]).toBe(1);
        expect(result.indices[2]).toBe(2);

        // Second face indices offset by 3 (first face vertex count)
        expect(result.indices[3]).toBe(3);
        expect(result.indices[4]).toBe(4);
        expect(result.indices[5]).toBe(5);
    });

    test('empty faces array produces empty typed arrays', () => {
        const result = triangulatefaces([], identity, white);

        expect(result.vertices).toHaveLength(0);
        expect(result.indices).toHaveLength(0);
        expect(result.vertices).toBeInstanceOf(Float32Array);
        expect(result.indices).toBeInstanceOf(Uint32Array);
    });

    test('position data is stored as-is from vertex coordinates', () => {
        const faces: Face3D[] = [
            {
                vertices: [
                    [10.5, -3.2, 7.8],
                    [1, 0, 0],
                    [0, 1, 0],
                ],
            },
        ];

        const result = triangulatefaces(faces, identity, white);

        expect(result.vertices[0]).toBeCloseTo(10.5);
        expect(result.vertices[1]).toBeCloseTo(-3.2);
        expect(result.vertices[2]).toBeCloseTo(7.8);
    });

});

describe('GeometryManager', () => {

    /* eslint-disable @stylistic/array-element-newline */
    const identity = new Float64Array([
        1, 0, 0, 0,
        0, 1, 0, 0,
        0, 0, 1, 0,
        0, 0, 0, 1,
    ]);
    /* eslint-enable @stylistic/array-element-newline */

    const white: ColorRGBA = [255, 255, 255, 1];
    const floatsPerVertex = VERTEX_STRIDE / 4;

    function createManager() {
        const device = createMockGPUDevice();
        const manager = new GeometryManager(device.handle, createMockPipelineState(device));

        return {
            device,
            manager,
        };
    }

    function createSubmission(vertexCount: number, seed: number = 0): MeshSubmission {
        const vertices = new Float32Array(vertexCount * floatsPerVertex);

        for (let i = 0; i < vertices.length; i++) {
            vertices[i] = seed + i;
        }

        const indices = new Uint32Array(vertexCount);

        for (let i = 0; i < vertexCount; i++) {
            indices[i] = i;
        }

        return {
            vertices,
            indices,
            modelMatrix: identity,
            normalMatrix: identity,
        };
    }

    function renderFrame(manager: GeometryManager, submissions: MeshSubmission[]) {
        manager.beginFrame();
        submissions.forEach(submission => manager.submit(submission));

        return manager.flush();
    }

    test('Should return null when no meshes were submitted', () => {
        const { manager } = createManager();

        manager.beginFrame();

        expect(manager.flush()).toBeNull();
    });

    test('Should write interleaved vertex data and index data for a known mesh', () => {
        const { manager } = createManager();

        const faces: Face3D[] = [
            {
                vertices: [
                    [0, 0, 0],
                    [1, 0, 0],
                    [1, 1, 0],
                    [0, 1, 0],
                ],
            },
        ];

        const mesh = triangulatefaces(faces, identity, white);
        const result = renderFrame(manager, [
            {
                vertices: mesh.vertices,
                indices: mesh.indices,
                modelMatrix: identity,
                normalMatrix: identity,
            },
        ])!;

        expect(result).not.toBeNull();
        expect(result.vertexCount).toBe(4);
        expect(result.indexCount).toBe(6);

        const writtenVertices = Array.from(asMockBuffer(result.vertexBuffer).asFloat32(mesh.vertices.length));
        const writtenIndices = Array.from(asMockBuffer(result.indexBuffer).asUint32(mesh.indices.length));

        expect(writtenVertices).toEqual(Array.from(mesh.vertices));
        expect(writtenIndices).toEqual([0, 1, 2, 0, 2, 3]);
    });

    test('Should offset indices of subsequent meshes by the accumulated vertex count', () => {
        const { manager } = createManager();

        const result = renderFrame(manager, [
            createSubmission(3),
            createSubmission(3, 100),
        ])!;

        const vertexFloats = asMockBuffer(result.vertexBuffer).asFloat32(6 * floatsPerVertex);
        const indexValues = Array.from(asMockBuffer(result.indexBuffer).asUint32(6));

        // First mesh occupies floats 0-29, second mesh floats 30-59
        expect(vertexFloats[0]).toBe(0);
        expect(vertexFloats[29]).toBe(29);
        expect(vertexFloats[30]).toBe(100);
        expect(vertexFloats[59]).toBe(129);

        // Second mesh's indices are rebased by the first mesh's vertex count
        expect(indexValues).toEqual([0, 1, 2, 3, 4, 5]);

        expect(result.draws).toHaveLength(2);
        expect(result.draws[0].indexOffset).toBe(0);
        expect(result.draws[1].indexOffset).toBe(3);
    });

    test('Should reuse the same GPU buffers on a subsequent flush with the same geometry', () => {
        const {
            device,
            manager,
        } = createManager();

        const first = renderFrame(manager, [createSubmission(3)])!;
        const bufferCount = device.buffers.length;

        const second = renderFrame(manager, [createSubmission(3, 50)])!;

        expect(second.vertexBuffer).toBe(first.vertexBuffer);
        expect(second.indexBuffer).toBe(first.indexBuffer);
        expect(device.buffers.length).toBe(bufferCount);

        // The second frame's data was written into the reused buffer
        expect(asMockBuffer(second.vertexBuffer).asFloat32(1)[0]).toBe(50);
    });

    test('Should grow capacity for a larger mesh and reuse the grown buffers for a smaller mesh', () => {
        const {
            device,
            manager,
        } = createManager();

        const small = renderFrame(manager, [createSubmission(3)])!;
        const large = renderFrame(manager, [createSubmission(20)])!;

        expect(large.vertexBuffer).not.toBe(small.vertexBuffer);
        expect(large.indexBuffer).not.toBe(small.indexBuffer);
        expect(asMockBuffer(small.vertexBuffer).destroyed).toBe(true);
        expect(asMockBuffer(small.indexBuffer).destroyed).toBe(true);

        const bufferCount = device.buffers.length;
        const smallAgain = renderFrame(manager, [createSubmission(3, 7)])!;

        expect(smallAgain.vertexBuffer).toBe(large.vertexBuffer);
        expect(smallAgain.indexBuffer).toBe(large.indexBuffer);
        expect(device.buffers.length).toBe(bufferCount);
    });

    test('Should upload and draw using the used lengths rather than the buffer capacity', () => {
        const {
            device,
            manager,
        } = createManager();

        renderFrame(manager, [createSubmission(20)]);

        const result = renderFrame(manager, [createSubmission(3)])!;
        const vertexBuffer = asMockBuffer(result.vertexBuffer);
        const indexBuffer = asMockBuffer(result.indexBuffer);

        const vertexWrite = device.queue.writeBufferCalls.filter(call => call.buffer === vertexBuffer).at(-1)!;
        const indexWrite = device.queue.writeBufferCalls.filter(call => call.buffer === indexBuffer).at(-1)!;

        expect(vertexWrite.byteLength).toBe(3 * VERTEX_STRIDE);
        expect(vertexWrite.byteLength).toBeLessThan(vertexBuffer.size);
        expect(indexWrite.byteLength).toBe(3 * 4);
        expect(indexWrite.byteLength).toBeLessThan(indexBuffer.size);

        expect(result.vertexCount).toBe(3);
        expect(result.indexCount).toBe(3);
        expect(result.draws[0].indexCount).toBe(3);
    });

    test('Should create GPU buffers with power-of-two capacities aligned to 4 bytes', () => {
        const {
            device,
            manager,
        } = createManager();

        renderFrame(manager, [createSubmission(3)]);
        renderFrame(manager, [createSubmission(20)]);

        const isPowerOfTwo = (value: number) => value > 0 && (value & (value - 1)) === 0;
        const geometryBuffers = [
            ...device.buffersWithUsage(GPU_BUFFER_USAGE.VERTEX),
            ...device.buffersWithUsage(GPU_BUFFER_USAGE.INDEX),
        ];

        expect(geometryBuffers.length).toBeGreaterThan(0);

        for (const buffer of geometryBuffers) {
            expect(buffer.size % 4).toBe(0);
            expect(isPowerOfTwo(buffer.size / 4)).toBe(true);
        }
    });

    test('Should reuse pooled model uniform bind groups across frames', () => {
        const {
            device,
            manager,
        } = createManager();

        const first = renderFrame(manager, [
            createSubmission(3),
            createSubmission(3),
        ])!;

        const bindGroupCount = device.bindGroupDescriptors.length;

        const second = renderFrame(manager, [
            createSubmission(3),
            createSubmission(3),
        ])!;

        expect(device.bindGroupDescriptors.length).toBe(bindGroupCount);
        expect(second.draws[0].modelBindGroup).toBe(first.draws[0].modelBindGroup);
        expect(second.draws[1].modelBindGroup).toBe(first.draws[1].modelBindGroup);
    });

    test('Should record draw calls with the correct index counts through a render pass encoder', () => {
        const {
            device,
            manager,
        } = createManager();

        const result = renderFrame(manager, [
            createSubmission(4),
            createSubmission(3),
        ])!;

        const encoder = device.createCommandEncoder();
        const pass = encoder.beginRenderPass();

        pass.setVertexBuffer(0, asMockBuffer(result.vertexBuffer));
        pass.setIndexBuffer(asMockBuffer(result.indexBuffer), 'uint32');

        for (const draw of result.draws) {
            pass.setBindGroup(1, draw.modelBindGroup);
            pass.drawIndexed(draw.indexCount, 1, draw.indexOffset, 0, 0);
        }

        pass.end();

        expect(pass.drawIndexedCalls).toHaveLength(2);
        expect(pass.drawIndexedCalls[0].indexCount).toBe(4);
        expect(pass.drawIndexedCalls[0].firstIndex).toBe(0);
        expect(pass.drawIndexedCalls[1].indexCount).toBe(3);
        expect(pass.drawIndexedCalls[1].firstIndex).toBe(4);
        expect(pass.indexFormat).toBe('uint32');
        expect(pass.vertexBuffers.get(0)).toBe(asMockBuffer(result.vertexBuffer));
        expect(pass.ended).toBe(true);
    });

    test('Should create fresh buffers after destroy', () => {
        const { manager } = createManager();

        const first = renderFrame(manager, [createSubmission(3)])!;

        manager.destroy();

        expect(asMockBuffer(first.vertexBuffer).destroyed).toBe(true);
        expect(asMockBuffer(first.indexBuffer).destroyed).toBe(true);

        const second = renderFrame(manager, [createSubmission(3)])!;

        expect(second.vertexBuffer).not.toBe(first.vertexBuffer);
        expect(second.indexBuffer).not.toBe(first.indexBuffer);
        expect(asMockBuffer(second.vertexBuffer).destroyed).toBe(false);
        expect(asMockBuffer(second.indexBuffer).destroyed).toBe(false);
    });

});
