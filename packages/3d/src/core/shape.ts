import {
    contextIsContext3D,
} from './context';

import type {
    Context3D,
} from './context';

import {
    mat4Identity,
    mat4RotateX,
    mat4RotateY,
    mat4RotateZ,
    mat4TransformDirection,
    mat4TransformPoint,
    mat4Translate,
    vec3Normalize,
    vec3TriangleNormal,
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
} from './shading';

import {
    DEFAULT_SURFACE_COLOR,
    resolveColor,
    rgbToUnit,
} from './color';

import {
    Box,
    Shape,
} from '@ripl/core';

import type {
    BaseElementState,
    ColorRGBA,
    Context,
    ContextPath,
    ElementInterpolationState,
    ElementInterpolators,
    ElementIntersectionOptions,
    ElementOptions,
    Interpolator,
    LineCap,
    LineJoin,
    Matrix,
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
    /** The face's vertices in local (model) space, ordered counter-clockwise when viewed from the front. */
    vertices: Vector3[];
    /** The precomputed surface normal. When omitted, it is derived from the first three vertices. */
    normal?: Vector3;
}

/**
 * The 2D drawing state resolved for an element at the moment its faces were projected.
 *
 * A CPU-rendered face is buffered and painted at the end of the frame, long after the element's
 * own `restore()` has unwound everything it applied, so the state has to travel with the face.
 */
export interface ProjectedFaceState3D {
    /** The accumulated alpha: the element's own opacity composited under every ancestor group's. */
    opacity: number;
    /** The compositing operation in effect. */
    globalCompositeOperation: unknown;
    /** The filter in effect. */
    filter: string;
    /** The shadow blur radius in effect. */
    shadowBlur: number;
    /** The shadow color in effect. */
    shadowColor: string;
    /** The horizontal shadow offset in effect. */
    shadowOffsetX: number;
    /** The vertical shadow offset in effect. */
    shadowOffsetY: number;
    /** The line cap in effect for stroked face edges. */
    lineCap: LineCap;
    /** The line join in effect for stroked face edges. */
    lineJoin: LineJoin;
    /** The line dash pattern in effect for stroked face edges. */
    lineDash: number[];
    /** The line dash offset in effect for stroked face edges. */
    lineDashOffset: number;
    /** The miter limit in effect for stroked face edges. */
    miterLimit: number;
    /** The element's composed 2D world transform, or `null` when it is the identity. */
    transform: Matrix | null;
}

/** A projected face ready for 2D rendering with screen-space points, fill/stroke styles, and depth. */
export interface ProjectedFace3D {
    /** The face's screen-space points, each carrying a depth component. */
    points: ProjectedPoint[];
    /** The shaded fill color applied to the face. */
    fillColor: string;
    /** The stroke style applied to the face edges, if any. */
    strokeStyle: string | undefined;
    /** The stroke line width, if any. */
    lineWidth: number | undefined;
    /** The average projected depth of the face, used for back-to-front sorting. */
    depth: number;
    /**
     * The drawing state to paint the face with, captured when it was projected. Faces sharing one
     * state object are painted in a single scope, so identity matters. Absent when the context
     * does not defer its face drawing.
     */
    state?: ProjectedFaceState3D;
}

/** State interface for a 3D shape, defining position and rotation around each axis. */
export interface Shape3DState extends BaseElementState {
    /** The X position of the shape's origin in world space. */
    x: number;
    /** The Y position of the shape's origin in world space. */
    y: number;
    /** The Z position of the shape's origin in world space. */
    z: number;
    /** The rotation around the X axis, in radians. */
    rotationX: number;
    /** The rotation around the Y axis, in radians. */
    rotationY: number;
    /** The rotation around the Z axis, in radians. */
    rotationZ: number;
}

/** Options for constructing a 3D shape, with all state properties optional. */
export type Shape3DOptions<TState extends Shape3DState = Shape3DState> = Partial<Omit<ElementOptions<TState>, 'zIndex'>>;

