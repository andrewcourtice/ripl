import {
    Box,
    Shape,
} from '@ripl/core';

import {
    mat4Identity,
    mat4RotateX,
    mat4RotateY,
    mat4RotateZ,
    mat4TransformPoint,
    mat4Translate,
} from '../math';

import {
    computeFaceBrightness,
    computeFaceNormal,
    shadeFaceColor,
} from '../shading';

import type {
    BaseElementState,
    Context,
    ShapeOptions,
} from '@ripl/core';

import type {
    Context3D,
} from '../context';

import type {
    Vector3,
} from '../math';

export interface Face3D {
    vertices: Vector3[];
    normal?: Vector3;
}

export interface ProjectedFace3D {
    element: Shape3D;
    points: [number, number][];
    fillColor: string;
    strokeStyle: string | undefined;
    lineWidth: number | undefined;
    depth: number;
}

export interface Shape3DState extends BaseElementState {
    x: number;
    y: number;
    z: number;
    rotationX: number;
    rotationY: number;
    rotationZ: number;
}

export type Shape3DOptions<TState extends Shape3DState = Shape3DState> = Partial<ShapeOptions<TState>>;

export class Shape3D<TState extends Shape3DState = Shape3DState> extends Shape<TState> {

    public get x() {
        return this.getStateValue('x');
    }

    public set x(value) {
        this.setStateValue('x', value);
    }

    public get y() {
        return this.getStateValue('y');
    }

    public set y(value) {
        this.setStateValue('y', value);
    }

    public get z() {
        return this.getStateValue('z');
    }

    public set z(value) {
        this.setStateValue('z', value);
    }

    public get rotationX() {
        return this.getStateValue('rotationX');
    }

    public set rotationX(value) {
        this.setStateValue('rotationX', value);
    }

    public get rotationY() {
        return this.getStateValue('rotationY');
    }

    public set rotationY(value) {
        this.setStateValue('rotationY', value);
    }

    public get rotationZ() {
        return this.getStateValue('rotationZ');
    }

    public set rotationZ(value) {
        this.setStateValue('rotationZ', value);
    }

    constructor(type: string, options: Shape3DOptions<TState>) {
        super(type, {
            x: 0,
            y: 0,
            z: 0, // eslint-disable-line id-length
            rotationX: 0,
            rotationY: 0,
            rotationZ: 0,
            ...options,
        } as unknown as ShapeOptions<TState>);
    }

    protected computeFaces(): Face3D[] {
        return [];
    }

    protected transformVertices(vertices: Vector3[]): Vector3[] {
        let matrix = mat4Identity();

        matrix = mat4Translate(matrix, [this.x, this.y, this.z]);
        matrix = mat4RotateX(matrix, this.rotationX);
        matrix = mat4RotateY(matrix, this.rotationY);
        matrix = mat4RotateZ(matrix, this.rotationZ);

        return vertices.map(vertex => mat4TransformPoint(matrix, vertex));
    }

    public getDepth(context: Context3D): number {
        return context.projectDepth([this.x, this.y, this.z]);
    }

    public getBoundingBox(): Box {
        const context = this.context as Context3D | undefined;

        if (!context) {
            return new Box(0, 0, 0, 0);
        }

        const faces = this.computeFaces();
        
        let minX = Infinity;
        let minY = Infinity;
        let maxX = -Infinity;
        let maxY = -Infinity;

        for (const face of faces) {
            const transformed = this.transformVertices(face.vertices);

            for (const vertex of transformed) {
                const [px, py] = context.project(vertex);

                minX = Math.min(minX, px);
                minY = Math.min(minY, py);
                maxX = Math.max(maxX, px);
                maxY = Math.max(maxY, py);
            }
        }

        if (!isFinite(minX)) {
            return new Box(0, 0, 0, 0);
        }

        return new Box(minY, minX, maxY, maxX);
    }

    public render(context: Context): void {
        const ctx = context as Context3D;
        const faces = this.computeFaces();
        const baseFillStyle = this.fillStyle || '#888888';

        // Transform all faces and compute projected depth
        const projectedFaces = faces.map(face => {
            const transformed = this.transformVertices(face.vertices);
            const normal = face.normal ?? computeFaceNormal(transformed);

            let depthSum = 0;

            for (const vertex of transformed) {
                depthSum += ctx.projectDepth(vertex);
            }

            return {
                transformed,
                normal,
                depth: depthSum / transformed.length,
            };
        });

        // If the context has a face buffer, defer faces for global sorting
        if (ctx.faceBuffer) {
            this.context = context;

            for (const face of projectedFaces) {
                const brightness = computeFaceBrightness(face.normal, ctx.lightDirection ?? [0, 0, -1]);
                const fillColor = shadeFaceColor(baseFillStyle, 0.3 + brightness * 0.7);
                const points = face.transformed.map(vertex => ctx.project(vertex));

                ctx.faceBuffer.push({
                    element: this,
                    points,
                    fillColor,
                    strokeStyle: this.strokeStyle,
                    lineWidth: this.lineWidth,
                    depth: face.depth,
                });
            }

            return;
        }

        // Painter's algorithm: sort back-to-front (larger depth = further away)
        projectedFaces.sort((fa, fb) => fb.depth - fa.depth);

        for (const face of projectedFaces) {
            const brightness = computeFaceBrightness(face.normal, ctx.lightDirection ?? [0, 0, -1]);
            const faceColor = shadeFaceColor(baseFillStyle, 0.3 + brightness * 0.7);

            const points = face.transformed.map(vertex => ctx.project(vertex));

            this.fillStyle = faceColor;

            super.render(context, path => {
                path.moveTo(points[0][0], points[0][1]);

                for (let idx = 1; idx < points.length; idx++) {
                    path.lineTo(points[idx][0], points[idx][1]);
                }

                path.closePath();
            });
        }

        // Restore original fill style
        this.fillStyle = baseFillStyle;
    }

    public renderFace(context: Context, face: ProjectedFace3D): void {
        const baseFillStyle = this.fillStyle;

        this.fillStyle = face.fillColor;

        if (face.strokeStyle) {
            this.strokeStyle = face.strokeStyle;
        }

        if (face.lineWidth !== undefined) {
            this.lineWidth = face.lineWidth;
        }

        super.render(context, path => {
            path.moveTo(face.points[0][0], face.points[0][1]);

            for (let idx = 1; idx < face.points.length; idx++) {
                path.lineTo(face.points[idx][0], face.points[idx][1]);
            }

            path.closePath();
        });

        this.fillStyle = baseFillStyle;
    }

}

export function createShape3D(...options: ConstructorParameters<typeof Shape3D>) {
    return new Shape3D(...options);
}

export function elementIsShape3D(value: unknown): value is Shape3D {
    return value instanceof Shape3D;
}