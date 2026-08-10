import {
    createCamera,
    createContext,
    Shape3D,
} from '@ripl/3d';

import type {
    Camera,
    CanvasContext3D,
    Face3D,
    Matrix4,
    Shape3DOptions,
    Shape3DState,
    Vector3,
} from '@ripl/3d';

import {
    createGroup,
    createRenderer,
    createScene,
    createText,
} from '@ripl/web';

import type {
    Renderer,
    Scene,
    Text,
} from '@ripl/web';

import {
    buildSurface,
    surfaceWorldPoint,
    updateSurface,
} from './surface-3d';

import type {
    SurfaceBounds,
    SurfaceMeshOptions,
} from './surface-3d';

import {
    generateTicks,
} from './ticks';

import type {
    TickSet,
} from './ticks';

import type {
    GraphTheme,
    SurfaceField,
} from '../types';

/** The mesh detail presets the surface can be built at. */
export type SurfaceQuality = 'low' | 'balanced' | 'high';

/** The pair of grid resolutions a quality preset moves between. */
export interface SurfaceQualityLevel {
    /** The number of vertices per side used while the camera is in flight. */
    moving: number;
    /** The number of vertices per side used once the camera settles. */
    settled: number;
}

/**
 * The grid resolutions each quality preset moves between.
 *
 * The axis is camera-moving versus camera-still, not idle versus active: `computeFaces` is cached
 * and only invalidated by a state write, and the renderer skips the paint entirely when nothing is
 * dirty, so orbiting re-projects without rebuilding and a settled surface costs nothing at all.
 *
 * Budgeted against the CPU painter's per-face cost (projection, the global depth sort, the
 * unconditional hit-path trace and one canvas `fill()`): roughly 4,000 to 6,000 faces hold 60fps
 * and 10,000 to 14,000 hold 30fps, with the depth sort alone reaching ~5ms beyond 20,000. The
 * default preset is therefore ~2,200 quads in flight and ~6,200 settled. Evaluating the field costs
 * 0.29 to 0.65 microseconds per vertex, so the settled rebuild is a single ~4.9ms hitch.
 */
export const SURFACE_QUALITY_LEVELS: Record<SurfaceQuality, SurfaceQualityLevel> = {
    low: {
        moving: 32,
        settled: 48,
    },
    balanced: {
        moving: 48,
        settled: 80,
    },
    high: {
        moving: 64,
        settled: 96,
    },
};

/**
 * Supplies the height field at a requested grid resolution.
 *
 * Injected rather than imported so the renderer never reaches the expression engine itself, and
 * never on the `computeFaces` path.
 */
export type SurfaceFieldProvider = (resolution: number) => SurfaceField | undefined;

/**
 * Debug overlays the 3D view may enable.
 *
 * `boundingBoxes` is deliberately absent: {@link Shape3D} opts out of bounds caching and
 * re-projects every vertex on `getBoundingBox`, which the overlay calls for every buffered element.
 */
export interface Graph3DDebugOptions {
    /** Draws the frames-per-second badge. */
    fps?: boolean;
    /** Draws the rendered element count badge. */
    elementCount?: boolean;
}

/** Options for constructing the 3D surface view. */
export interface Graph3DOptions {
    /** The element the 3D canvas mounts into. */
    host: HTMLElement;
    /** Supplies the height field at a requested grid resolution. */
    provideField: SurfaceFieldProvider;
    /** The resolved canvas colors for the axes, labels and background. */
    theme: GraphTheme;
    /** The mesh detail preset. Defaults to `balanced`. */
    quality?: SurfaceQuality;
    /** The debug overlays to enable. */
    debug?: Graph3DDebugOptions;
}

/** An orbitable 3D surface view, owning its context, scene, renderer and camera. */
export interface Graph3D {
    /** The 3D rendering context the view paints into. */
    readonly context: CanvasContext3D;
    /** The scene holding the surface, the axis frame and the 2D label overlay. */
    readonly scene: Scene;
    /** The renderer driving the frame loop. */
    readonly renderer: Renderer;
    /** The orbit camera rig. */
    readonly camera: Camera;
    /** Re-evaluates the field and rebuilds the mesh. Call when the expression, domain or a parameter changes. */
    update(): void;
    /** Applies newly resolved theme colors. */
    setTheme(theme: GraphTheme): void;
    /** Applies a new mesh detail preset and rebuilds. */
    setQuality(quality: SurfaceQuality): void;
    /** Returns the camera to its default framing. */
    resetCamera(): void;
    /** Destroys the renderer, scene, camera, context and every listener this view registered. */
    destroy(): void;
}

