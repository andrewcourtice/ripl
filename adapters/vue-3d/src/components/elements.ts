import {
    GROUP_3D_FIELD_KEYS,
    SHAPE_3D_FIELD_KEYS,
    SHAPE_3D_FIELDS,
    SHAPE_3D_KEYS,
    SHAPE_3D_STATE_KEYS,
} from '../core/props';

import type {
    Ripl3DElementProps,
    RiplGroup3DProps,
} from '../types';

import {
    createBezierSurface,
    createCone,
    createCube,
    createCylinder,
    createGroup3D,
    createMesh,
    createParametric,
    createPlane,
    createSphere,
    createTorus,
} from '@ripl/3d';

import type {
    BezierPatch,
    BezierSurface,
    BezierSurfaceOptions,
    BezierSurfaceState,
    Cone,
    ConeState,
    Cube,
    CubeState,
    Cylinder,
    CylinderState,
    Face3D,
    Group3D,
    Group3DOptions,
    Mesh,
    MeshOptions,
    MeshState,
    Parametric,
    ParametricOptions,
    ParametricState,
    ParametricSurface,
    Plane,
    PlaneState,
    Shape3DOptions,
    Sphere,
    SphereState,
    Torus,
    TorusState,
} from '@ripl/3d';

import {
    defineRiplElement,
    elementFactory,
} from '@ripl/vue';

import type {
    RiplComponent,
    RiplFieldWriters,
} from '@ripl/vue';

/** The definition fields every 3D shape shares: no `zIndex`, plus the 3D transform and `material`. */
const SHAPE_3D = {
    baseStateKeys: SHAPE_3D_STATE_KEYS,
    fieldKeys: SHAPE_3D_FIELD_KEYS,
    paintedKeys: SHAPE_3D_FIELDS,
} as const;

// Geometry payloads are held by reference behind a revision counter, so replacing one goes through
// the shape's own method rather than an assignment it has no setter for.
const GEOMETRY_WRITERS = {
    faces: (element, value) => (element as Mesh).setFaces(value as Face3D[]),
    patches: (element, value) => (element as BezierSurface).setPatches(value as BezierPatch[]),
    surface: (element, value) => (element as Parametric).setSurface(value as ParametricSurface),
} satisfies RiplFieldWriters;

/**
 * Groups its children, composing its transform onto theirs and cascading its state to them.
 *
 * A group's transform is not element state, so it applies immediately and cannot be animated by a
 * `<ripl-transition>`. Animate the children instead.
 *
 * @example
 * <ripl-group-3d :rotation-y="angle">
 *     <ripl-cube :size="1" :x="-1"/>
 *     <ripl-cube :size="1" :x="1"/>
 * </ripl-group-3d>
 */
export const RiplGroup3D = defineRiplElement({
    name: 'RiplGroup3D',
    stateKeys: [],
    baseStateKeys: SHAPE_3D_STATE_KEYS.filter(key => !GROUP_3D_FIELD_KEYS.includes(key as never)),
    fieldKeys: GROUP_3D_FIELD_KEYS,
    paintedKeys: new Set<string>(GROUP_3D_FIELD_KEYS),
    container: true,
    create: elementFactory<Group3DOptions>(createGroup3D),
}) as unknown as RiplComponent<RiplGroup3DProps, Group3D>;

/** A cube with uniform edge length. */
export const RiplCube = defineRiplElement({
    ...SHAPE_3D,
    name: 'RiplCube',
    stateKeys: SHAPE_3D_KEYS.cube,
    create: elementFactory<Shape3DOptions<CubeState>>(createCube),
}) as unknown as RiplComponent<Ripl3DElementProps<CubeState>, Cube>;

/** A sphere, tessellated into longitudinal segments and latitudinal rings. */
export const RiplSphere = defineRiplElement({
    ...SHAPE_3D,
    name: 'RiplSphere',
    stateKeys: SHAPE_3D_KEYS.sphere,
    create: elementFactory<Shape3DOptions<SphereState>>(createSphere),
}) as unknown as RiplComponent<Ripl3DElementProps<SphereState>, Sphere>;

/** A cylinder, or a truncated cone when its two cap radii differ. */
export const RiplCylinder = defineRiplElement({
    ...SHAPE_3D,
    name: 'RiplCylinder',
    stateKeys: SHAPE_3D_KEYS.cylinder,
    create: elementFactory<Shape3DOptions<CylinderState>>(createCylinder),
}) as unknown as RiplComponent<Ripl3DElementProps<CylinderState>, Cylinder>;

/** A cone rising from a circular base. */
export const RiplCone = defineRiplElement({
    ...SHAPE_3D,
    name: 'RiplCone',
    stateKeys: SHAPE_3D_KEYS.cone,
    create: elementFactory<Shape3DOptions<ConeState>>(createCone),
}) as unknown as RiplComponent<Ripl3DElementProps<ConeState>, Cone>;

/** A flat rectangle in the XY plane. */
export const RiplPlane = defineRiplElement({
    ...SHAPE_3D,
    name: 'RiplPlane',
    stateKeys: SHAPE_3D_KEYS.plane,
    create: elementFactory<Shape3DOptions<PlaneState>>(createPlane),
}) as unknown as RiplComponent<Ripl3DElementProps<PlaneState>, Plane>;

/** A torus: a tube swept around a major ring. */
export const RiplTorus = defineRiplElement({
    ...SHAPE_3D,
    name: 'RiplTorus',
    stateKeys: SHAPE_3D_KEYS.torus,
    create: elementFactory<Shape3DOptions<TorusState>>(createTorus),
}) as unknown as RiplComponent<Ripl3DElementProps<TorusState>, Torus>;

/** An arbitrary mesh built from an explicit face list. */
export const RiplMesh = defineRiplElement({
    ...SHAPE_3D,
    name: 'RiplMesh',
    fieldWriters: GEOMETRY_WRITERS,
    stateKeys: SHAPE_3D_KEYS.mesh,
    create: elementFactory<MeshOptions>(createMesh),
}) as unknown as RiplComponent<Ripl3DElementProps<MeshState>, Mesh>;

/** A surface tessellated from a parametric function of two variables. */
export const RiplParametric = defineRiplElement({
    ...SHAPE_3D,
    name: 'RiplParametric',
    fieldWriters: GEOMETRY_WRITERS,
    stateKeys: SHAPE_3D_KEYS.parametric,
    create: elementFactory<ParametricOptions>(createParametric),
}) as unknown as RiplComponent<Ripl3DElementProps<ParametricState>, Parametric>;

/** A surface tessellated from one or more bicubic Bézier patches. */
export const RiplBezierSurface = defineRiplElement({
    ...SHAPE_3D,
    name: 'RiplBezierSurface',
    fieldWriters: GEOMETRY_WRITERS,
    stateKeys: SHAPE_3D_KEYS.bezierSurface,
    create: elementFactory<BezierSurfaceOptions>(createBezierSurface),
}) as unknown as RiplComponent<Ripl3DElementProps<BezierSurfaceState>, BezierSurface>;
