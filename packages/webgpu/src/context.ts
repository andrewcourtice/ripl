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
    packSceneUniform,
} from '@ripl/3d';

import type {
    Context3DOptions,
    MeshSubmission,
} from '@ripl/3d';

import {
    factory,
    scaleContinuous,
} from '@ripl/core';

import type {
    ContextPath,
    ContextText,
    FillRule,
    TextOptions,
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
    /** MSAA sample count for the render pipeline. Defaults to 4. */
    sampleCount?: number;
    /**
     * Straight (non-premultiplied) RGBA clear color, 0–1 per channel, applied at the start of each
     * frame. Defaults to transparent. The surface is configured `alphaMode: 'premultiplied'`, so
     * the channels are multiplied by the alpha on the way in.
     */
    clearColor?: [number, number, number, number];
}

/** WebGPU-backed 3D rendering context with hardware depth testing and WGSL shaders. */
export class WebGPUContext3D extends Context3D {

    private _gpuContext: GPUCanvasContext;
    private _pipelineState: PipelineState;
    private _geometryManager: GeometryManager;
    private _sceneUniformBuffer: GPUBuffer;
    private _sceneUniformData = new Float32Array(SCENE_UNIFORM_SIZE / 4);
    private _sceneBindGroup: GPUBindGroup;
    private _depthTexture: GPUTexture | null = null;
    private _depthView: GPUTextureView | null = null;
    private _msaaTexture: GPUTexture | null = null;
    private _msaaView: GPUTextureView | null = null;
    private _clearColor: [number, number, number, number];
    private _destroyed = false;
    private _warned2D = false;

    // Offscreen canvas for CPU-side hit testing
    private _hitCanvas: HTMLCanvasElement;
    private _hitContext: CanvasRenderingContext2D;

    constructor(
        target: string | HTMLElement,
        device: GPUDevice,
        gpuContext: GPUCanvasContext,
        canvas: HTMLCanvasElement,
        pipelineState: PipelineState,
        options?: WebGPUContextOptions
    ) {
        super('webgpu', target, canvas, options, 'gpu');

        const {
            clearColor = [0, 0, 0, 0],
        } = options || {};

        this._gpuContext = gpuContext;
        this._pipelineState = pipelineState;

        // The surface is premultiplied, so a straight colour with r > a is out of gamut for it.
        this._clearColor = [
            clearColor[0] * clearColor[3],
            clearColor[1] * clearColor[3],
            clearColor[2] * clearColor[3],
            clearColor[3],
        ];

        this._sceneUniformBuffer = device.createBuffer({
            size: SCENE_UNIFORM_SIZE,
            usage: GPUBufferUsage.UNIFORM | GPUBufferUsage.COPY_DST,
        });

        this._sceneBindGroup = device.createBindGroup({
            layout: pipelineState.sceneBindGroupLayout,
            entries: [
                {
                    binding: 0,
                    resource: {
                        buffer: this._sceneUniformBuffer,
                    },
                },
            ],
        });

        this._geometryManager = new GeometryManager(device, pipelineState);

        // Offscreen canvas for hit testing
        this._hitCanvas = document.createElement('canvas');
        this._hitContext = this._hitCanvas.getContext('2d')!;

        this.updateProjectionMatrix();
        this.init();
    }

    protected rescale(width: number, height: number) {
        if (this._destroyed) {
            return;
        }

        // Through the factory, like every other backend: `window` desynchronises the hit canvas from the surface scales and is absent outside the DOM.
        const dpr = factory.devicePixelRatio;
        const scaledWidth = Math.floor(width * dpr);
        const scaledHeight = Math.floor(height * dpr);

        // Gated on the logical size, never the backing store: a fresh canvas is already 300x150.
        if (width === this.width && height === this.height) {
            return;
        }

        this.element.width = scaledWidth;
        this.element.height = scaledHeight;

        // Resize hit canvas to match
        this._hitCanvas.width = scaledWidth;
        this._hitCanvas.height = scaledHeight;
        this._hitContext.setTransform(dpr, 0, 0, dpr, 0, 0);

        this.width = width;
        this.height = height;
        this.scaleX = scaleContinuous([0, width], [0, scaledWidth]);
        this.scaleY = scaleContinuous([0, height], [0, scaledHeight]);

        this._recreateDepthTexture(scaledWidth, scaledHeight);
        this._recreateMSAATexture(scaledWidth, scaledHeight);

        if (this.viewMatrix) {
            this.updateProjectionMatrix();
        }

        // Emitted last, not through `super.rescale`: a bound scene repaints synchronously here, and
        // would otherwise draw under identity scales and against textures still at the old size.
        this.emit('resize', null);
    }

