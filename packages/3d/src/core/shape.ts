import {
    contextIsContext3D,
} from './context';

import type {
    Context3D,
} from './context';

import {
    mat4Compose,
    mat4Multiply,
    mat4NormalMatrix,
    mat4TransformDirection,
    mat4TransformPoint,
    rayAt,
    rayHitBarycentric,
    rayIntersectsBox,
    rayIntersectTriangle,
    rayIntersectTriangleBuffer,
    vec3Length,
    vec3Normalize,
    vec3Sub,
    vec3TriangleNormal,
} from '../math';

import type {
    Matrix4,
    ProjectedPoint,
    Ray,
    RayTriangleHit,
    Vector2,
    Vector3,
} from '../math';

import {
    composeSurfaceColor,
    computeFaceNormal,
    createSurfaceIllumination,
    shadeSurface,
} from './shading';

import {
    materialDrawsFace,
    resolveMaterial,
} from './material';

// Imported for its registration side effect, which every 3D element depends on for animation.
import './interpolators';

import type {
    Material,
    ResolvedMaterial,
} from './material';

import type {
    Texture,
} from './texture';

import {
    DEFAULT_SURFACE_COLOR,
    resolveColor,
    rgbToUnit,
} from './color';

import {
    Box,
    interpolateNumber,
    matrixApplyToPoint,
    matrixInvert,
    Shape,
} from '@ripl/core';

import type {
    BaseElementState,
    ColorRGBA,
    Context,
    Element,
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
    /**
     * Per-vertex normals, parallel to {@link vertices}, enabling smooth shading.
     *
     * The GPU interpolates these across the face. The CPU painter can only fill a flat polygon, so
     * it shades from their average — closer to the true surface than the face normal, but still one
     * colour per face.
     */
    normals?: Vector3[];
    /**
     * Per-vertex colours, parallel to {@link vertices}, used when the material sets `vertexColors`.
     *
     * The GPU interpolates these across the face; the CPU painter averages them, so a mesh relying
     * on this wants enough subdivision that each face is close to one colour.
     */
    colors?: string[];
    /** Per-vertex texture coordinates, parallel to {@link vertices}, used when the material has a `map`. */
    uvs?: Vector2[];
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
    /** The shaded fill color applied to the face, or `undefined` when the material is a wireframe. */
    fillColor: string | undefined;
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
    /** The texture to map across the face, if the material has one and the face carries UVs. */
    texture?: Texture;
    /** The face's texture coordinates, parallel to {@link points}. */
    uvs?: Vector2[];
}

/** Options for a raycast against 3D geometry. */
export interface Raycast3DOptions {
    /** Whether a triangle met from behind counts as a hit. Defaults to `true`, matching the unculled render. */
    backFaces?: boolean;
}

/** Where a ray met a shape's geometry. */
export interface Intersection3D {
    /** The shape that was hit. */
    element: Shape3D;
    /** Distance along the ray, in world units. */
    distance: number;
    /** The world-space point of the hit. */
    point: Vector3;
    /** The face that was hit. */
    face: Face3D;
    /** The index of the hit face within the shape's face list. */
    faceIndex: number;
    /** Whether the triangle was met from behind. */
    backFacing: boolean;
    /** The world-space surface normal at the hit, interpolated when the face carries vertex normals. */
    normal: Vector3;
    /** The texture coordinate at the hit, when the face carries UVs. */
    uv: Vector2 | undefined;
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
    /** The scale along the X axis. */
    scaleX: number;
    /** The scale along the Y axis. */
    scaleY: number;
    /** The scale along the Z axis. */
    scaleZ: number;
    /** How the surface responds to light. When omitted, the element shades from its `fill` alone. */
    material?: Material;
}

/** Options for constructing a 3D shape, with all state properties optional. */
export type Shape3DOptions<TState extends Shape3DState = Shape3DState> = Partial<Omit<ElementOptions<TState>, 'zIndex'>> & {
    /** A uniform scale, applied to all three axes. Overridden by any per-axis scale also given. */
    scale?: number;
};

