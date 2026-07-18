import {
    MODEL_BIND_GROUP_LAYOUT_ENTRIES,
    SCENE_BIND_GROUP_LAYOUT_ENTRIES,
} from '../src/pipeline';

import type {
    PipelineState,
} from '../src/pipeline';

/** A recorded `GPUQueue.writeBuffer` call. */
export interface WriteBufferCall {
    /** The destination buffer of the write. */
    buffer: MockGPUBuffer;
    /** Byte offset into the destination buffer. */
    bufferOffset: number;
    /** Number of bytes copied into the destination buffer. */
    byteLength: number;
}

/** A recorded `GPURenderPassEncoder.drawIndexed` call. */
export interface DrawIndexedCall {
    /** Number of indices drawn. */
    indexCount: number;
    /** Number of instances drawn. */
    instanceCount: number;
    /** Offset into the bound index buffer, in indices. */
    firstIndex: number;
    /** Value added to each index before reading the vertex buffer. */
    baseVertex: number;
    /** First instance to draw. */
    firstInstance: number;
}

/** `GPUBufferUsage` flag values, installed globally for source modules under test. */
export const GPU_BUFFER_USAGE = {
    MAP_READ: 0x0001,
    MAP_WRITE: 0x0002,
    COPY_SRC: 0x0004,
    COPY_DST: 0x0008,
    INDEX: 0x0010,
    VERTEX: 0x0020,
    UNIFORM: 0x0040,
    STORAGE: 0x0080,
    INDIRECT: 0x0100,
    QUERY_RESOLVE: 0x0200,
} as const;

function extractWriteBytes(data: ArrayBuffer | ArrayBufferView, dataOffset: number, size?: number): Uint8Array {
    if (data instanceof ArrayBuffer) {
        const byteLength = size ?? (data.byteLength - dataOffset);

        return new Uint8Array(data, dataOffset, byteLength).slice();
    }

    // For typed arrays dataOffset/size are in elements; for DataView they are in bytes.
    const elementSize = data instanceof DataView
        ? 1
        : (data as unknown as { BYTES_PER_ELEMENT: number }).BYTES_PER_ELEMENT;

    const elementCount = size ?? (data.byteLength / elementSize - dataOffset);

    return new Uint8Array(
        data.buffer as ArrayBuffer,
        data.byteOffset + dataOffset * elementSize,
        elementCount * elementSize
    ).slice();
}

/** Minimal CPU-backed stand-in for a `GPUBuffer`. */
export class MockGPUBuffer {

    /** Buffer byte size, as passed to `createBuffer`. */
    public readonly size: number;

    /** Usage flags, as passed to `createBuffer`. */
    public readonly usage: number;

    /** CPU backing store holding the bytes written via `writeBuffer`. */
    public readonly data: Uint8Array;

    /** Whether `destroy` has been called on this buffer. */
    public destroyed = false;

    constructor(descriptor: GPUBufferDescriptor) {
        this.size = descriptor.size;
        this.usage = descriptor.usage;
        this.data = new Uint8Array(descriptor.size);
    }

    /** Marks the buffer as destroyed. */
    public destroy(): void {
        this.destroyed = true;
    }

    /** Views the backing store as floats, optionally limited to the first `count` floats. */
    public asFloat32(count?: number): Float32Array {
        return new Float32Array(this.data.buffer, 0, count ?? Math.floor(this.size / 4));
    }

    /** Views the backing store as unsigned 32-bit integers, optionally limited to the first `count` values. */
    public asUint32(count?: number): Uint32Array {
        return new Uint32Array(this.data.buffer, 0, count ?? Math.floor(this.size / 4));
    }

}

/** Minimal stand-in for a `GPUQueue` that validates and records buffer writes. */
export class MockGPUQueue {

    /** Every `writeBuffer` call, in call order. */
    public readonly writeBufferCalls: WriteBufferCall[] = [];

    /** Command buffer batches passed to `submit`, in call order. */
    public readonly submitCalls: unknown[][] = [];

