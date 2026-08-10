import {
    LIGHT_DIRECTION,
} from './constants';

import {
    createAmbientLight,
    createDirectionalLight,
    lightIsCameraSpace,
    lightIsPositional,
    LightList,
    resolveLight,
} from './lights';

import {
    MAX_LIGHTS,
} from './uniforms';

import {
    resolveFog,
} from './fog';

import type {
    Fog,
} from './fog';

import type {
    ResolvedFog,
} from './uniforms';

import type {
    DirectionalLight,
    Light,
} from './lights';

import type {
    ResolvedLight,
} from './shading';

import type {
    ResolvedMaterial,
} from './material';

import {
    releaseTexturePatternCache,
    resolveTexturePattern,
} from './texture-pattern';

import type {
    Texture,
} from './texture';

import {
    elementIsShape3D,
} from './shape';

import type {
    Intersection3D,
    ProjectedFace3D,
    ProjectedFaceState3D,
    Raycast3DOptions,
    Shape3D,
} from './shape';

import type {
    RenderElement,
} from '@ripl/core';

import {
    mat4Identity,
    mat4Invert,
    mat4LookAt,
    mat4Multiply,
    mat4Orthographic,
    mat4Perspective,
    mat4TransformDirectionInverse,
    mat4TransformPoint,
} from '../math/matrix';

import {
    projectPoint,
    rayFromScreen,
} from '../math/projection';

import type {
    Matrix4,
    ProjectedPoint,
    Ray,
    Vector2,
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
    Element,
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
    /** The resolved material the mesh is shaded with. */
    material: ResolvedMaterial;
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
    /**
     * The lights illuminating the scene, replacing the default ambient-plus-directional rig.
     *
     * Supplying this detaches {@link Context3D.lightDirection} and {@link Context3D.lightMode},
     * which exist to drive that default rig.
     */
    lights?: Light[];
    /** Intensity of the default rig's ambient light. Defaults to `0.3`. */
    ambientIntensity?: number;
    /** Atmospheric haze blending distant geometry towards a colour. Omit for none. */
    fog?: Fog;
}

/** Base 3D rendering context providing view/projection matrices, camera, lighting, and projection. Subclassed by CanvasContext3D and WebGPUContext3D. */
export class Context3D extends DOMContext<HTMLCanvasElement, Context3DMeta> {

    /** The view matrix transforming world space into camera (view) space. */
    public viewMatrix: Matrix4;
    /** The projection matrix transforming view space into clip space. */
    public projectionMatrix: Matrix4;
    /** The combined view-projection matrix, transforming world space directly into clip space. */
    public viewProjectionMatrix: Matrix4;
    /** The lights illuminating the scene. */
    public readonly lights: LightList;
    /** The camera's world-space position, as last set by {@link setCamera}. */
    public cameraPosition: Vector3 = [0, 0, 0];
    /**
     * Faces accumulated since the last flush, sorted back-to-front and drained when they are drawn
     * (painter's algorithm). A backend that never draws them — the base class, or a GPU context —
     * leaves this empty by clearing it at the start of each pass.
     */
    public faceBuffer: ProjectedFace3D[] = [];

    protected fov: number;
    protected near: number;
    protected far: number;

    private _orthographicFrustum: [number, number, number, number, number, number] | null = null;
    private _defaultLight?: DirectionalLight;
    private _detachedLightWarned = false;
    private _resolvedLights: ResolvedLight[] = [];
    private _resolvedVersion = -1;
    private _resolvedView?: Matrix4;
    private _fog: Fog | null = null;
    private _resolvedFog: ResolvedFog | null = null;

    /**
     * Atmospheric haze blending distant geometry towards a colour, or `null` for none.
     *
     * Both backends resolve it identically. Assign a new object to change it — mutating the existing
     * one in place will not repaint.
     */
    public get fog(): Fog | null {
        return this._fog;
    }

    public set fog(value: Fog | null) {
        this._fog = value;
        this._resolvedFog = resolveFog(value);
        this.requestRender();
    }

    /** The resolved fog both backends shade against, or `null` when there is none. */
    public get resolvedFog(): ResolvedFog | null {
        return this._resolvedFog;
    }

    /** The projection currently in effect, which a resize preserves. */
    public get projectionMode(): 'perspective' | 'orthographic' {
        return this._orthographicFrustum ? 'orthographic' : 'perspective';
    }