// The GPU mesh needs numeric channels, so an unparseable fill degrades to the default grey there.
const DEFAULT_MESH_COLOR = resolveColor(DEFAULT_SURFACE_COLOR)!;

/**
 * Floats per interleaved vertex: position(3), normal(3), colour(4), uv(2).
 *
 * The GPU backend derives its vertex stride from this, so the two cannot disagree about the layout
 * {@link triangulateFacesFlat} writes.
 */
export const VERTEX_FLOATS = 12;

/** Base class for 3D shapes, handling model transforms, face projection, shading, and hit testing. */
export class Shape3D<TState extends Shape3DState = Shape3DState> extends Shape<TState> {

    private _depth = 0;
    private _getCachedFaces: CachedFunction<() => Face3D[]>;
    private _hitFaceCount = 0;
    private _hitFaceOffsets = new Uint32Array(0);

    // World-space vertices of the faces this frame actually drew, three floats each. The painter
    // already transforms every vertex and used to throw the result away; retaining it is what makes
    // a per-pointer-move raycast affordable. Reused across frames and overwritten in place.
    private _hitVertices = new Float64Array(0);

    // The world-space AABB of the same vertices, as [minX, minY, minZ, maxX, maxY, maxZ]. Free to
    // accumulate while writing them, and it rejects most of an assembly before any triangle work.
    private _hitBounds = new Float64Array(6);

    // Not `_hitFaceCount > 0`: a rendered shape with no faces hit-tests as empty, not as a box.
    private _hasHitGeometry = false;

    // One raycast per pointer position: `hitTest` asks whether each candidate is hit and then asks
    // again for the distance to rank it, and a pointer move is one hit test per animation frame.
    private _hitQueryX = NaN;
    private _hitQueryY = NaN;
    private _hitQueryDistance = -1;

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

    /** The scale along the X axis. */
    public get scaleX() {
        return this.getStateValue('scaleX');
    }

    public set scaleX(value) {
        this.setStateValue('scaleX', value);
    }

    /** The scale along the Y axis. */
    public get scaleY() {
        return this.getStateValue('scaleY');
    }

    public set scaleY(value) {
        this.setStateValue('scaleY', value);
    }

    /** The scale along the Z axis. */
    public get scaleZ() {
        return this.getStateValue('scaleZ');
    }

    public set scaleZ(value) {
        this.setStateValue('scaleZ', value);
    }

    /**
     * The uniform scale, when all three axes agree.
     *
     * Reads back the X scale, so a shape scaled non-uniformly reports only that axis. Writing sets
     * all three.
     */
    public get scale() {
        return this.getStateValue('scaleX');
    }

    public set scale(value) {
        this.setStateValue('scaleX', value);
        this.setStateValue('scaleY', value);
        this.setStateValue('scaleZ', value);
    }

    /**
     * How the surface responds to light.
     *
     * Read as a plain value rather than observed, so assign a new object to change it — mutating
     * the existing one in place will not repaint.
     */
    public get material() {
        return this.getStateValue('material');
    }

    public set material(value) {
        this.setStateValue('material', value);
    }

    /**
     * The stacking order, derived from the depth of the shape's **nearest projected face** — the one
     * the painter's algorithm draws last. Not settable on 3D shapes, and not what hit testing ranks
     * by: {@link Context3D} casts a ray and ranks by the distance to the geometry itself, which no
     * per-shape scalar can reproduce for interleaved parts.
     */
    public override get zIndex(): number {
        return -this._depth;
    }

    public override set zIndex(_value: number) {
        console.warn('Setting zIndex will have no impact this element. 3D shapes derive zIndex from projected depth.');
    }

