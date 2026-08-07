import {
    LIGHT_DIRECTION,
} from './constants';

import {
    vec3Normalize,
} from '../math/vector';

import {
    LIGHT_TYPE_CODE,
} from './uniforms';

import {
    resolveLightColor,
} from './shading';

import {
    HALF_PI,
} from '@ripl/core';

import {
    numberClamp,
} from '@ripl/utilities';

import type {
    ResolvedLight,
} from './shading';

import type {
    Vector3,
} from '../math/vector';

/** The kind of illumination a {@link Light} contributes. */
export type LightType = 'ambient' | 'hemisphere' | 'directional' | 'point' | 'spot';

/** Whether a light's orientation is fixed in world space or follows the camera. */
export type LightSpace = 'world' | 'camera';

/** Options shared by every light. */
export interface LightOptions {
    /** The light's colour. Defaults to `'#ffffff'`. */
    color?: string;
    /** How strongly the light contributes. Defaults to `1`. */
    intensity?: number;
    /** Whether the light contributes at all. Defaults to `true`. */
    enabled?: boolean;
}

/** Options for a light that has an orientation. */
export interface DirectedLightOptions extends LightOptions {
    /** The direction the light travels in. */
    direction?: Vector3;
    /** Whether {@link DirectionalLight.direction} is fixed in world space or follows the camera. Defaults to `'world'`. */
    space?: LightSpace;
}

/** Options for a light that radiates from a point. */
export interface PositionalLightOptions extends LightOptions {
    /** The light's world-space position. Defaults to the origin. */
    position?: Vector3;
    /** The distance at which the light falls to zero. `0` means it never does. Defaults to `0`. */
    distance?: number;
    /** The exponent of the inverse-distance falloff. Defaults to `2` for physically plausible falloff. */
    decay?: number;
}

/** Options for {@link AmbientLight}. */
export type AmbientLightOptions = LightOptions;

/** Options for {@link HemisphereLight}. */
export interface HemisphereLightOptions extends LightOptions {
    /** The colour reaching surfaces that face downwards. Defaults to `'#000000'`. */
    groundColor?: string;
}

/** Options for {@link DirectionalLight}. */
export type DirectionalLightOptions = DirectedLightOptions;

/** Options for {@link PointLight}. */
export type PointLightOptions = PositionalLightOptions;

/** Options for {@link SpotLight}. */
export interface SpotLightOptions extends PositionalLightOptions, DirectedLightOptions {
    /** Half-angle of the cone, in radians, clamped to below a right angle. Defaults to `Math.PI / 6`. */
    angle?: number;
    /** How softly the cone fades at its edge, from `0` (hard) to `1` (fully soft). Defaults to `0`. */
    penumbra?: number;
}

const DEFAULT_LIGHT_COLOR = '#ffffff';
const DEFAULT_GROUND_COLOR = '#000000';
const DEFAULT_SPOT_ANGLE = Math.PI / 6;

// A cone at or beyond a right angle stops being a cone, and its cosine flips sign.
const MAX_SPOT_ANGLE = HALF_PI - 1e-4;

/**
 * Base class for every light, carrying the colour, intensity and enabled state they share.
 *
 * A light notifies the context it belongs to whenever one of its properties changes, so a scene
 * that is otherwise idle still repaints.
 */
export abstract class Light {

    /** The kind of illumination this light contributes. */
    public readonly type: LightType;

    protected _color: string;
    protected _intensity: number;
    protected _enabled: boolean;

    // Set by the LightList the light is added to; a detached light simply has nothing to notify.
    private _notify?: () => void;

    /** The light's colour. */
    public get color() {
        return this._color;
    }

    public set color(value) {
        this._color = value;
        this.invalidate();
    }

    /** How strongly the light contributes. */
    public get intensity() {
        return this._intensity;
    }

    public set intensity(value) {
        this._intensity = value;
        this.invalidate();
    }

    /** Whether the light contributes at all. */
    public get enabled() {
        return this._enabled;
    }

    public set enabled(value) {
        this._enabled = value;
        this.invalidate();
    }

    constructor(type: LightType, options?: LightOptions) {
        this.type = type;
        this._color = options?.color ?? DEFAULT_LIGHT_COLOR;
        this._intensity = options?.intensity ?? 1;
        this._enabled = options?.enabled ?? true;
    }

    /** @internal Binds the callback a property change should notify. */
    public _bind(notify?: () => void): void {
        this._notify = notify;
    }

    /** Requests a repaint of whatever this light is attached to. Call after mutating derived state. */
    public invalidate(): void {
        this._notify?.();
    }

}

/** A light that reaches every surface equally, regardless of orientation. */
export class AmbientLight extends Light {

    constructor(options?: AmbientLightOptions) {
        super('ambient', options);
    }

}

