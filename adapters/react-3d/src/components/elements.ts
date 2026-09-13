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
    BezierSurface,
    BezierSurfaceOptions,
    BezierSurfaceState,
    Cone,
    ConeState,
    Cube,
    CubeState,
    Cylinder,
    CylinderState,
    Group3D,
    Group3DOptions,
    Mesh,
    MeshOptions,
    MeshState,
    Parametric,
    ParametricOptions,
    ParametricState,
    Plane,
    PlaneState,
    Shape3DOptions,
    Sphere,
    SphereState,
    Torus,
    TorusState,
} from '@ripl/3d';

import {
    GEOMETRY_WRITERS,
    GROUP_3D_DEFINITION,
    SHAPE_3D_DEFINITION,
    SHAPE_3D_KEYS,
} from '@ripl/adapters-3d';

import {
    defineRiplElement,
    elementFactory,
} from '@ripl/react';

import type {
    RiplComponent,
} from '@ripl/react';

/**
 * Groups its children, composing its transform onto theirs and cascading its state to them.
 *
 * A group's transform is not element state, so it applies immediately and cannot be animated by a
 * `<RiplTransition>`. Animate the children instead.
 *
 * @example
 * <RiplGroup3D rotationY={angle}>
 *     <RiplCube size={1} x={-1}/>
 *     <RiplCube size={1} x={1}/>
 * </RiplGroup3D>
 */
export const RiplGroup3D = defineRiplElement({
    ...GROUP_3D_DEFINITION,
    name: 'RiplGroup3D',
    stateKeys: [],
    container: true,
    create: elementFactory<Group3DOptions>(createGroup3D),
}) as unknown as RiplComponent<RiplGroup3DProps, Group3D>;

/** A cube with uniform edge length. */
export const RiplCube = defineRiplElement({
    ...SHAPE_3D_DEFINITION,
    name: 'RiplCube',
    stateKeys: SHAPE_3D_KEYS.cube,
    create: elementFactory<Shape3DOptions<CubeState>>(createCube),
}) as unknown as RiplComponent<Ripl3DElementProps<CubeState>, Cube>;

/** A sphere, tessellated into longitudinal segments and latitudinal rings. */
export const RiplSphere = defineRiplElement({
    ...SHAPE_3D_DEFINITION,
    name: 'RiplSphere',
    stateKeys: SHAPE_3D_KEYS.sphere,
    create: elementFactory<Shape3DOptions<SphereState>>(createSphere),
}) as unknown as RiplComponent<Ripl3DElementProps<SphereState>, Sphere>;

/** A cylinder, or a truncated cone when its two cap radii differ. */
export const RiplCylinder = defineRiplElement({
    ...SHAPE_3D_DEFINITION,
    name: 'RiplCylinder',
    stateKeys: SHAPE_3D_KEYS.cylinder,
    create: elementFactory<Shape3DOptions<CylinderState>>(createCylinder),
}) as unknown as RiplComponent<Ripl3DElementProps<CylinderState>, Cylinder>;

/** A cone rising from a circular base. */
export const RiplCone = defineRiplElement({
    ...SHAPE_3D_DEFINITION,
    name: 'RiplCone',
    stateKeys: SHAPE_3D_KEYS.cone,
    create: elementFactory<Shape3DOptions<ConeState>>(createCone),
}) as unknown as RiplComponent<Ripl3DElementProps<ConeState>, Cone>;

/** A flat rectangle in the XY plane. */
export const RiplPlane = defineRiplElement({
    ...SHAPE_3D_DEFINITION,
    name: 'RiplPlane',
    stateKeys: SHAPE_3D_KEYS.plane,
    create: elementFactory<Shape3DOptions<PlaneState>>(createPlane),
}) as unknown as RiplComponent<Ripl3DElementProps<PlaneState>, Plane>;

/** A torus: a tube swept around a major ring. */
export const RiplTorus = defineRiplElement({
    ...SHAPE_3D_DEFINITION,
    name: 'RiplTorus',
    stateKeys: SHAPE_3D_KEYS.torus,
    create: elementFactory<Shape3DOptions<TorusState>>(createTorus),
}) as unknown as RiplComponent<Ripl3DElementProps<TorusState>, Torus>;

/** An arbitrary mesh built from an explicit face list. */
export const RiplMesh = defineRiplElement({
    ...SHAPE_3D_DEFINITION,
    name: 'RiplMesh',
    fieldWriters: GEOMETRY_WRITERS,
    stateKeys: SHAPE_3D_KEYS.mesh,
    create: elementFactory<MeshOptions>(createMesh),
}) as unknown as RiplComponent<Ripl3DElementProps<MeshState>, Mesh>;

/** A surface tessellated from a parametric function of two variables. */
export const RiplParametric = defineRiplElement({
    ...SHAPE_3D_DEFINITION,
    name: 'RiplParametric',
    fieldWriters: GEOMETRY_WRITERS,
    stateKeys: SHAPE_3D_KEYS.parametric,
    create: elementFactory<ParametricOptions>(createParametric),
}) as unknown as RiplComponent<Ripl3DElementProps<ParametricState>, Parametric>;

/** A surface tessellated from one or more bicubic Bézier patches. */
export const RiplBezierSurface = defineRiplElement({
    ...SHAPE_3D_DEFINITION,
    name: 'RiplBezierSurface',
    fieldWriters: GEOMETRY_WRITERS,
    stateKeys: SHAPE_3D_KEYS.bezierSurface,
    create: elementFactory<BezierSurfaceOptions>(createBezierSurface),
}) as unknown as RiplComponent<Ripl3DElementProps<BezierSurfaceState>, BezierSurface>;
