/**
 * The tag used for a node's marker in an adapter's hidden DOM mirror. Hyphenated so browsers treat
 * it as an undefined custom element (a plain `HTMLElement`) rather than `HTMLUnknownElement`.
 */
export const MARKER_TAG = 'ripl-node';

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

/**
 * Construction options that become plain fields on the element rather than animatable state,
 * excluding the class binding.
 *
 * The class binding is left out because its prop name differs per framework — `class` in a template
 * language, `className` in JSX — so each adapter composes its own key list around this one.
 */
export const ELEMENT_OPTION_KEYS_BASE = [
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

/** Plain fields that change how a shape paints. */
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
