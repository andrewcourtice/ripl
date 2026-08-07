import {
    mat4Compose,
} from '../math/matrix';

import type {
    Matrix4,
} from '../math/matrix';

import type {
    Vector3,
} from '../math/vector';

import {
    Group,
} from '@ripl/core';

import type {
    ElementEventMap,
} from '@ripl/core';

/** Options for constructing a {@link Group3D}. */
export interface Group3DOptions {
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
    /** A uniform scale, applied to all three axes. Overridden by any per-axis scale also given. */
    scale?: number;
}

/**
 * A group whose transform composes into the model matrix of every {@link Shape3D} beneath it.
 *
 * The plain 2D `Group` nests elements without a 3D transform, which is all a flat scene needs. This
 * is the one to reach for when a subtree should orbit, tilt or scale as a unit — a solar system, an
 * articulated arm, an exploded assembly. Groups nest, and each level composes onto the last.
 *
 * The transform lives outside element state, because a group's own state is not parameterized. It
 * therefore cannot be driven by `renderer.transition`; animate it from the render tick, or animate
 * the children instead.
 *
 * @example
 * const arm = createGroup3D({ rotationY: Math.PI / 4 });
 *
 * arm.add(createCube({ size: 1, x: 2 }));
 * scene.add(arm);
 */
export class Group3D<TEventMap extends ElementEventMap = ElementEventMap> extends Group<TEventMap> {

    private _position: Vector3;
    private _rotation: Vector3;
    private _scale: Vector3;

    /** The X position of the group's origin in world space. */
    public get x() {
        return this._position[0];
    }

    public set x(value: number) {
        this._position[0] = value;
        this._invalidate();
    }

    /** The Y position of the group's origin in world space. */
    public get y() {
        return this._position[1];
    }

    public set y(value: number) {
        this._position[1] = value;
        this._invalidate();
    }

    /** The Z position of the group's origin in world space. */
    public get z() {
        return this._position[2];
    }

    public set z(value: number) {
        this._position[2] = value;
        this._invalidate();
    }

    /** The rotation around the X axis, in radians. */
    public get rotationX() {
        return this._rotation[0];
    }

    public set rotationX(value: number) {
        this._rotation[0] = value;
        this._invalidate();
    }

    /** The rotation around the Y axis, in radians. */
    public get rotationY() {
        return this._rotation[1];
    }

    public set rotationY(value: number) {
        this._rotation[1] = value;
        this._invalidate();
    }

    /** The rotation around the Z axis, in radians. */
    public get rotationZ() {
        return this._rotation[2];
    }

    public set rotationZ(value: number) {
        this._rotation[2] = value;
        this._invalidate();
    }

    /** The scale along the X axis. */
    public get scaleX() {
        return this._scale[0];
    }

    public set scaleX(value: number) {
        this._scale[0] = value;
        this._invalidate();
    }

    /** The scale along the Y axis. */
    public get scaleY() {
        return this._scale[1];
    }

    public set scaleY(value: number) {
        this._scale[1] = value;
        this._invalidate();
    }

    /** The scale along the Z axis. */
    public get scaleZ() {
        return this._scale[2];
    }

    public set scaleZ(value: number) {
        this._scale[2] = value;
        this._invalidate();
    }

    /** The uniform scale. Reads back the X scale; writing sets all three axes. */
    public get scale() {
        return this._scale[0];
    }

    public set scale(value: number) {
        this._scale = [value, value, value];
        this._invalidate();
    }

    /** @param options - The group's transform, plus anything a plain group accepts. */
    constructor(options?: Group3DOptions & ConstructorParameters<typeof Group>[0]) {
        const {
            x = 0,
            y = 0,
            z = 0,
            rotationX = 0,
            rotationY = 0,
            rotationZ = 0,
            scale = 1,
            scaleX = scale,
            scaleY = scale,
            scaleZ = scale,
            ...groupOptions
        } = options ?? {};

        super(groupOptions);

        this._position = [x, y, z];
        this._rotation = [rotationX, rotationY, rotationZ];
        this._scale = [scaleX, scaleY, scaleZ];
    }

    /**
     * The group's own transform, which descendants compose into their model matrices.
     *
     * {@link Shape3D} discovers this structurally while walking its ancestors, so a plain 2D group in
     * the chain simply does not answer and contributes nothing.
     */
    public getGroupMatrix3D(): Matrix4 {
        return mat4Compose(this._position, this._rotation, this._scale);
    }

    private _invalidate(): void {
        this.context?.requestRender();
    }

}

/** Creates a {@link Group3D}. */
export function createGroup3D<TEventMap extends ElementEventMap = ElementEventMap>(
    options?: Group3DOptions & ConstructorParameters<typeof Group>[0]
) {
    return new Group3D<TEventMap>(options);
}

/** Type guard that checks whether a value is a {@link Group3D}. */
export function elementIsGroup3D(value: unknown): value is Group3D {
    return value instanceof Group3D;
}
