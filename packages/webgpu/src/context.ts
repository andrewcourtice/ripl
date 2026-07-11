import {
    GeometryManager,
} from './geometry';

import {
    createPipeline,
    SCENE_UNIFORM_SIZE,
} from './pipeline';

import type {
    PipelineState,
} from './pipeline';

import {
    Context3D,
} from '@ripl/3d';

import type {
    Context3DOptions,
    MeshSubmission,
} from '@ripl/3d';

import {
    scaleContinuous,
} from '@ripl/core';

import type {
    ContextPath,
    FillRule,
} from '@ripl/core';

import {
    canvasMeasureText,
    CanvasPath,
} from '@ripl/canvas';

import {
    typeIsString,
} from '@ripl/utilities';

/** Options for constructing a WebGPU 3D context. */
export interface WebGPUContextOptions extends Context3DOptions {
    sampleCount?: number;
    clearColor?: [number, number, number, number];
}

/** WebGPU-backed 3D rendering context with hardware depth testing and WGSL shaders. */
export class WebGPUContext3D extends Context3D {

    private gpuContext: GPUCanvasContext;
    private pipelineState: PipelineState;
    private geometryManager: GeometryManager;
    private sceneUniformBuffer: GPUBuffer;
    private sceneBindGroup: GPUBindGroup;
    private depthTexture: GPUTexture | null = null;
    private msaaTexture: GPUTexture | null = null;
    private clearColor: [number, number, number, number];

    // Offscreen canvas for CPU-side hit testing
    private hitCanvas: HTMLCanvasElement;
    private hitContext: CanvasRenderingContext2D;

    constructor(
        target: string | HTMLElement,
        device: GPUDevice,
        gpuContext: GPUCanvasContext,
        canvas: HTMLCanvasElement,
        pipelineState: PipelineState,
        options?: WebGPUContextOptions
    ) {
        super('webgpu', target, canvas, {
            ...options,
            meta: {
                renderStrategy: 'gpu',
                ...options?.meta,
            },
        });

        const {
            clearColor = [0, 0, 0, 0],
        } = options || {};

        this.gpuContext = gpuContext;
        this.pipelineState = pipelineState;
        this.clearColor = clearColor;

        this.sceneUniformBuffer = device.createBuffer({
            size: SCENE_UNIFORM_SIZE,
            usage: GPUBufferUsage.UNIFORM | GPUBufferUsage.COPY_DST,
        });

        this.sceneBindGroup = device.createBindGroup({
            layout: pipelineState.sceneBindGroupLayout,
            entries: [
                {
                    binding: 0,
                    resource: {
                        buffer: this.sceneUniformBuffer,
                    },
                },
            ],
        });

        this.geometryManager = new GeometryManager(device, pipelineState);

        // Offscreen canvas for hit testing
        this.hitCanvas = document.createElement('canvas');
        this.hitContext = this.hitCanvas.getContext('2d')!;

        this.updateProjectionMatrix();
        this.init();
    }

    protected rescale(width: number, height: number) {
        const dpr = window.devicePixelRatio;
        const scaledWidth = Math.floor(width * dpr);
        const scaledHeight = Math.floor(height * dpr);

        if (scaledWidth === this.element.width && scaledHeight === this.element.height) {
            return;
        }

        this.element.width = scaledWidth;
        this.element.height = scaledHeight;

        // Resize hit canvas to match
        this.hitCanvas.width = scaledWidth;
        this.hitCanvas.height = scaledHeight;
        this.hitContext.setTransform(dpr, 0, 0, dpr, 0, 0);

        super.rescale(width, height);

        this.scaleX = scaleContinuous([0, width], [0, scaledWidth]);
        this.scaleY = scaleContinuous([0, height], [0, scaledHeight]);

        this.recreateDepthTexture(scaledWidth, scaledHeight);
        this.recreateMSAATexture(scaledWidth, scaledHeight);

        if (this.viewMatrix) {
            this.updateProjectionMatrix();
        }
    }

    private recreateDepthTexture(width: number, height: number): void {
        this.depthTexture?.destroy();

        if (width <= 0 || height <= 0) {
            this.depthTexture = null;
            return;
        }

        this.depthTexture = this.pipelineState.device.createTexture({
            size: [width, height],
            format: this.pipelineState.depthFormat,
            usage: GPUTextureUsage.RENDER_ATTACHMENT,
            sampleCount: this.pipelineState.sampleCount,
        });
    }

    private recreateMSAATexture(width: number, height: number): void {
        this.msaaTexture?.destroy();

        if (width <= 0 || height <= 0 || this.pipelineState.sampleCount <= 1) {
            this.msaaTexture = null;
            return;
        }

        this.msaaTexture = this.pipelineState.device.createTexture({
            size: [width, height],
            format: this.pipelineState.presentationFormat,
            usage: GPUTextureUsage.RENDER_ATTACHMENT,
            sampleCount: this.pipelineState.sampleCount,
        });
    }

    /** Submits a mesh for GPU rendering this frame. */
    public override submitMesh(submission: MeshSubmission): void {
        this.geometryManager.submit(submission);
    }

    public markRenderStart(): void {
        super.markRenderStart();

        if (this.renderDepth === 1) {
            this.geometryManager.beginFrame();
        }
    }

    public markRenderEnd(): void {
        super.markRenderEnd();

        if (this.renderDepth > 0) {
            return;
        }

        this.executeRenderPass();
    }