    /** Validates alignment/bounds like a real device and copies the bytes into the buffer's backing store. */
    public writeBuffer(
        buffer: MockGPUBuffer,
        bufferOffset: number,
        data: ArrayBuffer | ArrayBufferView,
        dataOffset: number = 0,
        size?: number
    ): void {
        const bytes = extractWriteBytes(data, dataOffset, size);

        if (buffer.destroyed) {
            throw new Error('writeBuffer called on a destroyed buffer');
        }

        if (bufferOffset % 4 !== 0) {
            throw new Error(`writeBuffer bufferOffset (${bufferOffset}) must be a multiple of 4 bytes`);
        }

        if (bytes.byteLength % 4 !== 0) {
            throw new Error(`writeBuffer content size (${bytes.byteLength}) must be a multiple of 4 bytes`);
        }

        if (bufferOffset + bytes.byteLength > buffer.size) {
            throw new Error(`writeBuffer overflows buffer (offset ${bufferOffset} + ${bytes.byteLength} bytes > size ${buffer.size})`);
        }

        buffer.data.set(bytes, bufferOffset);

        this.writeBufferCalls.push({
            buffer,
            bufferOffset,
            byteLength: bytes.byteLength,
        });
    }

    /** Records a command buffer submission. */
    public submit(commandBuffers: unknown[]): void {
        this.submitCalls.push(commandBuffers);
    }

}

/** Minimal stand-in for a `GPURenderPassEncoder` that records encoded commands. */
export class MockGPURenderPassEncoder {

    /** Bind groups by group index, as last set. */
    public readonly bindGroups = new Map<number, GPUBindGroup>();

    /** Vertex buffers by slot, as last set. */
    public readonly vertexBuffers = new Map<number, MockGPUBuffer>();

    /** Every `drawIndexed` call, in encode order. */
    public readonly drawIndexedCalls: DrawIndexedCall[] = [];

    /** The pipeline last set via `setPipeline`. */
    public pipeline: unknown = null;

    /** The index buffer last set via `setIndexBuffer`. */
    public indexBuffer: MockGPUBuffer | null = null;

    /** The index format last set via `setIndexBuffer`. */
    public indexFormat: GPUIndexFormat | null = null;

    /** Whether `end` has been called on this pass. */
    public ended = false;

    /** Records the active pipeline. */
    public setPipeline(pipeline: unknown): void {
        this.pipeline = pipeline;
    }

    /** Records the bind group for the given group index. */
    public setBindGroup(index: number, bindGroup: GPUBindGroup): void {
        this.bindGroups.set(index, bindGroup);
    }

    /** Records the vertex buffer for the given slot. */
    public setVertexBuffer(slot: number, buffer: MockGPUBuffer): void {
        this.vertexBuffers.set(slot, buffer);
    }

    /** Records the index buffer and format. */
    public setIndexBuffer(buffer: MockGPUBuffer, format: GPUIndexFormat): void {
        this.indexBuffer = buffer;
        this.indexFormat = format;
    }

    /** Records an indexed draw call. */
    public drawIndexed(
        indexCount: number,
        instanceCount: number = 1,
        firstIndex: number = 0,
        baseVertex: number = 0,
        firstInstance: number = 0
    ): void {
        this.drawIndexedCalls.push({
            indexCount,
            instanceCount,
            firstIndex,
            baseVertex,
            firstInstance,
        });
    }

    /** Marks the pass as ended. */
    public end(): void {
        this.ended = true;
    }

}

/** Minimal stand-in for a `GPUCommandEncoder` that hands out recording render passes. */
export class MockGPUCommandEncoder {

    /** Every render pass begun on this encoder, in encode order. */
    public readonly renderPasses: MockGPURenderPassEncoder[] = [];

    /** Begins and records a new mock render pass. */
    public beginRenderPass(_descriptor?: GPURenderPassDescriptor): MockGPURenderPassEncoder {
        const pass = new MockGPURenderPassEncoder();

        this.renderPasses.push(pass);

        return pass;
    }

