import {
    CanvasContext,
} from '@ripl/core';

import type {
    ProjectedFace3D,
} from './core/shape';

import {
    mat4Identity,
    mat4LookAt,
    mat4Multiply,
    mat4Orthographic,
    mat4Perspective,
    mat4TransformPoint,
} from './math/matrix';

import {
    degreesToRadians,
} from '@ripl/core';

import type {
    ContextOptions,
} from '@ripl/core';

import type {
    Matrix4,
    ProjectedPoint,
    Vector3,
} from './math';

/** Options for the 3D rendering context, extending the base context options with camera parameters. */
export interface Context3DOptions extends ContextOptions {
    fov?: number;
    near?: number;
    far?: number;
}

/** 3D rendering context extending the Canvas context with view/projection matrices and a face buffer for painter's algorithm sorting. */
export class Context3D extends CanvasContext {

    public viewMatrix: Matrix4;
    public projectionMatrix: Matrix4;
    public viewProjectionMatrix: Matrix4;
    public lightDirection: Vector3;
    public faceBuffer: ProjectedFace3D[] = [];

    private fov: number;
    private near: number;
    private far: number;

    constructor(target: string | HTMLElement, options?: Context3DOptions) {
        super(target, options);

        const {
            fov = 60,
            near = 0.1,
            far = 1000,
        } = options || {};

        this.fov = fov;
        this.near = near;
        this.far = far;
        this.lightDirection = [0, 0, -1];
        this.viewMatrix = mat4Identity();
        this.projectionMatrix = mat4Identity();
        this.viewProjectionMatrix = mat4Identity();

        this.updateProjectionMatrix();
    }

    protected rescale(width: number, height: number) {
        super.rescale(width, height);

        if (this.viewMatrix) {
            this.updateProjectionMatrix();
        }
    }

    private updateViewProjectionMatrix(): void {
        this.viewProjectionMatrix = mat4Multiply(this.projectionMatrix, this.viewMatrix);
    }

    private updateProjectionMatrix(): void {
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

    /** Projects a 3D world-space point to 2D screen coordinates. */
    public project(point: Vector3): ProjectedPoint {
        const clip = mat4TransformPoint(this.viewProjectionMatrix, point);

        return [
            (clip[0] * 0.5 + 0.5) * this.width,
            (-clip[1] * 0.5 + 0.5) * this.height,
            clip[2],
        ];
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

/** Creates a 3D rendering context attached to the given DOM target. */
export function createContext(target: string | HTMLElement, options?: Context3DOptions): Context3D {
    return new Context3D(target, options);
}
