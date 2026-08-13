import {
    Shape3D,
} from '../core/shape';

import type {
    Face3D,
    Shape3DOptions,
    Shape3DState,
} from '../core/shape';

import type {
    Vector2,
} from '../math/vector2';

import type {
    Vector3,
} from '../math/vector';

import type {
    Shape3DDefaults,
} from '../core/shape';

import {
    interpolateNumber,
} from '@ripl/core';

const FACE_UVS: Vector2[] = [
    [0, 1],
    [1, 1],
    [1, 0],
    [0, 0],
];

/** State interface for a cube, defining uniform edge size. */
export interface CubeState extends Shape3DState {
    /** The length of each edge of the cube, in world units. */
    size: number;
}

const CUBE_DEFAULTS: Shape3DDefaults<CubeState> = {
    interpolators: {
        size: interpolateNumber,
    },
};

/** A 3D cube shape with uniform edge size. */
export class Cube extends Shape3D<CubeState> {

    /** The length of each edge of the cube, in world units. */
    public get size() {
        return this.getStateValue('size');
    }

    public set size(value) {
        this.setStateValue('size', value);
    }

    constructor(options: Shape3DOptions<CubeState>) {
        super('cube', options, CUBE_DEFAULTS);
    }

    protected computeFaces(): Face3D[] {
        const hs = this.size / 2;

        // 0: left-bottom-back, 1: right-bottom-back, 2: right-top-back, 3: left-top-back
        // 4: left-bottom-front, 5: right-bottom-front, 6: right-top-front, 7: left-top-front
        const vertices: Vector3[] = [
            [-hs, -hs, -hs],
            [hs, -hs, -hs],
            [hs, hs, -hs],
            [-hs, hs, -hs],
            [-hs, -hs, hs],
            [hs, -hs, hs],
            [hs, hs, hs],
            [-hs, hs, hs],
        ];

        // Each face carries the whole texture, which is the convention a cube map asset assumes.
        return [
            {
                vertices: [vertices[4], vertices[5], vertices[6], vertices[7]],
                normal: [0, 0, 1],
                uvs: FACE_UVS,
            },
            {
                vertices: [vertices[1], vertices[0], vertices[3], vertices[2]],
                normal: [0, 0, -1],
                uvs: FACE_UVS,
            },
            {
                vertices: [vertices[7], vertices[6], vertices[2], vertices[3]],
                normal: [0, 1, 0],
                uvs: FACE_UVS,
            },
            {
                vertices: [vertices[0], vertices[1], vertices[5], vertices[4]],
                normal: [0, -1, 0],
                uvs: FACE_UVS,
            },
            {
                vertices: [vertices[5], vertices[1], vertices[2], vertices[6]],
                normal: [1, 0, 0],
                uvs: FACE_UVS,
            },
            {
                vertices: [vertices[0], vertices[4], vertices[7], vertices[3]],
                normal: [-1, 0, 0],
                uvs: FACE_UVS,
            },
        ];
    }

}

/** Factory function that creates a new `Cube` instance. */
export function createCube(...options: ConstructorParameters<typeof Cube>) {
    return new Cube(...options);
}

/** Type guard that checks whether a value is a `Cube` instance. */
export function elementIsCube(value: unknown): value is Cube {
    return value instanceof Cube;
}
