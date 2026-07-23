import {
    LIGHT_DIRECTION,
} from './constants';

import type {
    ProjectedFace3D,
} from './shape';

import {
    mat4Identity,
    mat4LookAt,
    mat4Multiply,
    mat4Orthographic,
    mat4Perspective,
    mat4TransformDirection,
    mat4TransformPoint,
} from '../math/matrix';

import type {
    Matrix4,
    ProjectedPoint,
    Vector3,
} from '../math';

import {
    degreesToRadians,
} from '@ripl/core';

import type {
    Box,
    ContextExport,
    ContextFactory,
    ContextOptions,
} from '@ripl/core';

import {
    createCanvasExport,
    DOMContext,
} from '@ripl/dom';

import {
    canvas2DStateMixin,
    rescaleCanvas,
} from '@ripl/canvas';

/** The rendering strategy used by a 3D context. */
export type RenderStrategy = 'cpu' | 'gpu';

/** Typed metadata for 3D contexts. */
export interface Context3DMeta {
    /** The rendering strategy (CPU painter's algorithm or GPU) used by the context. */
    renderStrategy: RenderStrategy;
    /** Arbitrary additional metadata entries. */
    [key: string]: unknown;
}

/** Determines whether the light direction is fixed in world space or follows the camera. */
export type LightMode = 'world' | 'camera';

/** A mesh submission queued for a single frame. */
export interface MeshSubmission {
    /** Interleaved vertex data (position, normal, and colour) for the mesh. */
    vertices: Float32Array;
    /** Triangle indices into the vertex buffer. */
    indices: Uint32Array;
    /** The model matrix transforming the mesh from local to world space. */
    modelMatrix: Matrix4;
    /** The matrix transforming surface normals into world space. */
    normalMatrix: Matrix4;
}

/** Options for the 3D rendering context, extending the base context options with camera parameters. */
export interface Context3DOptions extends ContextOptions<Context3DMeta> {
    /** The vertical field of view in degrees. Defaults to `60`. */
    fov?: number;
    /** The distance to the near clipping plane. Defaults to `0.1`. */
    near?: number;
    /** The distance to the far clipping plane. Defaults to `1000`. */
    far?: number;
    /** The directional light vector used for shading. Defaults to a top-left-front direction. */
    lightDirection?: Vector3;
    /** Whether the light is fixed in world space or follows the camera. Defaults to `'world'`. */
    lightMode?: LightMode;
}

/** Base 3D rendering context providing view/projection matrices, camera, lighting, and projection. Subclassed by CanvasContext3D and WebGPUContext3D. */
export class Context3D extends DOMContext<HTMLCanvasElement, Context3DMeta> {

    /** The view matrix transforming world space into camera (view) space. */
    public viewMatrix: Matrix4;
    /** The projection matrix transforming view space into clip space. */
    public projectionMatrix: Matrix4;
    /** The combined view-projection matrix, transforming world space directly into clip space. */
    public viewProjectionMatrix: Matrix4;
    /** The directional light vector used for shading faces. */
    public lightDirection: Vector3;
    /** Whether {@link lightDirection} is fixed in world space or follows the camera. */
    public lightMode: LightMode;
    /** Faces accumulated during the current frame, sorted back-to-front before drawing (painter's algorithm). */
    public faceBuffer: ProjectedFace3D[] = [];

    protected fov: number;
    protected near: number;
    protected far: number;

    /** The active rendering strategy (`cpu` or `gpu`) for this context. */
    public get renderStrategy(): RenderStrategy {
        return this.meta.renderStrategy;
    }

    constructor(
        type: string,
        target: string | HTMLElement,
        element: HTMLCanvasElement,
        options?: Context3DOptions
    ) {
        element.style.display = 'block';
        element.style.width = '100%';
        element.style.height = '100%';

        super(type, target, element, {
            ...options,
            meta: {
                renderStrategy: 'cpu',
                ...options?.meta,
            },
        });

        const {
            fov = 60,
            near = 0.1,
            far = 1000,
        } = options || {};

        this.fov = fov;
        this.near = near;
        this.far = far;
        this.lightDirection = options?.lightDirection ?? [...LIGHT_DIRECTION.topLeftFront];
        this.lightMode = options?.lightMode ?? 'world';
        this.viewMatrix = mat4Identity();
        this.projectionMatrix = mat4Identity();
        this.viewProjectionMatrix = mat4Identity();
    }

    protected updateViewProjectionMatrix(): void {
        this.viewProjectionMatrix = mat4Multiply(this.projectionMatrix, this.viewMatrix);
    }

    protected updateProjectionMatrix(): void {
        if (this.width > 0 && this.height > 0) {
            this.projectionMatrix = mat4Perspective(
                degreesToRadians(this.fov),
                this.width / this.height,
                this.near,
                this.far
            );
            this.updateViewProjectionMatrix();
        }
    }

    /** Sets the view matrix from an eye position, look-at target, and up direction. */
    public setCamera(eye: Vector3, target: Vector3, up: Vector3): void {
        this.viewMatrix = mat4LookAt(eye, target, up);
        this.updateViewProjectionMatrix();
        this.requestRender();
    }