/** State for a wireframe whose faces are held outside the element. */
interface WireframeState extends Shape3DState {
    /** A counter bumped whenever the face list is replaced, invalidating the cached geometry. */
    revision: number;
}

/** One projected axis label. */
interface AxisLabel {
    /** The text to draw. */
    content: string;
    /** The world-space point the text is anchored to. */
    anchor: Vector3;
}

/** The wireframe edges and world-anchored labels making up the axis frame. */
interface AxisFrame {
    /** The bounding box edges and the tick marks along each axis. */
    faces: Face3D[];
    /** The tick labels and axis names. */
    labels: AxisLabel[];
}

const CAMERA_POSITION: Vector3 = [2.1, 1.6, 2.4];
const CAMERA_TARGET: Vector3 = [0, 0, 0];
const CAMERA_FOV = 45;
const LIGHT_DIRECTION: Vector3 = [-0.5, -0.8, -1];

const AXIS_TICK_TARGET = 5;
const MAX_AXIS_TICKS = 8;
const LABEL_POOL_SIZE = MAX_AXIS_TICKS * 3 + 3;
const LABEL_FONT = '11px system-ui, sans-serif';
const TICK_LENGTH = 0.05;
const LABEL_GAP = 0.13;
const AXIS_WIDTH = 1;

// The overlay must paint after the surface: a 2D fill among its faces splits the global face sort.
const OVERLAY_Z_INDEX = 10;

const SETTLE_DELAY = 150;

function emptyField(): SurfaceField {
    return {
        resolution: 0,
        domain: {
            xMin: -1,
            xMax: 1,
            yMin: -1,
            yMax: 1,
        },
        values: new Float64Array(0),
        zMin: 0,
        zMax: 0,
    };
}

/** A set of straight edges drawn as degenerate faces, so the axis frame costs one element. */
class Wireframe extends Shape3D<WireframeState> {

    private _faces: Face3D[] = [];

    constructor(options?: Shape3DOptions<WireframeState>) {
        super('graph-wireframe', {
            revision: 0,
            ...options,
        });
    }

    /** Replaces the edge list, invalidating the cached geometry. */
    public setFaces(faces: Face3D[]): void {
        this._faces = faces;
        this.setStateValue('revision', this.getStateValue('revision') + 1);
    }

    protected computeFaces(): Face3D[] {
        return this._faces;
    }

}

// Two vertices fill nothing and stroke a line; the normal is explicit as the shared helper reads a third.
function edge(from: Vector3, to: Vector3): Face3D {
    return {
        vertices: [from, to],
        normal: [0, 1, 0],
    };
}

function boxEdges(extent: number, heightExtent: number): Face3D[] {
    const faces: Face3D[] = [];
    const signs = [-1, 1];

    for (const sa of signs) {
        for (const sb of signs) {
            faces.push(edge([-extent, sa * heightExtent, sb * extent], [extent, sa * heightExtent, sb * extent]));
            faces.push(edge([sa * extent, sb * heightExtent, -extent], [sa * extent, sb * heightExtent, extent]));
            faces.push(edge([sa * extent, -heightExtent, sb * extent], [sa * extent, heightExtent, sb * extent]));
        }
    }

    return faces;
}

function pushAxis(
    faces: Face3D[],
    labels: AxisLabel[],
    ticks: TickSet,
    anchorOf: (value: number) => Vector3,
    direction: Vector3
): void {
    const count = Math.min(ticks.values.length, MAX_AXIS_TICKS);

    for (let i = 0; i < count; i++) {
        const anchor = anchorOf(ticks.values[i]);
        const tip: Vector3 = [
            anchor[0] + direction[0] * TICK_LENGTH,
            anchor[1] + direction[1] * TICK_LENGTH,
            anchor[2] + direction[2] * TICK_LENGTH,
        ];

        faces.push(edge(anchor, tip));
        labels.push({
            content: ticks.labels[i],
            anchor: [
                anchor[0] + direction[0] * LABEL_GAP,
                anchor[1] + direction[1] * LABEL_GAP,
                anchor[2] + direction[2] * LABEL_GAP,
            ],
        });
    }
}