/**
 * A two-colour light that fades from {@link Light.color} overhead to {@link groundColor} underfoot.
 *
 * Cheaper than a pair of opposed directional lights and reads as bounced daylight, which is what a
 * flat ambient term cannot give you.
 */
export class HemisphereLight extends Light {

    private _groundColor: string;

    /** The colour reaching surfaces that face downwards. */
    public get groundColor() {
        return this._groundColor;
    }

    public set groundColor(value) {
        this._groundColor = value;
        this.invalidate();
    }

    constructor(options?: HemisphereLightOptions) {
        super('hemisphere', options);

        this._groundColor = options?.groundColor ?? DEFAULT_GROUND_COLOR;
    }

}

/** A light infinitely far away, casting parallel rays in a single direction. */
export class DirectionalLight extends Light {

    private _direction: Vector3;
    private _space: LightSpace;

    /** The direction the light travels in, normalized on assignment. */
    public get direction() {
        return this._direction;
    }

    public set direction(value) {
        this._direction = vec3Normalize(value);
        this.invalidate();
    }

    /** Whether {@link direction} is fixed in world space or follows the camera. */
    public get space() {
        return this._space;
    }

    public set space(value) {
        this._space = value;
        this.invalidate();
    }

    constructor(options?: DirectionalLightOptions) {
        super('directional', options);

        this._direction = vec3Normalize(options?.direction ?? [...LIGHT_DIRECTION.topLeftFront]);
        this._space = options?.space ?? 'world';
    }

}

/** Base class for lights that radiate from a position and fall off with distance. */
export abstract class PositionalLight extends Light {

    protected _position: Vector3;
    protected _distance: number;
    protected _decay: number;

    /** The light's world-space position. */
    public get position() {
        return this._position;
    }

    public set position(value) {
        this._position = value;
        this.invalidate();
    }

    /** The distance at which the light falls to zero. `0` means it never does. */
    public get distance() {
        return this._distance;
    }

    public set distance(value) {
        this._distance = value;
        this.invalidate();
    }

    /** The exponent of the inverse-distance falloff. */
    public get decay() {
        return this._decay;
    }

    public set decay(value) {
        this._decay = value;
        this.invalidate();
    }

    constructor(type: LightType, options?: PositionalLightOptions) {
        super(type, options);

        this._position = options?.position ?? [0, 0, 0];
        this._distance = options?.distance ?? 0;
        this._decay = options?.decay ?? 2;
    }

}

/** A light radiating equally in every direction from a point. */
export class PointLight extends PositionalLight {

    constructor(options?: PointLightOptions) {
        super('point', options);
    }

}

/** A light radiating from a point, confined to a cone with an optionally soft edge. */
export class SpotLight extends PositionalLight {

    private _direction: Vector3;
    private _space: LightSpace;
    private _angle: number;
    private _penumbra: number;

    /** The direction the cone points in, normalized on assignment. */
    public get direction() {
        return this._direction;
    }

    public set direction(value) {
        this._direction = vec3Normalize(value);
        this.invalidate();
    }

    /** Whether {@link direction} and {@link PositionalLight.position} are fixed in world space or follow the camera. */
    public get space() {
        return this._space;
    }

    public set space(value) {
        this._space = value;
        this.invalidate();
    }

    /** Half-angle of the cone, in radians, clamped to below a right angle. */
    public get angle() {
        return this._angle;
    }

    public set angle(value) {
        this._angle = numberClamp(value, 0, MAX_SPOT_ANGLE);
        this.invalidate();
    }

    /** How softly the cone fades at its edge, from `0` (hard) to `1` (fully soft). */
    public get penumbra() {
        return this._penumbra;
    }

    public set penumbra(value) {
        this._penumbra = numberClamp(value, 0, 1);
        this.invalidate();
    }

    constructor(options?: SpotLightOptions) {
        super('spot', options);

        this._direction = vec3Normalize(options?.direction ?? [0, -1, 0]);
        this._space = options?.space ?? 'world';
        this._angle = numberClamp(options?.angle ?? DEFAULT_SPOT_ANGLE, 0, MAX_SPOT_ANGLE);
        this._penumbra = numberClamp(options?.penumbra ?? 0, 0, 1);
    }

}

/** Creates an {@link AmbientLight}. */
export function createAmbientLight(options?: AmbientLightOptions): AmbientLight {
    return new AmbientLight(options);
}

/** Creates a {@link HemisphereLight}. */
export function createHemisphereLight(options?: HemisphereLightOptions): HemisphereLight {
    return new HemisphereLight(options);
}

/** Creates a {@link DirectionalLight}. */
export function createDirectionalLight(options?: DirectionalLightOptions): DirectionalLight {
    return new DirectionalLight(options);
}

/** Creates a {@link PointLight}. */
export function createPointLight(options?: PointLightOptions): PointLight {
    return new PointLight(options);
}

/** Creates a {@link SpotLight}. */
export function createSpotLight(options?: SpotLightOptions): SpotLight {
    return new SpotLight(options);
}

