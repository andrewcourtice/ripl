import {
    describe,
    expect,
    test,
} from 'vitest';

import {
    GeometryManager,
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

import {
    resolveMaterial,
    triangulateFacesFlat,
    triangulateFacesIndices,
} from '@ripl/3d';

import type {
    Face3D,
    MeshSubmission,
} from '@ripl/3d';

describe('GeometryManager', () => {

    /* eslint-disable @stylistic/array-element-newline */
    const identity = new Float64Array([
        1, 0, 0, 0,
        0, 1, 0, 0,
        0, 0, 1, 0,
        0, 0, 0, 1,
    ]);
    /* eslint-enable @stylistic/array-element-newline */

    const floatsPerVertex = VERTEX_STRIDE / 4;

    function createManager() {
        const device = createMockGPUDevice();
        const manager = new GeometryManager(device.handle, createMockPipelineState(device));

        return {
            device,
            manager,
        };
    }

    const material = resolveMaterial(undefined, '#ffffff');

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
            material,
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

        const meshVertices = triangulateFacesFlat(faces, material);
        const meshIndices = triangulateFacesIndices(faces);
        const result = renderFrame(manager, [
            {
                vertices: meshVertices,
                indices: meshIndices,
                modelMatrix: identity,
                normalMatrix: identity,
                material,
            },
        ])!;

        expect(result).not.toBeNull();
        expect(result.vertexCount).toBe(4);
        expect(result.indexCount).toBe(6);

        const writtenVertices = Array.from(asMockBuffer(result.vertexBuffer).asFloat32(meshVertices.length));
        const writtenIndices = Array.from(asMockBuffer(result.indexBuffer).asUint32(meshIndices.length));

        expect(writtenVertices).toEqual(Array.from(meshVertices));
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

        // The second mesh starts exactly where the first ends, whatever the vertex stride is.
        const meshFloats = 3 * floatsPerVertex;

        expect(vertexFloats[0]).toBe(0);
        expect(vertexFloats[meshFloats - 1]).toBe(meshFloats - 1);
        expect(vertexFloats[meshFloats]).toBe(100);
        expect(vertexFloats[meshFloats * 2 - 1]).toBe(100 + meshFloats - 1);

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

    // WGPU-5: this test used to assert the opposite — that a destroyed manager happily recreated
    // GPU buffers on a device it had already released. On real hardware those calls raise
    // validation errors; the mock cannot, which is exactly how the defect got pinned as behaviour.
    test('Should allocate nothing after destroy', () => {
        const { device, manager } = createManager();

        const first = renderFrame(manager, [createSubmission(3)])!;

        manager.destroy();

        expect(asMockBuffer(first.vertexBuffer).destroyed).toBe(true);
        expect(asMockBuffer(first.indexBuffer).destroyed).toBe(true);

        const bufferCount = device.buffers.length;

        expect(renderFrame(manager, [createSubmission(3)])).toBeNull();
        expect(device.buffers).toHaveLength(bufferCount);
    });

    test('Should release the last frame submissions on destroy', () => {
        const { manager } = createManager();

        renderFrame(manager, [createSubmission(3)]);
        manager.destroy();

        expect((manager as unknown as { _submissions: unknown[] })._submissions).toHaveLength(0);
    });

});