    // Views are immutable, so they are cached with the texture rather than rebuilt every frame.
    private _recreateDepthTexture(width: number, height: number): void {
        this._depthTexture?.destroy();
        this._depthTexture = null;
        this._depthView = null;

        if (width <= 0 || height <= 0) {
            return;
        }

        this._depthTexture = this._pipelineState.device.createTexture({
            size: [width, height],
            format: this._pipelineState.depthFormat,
            usage: GPUTextureUsage.RENDER_ATTACHMENT,
            sampleCount: this._pipelineState.sampleCount,
        });

        this._depthView = this._depthTexture.createView();
    }

    private _recreateMSAATexture(width: number, height: number): void {
        this._msaaTexture?.destroy();
        this._msaaTexture = null;
        this._msaaView = null;

        if (width <= 0 || height <= 0 || this._pipelineState.sampleCount <= 1) {
            return;
        }

        this._msaaTexture = this._pipelineState.device.createTexture({
            size: [width, height],
            format: this._pipelineState.presentationFormat,
            usage: GPUTextureUsage.RENDER_ATTACHMENT,
            sampleCount: this._pipelineState.sampleCount,
        });

        this._msaaView = this._msaaTexture.createView();
    }

    /** Submits a mesh for GPU rendering this frame. */
    public override submitMesh(submission: MeshSubmission): void {
        if (this._destroyed) {
            return;
        }

        this._geometryManager.submit(submission);
    }

    /** Begins a render pass, resetting per-frame geometry accumulation at the outermost depth. */
    public markRenderStart(): void {
        super.markRenderStart();

        if (!this._destroyed && this.renderDepth === 1) {
            this._geometryManager.beginFrame();
        }
    }

    /** Ends the render pass and, at the outermost depth, executes the queued GPU draw commands. */
    public markRenderEnd(): void {
        super.markRenderEnd();

        if (this.renderDepth > 0) {
            return;
        }

        this._executeRenderPass();
    }

    /** No-op; the surface is cleared by the render pass via `loadOp: 'clear'`. */
    public clear(): void {
        // WebGPU clears as part of the render pass (loadOp: 'clear')
    }

    /**
     * Warns once that a 2D drawing operation does nothing on this backend.
     *
     * The pipeline only rasterises submitted meshes, so the base no-op `applyFill`/`applyStroke`/
     * `applyClip`/`drawImage`/`createText` stand — but `createPath` returns a real `CanvasPath`, so
     * a `Shape2D` traced its path, painted nothing, and stayed hit-testable with no diagnostic. A
     * warning rather than a throw: a mixed 2D/3D scene should lose its labels, not its geometry.
     */
    private _warnUnsupported2D(operation: string): void {
        if (this._warned2D) {
            return;
        }

        this._warned2D = true;

        console.warn(`WebGPUContext3D cannot draw 2D elements: ${operation} is a no-op, so 2D shapes and text render nothing (they remain hit-testable). Render 2D content on a separate canvas layer, or use createContext from @ripl/3d.`);
    }

    /** Creates a {@link CanvasPath} used for CPU-side hit testing. */
    public createPath(id?: string): CanvasPath {
        return new CanvasPath(id);
    }

    /** No-op; the WebGPU pipeline rasterises submitted meshes only. Warns once. */
    public override applyFill(): void {
        this._warnUnsupported2D('applyFill');
    }

    /** No-op; the WebGPU pipeline rasterises submitted meshes only. Warns once. */
    public override applyStroke(): void {
        this._warnUnsupported2D('applyStroke');
    }

    /** No-op; the WebGPU pipeline rasterises submitted meshes only. Warns once. */
    public override applyClip(): void {
        this._warnUnsupported2D('applyClip');
    }

    /** No-op; the WebGPU pipeline rasterises submitted meshes only. Warns once. */
    public override drawImage(): void {
        this._warnUnsupported2D('drawImage');
    }