    /** The active rendering strategy (`cpu` or `gpu`) for this context. */
    public get renderStrategy(): RenderStrategy {
        return this.meta.renderStrategy;
    }

    /**
     * The direction of the default rig's directional light.
     *
     * A convenience over reaching into {@link lights} for the single-light case. Replacing the rig
     * through {@link Context3DOptions.lights}, or removing that light, leaves this inert — set the
     * light's own `direction` instead.
     */
    public get lightDirection(): Vector3 {
        return this._defaultLight?.direction ?? [...LIGHT_DIRECTION.topLeftFront];
    }

    public set lightDirection(value: Vector3) {
        if (!this._requireDefaultLight()) {
            return;
        }

        this._defaultLight!.direction = value;
    }

    /**
     * Whether the default rig's directional light is fixed in world space or follows the camera.
     *
     * Inert once the default rig is replaced, exactly as {@link lightDirection} is.
     */
    public get lightMode(): LightMode {
        return this._defaultLight?.space ?? 'world';
    }

    public set lightMode(value: LightMode) {
        if (!this._requireDefaultLight()) {
            return;
        }

        this._defaultLight!.space = value;
    }

    /**
     * @param type - The context type name.
     * @param target - The host element or selector the surface mounts into.
     * @param element - The canvas backing the surface.
     * @param options - Camera, lighting and base context options.
     * @param renderStrategy - The strategy this backend renders with. Applied **after** the
     * caller's `meta`, because it is the subclass's invariant rather than a preference: a
     * caller-supplied `renderStrategy` used to be able to downgrade a GPU context to `'cpu'`,
     * routing every shape into a CPU painter the backend never draws.
     */
    constructor(
        type: string,
        target: string | HTMLElement,
        element: HTMLCanvasElement,
        options?: Context3DOptions,
        renderStrategy: RenderStrategy = 'cpu'
    ) {
        element.style.display = 'block';
        element.style.width = '100%';
        element.style.height = '100%';

        super(type, target, element, {
            ...options,
            meta: {
                ...options?.meta,
                renderStrategy,
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
        this.viewMatrix = mat4Identity();
        this.projectionMatrix = mat4Identity();
        this.viewProjectionMatrix = mat4Identity();
        this.lights = new LightList(() => this.requestRender());
        this._fog = options?.fog ?? null;
        this._resolvedFog = resolveFog(this._fog);

        if (options?.lights) {
            this.lights.add(...options.lights);

            return;
        }

        // An ambient light at 0.3 plus a directional at 0.7 is exactly the `0.3 + 0.7 * ndotl`
        // the single hard-coded light used, so a caller who configures nothing sees no change.
        const ambientIntensity = options?.ambientIntensity ?? 0.3;

        this._defaultLight = createDirectionalLight({
            direction: options?.lightDirection ?? [...LIGHT_DIRECTION.topLeftFront],
            intensity: 1 - ambientIntensity,
            space: options?.lightMode ?? 'world',
        });

        this.lights.add(
            createAmbientLight({
                intensity: ambientIntensity,
            }),
            this._defaultLight
        );
    }

    protected updateViewProjectionMatrix(): void {
        this.viewProjectionMatrix = mat4Multiply(this.projectionMatrix, this.viewMatrix);
    }

    protected updateProjectionMatrix(): void {
        // A rebuild must preserve the projection type: rescale calls this on every size change.
        if (this._orthographicFrustum) {
            this.projectionMatrix = mat4Orthographic(...this._orthographicFrustum);
            this.updateViewProjectionMatrix();

            return;
        }

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
        // Retained rather than recovered by inverting the view matrix: specular highlights and
        // camera-space lights need it every frame, and the caller already has it here.
        this.cameraPosition = [...eye];
        this.updateViewProjectionMatrix();
        this.requestRender();
    }

    /** Updates the perspective projection with the given field of view, near, and far planes, replacing any orthographic projection. */
    public setPerspective(fov: number, near: number, far: number): void {
        this.fov = fov;
        this.near = near;
        this.far = far;
        this._orthographicFrustum = null;
        this.updateProjectionMatrix();
        this.requestRender();
    }

    /**
     * Sets an orthographic projection with explicit frustum bounds.
     *
     * The bounds are retained and replayed verbatim whenever the projection is rebuilt, so a
     * resize keeps the projection orthographic. It does not re-fit the frustum to the new aspect
     * ratio — the caller owns that, and {@link Camera} recomputes it on its next flush.
     */
    public setOrthographic(
        left: number,
        right: number,
        bottom: number,
        top: number,
        near: number,
        far: number
    ): void {
        this._orthographicFrustum = [left, right, bottom, top, near, far];
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

    /**
     * Builds the world-space ray through a point on the surface.
     *
     * @param x - Screen-space x, in logical CSS pixels relative to the context's top-left.
     * @param y - Screen-space y.
     * @returns The ray, or `null` when the view-projection matrix is singular.
     */
    public raycast(x: number, y: number): Ray | null {
        return rayFromScreen(x, y, this.viewProjectionMatrix, this);
    }

    /**
     * Casts a ray through a point on the surface and returns every 3D shape it meets.
     *
     * Reports the full intersection — point, face, normal and texture coordinate — where
     * {@link hitTest} answers only which elements the pointer is over. It also ignores
     * `pointerEvents` and whether a shape has any handlers, so it sees the whole scene.
     *
     * @param root - The element to search, typically the scene.
     * @param x - Screen-space x, in logical CSS pixels relative to the context's top-left.
     * @param y - Screen-space y.
     * @param options - Whether to accept back-facing hits.
     * @returns The intersections, nearest first.
     */
    public raycastAll(root: Element, x: number, y: number, options?: Raycast3DOptions): Intersection3D[] {
        const ray = this.raycast(x, y);

        if (!ray) {
            return [];
        }

        const hits: Intersection3D[] = [];

        for (const element of collectShapes(root)) {
            const hit = element.raycast(ray, options);

            if (hit) {
                hits.push(hit);
            }
        }

        return hits.sort((left, right) => left.distance - right.distance);
    }

    /**
     * Tests which rendered elements the pointer is over, ranking 3D shapes by how near their
     * geometry is rather than by paint order.
     *
     * The base class ranks by paint order, which for 2D is exactly right — the last thing painted is
     * the thing on top. A 3D scene does not paint in element order: {@link CanvasContext3D.flushFaces}
     * buffers the faces of every shape and depth-sorts them globally, so what you see is ordered by
     * depth while what the base class hits is ordered by the position an element happened to take in
     * the render stream. For an assembly of interleaved parts those two orders routinely disagree.
     *
     * 2D elements keep their paint order and their positions in the list, so a 2D element painted
     * over a 3D one still wins: it flushed the face buffer, and paint order genuinely does decide
     * there.
     */
    protected override hitTest(events: string[], x: number, y: number): RenderElement[] {
        const hits = super.hitTest(events, x, y);

        if (hits.length < 2) {
            return hits;
        }

        const positions: number[] = [];
        const shapes: Shape3D[] = [];

        hits.forEach((element, index) => {
            if (elementIsShape3D(element)) {
                positions.push(index);
                shapes.push(element);
            }
        });

        if (shapes.length < 2) {
            return hits;
        }

        // The distance is memoized per pointer position, so the comparator costs no extra raycasts.
        shapes.sort((left, right) => (left.raycastDistance(x, y) ?? Infinity) - (right.raycastDistance(x, y) ?? Infinity));
        positions.forEach((position, index) => {
            hits[position] = shapes[index];
        });

        return hits;
    }

    /**
     * Resolves the scene's lights into the flat numeric form both backends shade against.
     *
     * Cached until a light changes or the camera moves, because the CPU painter asks for it once
     * per shape and camera-space lights depend on the view matrix.
     *
     * @returns The enabled lights, capped at {@link MAX_LIGHTS}.
     */
    public resolveLights(): ResolvedLight[] {
        if (this._resolvedVersion === this.lights.version && this._resolvedView === this.viewMatrix) {
            return this._resolvedLights;
        }

        const enabled = this.lights.toArray().filter(light => light.enabled && light.intensity !== 0);

        if (enabled.length > MAX_LIGHTS) {
            console.warn(`Ripl: a 3D context supports up to ${MAX_LIGHTS} lights; ${enabled.length - MAX_LIGHTS} were dropped.`);
        }

        let inverseView: Matrix4 | null | undefined;

        this._resolvedLights = enabled.slice(0, MAX_LIGHTS).map(light => {
            const resolved = resolveLight(light);

            if (!lightIsCameraSpace(light)) {
                return resolved;
            }

            resolved.direction = mat4TransformDirectionInverse(this.viewMatrix, resolved.direction);

            if (lightIsPositional(light)) {
                inverseView = inverseView === undefined ? mat4Invert(this.viewMatrix) : inverseView;

                if (inverseView) {
                    resolved.position = mat4TransformPoint(inverseView, resolved.position);
                }
            }

            return resolved;
        });

        this._resolvedVersion = this.lights.version;
        this._resolvedView = this.viewMatrix;

        return this._resolvedLights;
    }

    private _requireDefaultLight(): boolean {
        if (this._defaultLight) {
            return true;
        }

        if (!this._detachedLightWarned) {
            this._detachedLightWarned = true;
            console.warn('Ripl: lightDirection and lightMode drive the default light rig, which this context replaced. Set the light\'s own properties instead.');
        }

        return false;
    }

    /** Projects a 3D world-space point to 2D logical coordinates — CSS pixels relative to the context's top-left — plus a depth for z-ordering. */
    public project(point: Vector3): ProjectedPoint {
        return projectPoint(point, this.viewProjectionMatrix, this);
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

    /**
     * Begins a render pass, emptying the frame's face buffer at the outermost depth.
     *
     * Every 3D context accumulates faces, but only a backend that paints them drains the buffer —
     * so the reset belongs here, or a context that never draws them grows it without bound.
     */
    public markRenderStart(): void {
        super.markRenderStart();

        if (this.renderDepth === 1) {
            this.faceBuffer.length = 0;
        }
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

/** Type guard that checks whether a rendering context is a `Context3D`. */
export function contextIsContext3D(value: unknown): value is Context3D {
    return value instanceof Context3D;
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

        this.width = width;
        this.height = height;
        this.scaleX = result.scaleX;
        this.scaleY = result.scaleY;

        if (this.viewMatrix) {
            this.updateProjectionMatrix();
        }

        // Emitted last, not through `super.rescale`: a bound scene repaints synchronously here, and
        // would otherwise draw under identity scales and the previous projection.
        this.emit('resize', null);
    }

    /** Begins a render pass, resetting the frame's face buffer and clip tracking at the outermost depth. */
    public override markRenderStart(): void {
        super.markRenderStart();

        if (this.renderDepth === 1) {
            this._clipPending = false;
        }
    }

    /** Ends the render pass and, at the outermost depth, flushes any faces still buffered. */
    public override markRenderEnd(): void {
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

        if (face.fillColor) {
            if (face.fillColor !== applied.fill) {
                ctx.fillStyle = face.fillColor;
                applied.fill = face.fillColor;
            }

            ctx.fill();
        }

        if (face.texture && face.uvs) {
            this._drawFaceTexture(face, face.texture, face.uvs);
            applied.fill = '';
        }

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

    /**
     * Maps a texture across one projected face, one fan triangle at a time.
     *
     * Each triangle gets the affine transform carrying its UV corners onto its screen corners, so
     * the image is stretched linearly across it. That is affine, not perspective-correct: a large
     * face seen at a steep angle will show the seam along its fan diagonal, which subdividing the
     * geometry removes. The shaded fill is already down, so the image is multiplied over it and the
     * lighting still applies.
     *
     * The paint is a repeating {@link CanvasPattern}, not a single `drawImage`: the transform folds
     * the texture's `repeat` into the UV mapping, so one image draw covers only `1 / (ru * rv)` of
     * the surface and leaves the rest bare. Tiling the pattern instead covers all of it, and carries
     * the wrap modes the Canvas backend could not otherwise express.
     *
     * Everything here drives the raw 2D context rather than this context's own `drawImage`, which
     * flushes the face buffer first — calling it from inside the flush would re-enter it and split
     * the global back-to-front sort.
     */
    private _drawFaceTexture(face: ProjectedFace3D, texture: Texture, uvs: Vector2[]): void {
        const width = texture.width;
        const height = texture.height;

        if (width <= 0 || height <= 0) {
            return;
        }

        const ctx = this.context;
        const points = face.points;
        const { pattern } = resolveTexturePattern(ctx, texture);

        if (!pattern) {
            return;
        }

        ctx.save();
        ctx.globalCompositeOperation = 'multiply';
        ctx.fillStyle = pattern;

        for (let idx = 1; idx < points.length - 1; idx++) {
            const transform = solveAffineUVTransform(
                uvs[0], uvs[idx], uvs[idx + 1],
                points[0], points[idx], points[idx + 1],
                width, height, texture
            );

            if (!transform) {
                continue;
            }

            // The pattern carries the transform so the triangle itself stays in screen space; a CTM
            // change would move the path too, and the path is what bounds the fill.
            pattern.setTransform(assignPatternMatrix(transform));

            ctx.beginPath();
            ctx.moveTo(points[0][0], points[0][1]);
            ctx.lineTo(points[idx][0], points[idx][1]);
            ctx.lineTo(points[idx + 1][0], points[idx + 1][1]);
            ctx.closePath();
            ctx.fill();
        }

        ctx.restore();
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

    /** Destroys the context, releasing the texture patterns and tile canvases cached against it. */
    public override destroy(): void {
        releaseTexturePatternCache(this.context);

        super.destroy();
    }

}

/* eslint-disable id-length -- `a`–`f` are the canvas matrix components, not free variable names. */

// One instance, overwritten per triangle: `setTransform` reads the matrix and keeps nothing.
const patternMatrix: DOMMatrix2DInit = {
    a: 1,
    b: 0,
    c: 0,
    d: 1,
    e: 0,
    f: 0,
};

function assignPatternMatrix(transform: Matrix): DOMMatrix2DInit {
    patternMatrix.a = transform[0];
    patternMatrix.b = transform[1];
    patternMatrix.c = transform[2];
    patternMatrix.d = transform[3];
    patternMatrix.e = transform[4];
    patternMatrix.f = transform[5];

    return patternMatrix;
}

/* eslint-enable id-length */

/**
 * Solves the affine transform mapping a triangle's texture pixels onto its screen corners.
 *
 * @returns The six-component transform, or `null` when the triangle is degenerate in UV space.
 */
function solveAffineUVTransform(
    uvA: Vector2,
    uvB: Vector2,
    uvC: Vector2,
    screenA: ProjectedPoint,
    screenB: ProjectedPoint,
    screenC: ProjectedPoint,
    width: number,
    height: number,
    texture: Texture
): Matrix | null {
    const scaleU = texture.repeat[0] || 1;
    const scaleV = texture.repeat[1] || 1;

    const ax = (uvA[0] * scaleU + texture.offset[0]) * width;
    const ay = (texture.flipY ? 1 - uvA[1] * scaleV - texture.offset[1] : uvA[1] * scaleV + texture.offset[1]) * height;
    const bx = (uvB[0] * scaleU + texture.offset[0]) * width;
    const by = (texture.flipY ? 1 - uvB[1] * scaleV - texture.offset[1] : uvB[1] * scaleV + texture.offset[1]) * height;
    const cx = (uvC[0] * scaleU + texture.offset[0]) * width;
    const cy = (texture.flipY ? 1 - uvC[1] * scaleV - texture.offset[1] : uvC[1] * scaleV + texture.offset[1]) * height;

    const det = (bx - ax) * (cy - ay) - (cx - ax) * (by - ay);

    if (det === 0 || !isFinite(det)) {
        return null;
    }

    const inv = 1 / det;
    const dxB = screenB[0] - screenA[0];
    const dyB = screenB[1] - screenA[1];
    const dxC = screenC[0] - screenA[0];
    const dyC = screenC[1] - screenA[1];

    const scaleX = (dxB * (cy - ay) - dxC * (by - ay)) * inv;
    const skewY = (dyB * (cy - ay) - dyC * (by - ay)) * inv;
    const skewX = (dxC * (bx - ax) - dxB * (cx - ax)) * inv;
    const scaleY = (dyC * (bx - ax) - dyB * (cx - ax)) * inv;

    return [
        scaleX,
        skewY,
        skewX,
        scaleY,
        screenA[0] - scaleX * ax - skewX * ay,
        screenA[1] - skewY * ax - scaleY * ay,
    ];
}

function collectShapes(root: Element): Shape3D[] {
    const shapes: Shape3D[] = [];
    const queue: Element[] = [root];

    while (queue.length) {
        const element = queue.pop()!;

        if (elementIsShape3D(element)) {
            shapes.push(element);
        }

        const children = (element as { children?: Element[] }).children;

        if (children) {
            queue.push(...children);
        }
    }

    return shapes;
}

/** Creates a Canvas 2D–backed 3D rendering context attached to the given DOM target. */
export function createContext(target: string | HTMLElement, options?: Context3DOptions): CanvasContext3D {
    return new CanvasContext3D(target, options);
}

// Compile-time conformance: the 3D canvas backend factory matches the shared `ContextFactory` contract.
createContext satisfies ContextFactory<string | HTMLElement, Context3DOptions, CanvasContext3D>;
