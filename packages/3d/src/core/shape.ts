import {
    mat4Identity,
    mat4RotateX,
    mat4RotateY,
    mat4RotateZ,
    mat4TransformPoint,
    mat4Translate,
    vec3Normalize,
} from '../math';

import {
    computeFaceBrightness,
    computeFaceNormal,
    shadeFaceColor,
} from '../shading';

import {
    Box,
    parseColor,
    Shape,
} from '@ripl/core';

import {
    functionCache,
    numberSum,
} from '@ripl/utilities';

import type {
    CachedFunction,
} from '@ripl/utilities';

import type {
    BaseElementState,
    ColorRGBA,
    Context,
    ContextPath,
    ElementIntersectionOptions,
    ElementOptions,
} from '@ripl/core';

import type {
    Context3D,
    ProjectedPoint,
} from '../context';

import type {
    Matrix4,
    Vector3,
} from '../math';

export interface Face3D {
    vertices: Vector3[];
    normal?: Vector3;
}

export interface ProjectedFace3D {
    points: ProjectedPoint[];
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

export type Shape3DOptions<TState extends Shape3DState = Shape3DState> = Partial<ElementOptions<TState>>;

export class Shape3D<TState extends Shape3DState = Shape3DState> extends Shape<TState> {

    protected hitPath?: ContextPath;
    public renderDepth: number = 0;

    private getCachedFaces: CachedFunction<() => Face3D[]>;

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
            z: 0,
            rotationX: 0,
            rotationY: 0,
            rotationZ: 0,
            ...options,
        } as unknown as ElementOptions<TState>);

        this.getCachedFaces = functionCache(() => this.computeFaces());
    }

    protected override setStateValue<TKey extends keyof TState>(key: TKey, value: TState[TKey]) {
        super.setStateValue(key, value);
        this.getCachedFaces.invalidate();
    }

    protected computeFaces(): Face3D[] {
        return [];
    }

    protected getModelMatrix(): Matrix4 {
        let matrix = mat4Identity();

        matrix = mat4Translate(matrix, [this.x, this.y, this.z]);
        matrix = mat4RotateX(matrix, this.rotationX);
        matrix = mat4RotateY(matrix, this.rotationY);
        matrix = mat4RotateZ(matrix, this.rotationZ);

        return matrix;
    }

    protected transformVertices(vertices: Vector3[], matrix?: Matrix4): Vector3[] {
        const mat = matrix ?? this.getModelMatrix();

        return vertices.map(vertex => mat4TransformPoint(mat, vertex));
    }

    public getDepth(context: Context3D): number {
        return context.project([this.x, this.y, this.z])[2];
    }

    public getBoundingBox(): Box {
        const context = this.context as Context3D | undefined;

        if (!context) {
            return new Box(0, 0, 0, 0);
        }

        const faces = this.getCachedFaces();
        const matrix = this.getModelMatrix();

        let minX = Infinity;
        let minY = Infinity;
        let maxX = -Infinity;
        let maxY = -Infinity;

        for (const face of faces) {
            const transformed = this.transformVertices(face.vertices, matrix);

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
        const faces = this.getCachedFaces();
        const baseFillStyle = this.fillStyle || '#888888';
        const baseRGBA = parseColor(baseFillStyle) as ColorRGBA;
        const normalizedLight = vec3Normalize(ctx.lightDirection ?? [0, 0, -1]);
        const matrix = this.getModelMatrix();

        this.context = context;
        this.hitPath = undefined;

        let totalDepth = 0;
        const hitPath = ctx.createPath(`${this.id}:hit`);

        for (const face of faces) {
            const transformed = this.transformVertices(face.vertices, matrix);
            const normal = face.normal ?? computeFaceNormal(transformed);
            const brightness = computeFaceBrightness(normal, normalizedLight, true);
            const fillColor = baseRGBA ? shadeFaceColor(baseRGBA, 0.3 + brightness * 0.7) : baseFillStyle;
            const points = transformed.map(vertex => ctx.project(vertex));
            const depth = numberSum(points, p => p[2]) / points.length;

            totalDepth += depth;

            ctx.faceBuffer.push({
                points,
                fillColor,
                strokeStyle: this.strokeStyle,
                lineWidth: this.lineWidth,
                depth,
            });

            hitPath.moveTo(points[0][0], points[0][1]);

            for (let idx = 1; idx < points.length; idx++) {
                hitPath.lineTo(points[idx][0], points[idx][1]);
            }

            hitPath.closePath();
        }

        this.hitPath = hitPath;
        this.renderDepth = faces.length > 0
            ? totalDepth / faces.length
            : 0;
    }

    public intersectsWith(x: number, y: number, options?: Partial<ElementIntersectionOptions>) {
        if (!this.context || !this.hitPath) {
            return super.intersectsWith(x, y, options);
        }

        const {
            isPointer = false,
        } = options || {};

        const isAnyIntersecting = () => !!(this.hitPath && this.context) && (
            this.context.isPointInStroke(this.hitPath, x, y) ||
            this.context.isPointInPath(this.hitPath, x, y)
        );

        if (!isPointer) {
            return isAnyIntersecting();
        }

        if (this.pointerEvents === 'none') {
            return false;
        }

        if (this.pointerEvents === 'stroke') {
            return !!this.context.isPointInStroke(this.hitPath, x, y);
        }

        if (this.pointerEvents === 'fill') {
            return !!this.context.isPointInPath(this.hitPath, x, y);
        }

        return isAnyIntersecting();
    }

}

export function createShape3D(...options: ConstructorParameters<typeof Shape3D>) {
    return new Shape3D(...options);
}

export function elementIsShape3D(value: unknown): value is Shape3D {
    return value instanceof Shape3D;
}