import {
    getDocsUrl,
} from './docs';

/** Core 2D elements, each documented under `/docs/core/elements/`. */
const CORE_ELEMENT_TYPES = [
    'arc',
    'circle',
    'ellipse',
    'image',
    'line',
    'path',
    'polygon',
    'polyline',
    'rect',
    'text',
];

/** 3D shapes from `@ripl/3d`, each documented under `/docs/3d/shapes/`. */
const SHAPE_3D_TYPES = [
    'cone',
    'cube',
    'cylinder',
    'plane',
    'sphere',
    'torus',
];

function toDocsEntries(types: string[], prefix: string): [string, string][] {
    return types.map(type => [type, getDocsUrl(`${prefix}/${type}.html`)]);
}

/**
 * Documentation URL per built-in element type. Membership is what makes an element "built-in":
 * a type absent from this map came from consumer code and gets no badge or link.
 */
const BUILT_IN_DOCS = new Map<string, string>([
    ...toDocsEntries(CORE_ELEMENT_TYPES, '/docs/core/elements'),
    ...toDocsEntries(SHAPE_3D_TYPES, '/docs/3d/shapes'),
    ['group', getDocsUrl('/docs/core/essentials/group.html')],
    ['scene', getDocsUrl('/docs/core/essentials/scene.html')],
    ['context', getDocsUrl('/docs/core/essentials/context.html')],
    ['ribbon', getDocsUrl('/charts/chord.html')],
    ['sankey-link', getDocsUrl('/charts/sankey.html')],
]);

/**
 * Determines whether an element type is one of Ripl's own, as opposed to a custom element
 * defined by the inspected page.
 *
 * @param elementType - The serialized element type (e.g. `circle`, `group`).
 * @returns Whether Ripl ships the element.
 */
export function elementTypeIsBuiltIn(elementType: string): boolean {
    return BUILT_IN_DOCS.has(elementType);
}

/**
 * Returns the documentation URL for a built-in element type.
 *
 * @param elementType - The serialized element type (e.g. `circle`, `group`).
 * @returns The absolute docs URL, or `undefined` for a type Ripl does not ship.
 */
export function getElementDocsUrl(elementType: string): string | undefined {
    return BUILT_IN_DOCS.get(elementType);
}
