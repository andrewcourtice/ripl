import {
    MODEL_BIND_GROUP_LAYOUT_ENTRIES,
    SCENE_BIND_GROUP_LAYOUT_ENTRIES,
    TEXTURE_BIND_GROUP_LAYOUT_ENTRIES,
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

/** `GPUTextureUsage` flag values, installed globally for source modules under test. */
export const GPU_TEXTURE_USAGE = {
    COPY_SRC: 0x01,
    COPY_DST: 0x02,
    TEXTURE_BINDING: 0x04,
    STORAGE_BINDING: 0x08,
    RENDER_ATTACHMENT: 0x10,
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

/** Minimal stand-in for a `GPUTexture` that records every view it hands out. */
export class MockGPUTexture {

    /** The descriptor passed to `createTexture`. */
    public readonly descriptor: GPUTextureDescriptor;

    /** Every view handed out by `createView`, in call order — a per-frame allocation shows up as unbounded growth. */
    public readonly views: GPUTextureView[] = [];

    /** Whether `destroy` has been called on this texture. */
    public destroyed = false;

    /** Texel width, from the descriptor's size. */
    public readonly width: number;

    /** Texel height, from the descriptor's size. */
    public readonly height: number;

    constructor(descriptor: GPUTextureDescriptor) {
        const size = descriptor.size as number[];

        this.descriptor = descriptor;
        this.width = size[0] ?? 0;
        this.height = size[1] ?? 0;
    }

    /** The texel format, as passed to `createTexture`. */
    public get format(): GPUTextureFormat {
        return this.descriptor.format;
    }

    /** The MSAA sample count, as passed to `createTexture`. */
    public get sampleCount(): number {
        return this.descriptor.sampleCount ?? 1;
    }

    /** Usage flags, as passed to `createTexture`. */
    public get usage(): number {
        return this.descriptor.usage;
    }

    /** Creates and records an opaque view token. */
    public createView(): GPUTextureView {
        const view = { label: `mock-texture-view-${this.views.length + 1}` } as unknown as GPUTextureView;

        this.views.push(view);

        return view;
    }

    /** Marks the texture as destroyed. */
    public destroy(): void {
        this.destroyed = true;
    }

}

/**
 * Minimal stand-in for a `GPUCanvasContext`, recording configuration and handing out a swap-chain
 * texture. `getCurrentTexture` returns the same texture for the lifetime of a configuration, as a
 * real swap chain does within a frame, so a test can count `createView` calls against it.
 */
export class MockGPUCanvasContext {

    /** Every configuration passed to `configure`, in call order. */
    public readonly configurations: GPUCanvasConfiguration[] = [];

    /** Number of `unconfigure` calls — a `destroy` that leaves the swap chain configured reads as `0`. */
    public unconfigureCount = 0;

    /** Number of `getCurrentTexture` calls, in call order. */
    public getCurrentTextureCount = 0;

    private _canvas: HTMLCanvasElement | undefined;
    private _currentTexture: MockGPUTexture | null = null;

    constructor(canvas?: HTMLCanvasElement) {
        this._canvas = canvas;
    }

    /** Whether the swap chain is currently configured. */
    public get configured(): boolean {
        return this.configurations.length > this.unconfigureCount;
    }

    /** This mock viewed through the real `GPUCanvasContext` type, for passing to source code under test. */
    public get handle(): GPUCanvasContext {
        return this as unknown as GPUCanvasContext;
    }

    /** Records the configuration and drops any texture from the previous one. */
    public configure(configuration: GPUCanvasConfiguration): void {
        this.configurations.push(configuration);
        this._currentTexture = null;
    }

    /** Records an unconfigure and drops the current texture. */
    public unconfigure(): void {
        this.unconfigureCount += 1;
        this._currentTexture = null;
    }

    /** Returns the swap-chain texture, sized from the backing canvas when one was supplied. */
    public getCurrentTexture(): MockGPUTexture {
        this.getCurrentTextureCount += 1;

        if (!this._currentTexture) {
            const format = this.configurations.at(-1)?.format ?? 'bgra8unorm';

            this._currentTexture = new MockGPUTexture({
                size: [this._canvas?.width ?? 0, this._canvas?.height ?? 0],
                format,
                usage: GPU_TEXTURE_USAGE.RENDER_ATTACHMENT,
            });
        }

        return this._currentTexture;
    }

}

/** Minimal stand-in for a `GPUQueue` that validates and records buffer writes. */
/** A recorded `writeTexture` call. */
export interface WriteTextureCall {
    /** The texture written to. */
    texture: MockGPUTexture;
    /** The number of bytes written. */
    byteLength: number;
    /** The texel layout the write declared. */
    layout: GPUTexelCopyBufferLayout;
    /** The extent the write covered. */
    size: GPUExtent3DStrict;
}

/** A recorded `copyExternalImageToTexture` call. */
export interface CopyExternalImageCall {
    /** The texture uploaded to. */
    texture: MockGPUTexture;
    /** The image the upload read from. */
    source: unknown;
    /** Whether the upload flipped the image vertically. */
    flipY: boolean;
    /** The extent the upload covered. */
    size: GPUExtent3DStrict;
}

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

    /** Every `writeTexture` call, in call order. */
    public readonly writeTextureCalls: WriteTextureCall[] = [];

    /** Every `copyExternalImageToTexture` call, in call order. */
    public readonly copyExternalImageCalls: CopyExternalImageCall[] = [];

    /** Records a texture write. */
    public writeTexture(
        destination: { texture: MockGPUTexture },
        data: ArrayBuffer | ArrayBufferView,
        layout: GPUTexelCopyBufferLayout,
        size: GPUExtent3DStrict
    ): void {
        if (destination.texture.destroyed) {
            throw new Error('writeTexture called on a destroyed texture');
        }

        this.writeTextureCalls.push({
            texture: destination.texture,
            byteLength: extractWriteBytes(data, 0).byteLength,
            layout,
            size,
        });
    }

    /** Records an image upload. */
    public copyExternalImageToTexture(
        source: { source: unknown;
            flipY?: boolean; },
        destination: { texture: MockGPUTexture },
        size: GPUExtent3DStrict
    ): void {
        if (destination.texture.destroyed) {
            throw new Error('copyExternalImageToTexture called on a destroyed texture');
        }

        this.copyExternalImageCalls.push({
            texture: destination.texture,
            source: source.source,
            flipY: !!source.flipY,
            size,
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

    /** The descriptor the pass was begun with, when one was supplied. */
    public descriptor: GPURenderPassDescriptor | undefined;

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

    /** Begins and records a new mock render pass, retaining its descriptor. */
    public beginRenderPass(descriptor?: GPURenderPassDescriptor): MockGPURenderPassEncoder {
        const pass = new MockGPURenderPassEncoder();

        pass.descriptor = descriptor;
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

    /** Descriptor of every `createSampler` call, in call order. */
    public readonly samplerDescriptors: GPUSamplerDescriptor[] = [];

    /** Descriptor of every `createBindGroup` call, in call order. */
    public readonly bindGroupDescriptors: GPUBindGroupDescriptor[] = [];

    /** Every command encoder created via `createCommandEncoder`, in creation order. */
    public readonly commandEncoders: MockGPUCommandEncoder[] = [];

    /** Every texture created via `createTexture`, in creation order. */
    public readonly textures: MockGPUTexture[] = [];

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
    /** Records a sampler descriptor and returns an opaque handle. */
    public createSampler(descriptor: GPUSamplerDescriptor = {}): GPUSampler {
        this.samplerDescriptors.push(descriptor);

        return {
            label: `mock-sampler-${this.samplerDescriptors.length}`,
        } as unknown as GPUSampler;
    }

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

    /** Creates and records a {@link MockGPUTexture}. */
    public createTexture(descriptor: GPUTextureDescriptor): MockGPUTexture {
        const texture = new MockGPUTexture(descriptor);

        this.textures.push(texture);

        return texture;
    }

    /** Returns every created buffer whose usage includes the given flag. */
    public buffersWithUsage(usage: number): MockGPUBuffer[] {
        return this.buffers.filter(buffer => (buffer.usage & usage) !== 0);
    }

    /** Every created texture that has not been destroyed — a leak reads as a non-empty list after teardown. */
    public liveTextures(): MockGPUTexture[] {
        return this.textures.filter(texture => !texture.destroyed);
    }

}

/** Installs the `GPUBufferUsage` and `GPUTextureUsage` constants globally so GPU source modules can run outside a browser. */
export function installMockGPUGlobals(): void {
    if (typeof globalThis.GPUBufferUsage === 'undefined') {
        (globalThis as Record<string, unknown>).GPUBufferUsage = GPU_BUFFER_USAGE;
    }

    if (typeof globalThis.GPUTextureUsage === 'undefined') {
        (globalThis as Record<string, unknown>).GPUTextureUsage = GPU_TEXTURE_USAGE;
    }
}

/** Creates a mock canvas context bound to `canvas`, installing the WebGPU constant globals alongside it. */
export function createMockGPUCanvasContext(canvas?: HTMLCanvasElement): MockGPUCanvasContext {
    installMockGPUGlobals();

    return new MockGPUCanvasContext(canvas);
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
        textureBindGroupLayout: device.createBindGroupLayout({ entries: TEXTURE_BIND_GROUP_LAYOUT_ENTRIES }),
        depthFormat: 'depth24plus',
        presentationFormat: 'bgra8unorm',
        sampleCount: 4,
    };
}

/** Views a `GPUBuffer` produced by the mock device as its underlying {@link MockGPUBuffer}. */
export function asMockBuffer(buffer: GPUBuffer): MockGPUBuffer {
    return buffer as unknown as MockGPUBuffer;
}

/** Views a `GPUTexture` produced by the mock device as its underlying {@link MockGPUTexture}. */
export function asMockTexture(texture: GPUTexture): MockGPUTexture {
    return texture as unknown as MockGPUTexture;
}
