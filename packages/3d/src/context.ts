import {
    LIGHT_DIRECTION,
} from './constants';

import type {
    ProjectedFace3D,
} from './core/shape';

import {
    mat4Identity,
    mat4LookAt,
    mat4Multiply,
    mat4Orthographic,
    mat4Perspective,
    mat4TransformDirection,
    mat4TransformPoint,
} from './math/matrix';

import type {
    Matrix4,
    ProjectedPoint,
    Vector3,
} from './math';

import {
    ContextText,
    degreesToRadians,
} from '@ripl/core';

import type {
    ContextOptions,
    ContextPath,
    FillRule,
} from '@ripl/core';

import {
    DOMContext,
} from '@ripl/dom';

import {
    applyCanvasFill,
    applyCanvasStroke,
    canvasDrawImage,
    canvasIsPointInPath,
    canvasIsPointInStroke,
    canvasMeasureText,
    CanvasPath,
    rescaleCanvas,
} from '@ripl/canvas';

/** Determines whether the light direction is fixed in world space or follows the camera. */
export type LightMode = 'world' | 'camera';

/** A mesh submission queued for a single frame. */
export interface MeshSubmission {
    vertices: Float32Array;
    indices: Uint32Array;
    modelMatrix: Matrix4;
    normalMatrix: Matrix4;
}

/** Options for the 3D rendering context, extending the base context options with camera parameters. */
export interface Context3DOptions extends ContextOptions {
    fov?: number;
    near?: number;
    far?: number;
    lightDirection?: Vector3;
    lightMode?: LightMode;
}

/** Base 3D rendering context providing view/projection matrices, camera, lighting, and projection. Subclassed by CanvasContext3D and WebGPUContext3D. */
export class Context3D extends DOMContext<HTMLCanvasElement> {

    public viewMatrix: Matrix4;
    public projectionMatrix: Matrix4;
    public viewProjectionMatrix: Matrix4;
    public lightDirection: Vector3;
    public lightMode: LightMode;

    protected fov: number;
    protected near: number;
    protected far: number;

    constructor(
        type: string,
        target: string | HTMLElement,
        element: HTMLCanvasElement,
        options?: Context3DOptions
    ) {
        element.style.display = 'block';
        element.style.width = '100%';
        element.style.height = '100%';

        super(type, target, element, options);

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
    }

    /** Updates the perspective projection with the given field of view, near, and far planes. */
    public setPerspective(fov: number, near: number, far: number): void {
        this.fov = fov;
        this.near = near;
        this.far = far;
        this.updateProjectionMatrix();
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

}

/** Canvas 2D–backed 3D rendering context with face buffer and painter's algorithm sorting. */
export class CanvasContext3D extends Context3D {

    protected context: CanvasRenderingContext2D;
    public faceBuffer: ProjectedFace3D[] = [];

    constructor(target: string | HTMLElement, options?: Context3DOptions) {
        const canvas = document.createElement('canvas');
        const context = canvas.getContext('2d');

        if (!context) {
            throw new Error();
        }

        super('canvas3d', target, canvas, options);

        this.context = context;
        this.updateProjectionMatrix();
        this.init();
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

    save(): void {
        return this.context.save();
    }

    restore(): void {
        return this.context.restore();
    }

    clear(): void {
        return this.context.clearRect(0, 0, this.width, this.height);
    }

    reset(): void {
        return this.context.reset();
    }

    rotate(angle: number): void {
        return this.context.rotate(angle);
    }

    scale(x: number, y: number): void {
        return this.context.scale(x, y);
    }

    translate(x: number, y: number): void {
        return this.context.translate(x, y);
    }

    // eslint-disable-next-line id-length
    setTransform(a: number, b: number, c: number, d: number, e: number, f: number): void {
        return this.context.setTransform(a, b, c, d, e, f);
    }

    // eslint-disable-next-line id-length
    transform(a: number, b: number, c: number, d: number, e: number, f: number): void {
        return this.context.transform(a, b, c, d, e, f);
    }

    measureText(text: string, font?: string): TextMetrics {
        return canvasMeasureText(this.context, text, font);
    }

    createPath(id?: string): CanvasPath {
        return new CanvasPath(id);
    }

    applyClip(path: CanvasPath, fillRule?: FillRule): void {
        return this.context.clip(path.ref, fillRule);
    }

    drawImage(image: CanvasImageSource, x: number, y: number, width?: number, height?: number): void {
        return canvasDrawImage(this.context, image, x, y, width, height);
    }

    applyFill(element: CanvasPath | ContextText, fillRule?: FillRule): void {
        return applyCanvasFill(this.context, element, fillRule);
    }

    applyStroke(element: CanvasPath | ContextText): void {
        return applyCanvasStroke(this.context, element);
    }

    isPointInPath(path: ContextPath, x: number, y: number, fillRule?: FillRule): boolean {
        if (path instanceof CanvasPath) {
            return canvasIsPointInPath(this.context, path, x, y, fillRule);
        }

        return false;
    }

    isPointInStroke(path: ContextPath, x: number, y: number): boolean {
        if (path instanceof CanvasPath) {
            return canvasIsPointInStroke(this.context, path, x, y);
        }

        return false;
    }

    markRenderStart(): void {
        super.markRenderStart();

        if (this.renderDepth === 1) {
            this.faceBuffer.length = 0;
        }
    }

    markRenderEnd(): void {
        super.markRenderEnd();

        if (this.renderDepth > 0 || this.faceBuffer.length === 0) {
            return;
        }

        const faces = this.faceBuffer;
        const ctx = this.context;

        // Global painter's algorithm: sort back-to-front
        faces.sort((a, b) => b.depth - a.depth);

        let lastFill = '';
        let lastStroke = '';
        let lastLineWidth = -1;

        for (const face of faces) {
            this.drawFace(ctx, face, lastFill, lastStroke, lastLineWidth);

            lastFill = face.fillColor;
            lastStroke = face.strokeStyle ?? '';
            lastLineWidth = face.lineWidth ?? -1;
        }
    }

    private drawFace(
        ctx: CanvasRenderingContext2D,
        face: ProjectedFace3D,
        lastFill: string,
        lastStroke: string,
        lastLineWidth: number
    ): void {
        const points = face.points;

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
