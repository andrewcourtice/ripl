import type {
    ComponentObjectPropsOptions,
} from 'vue';

/**
 * A prop Ripl itself types, declared here only so Vue extracts it from attrs. Runtime validation
 * would duplicate — and inevitably drift from — the element state interfaces.
 */
export const ANY_PROP = {
    /** Vue's runtime type check for any value. */
    type: null,
    /** Absent means unset, so an omitted prop leaves the Ripl default alone. */
    default: undefined,
} as const;

/**
 * A boolean prop. `default: undefined` is load-bearing: without an explicit default Vue casts an
 * absent boolean prop to `false`, which would override Ripl's own defaults rather than leave them
 * alone. Declaring the default keeps valueless-attribute casting (`<ripl-rect clip>`) while letting
 * an omitted prop stay omitted.
 */
export const BOOLEAN_PROP = {
    /** Vue's runtime type check for a boolean. */
    type: Boolean,
    /** Absent means unset, so an omitted prop leaves the Ripl default alone. */
    default: undefined,
} as const;

/** A numeric prop, left undefined when absent so it cannot override a Ripl default. */
export const NUMBER_PROP = {
    /** Vue's runtime type check for a number. */
    type: Number,
    /** Absent means unset, so an omitted prop leaves the Ripl default alone. */
    default: undefined,
} as const;

/** Every inheritable visual state property shared by all elements. */
export const BASE_STATE_KEYS = [
    'direction',
    'fill',
    'filter',
    'font',
    'fontKerning',
    'globalCompositeOperation',
    'lineCap',
    'lineDash',
    'lineDashOffset',
    'lineJoin',
    'lineWidth',
    'miterLimit',
    'opacity',
    'rotation',
    'shadowBlur',
    'shadowColor',
    'shadowOffsetX',
    'shadowOffsetY',
    'stroke',
    'textAlign',
    'textBaseline',
    'transformOriginX',
    'transformOriginY',
    'transformScaleX',
    'transformScaleY',
    'translateX',
    'translateY',
    'zIndex',
] as const;

/** Construction options that become plain fields on the element rather than animatable state. */
export const ELEMENT_OPTION_KEYS = [
    'class',
    'data',
    'id',
    'interpolators',
    'pointerEvents',
] as const;

/** Options an element only reads when it is constructed, so they cannot be synced on a prop change. */
export const CONSTRUCTION_ONLY_KEYS = new Set<string>(['interpolators']);

/** Plain `Shape2D` fields that change how a shape paints but emit no update event. */
export const SHAPE_FIELD_KEYS = [
    'autoFill',
    'autoStroke',
    'cachePath',
    'clip',
] as const;

/**
 * Plain fields that change how a shape paints. They are also the adapter's only boolean props, so
 * this doubles as the set needing Vue's valueless-attribute casting.
 */
export const SHAPE_FIELDS = new Set<string>(SHAPE_FIELD_KEYS);

/** The state properties specific to each built-in element, keyed by element type. */
export const ELEMENT_STATE_KEYS = {
    /** The state properties specific to an arc. */
    arc: [
        'borderRadius',
        'cx',
        'cy',
        'endAngle',
        'innerRadius',
        'padAngle',
        'padWidth',
        'radius',
        'startAngle',
    ],
    /** The state properties specific to a circle. */
    circle: [
        'cx',
        'cy',
        'radius',
    ],
    /** The state properties specific to an ellipse. */
    ellipse: [
        'cx',
        'cy',
        'endAngle',
        'radiusX',
        'radiusY',
        'startAngle',
    ],
    /** The state properties specific to an image. */
    image: [
        'height',
        'image',
        'width',
        'x',
        'y',
    ],
    /** The state properties specific to a line. */
    line: [
        'x1',
        'x2',
        'y1',
        'y2',
    ],
    /** The state properties specific to a path. */
    path: [
        'height',
        'width',
        'x',
        'y',
    ],
    /** The state properties specific to a polygon. */
    polygon: [
        'cx',
        'cy',
        'radius',
        'sides',
    ],
    /** The state properties specific to a polyline. */
    polyline: [
        'points',
        'renderer',
        'segments',
    ],
    /** The state properties specific to a rect. */
    rect: [
        'borderRadius',
        'height',
        'width',
        'x',
        'y',
    ],
    /** The state properties specific to a text run. */
    text: [
        'content',
        'pathData',
        'startOffset',
        'x',
        'y',
    ],
} as const satisfies Record<string, readonly string[]>;

/** Builds a Vue runtime props declaration from a list of prop names. */
export function createProps(keys: readonly string[]): ComponentObjectPropsOptions {
    return Object.fromEntries(keys.map(key => [
        key,
        SHAPE_FIELDS.has(key) ? BOOLEAN_PROP : ANY_PROP,
    ]));
}