    /** Updates the perspective projection with the given field of view, near, and far planes. */
    public setPerspective(fov: number, near: number, far: number): void {
        this.fov = fov;
        this.near = near;
        this.far = far;
        this.updateProjectionMatrix();
        this.requestRender();
    }

    /** Sets an orthographic projection with explicit frustum bounds. */
    public setOrthographic(
        left: number,
        right: number,
        bottom: number,
        top: number,
        near: number,
        far: number
    ): void {
        this.projectionMatrix = mat4Orthographic(left, right, bottom, top, near, far);
        this.updateViewProjectionMatrix();
        this.requestRender();
    }

    /** Returns the effective light direction for the current render, accounting for the light mode. */
    public getLightDirectionForRender(): Vector3 {
        if (this.lightMode === 'world') {
            return mat4TransformDirection(this.viewMatrix, this.lightDirection);
        }

        return this.lightDirection;
    }

    /** Projects a 3D world-space point to 2D screen coordinates. */
    public project(point: Vector3): ProjectedPoint {
        const clip = mat4TransformPoint(this.viewProjectionMatrix, point);

        return [
            (clip[0] * 0.5 + 0.5) * this.width,
            (-clip[1] * 0.5 + 0.5) * this.height,
            clip[2],
        ];
    }

    /** Submits a mesh for rendering this frame. Noop in the base class; overridden by GPU-backed contexts. */
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    public submitMesh(submission: MeshSubmission): void {
        // noop — overridden in subclasses (e.g. WebGPUContext3D)
    }

    /**
     * Exports the rendered canvas. Shared by CPU and GPU 3D contexts; call after a frame has
     * rendered (GPU present textures are transient, so `createCanvasExport` snapshots immediately).
     */
    public export(): ContextExport {
        return createCanvasExport(this.element);
    }

}

/** Canvas 2D–backed 3D rendering context with face buffer and painter's algorithm sorting. */
export class CanvasContext3D extends canvas2DStateMixin(Context3D) {

    declare protected context: CanvasRenderingContext2D;

    constructor(target: string | HTMLElement, options?: Context3DOptions) {
        const canvas = document.createElement('canvas');
        const context = canvas.getContext('2d');

        if (!context) {
            throw new Error('Failed to acquire a 2D canvas rendering context — the environment does not support the Canvas API');
        }

        super('canvas3d', target, canvas, options);

        this.context = context;
        this.updateProjectionMatrix();
        this.init();
    }

    // 3D faces are projected into screen space before painting, so gradients resolve against the
    // element's world box rather than the local box the 2D canvas context uses.
    protected gradientBounds(): Box | undefined {
        return this.currentRenderElement?.getBoundingBox?.();
    }

    protected rescale(width: number, height: number) {
        const result = rescaleCanvas(this.element, this.context, width, height);

        if (!result) {
            return;
        }

        super.rescale(width, height);

        this.scaleX = result.scaleX;
        this.scaleY = result.scaleY;

        if (this.viewMatrix) {
            this.updateProjectionMatrix();
        }
    }

    /** Begins a render pass, resetting the frame's face buffer at the outermost depth. */
    public markRenderStart(): void {
        super.markRenderStart();

        if (this.renderDepth === 1) {
            this.faceBuffer.length = 0;
        }
    }

    /** Ends the render pass and, at the outermost depth, sorts and draws the accumulated faces back-to-front. */
    public markRenderEnd(): void {
        super.markRenderEnd();

        if (this.renderDepth > 0 || this.faceBuffer.length === 0) {
            return;
        }

        const faces = this.faceBuffer;

        // Global painter's algorithm: sort back-to-front
        faces.sort((a, b) => b.depth - a.depth);

        this.layer(() => {
            let lastFill = '';
            let lastStroke = '';
            let lastLineWidth = -1;

            for (const face of faces) {
                this._drawFace(face, lastFill, lastStroke, lastLineWidth);

                lastFill = face.fillColor;
                lastStroke = face.strokeStyle ?? '';
                lastLineWidth = face.lineWidth ?? -1;
            }
        });
    }

    private _drawFace(
        face: ProjectedFace3D,
        lastFill: string,
        lastStroke: string,
        lastLineWidth: number
    ): void {
        const points = face.points;
        const ctx = this.context;

        ctx.beginPath();
        ctx.moveTo(points[0][0], points[0][1]);

        for (let idx = 1; idx < points.length; idx++) {
            ctx.lineTo(points[idx][0], points[idx][1]);
        }

        ctx.closePath();

        if (face.fillColor !== lastFill) {
            ctx.fillStyle = face.fillColor;
        }

        ctx.fill();

        if (!face.strokeStyle) {
            return;
        }

        if (face.strokeStyle !== lastStroke) {
            ctx.strokeStyle = face.strokeStyle;
        }

        if (face.lineWidth !== undefined && face.lineWidth !== lastLineWidth) {
            ctx.lineWidth = face.lineWidth;
        }

        ctx.stroke();
    }

}

/** Creates a Canvas 2D–backed 3D rendering context attached to the given DOM target. */
export function createContext(target: string | HTMLElement, options?: Context3DOptions): CanvasContext3D {
    return new CanvasContext3D(target, options);
}

// Compile-time conformance: the 3D canvas backend factory matches the shared `ContextFactory` contract.
createContext satisfies ContextFactory<string | HTMLElement, Context3DOptions, CanvasContext3D>;
