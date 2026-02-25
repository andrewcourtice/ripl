import {
    Shape3D,
} from '../core/shape';

import type {
    Face3D,
    Shape3DOptions,
    Shape3DState,
} from '../core/shape';

import type {
    Vector3,
} from '../math/vector';

export interface TorusState extends Shape3DState {
    radius: number;
    tube: number;
    radialSegments: number;
    tubularSegments: number;
}

export class Torus extends Shape3D<TorusState> {

    public get radius() {
        return this.getStateValue('radius');
    }

    public set radius(value) {
        this.setStateValue('radius', value);
    }

    public get tube() {
        return this.getStateValue('tube');
    }

    public set tube(value) {
        this.setStateValue('tube', value);
    }

    public get radialSegments() {
        return this.getStateValue('radialSegments');
    }

    public set radialSegments(value) {
        this.setStateValue('radialSegments', value);
    }

    public get tubularSegments() {
        return this.getStateValue('tubularSegments');
    }

    public set tubularSegments(value) {
        this.setStateValue('tubularSegments', value);
    }

    constructor(options: Shape3DOptions<TorusState>) {
        super('torus', {
            radialSegments: 12,
            tubularSegments: 24,
            ...options,
        });
    }

    protected computeFaces(): Face3D[] {
        const faces: Face3D[] = [];
        const radSegs = this.radialSegments;
        const tubSegs = this.tubularSegments;
        const radius = this.radius;
        const tube = this.tube;

        for (let ti = 0; ti < tubSegs; ti++) {
            const u1 = (ti / tubSegs) * Math.PI * 2;
            const u2 = ((ti + 1) / tubSegs) * Math.PI * 2;

            for (let ri = 0; ri < radSegs; ri++) {
                const v1 = (ri / radSegs) * Math.PI * 2;
                const v2 = ((ri + 1) / radSegs) * Math.PI * 2;

                faces.push({
                    vertices: [
                        torusVertex(radius, tube, u1, v1),
                        torusVertex(radius, tube, u2, v1),
                        torusVertex(radius, tube, u2, v2),
                        torusVertex(radius, tube, u1, v2),
                    ],
                });
            }
        }

        return faces;
    }

}

// eslint-disable-next-line id-length
function torusVertex(radius: number, tube: number, u: number, v: number): Vector3 {
    return [
        (radius + tube * Math.cos(v)) * Math.cos(u),
        tube * Math.sin(v),
        (radius + tube * Math.cos(v)) * Math.sin(u),
    ];
}

export function createTorus(...options: ConstructorParameters<typeof Torus>) {
    return new Torus(...options);
}

export function elementIsTorus(value: unknown): value is Torus {
    return value instanceof Torus;
}
