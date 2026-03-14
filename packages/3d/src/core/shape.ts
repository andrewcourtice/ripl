import {
    CanvasContext3D,
} from '../context';

import type {
    Context3D,
} from '../context';

import {
    mat4Identity,
    mat4RotateX,
    mat4RotateY,
    mat4RotateZ,
    mat4TransformPoint,
    mat4Translate,
    vec3Normalize,
} from '../math';

import type {
    Matrix4,
    ProjectedPoint,
    Vector3,
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

import type {
    BaseElementState,
    ColorRGBA,
    Context,
    ContextPath,
    ElementIntersectionOptions,
    ElementOptions,
} from '@ripl/core';

import {
    functionCache,
    numberSum,
} from '@ripl/utilities';

import type {
    CachedFunction,
} from '@ripl/utilities';

/** A single face of a 3D mesh, defined by its vertices and an optional precomputed normal. */
export interface Face3D {
    vertices: Vector3[];
    normal?: Vector3;
}

/** A projected face ready for 2D rendering with screen-space points, fill/stroke styles, and depth. */
export interface ProjectedFace3D {
    points: ProjectedPoint[];
    fillColor: string;
    strokeStyle: string | undefined;
    lineWidth: number | undefined;
    depth: number;
}

/** State interface for a 3D shape, defining position and rotation around each axis. */
export interface Shape3DState extends BaseElementState {
    x: number;
    y: number;
    z: number;
    rotationX: number;
    rotationY: number;
    rotationZ: number;
}

/** Options for constructing a 3D shape, with all state properties optional. */
export type Shape3DOptions<TState extends Shape3DState = Shape3DState> = Partial<Omit<ElementOptions<TState>, 'zIndex'>>;

/** Base class for 3D shapes, handling model transforms, face projection, shading, and hit testing. */
export class Shape3D<TState extends Shape3DState = Shape3DState> extends Shape<TState> {

    protected hitPath?: ContextPath;

    private _depth = 0;
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

    public override get zIndex(): number {
        return -this._depth;
    }

    public override set zIndex(_value: number) {
        console.warn('Setting zIndex will have no impact this element. 3D shapes derive zIndex from projected depth.');
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

    /** Returns the projected depth of this shape's origin in the given 3D context. */
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
        const baseFillStyle = this.fill || '#888888';
        const baseRGBA = parseColor(baseFillStyle) as ColorRGBA;
        const matrix = this.getModelMatrix();

        this.context = context;
        this.hitPath = undefined;

        // GPU path: submit raw mesh data via the context's submitMesh method
        ctx.submitMesh({
            vertices: triangulateFacesFlat(faces, baseRGBA),
            indices: triangulateFacesIndices(faces),
            modelMatrix: matrix,
            normalMatrix: matrix, // Valid when model has no non-uniform scale
        });

        const hitPath = ctx.createPath(`${this.id}:hit`);

        // Canvas 2D path: project faces on CPU and push to faceBuffer
        if (ctx instanceof CanvasContext3D) {
            const normalizedLight = vec3Normalize(ctx.getLightDirectionForRender());

            let totalDepth = 0;

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
                    strokeStyle: this.stroke,
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
            this._depth = faces.length > 0
                ? totalDepth / faces.length
                : 0;

            return;
        }

        // Non-canvas path (e.g. WebGPU): build 2D hit path from projected vertices for CPU-side interaction
        for (const face of faces) {
            const transformed = this.transformVertices(face.vertices, matrix);
            const points = transformed.map(vertex => ctx.project(vertex));

            hitPath.moveTo(points[0][0], points[0][1]);

            for (let idx = 1; idx < points.length; idx++) {
                hitPath.lineTo(points[idx][0], points[idx][1]);
            }

            hitPath.closePath();
        }

        this.hitPath = hitPath;
        this._depth = ctx.project([this.x, this.y, this.z])[2];
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

function computeTriangleNormal(a: Vector3, b: Vector3, c: Vector3): Vector3 {
    const ux = b[0] - a[0];
    const uy = b[1] - a[1];
    const uz = b[2] - a[2];
    const vx = c[0] - a[0];
    const vy = c[1] - a[1];
    const vz = c[2] - a[2];

    const nx = uy * vz - uz * vy;
    const ny = uz * vx - ux * vz;
    const nz = ux * vy - uy * vx;

    const len = Math.sqrt(nx * nx + ny * ny + nz * nz);

    if (len === 0) {
        return [0, 1, 0];
    }

    return [nx / len, ny / len, nz / len];
}

function triangulateFacesFlat(faces: Face3D[], color: ColorRGBA): Float32Array {
    let vertexCount = 0;

    for (const face of faces) {
        vertexCount += face.vertices.length;
    }

    const data = new Float32Array(vertexCount * 10);
    const cr = color[0] / 255;
    const cg = color[1] / 255;
    const cb = color[2] / 255;
    const ca = color[3];

    let offset = 0;

    for (const face of faces) {
        const verts = face.vertices;
        const normal = face.normal ?? computeTriangleNormal(verts[0], verts[1], verts[2]);

        for (const vertex of verts) {
            data[offset++] = vertex[0];
            data[offset++] = vertex[1];
            data[offset++] = vertex[2];
            data[offset++] = normal[0];
            data[offset++] = normal[1];
            data[offset++] = normal[2];
            data[offset++] = cr;
            data[offset++] = cg;
            data[offset++] = cb;
            data[offset++] = ca;
        }
    }

    return data;
}

function triangulateFacesIndices(faces: Face3D[]): Uint32Array {
    let indexCount = 0;

    for (const face of faces) {
        indexCount += (face.vertices.length - 2) * 3;
    }

    const indices = new Uint32Array(indexCount);
    let ii = 0;
    let baseIndex = 0;

    for (const face of faces) {
        for (let t = 0; t < face.vertices.length - 2; t++) {
            indices[ii++] = baseIndex;
            indices[ii++] = baseIndex + t + 1;
            indices[ii++] = baseIndex + t + 2;
        }

        baseIndex += face.vertices.length;
    }

    return indices;
}

/** Factory function that creates a new `Shape3D` instance. */
export function createShape3D(...options: ConstructorParameters<typeof Shape3D>) {
    return new Shape3D(...options);
}

/** Type guard that checks whether a value is a `Shape3D` instance. */
export function elementIsShape3D(value: unknown): value is Shape3D {
    return value instanceof Shape3D;
}