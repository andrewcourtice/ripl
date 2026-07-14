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
    MODEL_UNIFORM_SIZE,
    VERTEX_STRIDE,
} from './pipeline';

import type {
    PipelineState,
} from './pipeline';

/** Manages GPU buffer allocation and per-frame mesh accumulation. */
export class GeometryManager {

    private _device: GPUDevice;
    private _pipelineState: PipelineState;

    private _vertexBuffer: GPUBuffer | null = null;
    private _indexBuffer: GPUBuffer | null = null;
    private _vertexCapacity = 0;
    private _indexCapacity = 0;

    private _submissions: MeshSubmission[] = [];
    private _modelUniformBuffers: GPUBuffer[] = [];
    private _modelBindGroups: GPUBindGroup[] = [];
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

    /** Uploads all queued meshes to GPU buffers and returns draw commands. */
    public flush(): FlushResult | null {
        if (this._submissions.length === 0) {
            return null;
        }

        let totalVertices = 0;
        let totalIndices = 0;

        for (const sub of this._submissions) {
            totalVertices += sub.vertices.length / 10;
            totalIndices += sub.indices.length;
        }

        const vertexByteSize = totalVertices * VERTEX_STRIDE;
        const indexByteSize = totalIndices * 4;

        this._ensureVertexBuffer(vertexByteSize);
        this._ensureIndexBuffer(indexByteSize);

        const vertexData = new Float32Array(totalVertices * 10);
        const indexData = new Uint32Array(totalIndices);

        let vertexOffset = 0;
        let indexOffset = 0;
        let baseVertex = 0;

        const draws: DrawCommand[] = [];

        for (const sub of this._submissions) {
            const vertCount = sub.vertices.length / 10;

            vertexData.set(sub.vertices, vertexOffset * 10);

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

        this._device.queue.writeBuffer(this._vertexBuffer!, 0, vertexData);
        this._device.queue.writeBuffer(this._indexBuffer!, 0, indexData);

        return {
            vertexBuffer: this._vertexBuffer!,
            indexBuffer: this._indexBuffer!,
            draws,
        };
    }

    /** Releases all GPU buffers. */
    public destroy(): void {
        this._vertexBuffer?.destroy();
        this._indexBuffer?.destroy();

        for (const buffer of this._modelUniformBuffers) {
            buffer.destroy();
        }

        this._vertexBuffer = null;
        this._indexBuffer = null;
        this._modelUniformBuffers.length = 0;
        this._modelBindGroups.length = 0;
    }

    private _ensureVertexBuffer(byteSize: number): void {
        if (this._vertexBuffer && this._vertexCapacity >= byteSize) {
            return;
        }

        this._vertexBuffer?.destroy();
        this._vertexCapacity = Math.max(byteSize, this._vertexCapacity * 2);
        this._vertexBuffer = this._device.createBuffer({
            size: this._vertexCapacity,
            usage: GPUBufferUsage.VERTEX | GPUBufferUsage.COPY_DST,
        });
    }

    private _ensureIndexBuffer(byteSize: number): void {
        if (this._indexBuffer && this._indexCapacity >= byteSize) {
            return;
        }

        this._indexBuffer?.destroy();
        this._indexCapacity = Math.max(byteSize, this._indexCapacity * 2);
        this._indexBuffer = this._device.createBuffer({
            size: this._indexCapacity,
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
        const data = new Float32Array(MODEL_UNIFORM_SIZE / 4);

        data.set(modelMatrix, 0);
        data.set(normalMatrix, 16);

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
    /** GPU buffer containing all uploaded vertex data for the frame. */
    vertexBuffer: GPUBuffer;
    /** GPU buffer containing all uploaded index data for the frame. */
    indexBuffer: GPUBuffer;
    /** Per-mesh draw commands into the shared vertex and index buffers. */
    draws: DrawCommand[];
}

/** Triangulates a list of Face3D into interleaved vertex data and index arrays. */
export function triangulatefaces(
    faces: Face3D[],
    modelMatrix: Matrix4,
    color: ColorRGBA
): {
    /** Interleaved vertex data (positions, normals, colours) for all triangles. */
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