    constructor(type: string, options: Shape3DOptions<TState>) {
        const {
            scale = 1,
            interpolators,
            ...rest
        } = options;

        super(type, {
            x: 0,
            y: 0,
            z: 0,
            rotationX: 0,
            rotationY: 0,
            rotationZ: 0,
            scaleX: scale,
            scaleY: scale,
            scaleZ: scale,
            interpolators: {
                x: interpolateNumber,
                y: interpolateNumber,
                z: interpolateNumber,
                rotationX: interpolateNumber,
                rotationY: interpolateNumber,
                rotationZ: interpolateNumber,
                scaleX: interpolateNumber,
                scaleY: interpolateNumber,
                scaleZ: interpolateNumber,
                ...interpolators,
            },
            ...rest,
        } as unknown as ElementOptions<TState>);

        this._getCachedFaces = functionCache(() => this.computeFaces());
    }

    protected override setStateValue<TKey extends keyof TState>(key: TKey, value: TState[TKey]) {
        super.setStateValue(key, value);

        // A material only changes how the geometry is shaded, so rebuilding the mesh for it would
        // put every tessellator on the path of a colour tweak.
        if (key !== 'material') {
            this._getCachedFaces.invalidate();
        }
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
        const local = mat4Compose(
            [this.x, this.y, this.z],
            [this.rotationX, this.rotationY, this.rotationZ],
            [this.scaleX, this.scaleY, this.scaleZ]
        );
        const parent = this.getParentMatrix3D();

        return parent ? mat4Multiply(parent, local) : local;
    }

    // Only a Group3D answers, so a shape under a plain 2D group keeps behaving as it always has.
    protected getParentMatrix3D(): Matrix4 | null {
        let node = this.parent as { parent?: unknown;
            getGroupMatrix3D?: () => Matrix4; } | undefined;
        let matrix: Matrix4 | null = null;

        while (node) {
            const groupMatrix = node.getGroupMatrix3D?.();

            if (groupMatrix) {
                matrix = matrix ? mat4Multiply(groupMatrix, matrix) : groupMatrix;
            }

            node = node.parent as typeof node;
        }

        return matrix;
    }

    protected transformVertices(vertices: Vector3[], matrix?: Matrix4): Vector3[] {
        const mat = matrix ?? this.getModelMatrix();

        return vertices.map(vertex => mat4TransformPoint(mat, vertex));
    }