// The GPU mesh needs numeric channels, so an unparseable fill degrades to the default grey there.
const DEFAULT_MESH_COLOR = resolveColor(DEFAULT_SURFACE_COLOR)!;

/**
 * Pointer hit-test strategy per `pointerEvents` mode. Modes not listed here (e.g. `all`) fall back
 * to testing both fill and stroke.
 */
const POINTER_EVENT_HIT_TESTS: Record<string, (context: Context, path: ContextPath, x: number, y: number) => boolean> = {
    none: () => false,
    stroke: (context, path, x, y) => !!context.isPointInStroke(path, x, y),
    fill: (context, path, x, y) => !!context.isPointInPath(path, x, y),
};

/** Base class for 3D shapes, handling model transforms, face projection, shading, and hit testing. */
export class Shape3D<TState extends Shape3DState = Shape3DState> extends Shape<TState> {

    protected hitPath?: ContextPath;

    private _depth = 0;
    private _getCachedFaces: CachedFunction<() => Face3D[]>;
    private _hitFaceCount = 0;
    private _hitFaceOffsets = new Uint32Array(0);

    // Reused across frames and overwritten in place, so a frame no one hit-tests allocates nothing.
    private _hitPoints = new Float32Array(0);

    // Not `_hitFaceCount > 0`: a rendered shape with no faces hit-tests as an empty path, not a box.
    private _hasHitGeometry = false;

    /** The X position of the shape's origin in world space. */
    public get x() {
        return this.getStateValue('x');
    }

    public set x(value) {
        this.setStateValue('x', value);
    }

    /** The Y position of the shape's origin in world space. */
    public get y() {
        return this.getStateValue('y');
    }

    public set y(value) {
        this.setStateValue('y', value);
    }

    /** The Z position of the shape's origin in world space. */
    public get z() {
        return this.getStateValue('z');
    }

    public set z(value) {
        this.setStateValue('z', value);
    }

    /** The rotation around the X axis, in radians. */
    public get rotationX() {
        return this.getStateValue('rotationX');
    }

    public set rotationX(value) {
        this.setStateValue('rotationX', value);
    }

    /** The rotation around the Y axis, in radians. */
    public get rotationY() {
        return this.getStateValue('rotationY');
    }

    public set rotationY(value) {
        this.setStateValue('rotationY', value);
    }

    /** The rotation around the Z axis, in radians. */
    public get rotationZ() {
        return this.getStateValue('rotationZ');
    }

    public set rotationZ(value) {
        this.setStateValue('rotationZ', value);
    }

    /**
     * The stacking order, derived from the depth of the shape's **nearest projected face** — the
     * one the painter's algorithm draws last, so a hit test resolves to the shape whose geometry is
     * actually on top. Not settable on 3D shapes.
     */
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

