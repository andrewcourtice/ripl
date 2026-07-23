import type {
    Face3D,
    Matrix4,
    MeshSubmission,
    Vector3,
} from '@ripl/3d';

import type {
    ColorRGBA,
} from '@ripl/core';

import {
    numberNextPowerOfN,
} from '@ripl/utilities';

import {
    MODEL_UNIFORM_SIZE,
    VERTEX_STRIDE,
} from './pipeline';

import type {
    PipelineState,
} from './pipeline';

const FLOATS_PER_VERTEX = VERTEX_STRIDE / 4;

/**
 * Manages GPU buffer allocation and per-frame mesh accumulation.
 *
 * CPU staging arrays and GPU buffers are pooled between frames: capacity grows
 * in powers of two and is only released by {@link GeometryManager.destroy}, so
 * steady-state frames perform no allocations and no GPU buffer recreation.
 */
export class GeometryManager {

    private _device: GPUDevice;
    private _pipelineState: PipelineState;

    private _vertexBuffer: GPUBuffer | null = null;
    private _indexBuffer: GPUBuffer | null = null;
    private _vertexData = new Float32Array(0);
    private _indexData = new Uint32Array(0);

    private _submissions: MeshSubmission[] = [];
    private _modelUniformBuffers: GPUBuffer[] = [];
    private _modelBindGroups: GPUBindGroup[] = [];
    private _modelUniformData = new Float32Array(MODEL_UNIFORM_SIZE / 4);
    private _poolIndex = 0;

    constructor(device: GPUDevice, pipelineState: PipelineState) {
        this._device = device;
        this._pipelineState = pipelineState;
    }

    /** Resets per-frame state for a new render pass. */
    public beginFrame(): void {
        this._submissions.length = 0;
        this._poolIndex = 0;
    }

    /** Queues a mesh for rendering this frame. */
    public submit(submission: MeshSubmission): void {
        this._submissions.push(submission);
    }

    /**
     * Uploads all queued meshes to pooled GPU buffers and returns draw commands.
     *
     * Staging arrays and GPU buffers are reused between frames and only grow
     * (in powers of two) when the frame's geometry exceeds current capacity;
     * uploads and draw commands cover the used lengths, never the capacity.
     */
    public flush(): FlushResult | null {
        if (this._submissions.length === 0) {
            return null;
        }

        let totalVertices = 0;
        let totalIndices = 0;

        for (const sub of this._submissions) {
            totalVertices += sub.vertices.length / FLOATS_PER_VERTEX;
            totalIndices += sub.indices.length;
        }

        const vertexFloatCount = totalVertices * FLOATS_PER_VERTEX;

        this._ensureVertexCapacity(vertexFloatCount);
        this._ensureIndexCapacity(totalIndices);

        const vertexData = this._vertexData;
        const indexData = this._indexData;

        let vertexOffset = 0;
        let indexOffset = 0;
        let baseVertex = 0;

        const draws: DrawCommand[] = [];

        for (const sub of this._submissions) {
            const vertCount = sub.vertices.length / FLOATS_PER_VERTEX;

            vertexData.set(sub.vertices, vertexOffset * FLOATS_PER_VERTEX);

            for (let i = 0; i < sub.indices.length; i++) {
                indexData[indexOffset + i] = sub.indices[i] + baseVertex;
            }

            const modelBindGroup = this._getModelBindGroup(sub.modelMatrix, sub.normalMatrix);

            draws.push({
                indexCount: sub.indices.length,
                indexOffset,
                modelBindGroup,
            });

            vertexOffset += vertCount;
            indexOffset += sub.indices.length;
            baseVertex += vertCount;
        }

        this._device.queue.writeBuffer(this._vertexBuffer!, 0, vertexData, 0, vertexFloatCount);
        this._device.queue.writeBuffer(this._indexBuffer!, 0, indexData, 0, totalIndices);

        return {
            vertexBuffer: this._vertexBuffer!,
            indexBuffer: this._indexBuffer!,
            vertexCount: totalVertices,
            indexCount: totalIndices,
            draws,
        };
    }

    /** Releases all GPU buffers and pooled CPU staging arrays. */
    public destroy(): void {
        this._vertexBuffer?.destroy();
        this._indexBuffer?.destroy();

        for (const buffer of this._modelUniformBuffers) {
            buffer.destroy();
        }

        this._vertexBuffer = null;
        this._indexBuffer = null;
        this._vertexData = new Float32Array(0);
        this._indexData = new Uint32Array(0);
        this._modelUniformBuffers.length = 0;
        this._modelBindGroups.length = 0;
    }

    private _ensureVertexCapacity(floatCount: number): void {
        if (this._vertexBuffer && this._vertexData.length >= floatCount) {
            return;
        }

        const capacity = numberNextPowerOfN(floatCount);

        if (this._vertexData.length < capacity) {
            this._vertexData = new Float32Array(capacity);
        }

        this._vertexBuffer?.destroy();
        this._vertexBuffer = this._device.createBuffer({
            size: this._vertexData.byteLength,
            usage: GPUBufferUsage.VERTEX | GPUBufferUsage.COPY_DST,
        });
    }