/** Type guard that checks whether a value is any kind of {@link Light}. */
export function typeIsLight(value: unknown): value is Light {
    return value instanceof Light;
}

/** Type guard that narrows a light to an {@link AmbientLight}. */
export function lightIsAmbient(light: Light): light is AmbientLight {
    return light.type === 'ambient';
}

/** Type guard that narrows a light to a {@link HemisphereLight}. */
export function lightIsHemisphere(light: Light): light is HemisphereLight {
    return light.type === 'hemisphere';
}

/** Type guard that narrows a light to a {@link DirectionalLight}. */
export function lightIsDirectional(light: Light): light is DirectionalLight {
    return light.type === 'directional';
}

/** Type guard that narrows a light to a {@link PointLight}. */
export function lightIsPoint(light: Light): light is PointLight {
    return light.type === 'point';
}

/** Type guard that narrows a light to a {@link SpotLight}. */
export function lightIsSpot(light: Light): light is SpotLight {
    return light.type === 'spot';
}

/** Type guard that narrows a light to one that radiates from a position. */
export function lightIsPositional(light: Light): light is PositionalLight {
    return light instanceof PositionalLight;
}

/** Whether a light's orientation follows the camera rather than being fixed in world space. */
export function lightIsCameraSpace(light: Light): boolean {
    return (lightIsDirectional(light) || lightIsSpot(light)) && light.space === 'camera';
}

/**
 * Flattens a light into the numeric form {@link shadeSurface} and the scene uniform consume.
 *
 * The result is a fresh object the caller owns, so a camera-space light can be carried into world
 * space without mutating the light itself.
 *
 * @param light - The light to resolve.
 * @returns The resolved light, with its colour premultiplied by intensity.
 */
export function resolveLight(light: Light): ResolvedLight {
    const resolved: ResolvedLight = {
        type: LIGHT_TYPE_CODE[light.type],
        color: resolveLightColor(light.color, light.intensity),
        ground: [0, 0, 0],
        position: [0, 0, 0],
        direction: [0, -1, 0],
        distance: 0,
        decay: 2,
        cosOuter: -1,
        cosInner: -1,
    };

    if (lightIsHemisphere(light)) {
        resolved.ground = resolveLightColor(light.groundColor, light.intensity);
    }

    if (lightIsDirectional(light)) {
        resolved.direction = light.direction;
    }

    if (lightIsPositional(light)) {
        resolved.position = light.position;
        resolved.distance = light.distance;
        resolved.decay = light.decay;
    }

    if (lightIsSpot(light)) {
        resolved.direction = light.direction;
        resolved.cosOuter = Math.cos(light.angle);
        resolved.cosInner = Math.cos(light.angle * (1 - light.penumbra));
    }

    return resolved;
}

/**
 * An ordered, mutable collection of the lights illuminating a scene.
 *
 * Every mutation — adding, removing, or changing a property on a light already in the list —
 * notifies the owning context, so lighting changes repaint without an explicit render call.
 */
export class LightList implements Iterable<Light> {

    private _lights: Light[] = [];
    private _notify: () => void;
    private _version = 0;

    /** The number of lights in the list, enabled or not. */
    public get length(): number {
        return this._lights.length;
    }

    /** Increments on every mutation, so a consumer can cache resolved lighting between frames. */
    public get version(): number {
        return this._version;
    }

    /**
     * @param notify - Called after every mutation, and by any light in the list when it changes.
     */
    constructor(notify: () => void) {
        this._notify = notify;
    }

    /** Iterates the lights in insertion order, enabled or not. */
    public [Symbol.iterator](): Iterator<Light> {
        return this._lights[Symbol.iterator]();
    }

    /** Adds one or more lights, ignoring any already present. */
    public add(...lights: Light[]): void {
        for (const light of lights) {
            if (this._lights.includes(light)) {
                continue;
            }

            light._bind(() => this._invalidate());
            this._lights.push(light);
        }

        this._invalidate();
    }

    /** Removes one or more lights, ignoring any not present. */
    public remove(...lights: Light[]): void {
        for (const light of lights) {
            const index = this._lights.indexOf(light);

            if (index < 0) {
                continue;
            }

            light._bind(undefined);
            this._lights.splice(index, 1);
        }

        this._invalidate();
    }

    /** Removes every light. */
    public clear(): void {
        for (const light of this._lights) {
            light._bind(undefined);
        }

        this._lights.length = 0;
        this._invalidate();
    }

    /** Returns the lights as a new array, in insertion order. */
    public toArray(): Light[] {
        return [...this._lights];
    }

    /** Returns the first light of the given type, or `undefined` when there is none. */
    public find(type: LightType): Light | undefined {
        return this._lights.find(light => light.type === type);
    }

    private _invalidate(): void {
        this._version++;
        this._notify();
    }

}
