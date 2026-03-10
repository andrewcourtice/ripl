import {
    Shape3D,
} from '../core/shape';

import type {
    Face3D,
    Shape3DOptions,
    Shape3DState,
} from '../core/shape';

/** State interface for a plane, defining width and height. */
export interface PlaneState extends Shape3DState {
    width: number;
    height: number;
}

/** A flat rectangular 3D plane oriented along the XY plane. */
export class Plane extends Shape3D<PlaneState> {

    public get width() {
        return this.getStateValue('width');
    }

    public set width(value) {
        this.setStateValue('width', value);
    }

    public get height() {
        return this.getStateValue('height');
    }

    public set height(value) {
        this.setStateValue('height', value);
    }

    constructor(options: Shape3DOptions<PlaneState>) {
        super('plane', options);
    }

    protected computeFaces(): Face3D[] {
        const hw = this.width / 2;
        const hh = this.height / 2;

        return [
            {
                vertices: [
                    [-hw, -hh, 0],
                    [hw, -hh, 0],
                    [hw, hh, 0],
                    [-hw, hh, 0],
                ],
                normal: [0, 0, 1],
            },
        ];
    }

}

/** Factory function that creates a new `Plane` instance. */
export function createPlane(...options: ConstructorParameters<typeof Plane>) {
    return new Plane(...options);
}

/** Type guard that checks whether a value is a `Plane` instance. */
export function elementIsPlane(value: unknown): value is Plane {
    return value instanceof Plane;
}