    private _ensureIndexCapacity(indexCount: number): void {
        if (this._indexBuffer && this._indexData.length >= indexCount) {
            return;
        }

        const capacity = numberNextPowerOfN(indexCount);

        if (this._indexData.length < capacity) {
            this._indexData = new Uint32Array(capacity);
        }

        this._indexBuffer?.destroy();
        this._indexBuffer = this._device.createBuffer({
            size: this._indexData.byteLength,
            usage: GPUBufferUsage.INDEX | GPUBufferUsage.COPY_DST,
        });
    }

    private _getModelBindGroup(modelMatrix: Matrix4, normalMatrix: Matrix4): GPUBindGroup {
        if (this._poolIndex >= this._modelUniformBuffers.length) {
            const buffer = this._device.createBuffer({
                size: MODEL_UNIFORM_SIZE,
                usage: GPUBufferUsage.UNIFORM | GPUBufferUsage.COPY_DST,
            });

            const bindGroup = this._device.createBindGroup({
                layout: this._pipelineState.modelBindGroupLayout,
                entries: [
                    {
                        binding: 0,
                        resource: {
                            buffer,
                        },
                    },
                ],
            });

            this._modelUniformBuffers.push(buffer);
            this._modelBindGroups.push(bindGroup);
        }

        const buffer = this._modelUniformBuffers[this._poolIndex];
        const data = this._modelUniformData;

        data.set(modelMatrix, 0);
        data.set(normalMatrix, 16);

        // writeBuffer copies the data at call time, so the scratch array is safe to reuse.
        this._device.queue.writeBuffer(buffer, 0, data);

        const bindGroup = this._modelBindGroups[this._poolIndex];
        this._poolIndex++;

        return bindGroup;
    }

}

/** A single draw call within a flush result. */
export interface DrawCommand {
    /** Number of indices to draw for this mesh. */
    indexCount: number;
    /** Offset into the shared index buffer where this mesh's indices begin. */
    indexOffset: number;
    /** Bind group holding this mesh's model and normal matrices. */
    modelBindGroup: GPUBindGroup;
}

/** Result of flushing all queued meshes — buffers and per-mesh draw commands. */
export interface FlushResult {
    /** Pooled GPU buffer containing the frame's vertex data; capacity may exceed the used length. */
    vertexBuffer: GPUBuffer;
    /** Pooled GPU buffer containing the frame's index data; capacity may exceed the used length. */
    indexBuffer: GPUBuffer;
    /** Number of vertices used by this frame within {@link FlushResult.vertexBuffer}. */
    vertexCount: number;
    /** Number of indices used by this frame within {@link FlushResult.indexBuffer}. */
    indexCount: number;
    /** Per-mesh draw commands into the shared vertex and index buffers. */
    draws: DrawCommand[];
}

/** Triangulates a list of Face3D into interleaved vertex data and index arrays. */
export function triangulatefaces(
    faces: Face3D[],
    modelMatrix: Matrix4,
    color: ColorRGBA
): {
    /** Interleaved vertex data (positions, normals, colors) for all triangles. */
    vertices: Float32Array;
    /** Triangle vertex indices into {@link vertices}. */
    indices: Uint32Array;
} {
    let vertexCount = 0;
    let indexCount = 0;

    for (const face of faces) {
        const nv = face.vertices.length;
        vertexCount += nv;
        indexCount += (nv - 2) * 3;
    }

    const vertices = new Float32Array(vertexCount * 10);
    const indices = new Uint32Array(indexCount);

    const cr = color[0] / 255;
    const cg = color[1] / 255;
    const cb = color[2] / 255;
    const ca = color[3];

    let vi = 0;
    let ii = 0;
    let baseIndex = 0;

    for (const face of faces) {
        const faceVerts = face.vertices;
        const normal = face.normal ?? computeTriangleNormal(faceVerts[0], faceVerts[1], faceVerts[2]);

        for (const vertex of faceVerts) {
            vertices[vi++] = vertex[0];
            vertices[vi++] = vertex[1];
            vertices[vi++] = vertex[2];
            vertices[vi++] = normal[0];
            vertices[vi++] = normal[1];
            vertices[vi++] = normal[2];
            vertices[vi++] = cr;
            vertices[vi++] = cg;
            vertices[vi++] = cb;
            vertices[vi++] = ca;
        }

        // Fan triangulation for convex polygons
        for (let t = 0; t < faceVerts.length - 2; t++) {
            indices[ii++] = baseIndex;
            indices[ii++] = baseIndex + t + 1;
            indices[ii++] = baseIndex + t + 2;
        }

        baseIndex += faceVerts.length;
    }

    return {
        vertices,
        indices,
    };
}

function computeTriangleNormal(a: Vector3, b: Vector3, c: Vector3): Vector3 {
    const ux = b[0] - a[0];
    const uy = b[1] - a[1];
    const uz = b[2] - a[2];
    const vx = c[0] - a[0];
    const vy = c[1] - a[1];
    const vz = c[2] - a[2];

    const nx = uy * vz - uz * vy;
    const ny = uz * vx - ux * vz;
    const nz = ux * vy - uy * vx;

    const len = Math.sqrt(nx * nx + ny * ny + nz * nz);

    if (len === 0) {
        return [0, 1, 0];
    }

    return [nx / len, ny / len, nz / len];
}