    /**
     * Intersects a world-space ray with this shape's geometry.
     *
     * {@link intersectsWith} answers only whether the pointer is over the shape; this reports where
     * the ray met it, on which face, and at what texture coordinate. It also works before the shape
     * has rendered, and against any ray rather than one through a pointer position.
     *
     * @param ray - The world-space ray to cast.
     * @param options - Whether to accept back-facing hits.
     * @returns The nearest intersection, or `null` when the ray misses.
     */
    public raycast(ray: Ray, options?: Raycast3DOptions): Intersection3D | null {
        const matrix = this.getModelMatrix();
        const normalMatrix = mat4NormalMatrix(matrix);
        const backFaces = options?.backFaces ?? true;
        const faces = this._getCachedFaces();

        let nearest: Intersection3D | null = null;
        let faceIndex = 0;

        for (const face of faces) {
            const vertices = this.transformVertices(face.vertices, matrix);

            // Fan-triangulated to match how the face is drawn, so a hit and a fill agree.
            for (let corner = 1; corner < vertices.length - 1; corner++) {
                const hit = rayIntersectTriangle(ray, vertices[0], vertices[corner], vertices[corner + 1]);

                if (!hit || (!backFaces && hit.backFacing)) {
                    continue;
                }

                if (nearest && hit.distance >= nearest.distance) {
                    continue;
                }

                nearest = {
                    element: this,
                    distance: hit.distance,
                    point: rayAt(ray, hit.distance),
                    face,
                    faceIndex,
                    backFacing: hit.backFacing,
                    normal: resolveHitNormal(face, vertices, corner, hit, normalMatrix),
                    uv: face.uvs
                        ? rayHitBarycentric<Vector2>(hit, face.uvs[0], face.uvs[corner], face.uvs[corner + 1])
                        : undefined,
                };
            }

            faceIndex++;
        }

        return nearest;
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
            const material = resolveMaterial(this.material, this.fill);
            const matrix = this.getModelMatrix();

            // The camera moves every frame, so the retained hit geometry and any memoized pointer
            // query belong to the frame that wrote them and nothing later.
            this._hasHitGeometry = false;
            this._hitQueryX = NaN;
            this._hitQueryY = NaN;

            if (context.renderStrategy !== 'gpu') {
                return this._renderCPU(context, faces, material, matrix);
            }

            context.submitMesh({
                vertices: triangulateFacesFlat(faces, material),
                indices: triangulateFacesIndices(faces),
                modelMatrix: matrix,
                normalMatrix: mat4NormalMatrix(matrix),
                material,
            });

            this._renderGPU(context, faces, material, matrix);
        });
    }

    // Culling is decided per face from the projected signed area, so a material that leaves `side`
    // at its default draws every face exactly as the unculled model did — including the hidden ones
    // of a closed shape, which bleed through when `fill` alpha is below 1.
    private _renderCPU(context: Context3D, faces: Face3D[], material: ResolvedMaterial, matrix: Matrix4): void {
        const lights = context.resolveLights();
        const illumination = createSurfaceIllumination();
        const cameraPosition = context.cameraPosition;
        const normalMatrix = mat4NormalMatrix(matrix);
        const fog = context.resolvedFog;

        // One capture per shape: the flush groups faces by state identity, so sharing it is load-bearing.
        const state = context.captureFaceState(this.getWorldTransform());

        this._resetHitGeometry(faces);

        let nearestDepth = Infinity;
        let hitCursor = 0;
        let hitFace = 0;

        for (const face of faces) {
            const transformed = this.transformVertices(face.vertices, matrix);
            const points = transformed.map(vertex => context.project(vertex));

            // A culled face is neither painted nor hit: what the pointer resolves to is what the
            // frame drew, so the two cannot disagree about which side of a mesh is there.
            if (!materialDrawsFace(material.side, projectedSignedArea(points))) {
                continue;
            }

            const normal = resolveFaceNormal(face, transformed, normalMatrix, material.flatShading);
            const centroid = faceCentroid(transformed);
            const baseColor = resolveFaceColor(face, material);
            const fillColor = baseColor
                ? composeSurfaceColor(
                    baseColor,
                    shadeSurface(
                        normal,
                        centroid,
                        vec3Normalize(vec3Sub(cameraPosition, centroid)),
                        material.surface,
                        lights,
                        illumination
                    ),
                    fog,
                    fog ? vec3Length(vec3Sub(cameraPosition, centroid)) : 0
                )
                : material.colorStyle;
            const depth = numberSum(points, p => p[2]) / points.length;

            nearestDepth = Math.min(nearestDepth, depth);

            context.faceBuffer.push({
                points,
                fillColor: material.wireframe ? undefined : fillColor,
                strokeStyle: material.wireframe ? this.stroke ?? fillColor : this.stroke,
                lineWidth: this.lineWidth,
                depth,
                state,
                texture: !material.wireframe && face.uvs ? material.map : undefined,
                uvs: face.uvs,
            });

            hitCursor = this._writeFaceHitVertices(hitFace++, hitCursor, transformed);
        }

        this._hitFaceCount = hitFace;
        this._hasHitGeometry = true;
        this._depth = isFinite(nearestDepth) ? nearestDepth : 0;
    }

    // Redundant-looking on a backend that holds the geometry, but it is the only source of `_depth`
    // and of the world-space vertices a pointer raycast reads.
    private _renderGPU(context: Context3D, faces: Face3D[], material: ResolvedMaterial, matrix: Matrix4): void {
        this._resetHitGeometry(faces);

        let nearestDepth = Infinity;
        let hitCursor = 0;
        let hitFace = 0;

        for (const face of faces) {
            const transformed = this.transformVertices(face.vertices, matrix);
            const points = transformed.map(vertex => context.project(vertex));

            if (!materialDrawsFace(material.side, projectedSignedArea(points))) {
                continue;
            }

            nearestDepth = Math.min(nearestDepth, numberSum(points, p => p[2]) / points.length);

            hitCursor = this._writeFaceHitVertices(hitFace++, hitCursor, transformed);
        }

        this._hitFaceCount = hitFace;
        this._hasHitGeometry = true;
        this._depth = isFinite(nearestDepth) ? nearestDepth : 0;
    }

    private _resetHitGeometry(faces: Face3D[]): void {
        const componentCount = numberSum(faces, face => face.vertices.length) * 3;

        if (this._hitVertices.length < componentCount) {
            this._hitVertices = new Float64Array(componentCount);
        }

        if (this._hitFaceOffsets.length < faces.length + 1) {
            this._hitFaceOffsets = new Uint32Array(faces.length + 1);
        }

        this._hitFaceCount = 0;
        this._hitBounds[0] = Infinity;
        this._hitBounds[1] = Infinity;
        this._hitBounds[2] = Infinity;
        this._hitBounds[3] = -Infinity;
        this._hitBounds[4] = -Infinity;
        this._hitBounds[5] = -Infinity;
    }

    private _writeFaceHitVertices(faceIndex: number, offset: number, vertices: Vector3[]): number {
        const buffer = this._hitVertices;
        const bounds = this._hitBounds;

        let cursor = offset;

        for (const vertex of vertices) {
            buffer[cursor++] = vertex[0];
            buffer[cursor++] = vertex[1];
            buffer[cursor++] = vertex[2];

            bounds[0] = Math.min(bounds[0], vertex[0]);
            bounds[1] = Math.min(bounds[1], vertex[1]);
            bounds[2] = Math.min(bounds[2], vertex[2]);
            bounds[3] = Math.max(bounds[3], vertex[0]);
            bounds[4] = Math.max(bounds[4], vertex[1]);
            bounds[5] = Math.max(bounds[5], vertex[2]);
        }

        this._hitFaceOffsets[faceIndex] = offset;
        this._hitFaceOffsets[faceIndex + 1] = cursor;

        return cursor;
    }

    // Fan-triangulated to match how the face was drawn, so a hit and a fill agree.
    private _raycastHitGeometry(ray: Ray): number {
        if (!rayIntersectsBox(ray, this._hitBounds)) {
            return -1;
        }

        const vertices = this._hitVertices;
        const offsets = this._hitFaceOffsets;

        let nearest = -1;

        for (let face = 0; face < this._hitFaceCount; face++) {
            const start = offsets[face];
            const end = offsets[face + 1];

            for (let corner = start + 3; corner + 6 <= end; corner += 3) {
                const distance = rayIntersectTriangleBuffer(ray, vertices, start, corner, corner + 3);

                if (distance >= 0 && (nearest < 0 || distance < nearest)) {
                    nearest = distance;
                }
            }
        }

        return nearest;
    }

    /**
     * The distance along the pointer ray at which this shape is hit, or `null` when it is missed.
     *
     * {@link intersectsWith} can only answer whether a shape was hit, and a scene painted with a
     * global depth sort needs to know which hit is nearest to say which shape the pointer is really
     * on. {@link Context3D} ranks its hits with this; the result is memoized per pointer position,
     * so asking twice costs one raycast.
     *
     * @param x - X coordinate in logical space (CSS pixels relative to the context's top-left).
     * @param y - Y coordinate in logical space (CSS pixels relative to the context's top-left).
     * @returns The world-space distance to the nearest hit, or `null` when the shape is missed or has not rendered.
     */
    public raycastDistance(x: number, y: number): number | null {
        const context = this.context;

        if (!this._hasHitGeometry || !contextIsContext3D(context)) {
            return null;
        }

        if (x !== this._hitQueryX || y !== this._hitQueryY) {
            const [localX, localY] = this._toProjectionPoint(x, y);
            const ray = context.raycast(localX, localY);

            this._hitQueryX = x;
            this._hitQueryY = y;
            this._hitQueryDistance = ray ? this._raycastHitGeometry(ray) : -1;
        }

        return this._hitQueryDistance < 0 ? null : this._hitQueryDistance;
    }

    // The painter applies the element's 2D world transform on top of the projection, so a shape
    // under a 2D group is painted somewhere the projection alone does not put it.
    private _toProjectionPoint(x: number, y: number): [number, number] {
        const worldTransform = (this as unknown as Element).getWorldTransform();
        const inverse = worldTransform && matrixInvert(worldTransform);

        return inverse ? matrixApplyToPoint(inverse, [x, y]) : [x, y];
    }

    /**
     * Tests whether a point hits this shape, by casting the pointer ray through its triangles.
     *
     * A projected silhouette reports a hit anywhere inside a shape's outline — through the hole of a
     * torus, between the blades of a fan, across the bore of a casing — so the geometry itself is
     * what decides here. `pointerEvents: 'none'` still suppresses the hit; `'fill'` and `'stroke'`
     * have no meaning for a solid and are treated as `'all'`.
     *
     * @param x - X coordinate in logical space (CSS pixels relative to the context's top-left), the same space pointer event payloads report.
     * @param y - Y coordinate in logical space (CSS pixels relative to the context's top-left).
     * @param options - Hit-testing options, such as whether the test originates from a pointer event.
     * @returns Whether the pointer ray meets the shape's geometry.
     */
    public intersectsWith(x: number, y: number, options?: Partial<ElementIntersectionOptions>) {
        if (!this._hasHitGeometry || !contextIsContext3D(this.context)) {
            return super.intersectsWith(x, y, options);
        }

        if (options?.isPointer && this.pointerEvents === 'none') {
            return false;
        }

        return this.raycastDistance(x, y) !== null;
    }

}

