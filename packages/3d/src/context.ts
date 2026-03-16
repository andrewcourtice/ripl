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
    Direction,
    FillRule,
    FontKerning,
    LineCap,
    LineJoin,
    TextAlignment,
    TextBaseline,
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
    getCanvasGradientBounds,
    rescaleCanvas,
    setCanvasFill,
    setCanvasStroke,
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
    private _fillCSS: string = '';
    private _strokeCSS: string = '';

    public get fill(): string {
        return this._fillCSS || this.context.fillStyle as string;
    }

    public set fill(value) {
        this._fillCSS = value;
        const bounds = getCanvasGradientBounds(this.currentRenderElement?.getBoundingBox?.(), this.width, this.height);
        setCanvasFill(this.context, value, bounds);
    }

    public get filter(): string {
        return this.context.filter;
    }

    public set filter(value) {
        this.context.filter = value;
    }

    public get direction(): Direction {
        return this.context.direction;
    }

    public set direction(value) {
        this.context.direction = value;
    }

    public get font(): string {
        return this.context.font;
    }

    public set font(value) {
        this.context.font = value;
    }

    public get fontKerning(): FontKerning {
        return this.context.fontKerning;
    }

    public set fontKerning(value) {
        this.context.fontKerning = value;
    }

    public get opacity(): number {
        return this.context.globalAlpha;
    }

    public set opacity(value) {
        this.context.globalAlpha = value;
    }

    public get globalCompositeOperation(): unknown {
        return this.context.globalCompositeOperation;
    }

    public set globalCompositeOperation(value) {
        this.context.globalCompositeOperation = value as GlobalCompositeOperation;
    }

    public get lineCap(): LineCap {
        return this.context.lineCap;
    }

    public set lineCap(value) {
        this.context.lineCap = value;
    }

    public get lineDash(): number[] {
        return this.context.getLineDash();
    }

    public set lineDash(value) {
        this.context.setLineDash(value);
    }

    public get lineDashOffset(): number {
        return this.context.lineDashOffset;
    }

    public set lineDashOffset(value) {
        this.context.lineDashOffset = value;
    }

    public get lineJoin(): LineJoin {
        return this.context.lineJoin;
    }

    public set lineJoin(value) {
        this.context.lineJoin = value;
    }

    public get lineWidth(): number {
        return this.context.lineWidth;
    }

    public set lineWidth(value) {
        this.context.lineWidth = value;
    }

    public get miterLimit(): number {
        return this.context.miterLimit;
    }

    public set miterLimit(value) {
        this.context.miterLimit = value;
    }

    public get shadowBlur(): number {
        return this.context.shadowBlur;
    }

    public set shadowBlur(value) {
        this.context.shadowBlur = value;
    }

    public get shadowColor(): string {
        return this.context.shadowColor;
    }

    public set shadowColor(value) {
        this.context.shadowColor = value;
    }

    public get shadowOffsetX(): number {
        return this.context.shadowOffsetX;
    }

    public set shadowOffsetX(value) {
        this.context.shadowOffsetX = value;
    }

    public get shadowOffsetY(): number {
        return this.context.shadowOffsetY;
    }

    public set shadowOffsetY(value) {
        this.context.shadowOffsetY = value;
    }

    public get stroke(): string {
        return this._strokeCSS || this.context.strokeStyle as string;
    }

    public set stroke(value) {
        this._strokeCSS = value;
        const bounds = getCanvasGradientBounds(this.currentRenderElement?.getBoundingBox?.(), this.width, this.height);
        setCanvasStroke(this.context, value, bounds);
    }

    public get textAlign(): TextAlignment {
        return this.context.textAlign;
    }

    public set textAlign(value) {
        this.context.textAlign = value;
    }

    public get textBaseline(): TextBaseline {
        return this.context.textBaseline;
    }

    public set textBaseline(value) {
        this.context.textBaseline = value;
    }

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

    public save(): void {
        return this.context.save();
    }

    public restore(): void {
        return this.context.restore();
    }

    public clear(): void {
        return this.context.clearRect(0, 0, this.width, this.height);
    }

    public reset(): void {
        return this.context.reset();
    }

    public rotate(angle: number): void {
        return this.context.rotate(angle);
    }

    public scale(x: number, y: number): void {
        return this.context.scale(x, y);
    }

    public translate(x: number, y: number): void {
        return this.context.translate(x, y);
    }

    // eslint-disable-next-line id-length
    public setTransform(a: number, b: number, c: number, d: number, e: number, f: number): void {
        return this.context.setTransform(a, b, c, d, e, f);
    }

    // eslint-disable-next-line id-length
    public transform(a: number, b: number, c: number, d: number, e: number, f: number): void {
        return this.context.transform(a, b, c, d, e, f);
    }

    public measureText(text: string, font?: string): TextMetrics {
        return canvasMeasureText(this.context, text, font);
    }

    public createPath(id?: string): CanvasPath {
        return new CanvasPath(id);
    }

    public applyClip(path: CanvasPath, fillRule?: FillRule): void {
        return this.context.clip(path.ref, fillRule);
    }

    public drawImage(image: CanvasImageSource, x: number, y: number, width?: number, height?: number): void {
        return canvasDrawImage(this.context, image, x, y, width, height);
    }

    public applyFill(element: CanvasPath | ContextText, fillRule?: FillRule): void {
        return applyCanvasFill(this.context, element, fillRule);
    }

    public applyStroke(element: CanvasPath | ContextText): void {
        return applyCanvasStroke(this.context, element);
    }

    public isPointInPath(path: ContextPath, x: number, y: number, fillRule?: FillRule): boolean {
        if (path instanceof CanvasPath) {
            return canvasIsPointInPath(this.context, path, x, y, fillRule);
        }

        return false;
    }

    public isPointInStroke(path: ContextPath, x: number, y: number): boolean {
        if (path instanceof CanvasPath) {
            return canvasIsPointInStroke(this.context, path, x, y);
        }

        return false;
    }

    public markRenderStart(): void {
        super.markRenderStart();

        if (this.renderDepth === 1) {
            this.faceBuffer.length = 0;
        }
    }

    public markRenderEnd(): void {
        super.markRenderEnd();

        if (this.renderDepth > 0 || this.faceBuffer.length === 0) {
            return;
        }

        const faces = this.faceBuffer;
        const ctx = this.context;

        // Global painter's algorithm: sort back-to-front
        faces.sort((a, b) => b.depth - a.depth);

        this.layer(() => {
            let lastFill = '';
            let lastStroke = '';
            let lastLineWidth = -1;

            for (const face of faces) {
                this.drawFace(face, lastFill, lastStroke, lastLineWidth);

                lastFill = face.fillColor;
                lastStroke = face.strokeStyle ?? '';
                lastLineWidth = face.lineWidth ?? -1;
            }
        });
    }

    private drawFace(
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