    public clear(): void {
        // WebGPU clears as part of the render pass (loadOp: 'clear')
    }

    public createPath(id?: string): CanvasPath {
        return new CanvasPath(id);
    }

    public isPointInPath(path: ContextPath, x: number, y: number, fillRule?: FillRule): boolean {
        const canvasPath = this.rebuildPath2D(path);

        if (!canvasPath) {
            return false;
        }

        return this.hitContext.isPointInPath(canvasPath, x, y, fillRule);
    }

    public isPointInStroke(path: ContextPath, x: number, y: number): boolean {
        const canvasPath = this.rebuildPath2D(path);

        if (!canvasPath) {
            return false;
        }

        return this.hitContext.isPointInStroke(canvasPath, x, y);
    }

    private rebuildPath2D(path: ContextPath): Path2D | null {
        // CanvasPath instances from @ripl/core have a .ref property with the native Path2D
        const ref = (path as { ref?: Path2D }).ref;

        if (ref instanceof Path2D) {
            return ref;
        }

        return null;
    }

    private executeRenderPass(): void {
        const device = this.pipelineState.device;

        if (!this.depthTexture || this.element.width <= 0 || this.element.height <= 0) {
            return;
        }

        // Write scene uniforms
        const uniformData = new Float32Array(SCENE_UNIFORM_SIZE / 4);
        uniformData.set(this.viewProjectionMatrix, 0);

        const lightDir = this.getLightDirectionForRender();
        uniformData[16] = lightDir[0];
        uniformData[17] = lightDir[1];
        uniformData[18] = lightDir[2];
        uniformData[19] = 0.3; // ambient

        device.queue.writeBuffer(this.sceneUniformBuffer, 0, uniformData);

        // Flush geometry
        const flushResult = this.geometryManager.flush();

        const commandEncoder = device.createCommandEncoder();
        const textureView = this.gpuContext.getCurrentTexture().createView();

        const colorAttachment: GPURenderPassColorAttachment = this.msaaTexture
            ? {
                view: this.msaaTexture.createView(),
                resolveTarget: textureView,
                clearValue: {
                    r: this.clearColor[0],
                    g: this.clearColor[1],
                    b: this.clearColor[2],
                    a: this.clearColor[3],
                },
                loadOp: 'clear' as GPULoadOp,
                storeOp: 'discard' as GPUStoreOp,
            }
            : {
                view: textureView,
                clearValue: {
                    r: this.clearColor[0],
                    g: this.clearColor[1],
                    b: this.clearColor[2],
                    a: this.clearColor[3],
                },
                loadOp: 'clear' as GPULoadOp,
                storeOp: 'store' as GPUStoreOp,
            };

        const renderPass = commandEncoder.beginRenderPass({
            colorAttachments: [colorAttachment],
            depthStencilAttachment: {
                view: this.depthTexture.createView(),
                depthClearValue: 1.0,
                depthLoadOp: 'clear',
                depthStoreOp: 'store',
            },
        });

        if (flushResult) {
            renderPass.setPipeline(this.pipelineState.pipeline);
            renderPass.setBindGroup(0, this.sceneBindGroup);
            renderPass.setVertexBuffer(0, flushResult.vertexBuffer);
            renderPass.setIndexBuffer(flushResult.indexBuffer, 'uint32');

            for (const draw of flushResult.draws) {
                renderPass.setBindGroup(1, draw.modelBindGroup);
                renderPass.drawIndexed(draw.indexCount, 1, draw.indexOffset, 0, 0);
            }
        }

        renderPass.end();
        device.queue.submit([commandEncoder.finish()]);
    }

    public override measureText(text: string, font?: string): TextMetrics {
        return canvasMeasureText(this.hitContext, text, font);
    }

    /** Destroys the WebGPU context and releases GPU resources. */
    public override destroy(): void {
        this.geometryManager.destroy();
        this.sceneUniformBuffer.destroy();
        this.depthTexture?.destroy();
        this.msaaTexture?.destroy();
        super.destroy();
    }

}

/** Requests a WebGPU adapter and device, throwing if unsupported. */
export async function requestDevice(): Promise<GPUDevice> {
    if (!navigator.gpu) {
        throw new Error('WebGPU is not supported in this browser.');
    }

    const adapter = await navigator.gpu.requestAdapter();

    if (!adapter) {
        throw new Error('Failed to obtain a WebGPU adapter.');
    }

    return adapter.requestDevice();
}

/** Creates a WebGPU 3D rendering context attached to the given DOM target. */
export async function createContext(target: string | HTMLElement, options?: WebGPUContextOptions): Promise<WebGPUContext3D> {
    const device = await requestDevice();
    const canvas = document.createElement('canvas');
    const gpuContext = canvas.getContext('webgpu');

    if (!gpuContext) {
        throw new Error('Failed to obtain a WebGPU canvas context.');
    }

    const format = navigator.gpu.getPreferredCanvasFormat();

    gpuContext.configure({
        device,
        format,
        alphaMode: 'premultiplied',
    });

    const pipelineState = createPipeline(device, format, {
        sampleCount: options?.sampleCount ?? 4,
    });

    const resolvedTarget = typeIsString(target)
        ? document.querySelector(target) as HTMLElement
        : target;

    return new WebGPUContext3D(resolvedTarget, device, gpuContext, canvas, pipelineState, options);
}
