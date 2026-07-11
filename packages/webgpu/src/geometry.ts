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

    private device: GPUDevice;
    private pipelineState: PipelineState;

    private vertexBuffer: GPUBuffer | null = null;
    private indexBuffer: GPUBuffer | null = null;
    private vertexCapacity = 0;
    private indexCapacity = 0;

    private submissions: MeshSubmission[] = [];
    private modelUniformBuffers: GPUBuffer[] = [];
    private modelBindGroups: GPUBindGroup[] = [];
    private poolIndex = 0;

    constructor(device: GPUDevice, pipelineState: PipelineState) {
        this.device = device;
        this.pipelineState = pipelineState;
    }

    /** Resets per-frame state for a new render pass. */
    public beginFrame(): void {
        this.submissions.length = 0;
        this.poolIndex = 0;
    }

    /** Queues a mesh for rendering this frame. */
    public submit(submission: MeshSubmission): void {
        this.submissions.push(submission);
    }

    /** Uploads all queued meshes to GPU buffers and returns draw commands. */
    public flush(): FlushResult | null {
        if (this.submissions.length === 0) {
            return null;
        }

        let totalVertices = 0;
        let totalIndices = 0;

        for (const sub of this.submissions) {
            totalVertices += sub.vertices.length / 10;
            totalIndices += sub.indices.length;
        }

        const vertexByteSize = totalVertices * VERTEX_STRIDE;
        const indexByteSize = totalIndices * 4;

        this.ensureVertexBuffer(vertexByteSize);
        this.ensureIndexBuffer(indexByteSize);

        const vertexData = new Float32Array(totalVertices * 10);
        const indexData = new Uint32Array(totalIndices);

        let vertexOffset = 0;
        let indexOffset = 0;
        let baseVertex = 0;

        const draws: DrawCommand[] = [];

        for (const sub of this.submissions) {
            const vertCount = sub.vertices.length / 10;

            vertexData.set(sub.vertices, vertexOffset * 10);

            for (let i = 0; i < sub.indices.length; i++) {
                indexData[indexOffset + i] = sub.indices[i] + baseVertex;
            }

            const modelBindGroup = this.getModelBindGroup(sub.modelMatrix, sub.normalMatrix);

            draws.push({
                indexCount: sub.indices.length,
                indexOffset,
                modelBindGroup,
            });

            vertexOffset += vertCount;
            indexOffset += sub.indices.length;
            baseVertex += vertCount;
        }

        this.device.queue.writeBuffer(this.vertexBuffer!, 0, vertexData);
        this.device.queue.writeBuffer(this.indexBuffer!, 0, indexData);

        return {
            vertexBuffer: this.vertexBuffer!,
            indexBuffer: this.indexBuffer!,
            draws,
        };
    }

    /** Releases all GPU buffers. */
    public destroy(): void {
        this.vertexBuffer?.destroy();
        this.indexBuffer?.destroy();

        for (const buffer of this.modelUniformBuffers) {
            buffer.destroy();
        }

        this.vertexBuffer = null;
        this.indexBuffer = null;
        this.modelUniformBuffers.length = 0;
        this.modelBindGroups.length = 0;
    }

    private ensureVertexBuffer(byteSize: number): void {
        if (this.vertexBuffer && this.vertexCapacity >= byteSize) {
            return;
        }

        this.vertexBuffer?.destroy();
        this.vertexCapacity = Math.max(byteSize, this.vertexCapacity * 2);
        this.vertexBuffer = this.device.createBuffer({
            size: this.vertexCapacity,
            usage: GPUBufferUsage.VERTEX | GPUBufferUsage.COPY_DST,
        });
    }

    private ensureIndexBuffer(byteSize: number): void {
        if (this.indexBuffer && this.indexCapacity >= byteSize) {
            return;
        }

        this.indexBuffer?.destroy();
        this.indexCapacity = Math.max(byteSize, this.indexCapacity * 2);
        this.indexBuffer = this.device.createBuffer({
            size: this.indexCapacity,
            usage: GPUBufferUsage.INDEX | GPUBufferUsage.COPY_DST,
        });
    }

    private getModelBindGroup(modelMatrix: Matrix4, normalMatrix: Matrix4): GPUBindGroup {
        if (this.poolIndex >= this.modelUniformBuffers.length) {
            const buffer = this.device.createBuffer({
                size: MODEL_UNIFORM_SIZE,
                usage: GPUBufferUsage.UNIFORM | GPUBufferUsage.COPY_DST,
            });

            const bindGroup = this.device.createBindGroup({
                layout: this.pipelineState.modelBindGroupLayout,
                entries: [
                    {
                        binding: 0,
                        resource: {
                            buffer,
                        },
                    },
                ],
            });

            this.modelUniformBuffers.push(buffer);
            this.modelBindGroups.push(bindGroup);
        }

        const buffer = this.modelUniformBuffers[this.poolIndex];
        const data = new Float32Array(MODEL_UNIFORM_SIZE / 4);

        data.set(modelMatrix, 0);
        data.set(normalMatrix, 16);

        this.device.queue.writeBuffer(buffer, 0, data);

        const bindGroup = this.modelBindGroups[this.poolIndex];
        this.poolIndex++;

        return bindGroup;
    }

}

/** A single draw call within a flush result. */
export interface DrawCommand {
    indexCount: number;
    indexOffset: number;
    modelBindGroup: GPUBindGroup;
}

/** Result of flushing all queued meshes — buffers and per-mesh draw commands. */
export interface FlushResult {
    vertexBuffer: GPUBuffer;
    indexBuffer: GPUBuffer;
    draws: DrawCommand[];
}

/** Triangulates a list of Face3D into interleaved vertex data and index arrays. */
export function triangulatefaces(
    faces: Face3D[],
    modelMatrix: Matrix4,
    color: ColorRGBA
): {
    vertices: Float32Array;
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