function resolveHitNormal(
    face: Face3D,
    vertices: Vector3[],
    corner: number,
    hit: RayTriangleHit,
    normalMatrix: Matrix4
): Vector3 {
    if (face.normals?.length) {
        return vec3Normalize(mat4TransformDirection(normalMatrix, rayHitBarycentric<Vector3>(
            hit,
            face.normals[0],
            face.normals[corner],
            face.normals[corner + 1]
        )));
    }

    return face.normal
        ? vec3Normalize(mat4TransformDirection(normalMatrix, face.normal))
        : vec3TriangleNormal(vertices[0], vertices[corner], vertices[corner + 1]);
}

/** Twice the signed area of a projected polygon, negative when its winding faces the camera. */
function projectedSignedArea(points: ProjectedPoint[]): number {
    let area = 0;

    for (let idx = 0; idx < points.length; idx++) {
        const current = points[idx];
        const next = points[(idx + 1) % points.length];

        area += current[0] * next[1] - next[0] * current[1];
    }

    return area;
}

// The painter fills a flat polygon, so smooth shading can only average the vertex normals rather
// than interpolate them — closer to the true surface than the face normal, but still one colour.
function resolveFaceNormal(face: Face3D, transformed: Vector3[], normalMatrix: Matrix4, flatShading: boolean): Vector3 {
    if (!flatShading && face.normals?.length) {
        let nx = 0;
        let ny = 0;
        let nz = 0;

        for (const normal of face.normals) {
            nx += normal[0];
            ny += normal[1];
            nz += normal[2];
        }

        const averaged = vec3Normalize(mat4TransformDirection(normalMatrix, [nx, ny, nz]));

        if (averaged[0] !== 0 || averaged[1] !== 0 || averaged[2] !== 0) {
            return averaged;
        }
    }

    return face.normal
        ? vec3Normalize(mat4TransformDirection(normalMatrix, face.normal))
        : computeFaceNormal(transformed);
}