    /** Creates a text element that this backend cannot paint. Warns once. */
    public override createText(options: TextOptions): ContextText {
        this._warnUnsupported2D('createText');

        return super.createText(options);
    }

    /** Tests whether the logical-space point (x, y) lies inside the given path's fill, using an offscreen 2D canvas. */
    public isPointInPath(path: ContextPath, x: number, y: number, fillRule?: FillRule): boolean {
        const canvasPath = this._rebuildPath2D(path);

        if (!canvasPath) {
            return false;
        }

        // The hit canvas carries the same DPR matrix as the surface, which the native test ignores.
        return this._hitContext.isPointInPath(canvasPath, ...this.toSurfacePoint(x, y), fillRule);
    }

    /** Tests whether the logical-space point (x, y) lies on the given path's stroke, using an offscreen 2D canvas. */
    public isPointInStroke(path: ContextPath, x: number, y: number): boolean {
        const canvasPath = this._rebuildPath2D(path);

        if (!canvasPath) {
            return false;
        }

        return this._hitContext.isPointInStroke(canvasPath, ...this.toSurfacePoint(x, y));
    }

    private _rebuildPath2D(path: ContextPath): Path2D | null {
        // CanvasPath instances from @ripl/core have a .ref property with the native Path2D
        const ref = (path as { ref?: Path2D }).ref;

        if (ref instanceof Path2D) {
            return ref;
        }

        return null;
    }

    private _executeRenderPass(): void {
        // A rAF loop can keep ticking a destroyed context, so bail out rather than touch freed GPU resources.
        if (this._destroyed) {
            return;
        }

        const device = this._pipelineState.device;

        if (!this._depthTexture || this.element.width <= 0 || this.element.height <= 0) {
            return;
        }

        // Reused scratch array; writeBuffer copies at call time.
        packSceneUniform(this._sceneUniformData, {
            viewProjectionMatrix: this.viewProjectionMatrix,
            cameraPosition: this.cameraPosition,
            lights: this.resolveLights(),
        });

        device.queue.writeBuffer(this._sceneUniformBuffer, 0, this._sceneUniformData);

        // Flush geometry
        const flushResult = this._geometryManager.flush();

        const commandEncoder = device.createCommandEncoder();
        const textureView = this._gpuContext.getCurrentTexture().createView();

        const colorAttachment: GPURenderPassColorAttachment = this._msaaView
            ? {
                view: this._msaaView,
                resolveTarget: textureView,
                clearValue: {
                    r: this._clearColor[0],
                    g: this._clearColor[1],
                    b: this._clearColor[2],
                    a: this._clearColor[3],
                },
                loadOp: 'clear' as GPULoadOp,
                storeOp: 'discard' as GPUStoreOp,
            }
            : {
                view: textureView,
                clearValue: {
                    r: this._clearColor[0],
                    g: this._clearColor[1],
                    b: this._clearColor[2],
                    a: this._clearColor[3],
                },
                loadOp: 'clear' as GPULoadOp,
                storeOp: 'store' as GPUStoreOp,
            };

        const renderPass = commandEncoder.beginRenderPass({
            colorAttachments: [colorAttachment],
            depthStencilAttachment: {
                view: this._depthView!,
                depthClearValue: 1.0,
                depthLoadOp: 'clear',
                depthStoreOp: 'store',
            },
        });

        if (flushResult) {
            renderPass.setPipeline(this._pipelineState.pipeline);
            renderPass.setBindGroup(0, this._sceneBindGroup);
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

    /** Measures text using the offscreen 2D canvas context. */
    public override measureText(text: string, font?: string): TextMetrics {
        return canvasMeasureText(this._hitContext, text, font);
    }

    /** Destroys the WebGPU context, unconfigures the swap chain, and releases every GPU resource. */
    public override destroy(): void {
        this._destroyed = true;
        this._geometryManager.destroy();
        this._sceneUniformBuffer.destroy();
        this._depthTexture?.destroy();
        this._msaaTexture?.destroy();

        this._depthTexture = null;
        this._depthView = null;
        this._msaaTexture = null;
        this._msaaView = null;

        // Without this the swap chain stays configured against a canvas that is about to detach.
        this._gpuContext.unconfigure();

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
