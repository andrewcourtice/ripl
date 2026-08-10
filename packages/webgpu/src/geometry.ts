import {
    materialSideCode,
    packModelUniform,
} from '@ripl/3d';

import type {
    MeshSubmission,
} from '@ripl/3d';

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

import type {
    TextureManager,
} from './texture';

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
    private _destroyed = false;
    private _textureManager: TextureManager | null;

    /**
     * @param device - The device to allocate buffers on.
     * @param pipelineState - The pipeline the buffers are laid out for.
     * @param textureManager - Uploads and binds material textures. Omit to skip texture binding.
     */
    constructor(device: GPUDevice, pipelineState: PipelineState, textureManager?: TextureManager) {
        this._device = device;
        this._pipelineState = pipelineState;
        this._textureManager = textureManager ?? null;
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
     *
     * Returns `null` once {@link GeometryManager.destroy} has run: a destroyed manager allocates
     * nothing, rather than quietly recreating buffers on a device it has already released.
     */
    public flush(): FlushResult | null {
        if (this._destroyed || this._submissions.length === 0) {
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

        // Sorted by texture so a scene sharing one image issues one setBindGroup rather than one
        // per mesh. Depth is resolved by the depth buffer, so reordering draws is safe here.
        const submissions = this._textureManager
            ? [...this._submissions].sort((left, right) => textureKey(left).localeCompare(textureKey(right)))
            : this._submissions;

        for (const sub of submissions) {
            const vertCount = sub.vertices.length / FLOATS_PER_VERTEX;

            vertexData.set(sub.vertices, vertexOffset * FLOATS_PER_VERTEX);

            for (let i = 0; i < sub.indices.length; i++) {
                indexData[indexOffset + i] = sub.indices[i] + baseVertex;
            }

            const modelBindGroup = this._getModelBindGroup(sub);

            draws.push({
                indexCount: sub.indices.length,
                indexOffset,
                modelBindGroup,
                textureBindGroup: this._textureManager?.getBindGroup(sub.material.map),
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

    /** Releases all GPU buffers and pooled CPU staging arrays, leaving the manager permanently inert. */
    public destroy(): void {
        this._destroyed = true;
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
        this._submissions.length = 0;
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

    private _getModelBindGroup(submission: MeshSubmission): GPUBindGroup {
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
        const material = submission.material;

        packModelUniform(this._modelUniformData, {
            modelMatrix: submission.modelMatrix,
            normalMatrix: submission.normalMatrix,
            specular: material.surface.specular,
            shininess: material.surface.shininess,
            emissive: material.surface.emissive,
            side: materialSideCode(material.side),
            mapRepeat: material.map?.repeat ?? [1, 1],
            mapOffset: material.map?.offset ?? [0, 0],
        });

        // writeBuffer copies the data at call time, so the scratch array is safe to reuse.
        this._device.queue.writeBuffer(buffer, 0, this._modelUniformData);

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
    /** Bind group holding this mesh's texture and sampler, when the backend manages textures. */
    textureBindGroup?: GPUBindGroup;
}

function textureKey(submission: MeshSubmission): string {
    return submission.material.map?.id ?? '';
}

/** Result of flushing all queued meshes: buffers and per-mesh draw commands. */
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