// Averaged for the same reason as the normal: one fill per face is all the painter can express.
function resolveFaceColor(face: Face3D, material: ResolvedMaterial): ColorRGBA | undefined {
    const base = material.color;

    if (!base || !material.vertexColors || !face.colors?.length) {
        return base;
    }

    let cr = 0;
    let cg = 0;
    let cb = 0;
    let ca = 0;

    for (const color of face.colors) {
        const parsed = resolveColor(color) ?? base;

        cr += parsed[0];
        cg += parsed[1];
        cb += parsed[2];
        ca += parsed[3];
    }

    const count = face.colors.length;

    return [cr / count, cg / count, cb / count, ca / count];
}

// The CPU painter fills a flat polygon, so the whole face is shaded from its centroid. Positional
// lights need a point to measure distance from, and the centroid is the only one a flat fill has.
function faceCentroid(vertices: Vector3[]): Vector3 {
    let cx = 0;
    let cy = 0;
    let cz = 0;

    for (const vertex of vertices) {
        cx += vertex[0];
        cy += vertex[1];
        cz += vertex[2];
    }

    const count = vertices.length || 1;

    return [cx / count, cy / count, cz / count];
}

/**
 * Flattens faces into the interleaved vertex buffer a GPU backend uploads.
 *
 * @param faces - The mesh's faces.
 * @param material - The resolved material supplying the base colour and shading mode.
 * @returns Interleaved position, normal, colour and UV data, {@link VERTEX_FLOATS} per vertex.
 */
