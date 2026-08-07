import {
    Shape3D,
} from '../core/shape';

import type {
    Face3D,
    Shape3DOptions,
    Shape3DState,
} from '../core/shape';

/** State for a mesh built from an explicit face list. */
export interface MeshState extends Shape3DState {
    /** A counter bumped whenever the face list is replaced, invalidating the cached geometry. */
    revision: number;
}

/** Options for constructing a {@link Mesh}. */
export interface MeshOptions extends Shape3DOptions<MeshState> {
    /** The faces the mesh is built from. Held by reference and never copied. */
    faces?: Face3D[];
}

/**
 * A mesh built from an explicit list of faces.
 *
 * The escape hatch for geometry no primitive covers — imported models, procedurally generated
 * surfaces, hand-built assemblies. The faces live outside element state and are only read, because
 * `computeFaces` fires on every cache invalidation; call {@link setFaces} to replace them.
 *
 * @example
 * const mesh = createMesh({
 *     faces: [{ vertices: [[0, 0, 0], [1, 0, 0], [0, 1, 0]] }],
 *     fill: '#4488cc',
 * });
 */
export class Mesh extends Shape3D<MeshState> {

    private _faces: Face3D[];

    /** A counter bumped whenever the face list is replaced. */
    public get revision() {
        return this.getStateValue('revision');
    }

    /** The faces this mesh is built from. */
    public get faces() {
        return this._faces;
    }

    constructor(options?: MeshOptions) {
        const {
            faces = [],
            ...state
        } = options ?? {};

        super('mesh', {
            revision: 0,
            ...state,
        });

        this._faces = faces;
    }

    /**
     * Replaces the face list, invalidating the cached geometry.
     *
     * @param faces - The new faces, held by reference.
     */
    public setFaces(faces: Face3D[]): void {
        this._faces = faces;
        this.setStateValue('revision', this.revision + 1);
    }

    protected computeFaces(): Face3D[] {
        return this._faces;
    }

}

/** Creates a {@link Mesh} from an explicit face list. */
export function createMesh(options?: MeshOptions) {
    return new Mesh(options);
}

/** Type guard that checks whether a value is a {@link Mesh} instance. */
export function elementIsMesh(value: unknown): value is Mesh {
    return value instanceof Mesh;
}