/**
 * Builds the bounding box, the tick marks along each axis and the labels that annotate them.
 *
 * @param bounds - The world box the height field is fitted into.
 * @returns The wireframe edges and the world-anchored labels.
 */
function buildAxisFrame(bounds: SurfaceBounds): AxisFrame {
    const {
        domain,
        extent,
        heightExtent,
    } = bounds;

    const faces = boxEdges(extent, heightExtent);
    const labels: AxisLabel[] = [];

    pushAxis(
        faces,
        labels,
        generateTicks(domain.xMin, domain.xMax, AXIS_TICK_TARGET),
        value => surfaceWorldPoint(bounds, value, domain.yMax, bounds.zMin),
        [0, 0, 1]
    );

    pushAxis(
        faces,
        labels,
        generateTicks(domain.yMin, domain.yMax, AXIS_TICK_TARGET),
        value => surfaceWorldPoint(bounds, domain.xMax, value, bounds.zMin),
        [1, 0, 0]
    );

    pushAxis(
        faces,
        labels,
        generateTicks(bounds.zMin, bounds.zMax, AXIS_TICK_TARGET),
        value => surfaceWorldPoint(bounds, domain.xMax, domain.yMax, value),
        [1, 0, 1]
    );

    labels.push({
        content: 'x',
        anchor: [0, -heightExtent, extent + LABEL_GAP * 2.4],
    });

    labels.push({
        content: 'y',
        anchor: [extent + LABEL_GAP * 2.4, -heightExtent, 0],
    });

    labels.push({
        content: 'z',
        anchor: [extent + LABEL_GAP, heightExtent + LABEL_GAP, extent + LABEL_GAP],
    });

    return {
        faces,
        labels,
    };
}

/**
 * Creates the orbitable 3D surface view.
 *
 * The surface is one element whose vertices carry the colormap. Nothing 2D may paint between its
 * faces: a fill, stroke, image or clip flushes the face buffer, which splits the global
 * back-to-front sort and produces occlusion errors that are intermittent and orientation-dependent.
 * The surface therefore lives alone in one group and every 2D overlay sits above it on `zIndex`.
 *
 * @param options - The host element, field provider, theme and detail preset.
 * @returns The view handle, which owns everything it created.
 *
 * @example
 * ```ts
 * const graph = createGraph3D({
 *     host: viewport.value,
 *     theme: resolveTheme(),
 *     provideField: resolution => evaluateSurface(expression, { domain, resolution, params }),
 * });
 *
 * graph.update();
 * ```
 */
