import {
    FRAGMENT_SHADER,
    VERTEX_SHADER,
} from './shaders';

/** Byte stride for a single vertex: position(3) + normal(3) + color(4) = 10 floats × 4 bytes. */
export const VERTEX_STRIDE = 10 * 4;

/** Size in bytes of the scene uniform buffer: mat4(64) + vec3(12) + f32(4) = 80 bytes, aligned to 16 = 80. */
export const SCENE_UNIFORM_SIZE = 80;

/** Size in bytes of the model uniform buffer: mat4(64) + mat4(64) = 128 bytes. */
export const MODEL_UNIFORM_SIZE = 128;

/** Vertex buffer layout describing position, normal, and color attributes. */
export const VERTEX_BUFFER_LAYOUT: GPUVertexBufferLayout = {
    arrayStride: VERTEX_STRIDE,
    attributes: [
        {
            // position: vec3f
            shaderLocation: 0,
            offset: 0,
            format: 'float32x3',
        },
        {
            // normal: vec3f
            shaderLocation: 1,
            offset: 12,
            format: 'float32x3',
        },
        {
            // color: vec4f
            shaderLocation: 2,
            offset: 24,
            format: 'float32x4',
        },
    ],
};

/** Bind group layout entries for the scene-level uniforms (group 0). */
export const SCENE_BIND_GROUP_LAYOUT_ENTRIES: GPUBindGroupLayoutEntry[] = [
    {
        binding: 0,
        visibility: 0x3, // GPUShaderStage.VERTEX | GPUShaderStage.FRAGMENT
        buffer: {
            type: 'uniform',
        },
    },
];

/** Bind group layout entries for the per-model uniforms (group 1). */
export const MODEL_BIND_GROUP_LAYOUT_ENTRIES: GPUBindGroupLayoutEntry[] = [
    {
        binding: 0,
        visibility: 0x1, // GPUShaderStage.VERTEX
        buffer: {
            type: 'uniform',
        },
    },
];

/** Holds all GPU pipeline objects and layouts needed for rendering. */
export interface PipelineState {
    device: GPUDevice;
    pipeline: GPURenderPipeline;
    sceneBindGroupLayout: GPUBindGroupLayout;
    modelBindGroupLayout: GPUBindGroupLayout;
    depthFormat: GPUTextureFormat;
    presentationFormat: GPUTextureFormat;
    sampleCount: number;
}

/** Options for creating the render pipeline. */
export interface PipelineOptions {
    sampleCount?: number;
}

/** Creates the render pipeline and associated layouts on the given device. */
export function createPipeline(device: GPUDevice, format: GPUTextureFormat, options?: PipelineOptions): PipelineState {
    const sampleCount = options?.sampleCount ?? 4;
    const depthFormat: GPUTextureFormat = 'depth24plus';

    const sceneBindGroupLayout = device.createBindGroupLayout({
        entries: SCENE_BIND_GROUP_LAYOUT_ENTRIES,
    });

    const modelBindGroupLayout = device.createBindGroupLayout({
        entries: MODEL_BIND_GROUP_LAYOUT_ENTRIES,
    });

    const pipelineLayout = device.createPipelineLayout({
        bindGroupLayouts: [sceneBindGroupLayout, modelBindGroupLayout],
    });

    const vertexModule = device.createShaderModule({
        code: VERTEX_SHADER,
    });

    const fragmentModule = device.createShaderModule({
        code: FRAGMENT_SHADER,
    });

    const pipeline = device.createRenderPipeline({
        layout: pipelineLayout,
        vertex: {
            module: vertexModule,
            entryPoint: 'main',
            buffers: [VERTEX_BUFFER_LAYOUT],
        },
        fragment: {
            module: fragmentModule,
            entryPoint: 'main',
            targets: [
                {
                    format,
                    blend: {
                        color: {
                            srcFactor: 'src-alpha',
                            dstFactor: 'one-minus-src-alpha',
                            operation: 'add',
                        },
                        alpha: {
                            srcFactor: 'one',
                            dstFactor: 'one-minus-src-alpha',
                            operation: 'add',
                        },
                    },
                },
            ],
        },
        primitive: {
            topology: 'triangle-list',
            cullMode: 'none',
            frontFace: 'ccw',
        },
        depthStencil: {
            depthWriteEnabled: true,
            depthCompare: 'less',
            format: depthFormat,
        },
        multisample: {
            count: sampleCount,
        },
    });

    return {
        device,
        pipeline,
        sceneBindGroupLayout,
        modelBindGroupLayout,
        depthFormat,
        presentationFormat: format,
        sampleCount,
    };
}