    /** Produces an opaque command buffer token. */
    public finish(): GPUCommandBuffer {
        return { label: 'mock-command-buffer' } as unknown as GPUCommandBuffer;
    }

}

/** Minimal stand-in for a `GPUDevice` that records created resources. */
export class MockGPUDevice {

    /** The device's queue, recording writes and submissions. */
    public readonly queue = new MockGPUQueue();

    /** Every buffer created via `createBuffer`, in creation order. */
    public readonly buffers: MockGPUBuffer[] = [];

    /** Descriptor of every `createBindGroup` call, in call order. */
    public readonly bindGroupDescriptors: GPUBindGroupDescriptor[] = [];

    /** Every command encoder created via `createCommandEncoder`, in creation order. */
    public readonly commandEncoders: MockGPUCommandEncoder[] = [];

    /** This mock viewed through the real `GPUDevice` type, for passing to source code under test. */
    public get handle(): GPUDevice {
        return this as unknown as GPUDevice;
    }

    /** Creates and records a {@link MockGPUBuffer}. */
    public createBuffer(descriptor: GPUBufferDescriptor): MockGPUBuffer {
        const buffer = new MockGPUBuffer(descriptor);

        this.buffers.push(buffer);

        return buffer;
    }

    /** Records the descriptor and returns an opaque bind group token. */
    public createBindGroup(descriptor: GPUBindGroupDescriptor): GPUBindGroup {
        this.bindGroupDescriptors.push(descriptor);

        return { label: `mock-bind-group-${this.bindGroupDescriptors.length}` } as unknown as GPUBindGroup;
    }

    /** Returns an opaque bind group layout token. */
    public createBindGroupLayout(descriptor: GPUBindGroupLayoutDescriptor): GPUBindGroupLayout {
        return { entries: descriptor.entries } as unknown as GPUBindGroupLayout;
    }

    /** Creates and records a {@link MockGPUCommandEncoder}. */
    public createCommandEncoder(): MockGPUCommandEncoder {
        const encoder = new MockGPUCommandEncoder();

        this.commandEncoders.push(encoder);

        return encoder;
    }

    /** Returns every created buffer whose usage includes the given flag. */
    public buffersWithUsage(usage: number): MockGPUBuffer[] {
        return this.buffers.filter(buffer => (buffer.usage & usage) !== 0);
    }

}

/** Installs the `GPUBufferUsage` constants globally so GPU source modules can run outside a browser. */
export function installMockGPUGlobals(): void {
    if (typeof globalThis.GPUBufferUsage === 'undefined') {
        (globalThis as Record<string, unknown>).GPUBufferUsage = GPU_BUFFER_USAGE;
    }
}

/** Creates a mock GPU device, installing the WebGPU constant globals the source under test depends on. */
export function createMockGPUDevice(): MockGPUDevice {
    installMockGPUGlobals();

    return new MockGPUDevice();
}

/** Builds a {@link PipelineState} backed by the given mock device, sufficient for `GeometryManager`. */
export function createMockPipelineState(device: MockGPUDevice): PipelineState {
    return {
        device: device.handle,
        pipeline: { label: 'mock-render-pipeline' } as unknown as GPURenderPipeline,
        sceneBindGroupLayout: device.createBindGroupLayout({ entries: SCENE_BIND_GROUP_LAYOUT_ENTRIES }),
        modelBindGroupLayout: device.createBindGroupLayout({ entries: MODEL_BIND_GROUP_LAYOUT_ENTRIES }),
        depthFormat: 'depth24plus',
        presentationFormat: 'bgra8unorm',
        sampleCount: 4,
    };
}

/** Views a `GPUBuffer` produced by the mock device as its underlying {@link MockGPUBuffer}. */
export function asMockBuffer(buffer: GPUBuffer): MockGPUBuffer {
    return buffer as unknown as MockGPUBuffer;
}
