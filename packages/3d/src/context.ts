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
    Point,
} from '@ripl/core';

import type {
    Matrix4,
} from './math/matrix';

import type {
    Vector3,
} from './math/vector';

export interface Context3DOptions extends ContextOptions {
    fov?: number;
    near?: number;
    far?: number;
}

export class Context3D extends CanvasContext {

    public viewMatrix: Matrix4;
    public projectionMatrix: Matrix4;
    public viewProjectionMatrix: Matrix4;
    public lightDirection: Vector3;
    public faceBuffer: ProjectedFace3D[] | null = null;

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

    public setCamera(eye: Vector3, target: Vector3, up: Vector3): void {
        this.viewMatrix = mat4LookAt(eye, target, up);
        this.updateViewProjectionMatrix();
    }

    public setPerspective(fov: number, near: number, far: number): void {
        this.fov = fov;
        this.near = near;
        this.far = far;
        this.updateProjectionMatrix();
    }

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

    public project(point: Vector3): Point {
        const clip = mat4TransformPoint(this.viewProjectionMatrix, point);

        return [
            (clip[0] * 0.5 + 0.5) * this.width,
            (-clip[1] * 0.5 + 0.5) * this.height,
        ];
    }

    public projectDepth(point: Vector3): number {
        return mat4TransformPoint(this.viewProjectionMatrix, point)[2];
    }

    markRenderEnd(): void {
        super.markRenderEnd();

        if (this.renderDepth === 0 && this.faceBuffer && this.faceBuffer.length > 0) {
            const faces = this.faceBuffer;
            this.faceBuffer = null;

            // Global painter's algorithm: sort back-to-front
            faces.sort((a, b) => b.depth - a.depth);

            for (const face of faces) {
                face.element.renderFace(this, face);
            }
        }
    }

}

export function createContext(target: string | HTMLElement, options?: Context3DOptions): Context3D {
    return new Context3D(target, options);
}