export function createGraph3D(options: Graph3DOptions): Graph3D {
    const {
        host,
        provideField,
    } = options;

    const context = createContext(host);
    const camera = createCamera(context, {
        position: [...CAMERA_POSITION] as Vector3,
        target: [...CAMERA_TARGET] as Vector3,
        fov: CAMERA_FOV,
        interactions: {
            pivot: true,
            zoom: true,
            pan: true,
        },
    });

    context.lightDirection = [...LIGHT_DIRECTION] as Vector3;

    const meshOptions: SurfaceMeshOptions = {};
    const surface = buildSurface(emptyField(), meshOptions);
    const frame = new Wireframe({
        lineWidth: AXIS_WIDTH,
    });

    const labelPool: Text[] = [];

    for (let i = 0; i < LABEL_POOL_SIZE; i++) {
        labelPool.push(createText({
            x: 0,
            y: 0,
            content: '',
            opacity: 0,
            font: LABEL_FONT,
            textAlign: 'center',
            textBaseline: 'middle',
        }));
    }

    // One group per layer: a 2D element among the faces flushes the face buffer and splits the depth sort.
    const bandGroup = createGroup({
        children: [surface],
    });

    const axisGroup = createGroup({
        children: [frame],
    });

    const overlayGroup = createGroup({
        children: labelPool,
        zIndex: OVERLAY_Z_INDEX,
    });

    // Children at construction: `scene.add` defers the instruction rebuild, leaving the first frame empty.
    const scene = createScene(context, {
        children: [bandGroup, axisGroup, overlayGroup],
    });

    // Never `boundingBoxes`: a 3D shape re-projects every vertex for it, ~36,000 projections per frame here.
    const renderer = createRenderer(scene, {
        autoStart: true,
        autoStop: false,
        debug: {
            fps: options.debug?.fps ?? false,
            elementCount: options.debug?.elementCount ?? false,
        },
    });

    const disposables: (() => void)[] = [];

    let quality = options.quality ?? 'balanced';
    let labels: AxisLabel[] = [];
    let moving = false;
    let settleHandle: ReturnType<typeof setTimeout> | undefined;
    let projection: Matrix4 | undefined;

    function listen(target: EventTarget, type: string, handler: EventListener, listenerOptions?: AddEventListenerOptions): void {
        target.addEventListener(type, handler, listenerOptions);
        disposables.push(() => target.removeEventListener(type, handler, listenerOptions));
    }

    function positionLabels(): void {
        labelPool.forEach((text, index) => {
            const label = labels[index];

            if (!label) {
                text.opacity = 0;
                return;
            }

            const [px, py] = context.project(label.anchor);

            text.content = label.content;
            text.x = px;
            text.y = py;
            text.opacity = 1;
        });
    }

    function rebuildAxes(bounds: SurfaceBounds, plotted: boolean): void {
        if (!plotted) {
            frame.setFaces([]);
            labels = [];
            positionLabels();

            return;
        }

        const built = buildAxisFrame(bounds);

        frame.setFaces(built.faces);
        labels = built.labels;
        positionLabels();
    }

    function rebuild(resolution: number): void {
        const field = provideField(resolution) ?? emptyField();

        updateSurface(surface, field, meshOptions);
        rebuildAxes(surface.bounds, field.resolution > 1);
        scene.invalidate();
    }

    function activeResolution(): number {
        const level = SURFACE_QUALITY_LEVELS[quality];

        return moving ? level.moving : level.settled;
    }

    function beginCameraFlight(): void {
        if (settleHandle !== undefined) {
            clearTimeout(settleHandle);
            settleHandle = undefined;
        }

        if (moving) {
            return;
        }

        moving = true;
        rebuild(activeResolution());
    }

    function endCameraFlight(): void {
        // `pointerup` is bound to the window, so a click anywhere else must not cost a rebuild.
        if (!moving) {
            return;
        }

        if (settleHandle !== undefined) {
            clearTimeout(settleHandle);
        }

        settleHandle = setTimeout(() => {
            settleHandle = undefined;
            moving = false;
            rebuild(activeResolution());
        }, SETTLE_DELAY);
    }

    function applyTheme(theme: GraphTheme): void {
        context.element.style.backgroundColor = theme.background;
        frame.stroke = theme.axis;
        labelPool.forEach(text => {
            text.fill = theme.label;
        });
    }

    listen(host, 'pointerdown', beginCameraFlight);
    listen(window, 'pointerup', endCameraFlight);
    listen(host, 'wheel', () => {
        beginCameraFlight();
        endCameraFlight();
    }, {
        passive: true,
    });

    // Gated on the camera's matrix identity: relabelling every tick would repaint a settled surface forever.
    const tick = renderer.on('tick', () => {
        if (context.viewProjectionMatrix === projection) {
            return;
        }

        projection = context.viewProjectionMatrix;
        positionLabels();
    });

    applyTheme(options.theme);
    rebuild(activeResolution());

    return {
        context,
        scene,
        renderer,
        camera,

        update() {
            rebuild(activeResolution());
        },

        setTheme(next: GraphTheme) {
            applyTheme(next);
            scene.invalidate();
        },

        setQuality(next: SurfaceQuality) {
            quality = next;
            rebuild(activeResolution());
        },

        resetCamera() {
            camera.position = [...CAMERA_POSITION] as Vector3;
            camera.target = [...CAMERA_TARGET] as Vector3;
        },

        destroy() {
            if (settleHandle !== undefined) {
                clearTimeout(settleHandle);
                settleHandle = undefined;
            }

            disposables.forEach(dispose => dispose());
            disposables.length = 0;

            tick.dispose();
            renderer.destroy();
            camera.dispose();
            scene.destroy(true);
        },
    };
}