        this._getCachedFaces = functionCache(() => this.computeFaces());
    }

    protected override setStateValue<TKey extends keyof TState>(key: TKey, value: TState[TKey]) {
        super.setStateValue(key, value);
        this._getCachedFaces.invalidate();
    }

    /**
     * Creates an interpolator that transitions from the current state towards the target state,
     * invalidating this shape's cached geometry on every tick.
     *
     * The base tick writes straight to the state bag, which is the one path that bypasses
     * {@link Shape3D}'s `setStateValue` override — the face cache's only invalidation hook. Without
     * this a transition on a geometry property (`size`, `radius`, `segments`, …) finished with the
     * new state value but the mesh still built from the old one.
     */
    public override interpolate(
        newState: Partial<ElementInterpolationState<TState>>,
        interpolators: Partial<ElementInterpolators<TState>> = {}
    ): Interpolator<void> {
        const tick = super.interpolate(newState, interpolators);

        return time => {
            tick(time);
            this._getCachedFaces.invalidate();
        };
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

    // The box is projected through the context's camera, which no element state version can see.
    protected override get _boundsCacheable(): boolean {
        return false;
    }

    public _getLocalBoundingBox(): Box {
        const context = this.context as Context3D | undefined;

        if (!context) {
            return new Box(0, 0, 0, 0);
        }

        const faces = this._getCachedFaces();
        const matrix = this.getModelMatrix();

        // Accumulated in one pass rather than via numberMinOf/numberMaxOf: this projects every
        // vertex of every face, and materialising the points first would cost four extra passes.
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
        if (!contextIsContext3D(context)) {
            throw new Error(`Cannot render <${this.type}> into a "${context.type}" context: a Shape3D needs a Context3D for projection, lighting and mesh submission. Create the scene with createContext from @ripl/3d or @ripl/webgpu.`);
        }

        super.render(context, () => {
            const faces = this._getCachedFaces();
            const baseFillStyle = this.fill || DEFAULT_SURFACE_COLOR;
            const baseRGBA = resolveColor(baseFillStyle);
            const matrix = this.getModelMatrix();

            // The projection moves every frame, so any built path is dropped and rebuilt on demand.
            this.hitPath = undefined;
            this._hasHitGeometry = false;

            if (context.renderStrategy !== 'gpu') {
                return this._renderCPU(context, faces, baseRGBA, baseFillStyle, matrix);
            }

            context.submitMesh({
                vertices: triangulateFacesFlat(faces, baseRGBA ?? DEFAULT_MESH_COLOR),
                indices: triangulateFacesIndices(faces),
                modelMatrix: matrix,
                normalMatrix: matrix, // Valid when model has no non-uniform scale
            });

            this._renderGPU(context, faces, matrix);
        });
    }

    // No back-face culling, matching the GPU pipeline's `cullMode: 'none'`: a face's winding is
    // whatever the element author emitted, and rejecting on it would silently drop geometry from
    // any shape that is not a closed, consistently wound solid. The cost is that every face of a
    // closed shape is filled, and with `fill` alpha below 1 the hidden ones bleed through.
    private _renderCPU(context: Context3D, faces: Face3D[], baseRGBA: ColorRGBA | undefined, baseFillStyle: string, matrix: Matrix4): void {
        const normalizedLight = vec3Normalize(context.getLightDirectionForRender());

        // One capture per shape: the flush groups faces by state identity, so sharing it is load-bearing.
        const state = context.captureFaceState(this.getWorldTransform());

        this._resetHitGeometry(faces);

        let nearestDepth = Infinity;
        let hitCursor = 0;
        let hitFace = 0;

        for (const face of faces) {
            const transformed = this.transformVertices(face.vertices, matrix);
            const normal = face.normal
                ? vec3Normalize(mat4TransformDirection(matrix, face.normal))
                : computeFaceNormal(transformed);
            const brightness = computeFaceBrightness(normal, normalizedLight, true);
            const fillColor = baseRGBA ? shadeFaceColor(baseRGBA, 0.3 + brightness * 0.7) : baseFillStyle;
            const points = transformed.map(vertex => context.project(vertex));
            const depth = numberSum(points, p => p[2]) / points.length;

            nearestDepth = Math.min(nearestDepth, depth);

            context.faceBuffer.push({
                points,
                fillColor,
                strokeStyle: this.stroke,
                lineWidth: this.lineWidth,
                depth,
                state,
            });

            hitCursor = this._writeFaceHitPoints(hitFace++, hitCursor, points);
        }

        this._hasHitGeometry = true;
        this._depth = isFinite(nearestDepth) ? nearestDepth : 0;
    }

    // Redundant-looking on a backend that holds the geometry, but it is the only source of `_depth`.
    private _renderGPU(context: Context3D, faces: Face3D[], matrix: Matrix4): void {
        this._resetHitGeometry(faces);

        let nearestDepth = Infinity;
        let hitCursor = 0;
        let hitFace = 0;

        for (const face of faces) {
            const transformed = this.transformVertices(face.vertices, matrix);
            const points = transformed.map(vertex => context.project(vertex));

            nearestDepth = Math.min(nearestDepth, numberSum(points, p => p[2]) / points.length);

            hitCursor = this._writeFaceHitPoints(hitFace++, hitCursor, points);
        }

        this._hasHitGeometry = true;
        this._depth = isFinite(nearestDepth) ? nearestDepth : 0;
    }

    private _resetHitGeometry(faces: Face3D[]): void {
        const coordinateCount = numberSum(faces, face => face.vertices.length) * 2;

        if (this._hitPoints.length < coordinateCount) {
            this._hitPoints = new Float32Array(coordinateCount);
        }

        if (this._hitFaceOffsets.length < faces.length + 1) {
            this._hitFaceOffsets = new Uint32Array(faces.length + 1);
        }

        this._hitFaceCount = faces.length;
    }

    private _writeFaceHitPoints(faceIndex: number, offset: number, points: ProjectedPoint[]): number {
        const buffer = this._hitPoints;

        let cursor = offset;

        for (const point of points) {
            buffer[cursor++] = point[0];
            buffer[cursor++] = point[1];
        }

        this._hitFaceOffsets[faceIndex] = offset;
        this._hitFaceOffsets[faceIndex + 1] = cursor;

        return cursor;
    }

    private _getHitPath(): ContextPath | undefined {
        if (!this._hasHitGeometry || !this.context) {
            return undefined;
        }

        return this.hitPath ??= this._buildHitPath(this.context);
    }

    private _buildHitPath(context: Context): ContextPath {
        const hitPath = context.createPath(`${this.id}:hit`);
        const offsets = this._hitFaceOffsets;

        for (let idx = 0; idx < this._hitFaceCount; idx++) {
            this._traceFaceHitPath(hitPath, offsets[idx], offsets[idx + 1]);
        }

        return hitPath;
    }

    private _traceFaceHitPath(hitPath: ContextPath, start: number, end: number): void {
        const points = this._hitPoints;

        hitPath.moveTo(points[start], points[start + 1]);

        for (let idx = start + 2; idx < end; idx += 2) {
            hitPath.lineTo(points[idx], points[idx + 1]);
        }

        hitPath.closePath();
    }

    /**
     * Tests whether a point intersects this shape's projected silhouette.
     *
     * The hit path is traced from {@link Context3D.project}, which already emits logical
     * coordinates, so the point needs no mapping — unlike {@link Shape2D}, whose path is local.
     *
     * @param x - X coordinate in logical space (CSS pixels relative to the context's top-left), the same space pointer event payloads report.
     * @param y - Y coordinate in logical space (CSS pixels relative to the context's top-left).
     * @param options - Hit-testing options, such as whether the test originates from a pointer event.
     * @returns Whether the point lies within the shape's projected faces, honoring its pointer-event region.
     */
    public intersectsWith(x: number, y: number, options?: Partial<ElementIntersectionOptions>) {
        const context = this.context;
        const hitPath = this._getHitPath();

        if (!context || !hitPath) {
            return super.intersectsWith(x, y, options);
        }

        const {
            isPointer = false,
        } = options || {};

        const isAnyIntersecting = () => (
            context.isPointInStroke(hitPath, x, y) ||
            context.isPointInPath(hitPath, x, y)
        );

        if (!isPointer) {
            return isAnyIntersecting();
        }

        const hitTest = POINTER_EVENT_HIT_TESTS[this.pointerEvents];

        return hitTest
            ? hitTest(context, hitPath, x, y)
            : isAnyIntersecting();
    }

}

function triangulateFacesFlat(faces: Face3D[], color: ColorRGBA): Float32Array {
    const data = new Float32Array(numberSum(faces, face => face.vertices.length) * 10);
    const [cr, cg, cb] = rgbToUnit(color);
    const ca = color[3];

    let offset = 0;

    for (const face of faces) {
        const verts = face.vertices;
        const normal = face.normal ?? vec3TriangleNormal(verts[0], verts[1], verts[2]);

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