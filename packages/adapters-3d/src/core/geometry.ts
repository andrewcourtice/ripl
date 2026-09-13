import type {
    RiplFieldWriters,
} from '@ripl/adapters';

import type {
    BezierPatch,
    BezierSurface,
    Face3D,
    Mesh,
    Parametric,
    ParametricSurface,
} from '@ripl/3d';

// Geometry payloads are held by reference behind a revision counter, so replacing one goes through
// the shape's own method rather than an assignment it has no setter for.
/** Write overrides for the geometry payloads a 3D shape exposes through a method. */
export const GEOMETRY_WRITERS = {
    /** Replaces a mesh's face list. */
    faces: (element, value) => (element as Mesh).setFaces(value as Face3D[]),
    /** Replaces a Bézier surface's patch list. */
    patches: (element, value) => (element as BezierSurface).setPatches(value as BezierPatch[]),
    /** Replaces a parametric shape's surface function. */
    surface: (element, value) => (element as Parametric).setSurface(value as ParametricSurface),
} satisfies RiplFieldWriters;
