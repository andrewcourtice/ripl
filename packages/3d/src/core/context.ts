import {
    LIGHT_DIRECTION,
} from './constants';

import type {
    ProjectedFace3D,
    ProjectedFaceState3D,
} from './shape';

import {
    mat4Identity,
    mat4LookAt,
    mat4Multiply,
    mat4Orthographic,
    mat4Perspective,
    mat4TransformDirectionInverse,
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
    ContextExport,
    ContextFactory,
    ContextOptions,
    ContextText,
    FillRule,
    Matrix,
} from '@ripl/core';

import {
    createCanvasExport,
    DOMContext,
} from '@ripl/dom';

import {
    canvas2DStateMixin,
    rescaleCanvas,
} from '@ripl/canvas';

import type {
    CanvasPath,
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
    /** Interleaved vertex data (position, normal, and color) for the mesh. */
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
    /**
     * Faces accumulated since the last flush, sorted back-to-front and drained when they are drawn
     * (painter's algorithm). A backend that never draws them — the base class, or a GPU context —
     * leaves this empty by clearing it at the start of each pass.
     */
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

    /**
     * Returns the effective light direction for the current render, accounting for the light mode.
     *
     * Both consumers dot this against a **world-space** normal, so `'world'` is the identity and
     * `'camera'` reads {@link lightDirection} as camera-relative and carries it into world space
     * through the inverse of the view rotation.
     */
    public getLightDirectionForRender(): Vector3 {
        if (this.lightMode === 'camera') {
            return mat4TransformDirectionInverse(this.viewMatrix, this.lightDirection);
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

    /**
     * Snapshots the drawing state a face must be painted with.
     *
     * The CPU painter buffers faces and flushes them at the end of the frame, by which point every
     * element `restore()` and `popGroup()` has already unwound the state the face was projected
     * under. Capturing it here is what lets {@link CanvasContext3D} re-apply it at draw time.
     *
     * @param transform - The element's composed 2D world transform, or `null` for the identity.
     * @returns The resolved drawing state to store on each of the element's faces.
     */
    public captureFaceState(transform: Matrix | null): ProjectedFaceState3D {
        return {
            opacity: this.opacity,
            globalCompositeOperation: this.globalCompositeOperation,
            filter: this.filter,
            shadowBlur: this.shadowBlur,
            shadowColor: this.shadowColor,
            shadowOffsetX: this.shadowOffsetX,
            shadowOffsetY: this.shadowOffsetY,
            lineCap: this.lineCap,
            lineJoin: this.lineJoin,
            lineDash: this.lineDash,
            lineDashOffset: this.lineDashOffset,
            miterLimit: this.miterLimit,
            transform,
        };
    }

    /** Submits a mesh for rendering this frame. Noop in the base class; overridden by GPU-backed contexts. */
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    public submitMesh(submission: MeshSubmission): void {
        // noop, overridden in subclasses (e.g. WebGPUContext3D)
    }

    /**
     * Exports the rendered canvas. Shared by CPU and GPU 3D contexts; call after a frame has
     * rendered (GPU present textures are transient, so `createCanvasExport` snapshots immediately).
     */
    public export(): ContextExport {
        return createCanvasExport(this.element);
    }

}

/** Style values already assigned to the native context, so the diff only skips what it really applied. */
interface AppliedFaceStyle {
    fill: string;
    stroke: string;
    lineWidth: number;
}

/** Canvas 2D–backed 3D rendering context with face buffer and painter's algorithm sorting. */
export class CanvasContext3D extends canvas2DStateMixin(Context3D) {

    declare protected context: CanvasRenderingContext2D;

    private _clipPending = false;

    constructor(target: string | HTMLElement, options?: Context3DOptions) {
        const canvas = document.createElement('canvas');
        const context = canvas.getContext('2d');

        if (!context) {
            throw new Error('Failed to acquire a 2D canvas rendering context: the environment does not support the Canvas API');
        }

        super('canvas3d', target, canvas, options);

        this.context = context;
        this.updateProjectionMatrix();
        this.init();
    }

    /** Whether traced paths may be reused across frames; the 2D elements this context hosts trace side-effect-free paths. */
    public override get supportsPathCaching(): boolean {
        return true;
    }

    // Gated on the logical size, never the backing store: a fresh canvas is already 300x150.
    protected rescale(width: number, height: number) {
        if (width === this.width && height === this.height) {
            return;
        }

        const result = rescaleCanvas(this.element, this.context, width, height);

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
            this._clipPending = false;
        }
    }

    /** Ends the render pass and, at the outermost depth, flushes any faces still buffered. */
    public markRenderEnd(): void {
        super.markRenderEnd();

        if (this.renderDepth > 0) {
            return;
        }

        this.flushFaces();
    }

    /**
     * Sorts the buffered faces back-to-front and paints them, then empties the buffer.
     *
     * Called at the end of the frame and again whenever something else is about to paint — a 2D
     * element, an image, or a clip — so that 3D geometry composites in scene order rather than
     * always landing on top. Faces depth-sort against each other within a flush, not across flushes.
     */
    public flushFaces(): void {
        const faces = this.faceBuffer;

        if (faces.length === 0) {
            return;
        }

        // Painter's algorithm: back-to-front within this flush.
        faces.sort((a, b) => b.depth - a.depth);

        let index = 0;

        while (index < faces.length) {
            const start = index;
            const state = faces[start].state;

            while (index < faces.length && faces[index].state === state) {
                index++;
            }

            this._paintFaceScope(faces, start, index, state);
        }

        faces.length = 0;
    }

    /** Paints `faces[start, end)`, all of which share `state`, inside a single save/restore scope. */
    private _paintFaceScope(
        faces: ProjectedFace3D[],
        start: number,
        end: number,
        state: ProjectedFaceState3D | undefined
    ): void {
        this.layer(() => {
            if (state) {
                this._applyFaceState(state);
            }

            const applied: AppliedFaceStyle = {
                fill: '',
                stroke: '',
                lineWidth: -1,
            };

            for (let idx = start; idx < end; idx++) {
                this._drawFace(faces[idx], applied);
            }
        });
    }

    private _applyFaceState(state: ProjectedFaceState3D): void {
        const ctx = this.context;

        ctx.globalAlpha = state.opacity;
        ctx.globalCompositeOperation = state.globalCompositeOperation as GlobalCompositeOperation;
        ctx.filter = state.filter;
        ctx.shadowBlur = state.shadowBlur;
        ctx.shadowColor = state.shadowColor;
        ctx.shadowOffsetX = state.shadowOffsetX;
        ctx.shadowOffsetY = state.shadowOffsetY;
        ctx.lineCap = state.lineCap;
        ctx.lineJoin = state.lineJoin;
        ctx.lineDashOffset = state.lineDashOffset;
        ctx.setLineDash(state.lineDash);
        ctx.miterLimit = state.miterLimit;

        if (state.transform) {
            ctx.transform(...state.transform);
        }
    }

    private _drawFace(face: ProjectedFace3D, applied: AppliedFaceStyle): void {
        const points = face.points;
        const ctx = this.context;

        ctx.beginPath();
        ctx.moveTo(points[0][0], points[0][1]);

        for (let idx = 1; idx < points.length; idx++) {
            ctx.lineTo(points[idx][0], points[idx][1]);
        }

        ctx.closePath();

        if (face.fillColor !== applied.fill) {
            ctx.fillStyle = face.fillColor;
            applied.fill = face.fillColor;
        }

        ctx.fill();

        if (!face.strokeStyle) {
            return;
        }

        if (face.strokeStyle !== applied.stroke) {
            ctx.strokeStyle = face.strokeStyle;
            applied.stroke = face.strokeStyle;
        }

        if (face.lineWidth !== undefined && face.lineWidth !== applied.lineWidth) {
            ctx.lineWidth = face.lineWidth;
            applied.lineWidth = face.lineWidth;
        }

        ctx.stroke();
    }

    /** Fills a path or text, flushing any buffered 3D faces first so paint order follows scene order. */
    public override applyFill(element: CanvasPath | ContextText, fillRule?: FillRule): void {
        this.flushFaces();

        return super.applyFill(element, fillRule);
    }

    /** Strokes a path or text, flushing any buffered 3D faces first so paint order follows scene order. */
    public override applyStroke(element: CanvasPath | ContextText): void {
        this.flushFaces();

        return super.applyStroke(element);
    }

    /** Draws an image, flushing any buffered 3D faces first so paint order follows scene order. */
    public override drawImage(image: CanvasImageSource, x: number, y: number, width?: number, height?: number): void {
        this.flushFaces();

        return super.drawImage(image, x, y, width, height);
    }

    /** Clips subsequent drawing, flushing any buffered 3D faces first so the clip cannot reach back over them. */
    public override applyClip(path: CanvasPath, fillRule?: FillRule): void {
        this.flushFaces();
        this._clipPending = true;

        return super.applyClip(path, fillRule);
    }

    /**
     * Closes a group boundary, flushing any faces buffered under a clip installed within it.
     * `popGroup` unwinds that clip, so a group-scoped clip would otherwise be gone by the time the
     * faces were painted while an identical root-level clip still masked them.
     */
    public override popGroup(): void {
        if (this._clipPending) {
            this.flushFaces();
            this._clipPending = false;
        }

        super.popGroup();
    }

}

/** Creates a Canvas 2D–backed 3D rendering context attached to the given DOM target. */
export function createContext(target: string | HTMLElement, options?: Context3DOptions): CanvasContext3D {
    return new CanvasContext3D(target, options);
}

// Compile-time conformance: the 3D canvas backend factory matches the shared `ContextFactory` contract.
createContext satisfies ContextFactory<string | HTMLElement, Context3DOptions, CanvasContext3D>;
