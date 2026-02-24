import {
    Shape3D,
} from '../core/shape3d';

import type {
    Face3D,
    Shape3DOptions,
    Shape3DState,
} from '../core/shape3d';

import type {
    Vector3,
} from '../math/vector';

export interface CubeState extends Shape3DState {
    size: number;
}

export class Cube extends Shape3D<CubeState> {

    public get size() {
        return this.getStateValue('size');
    }

    public set size(value) {
        this.setStateValue('size', value);
    }

    constructor(options: Shape3DOptions<CubeState>) {
        super('cube', options);
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

        return [
            {
                vertices: [vertices[4], vertices[5], vertices[6], vertices[7]],
                normal: [0, 0, 1],
            },
            {
                vertices: [vertices[1], vertices[0], vertices[3], vertices[2]],
                normal: [0, 0, -1],
            },
            {
                vertices: [vertices[7], vertices[6], vertices[2], vertices[3]],
                normal: [0, 1, 0],
            },
            {
                vertices: [vertices[0], vertices[1], vertices[5], vertices[4]],
                normal: [0, -1, 0],
            },
            {
                vertices: [vertices[5], vertices[1], vertices[2], vertices[6]],
                normal: [1, 0, 0],
            },
            {
                vertices: [vertices[0], vertices[4], vertices[7], vertices[3]],
                normal: [-1, 0, 0],
            },
        ];
    }

}

export function createCube(...options: ConstructorParameters<typeof Cube>) {
    return new Cube(...options);
}

export function elementIsCube(value: unknown): value is Cube {
    return value instanceof Cube;
}