export function triangulateFacesFlat(faces: Face3D[], material: ResolvedMaterial): Float32Array {
    const data = new Float32Array(numberSum(faces, face => face.vertices.length) * VERTEX_FLOATS);
    // The GPU mesh needs numeric channels, so an unparseable colour degrades to grey there.
    const base = material.color ?? DEFAULT_MESH_COLOR;
    const [baseR, baseG, baseB] = rgbToUnit(base);
    const baseA = base[3];
    const smooth = !material.flatShading;

    let offset = 0;

    for (const face of faces) {
        const verts = face.vertices;
        const normal = face.normal ?? vec3TriangleNormal(verts[0], verts[1], verts[2]);
        const normals = smooth ? face.normals : undefined;
        const colors = material.vertexColors ? face.colors : undefined;

        for (let index = 0; index < verts.length; index++) {
            const vertex = verts[index];
            const vertexNormal = normals?.[index] ?? normal;

            data[offset++] = vertex[0];
            data[offset++] = vertex[1];
            data[offset++] = vertex[2];
            data[offset++] = vertexNormal[0];
            data[offset++] = vertexNormal[1];
            data[offset++] = vertexNormal[2];

            const vertexColor = colors?.[index] ? resolveColor(colors[index]) : undefined;

            if (vertexColor) {
                data[offset++] = vertexColor[0] / 255;
                data[offset++] = vertexColor[1] / 255;
                data[offset++] = vertexColor[2] / 255;
                data[offset++] = vertexColor[3] * baseA;
            } else {
                data[offset++] = baseR;
                data[offset++] = baseG;
                data[offset++] = baseB;
                data[offset++] = baseA;
            }

            const uv = face.uvs?.[index];

            data[offset++] = uv ? uv[0] : 0;
            data[offset++] = uv ? uv[1] : 0;
        }
    }

    return data;
}

/**
 * Fan-triangulates faces into an index buffer addressing {@link triangulateFacesFlat}'s vertices.
 *
 * @param faces - The mesh's faces.
 * @returns Triangle indices.
 */
export function triangulateFacesIndices(faces: Face3D[]): Uint32Array {
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