import {
    BASE_STATE_KEYS,
    SHAPE_FIELD_KEYS,
} from '@ripl/vue';

/**
 * The base state a 3D shape inherits, minus `zIndex`.
 *
 * A 3D shape derives its own `zIndex` from projected depth and warns if one is assigned, so binding
 * it would be a way to make the console noisy and nothing else.
 */
export const BASE_3D_STATE_KEYS = BASE_STATE_KEYS.filter(key => key !== 'zIndex');

/** The transform and surface state every 3D shape adds on top of the shared base state. */
export const SHAPE_3D_STATE_KEYS = [
    ...BASE_3D_STATE_KEYS,
    'material',
    'rotationX',
    'rotationY',
    'rotationZ',
    'scaleX',
    'scaleY',
    'scaleZ',
    'x',
    'y',
    'z',
] as const;

/**
 * The transform a group applies to its subtree.
 *
 * These are plain fields rather than element state — a group's own state is not parameterized — so
 * they are written straight through and cannot be animated by a transition.
 */
export const GROUP_3D_FIELD_KEYS = [
    'rotationX',
    'rotationY',
    'rotationZ',
    'scale',
    'scaleX',
    'scaleY',
    'scaleZ',
    'x',
    'y',
    'z',
] as const;

/**
 * Plain fields on a 3D shape, written through an accessor rather than the state bag.
 *
 * `scale` is sugar: its setter writes all three axes, so it is not itself a state property and
 * cannot be the target of a transition — animate `scaleX`/`scaleY`/`scaleZ` instead.
 */
export const SHAPE_3D_FIELD_KEYS = [
    'faces',
    'patches',
    'scale',
    'surface',
] as const;

/** Fields that change how a 3D shape paints, so a repaint has to be requested when they change. */
export const SHAPE_3D_FIELDS = new Set<string>([
    ...SHAPE_FIELD_KEYS,
    ...SHAPE_3D_FIELD_KEYS,
]);

/** The state properties specific to each built-in 3D shape, keyed by shape type. */
export const SHAPE_3D_KEYS = {
    bezierSurface: [
        'revision',
        'segments',
    ],
    cone: [
        'height',
        'radius',
        'segments',
    ],
    cube: [
        'size',
    ],
    cylinder: [
        'height',
        'radiusBottom',
        'radiusTop',
        'segments',
    ],
    mesh: [
        'revision',
    ],
    parametric: [
        'revision',
        'uSegments',
        'vSegments',
    ],
    plane: [
        'height',
        'width',
    ],
    sphere: [
        'radius',
        'rings',
        'segments',
    ],
    torus: [
        'radialSegments',
        'radius',
        'tube',
        'tubularSegments',
    ],
} as const satisfies Record<string, readonly string[]>;
