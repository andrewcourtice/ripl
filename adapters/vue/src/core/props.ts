import type {
    ComponentObjectPropsOptions,
} from 'vue';

/**
 * A prop Ripl itself types, declared here only so Vue extracts it from attrs. Runtime validation
 * would duplicate — and inevitably drift from — the element state interfaces.
 */
const ANY_PROP = {
    type: null,
    default: undefined,
} as const;

/**
 * A boolean prop. `default: undefined` is load-bearing: without an explicit default Vue casts an
 * absent boolean prop to `false`, which would override Ripl's own defaults rather than leave them
 * alone. Declaring the default keeps valueless-attribute casting (`<ripl-rect clip>`) while letting
 * an omitted prop stay omitted.
 */
const BOOLEAN_PROP = {
    type: Boolean,
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
    'pointerEvents',
] as const;

/** Plain `Shape2D` fields that change how a shape paints but emit no update event. */
export const SHAPE_FIELD_KEYS = [
    'autoFill',
    'autoStroke',
    'cachePath',
    'clip',
] as const;

/** Boolean props, which need Vue's valueless-attribute casting. */
const BOOLEAN_KEYS = new Set<string>(SHAPE_FIELD_KEYS);

/** The state properties specific to each built-in element, keyed by element type. */
export const ELEMENT_STATE_KEYS = {
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
    circle: [
        'cx',
        'cy',
        'radius',
    ],
    ellipse: [
        'cx',
        'cy',
        'endAngle',
        'radiusX',
        'radiusY',
        'startAngle',
    ],
    image: [
        'height',
        'image',
        'width',
        'x',
        'y',
    ],
    line: [
        'x1',
        'x2',
        'y1',
        'y2',
    ],
    path: [
        'height',
        'width',
        'x',
        'y',
    ],
    polygon: [
        'cx',
        'cy',
        'radius',
        'sides',
    ],
    polyline: [
        'points',
        'renderer',
        'segments',
    ],
    rect: [
        'borderRadius',
        'height',
        'width',
        'x',
        'y',
    ],
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
        BOOLEAN_KEYS.has(key) ? BOOLEAN_PROP : ANY_PROP,
    ]));
}
