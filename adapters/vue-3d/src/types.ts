import type {
    CameraInteractions,
    Context3D,
    Fog,
    Light,
    LightMode,
    Material,
    Shape3DState,
    Vector3,
} from '@ripl/3d';

import type {
    RiplElementListeners,
    RiplElementOptionProps,
    RiplPointerListeners,
    RiplShapeProps,
} from '@ripl/vue';

/** Props accepted by {@link RiplContext3D}. */
export interface RiplContext3DProps extends RiplPointerListeners {
    /** An existing 3D context to draw into instead of creating one. */
    context?: Context3D;
    /** Whether the context listens for and emits pointer and drag events. Defaults to `true`. */
    interactive?: boolean;
    /** Minimum pointer movement, in pixels, before a drag gesture is recognised. Defaults to `3`. */
    dragThreshold?: number;
    /** Arbitrary metadata attached to the context. */
    meta?: Record<string, unknown>;
    /** The vertical field of view, in degrees. Defaults to `60`. */
    fov?: number;
    /** The distance to the near clipping plane. Defaults to `0.1`. */
    near?: number;
    /** The distance to the far clipping plane. Defaults to `1000`. */
    far?: number;
    /** The directional light vector used by the default lighting rig. */
    lightDirection?: Vector3;
    /** Whether the default rig's light is fixed in world space or follows the camera. Defaults to `world`. */
    lightMode?: LightMode;
    /** The lights illuminating the scene, replacing the default ambient-plus-directional rig. */
    lights?: Light[];
    /** Intensity of the default rig's ambient light. Defaults to `0.3`. */
    ambientIntensity?: number;
    /** Atmospheric haze blending distant geometry towards a colour. */
    fog?: Fog;
    /** Fired once the context exists and its host element is in the document. */
    onReady?: (context: Context3D) => void;
    /** Fired when the context's surface is resized. */
    onResize?: () => void;
    /** Fired when the context requests a repaint that no element change triggered. */
    onRender?: () => void;
}

/**
 * The state every 3D shape carries, minus `zIndex` — a 3D shape derives that from projected depth
 * and ignores an assigned value.
 */
export type Ripl3DBaseState = Omit<Shape3DState, 'zIndex'>;

/**
 * The full prop surface of a 3D shape component: the shape's own state, the shared construction
 * options and paint flags, and its event listeners.
 *
 * @typeParam TState - The shape's state interface, e.g. `CubeState`.
 */
export type Ripl3DElementProps<TState extends Ripl3DBaseState> = Partial<TState>
& RiplElementOptionProps
& RiplShapeProps
& RiplElementListeners
& {
    /** A uniform scale applied to all three axes. Overridden by any per-axis scale also given. */
    scale?: number;
    /** How the surface responds to light. When omitted, the shape shades from its `fill` alone. */
    material?: Material;
};

/** Props accepted by {@link RiplGroup3D}. */
export interface RiplGroup3DProps extends RiplElementOptionProps, RiplElementListeners {
    /** The X position of the group's origin in world space. Defaults to `0`. */
    x?: number;
    /** The Y position of the group's origin in world space. Defaults to `0`. */
    y?: number;
    /** The Z position of the group's origin in world space. Defaults to `0`. */
    z?: number;
    /** The rotation around the X axis, in radians. Defaults to `0`. */
    rotationX?: number;
    /** The rotation around the Y axis, in radians. Defaults to `0`. */
    rotationY?: number;
    /** The rotation around the Z axis, in radians. Defaults to `0`. */
    rotationZ?: number;
    /** The scale along the X axis. Defaults to `1`. */
    scaleX?: number;
    /** The scale along the Y axis. Defaults to `1`. */
    scaleY?: number;
    /** The scale along the Z axis. Defaults to `1`. */
    scaleZ?: number;
    /** A uniform scale applied to all three axes. Overridden by any per-axis scale also given. */
    scale?: number;
}

/** Props accepted by {@link RiplCamera}. */
export interface RiplCameraProps {
    /** The camera's world-space position. Defaults to `[0, 0, 5]`. */
    position?: Vector3;
    /** The world-space point the camera looks at. Defaults to the origin. */
    target?: Vector3;
    /** The world-space up direction. Defaults to `[0, 1, 0]`. */
    up?: Vector3;
    /** The vertical field of view, in degrees. Defaults to `60`. */
    fov?: number;
    /** The distance to the near clipping plane. Defaults to `0.1`. */
    near?: number;
    /** The distance to the far clipping plane. Defaults to `1000`. */
    far?: number;
    /** The projection type. Defaults to `perspective`. */
    projection?: 'perspective' | 'orthographic';
    /** Pointer interactions, enabled all at once with a boolean or individually. */
    interactions?: boolean | CameraInteractions;
}

/** Props shared by every light component. */
export interface RiplLightProps {
    /** The light's colour. Defaults to `#ffffff`. */
    color?: string;
    /** How strongly the light contributes. Defaults to `1`. */
    intensity?: number;
    /** Whether the light contributes at all. Defaults to `true`. */
    enabled?: boolean;
}

/** Props accepted by {@link RiplHemisphereLight}. */
export interface RiplHemisphereLightProps extends RiplLightProps {
    /** The colour reaching surfaces that face downwards. Defaults to `#000000`. */
    groundColor?: string;
}

/** Props accepted by {@link RiplDirectionalLight}. */
export interface RiplDirectionalLightProps extends RiplLightProps {
    /** The direction the light travels in. */
    direction?: Vector3;
    /** Whether the direction is fixed in world space or follows the camera. Defaults to `world`. */
    space?: 'world' | 'camera';
}

/** Props accepted by {@link RiplPointLight}. */
export interface RiplPointLightProps extends RiplLightProps {
    /** The light's world-space position. Defaults to the origin. */
    position?: Vector3;
    /** The distance at which the light falls to zero. `0` means it never does. Defaults to `0`. */
    distance?: number;
    /** The exponent of the inverse-distance falloff. Defaults to `2`. */
    decay?: number;
}

/** Props accepted by {@link RiplSpotLight}. */
export interface RiplSpotLightProps extends RiplPointLightProps, RiplDirectionalLightProps {
    /** Half-angle of the cone, in radians. Defaults to `Math.PI / 6`. */
    angle?: number;
    /** How softly the cone fades at its edge, from `0` (hard) to `1` (fully soft). Defaults to `0`. */
    penumbra?: number;
}
