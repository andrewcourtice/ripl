import {
    TREE_CHUNK_SIZE,
} from './constants';

import type {
    ContextInfo,
    SerializedNode,
    SerializedProperty,
} from './protocol';

import type {
    DevtoolsBinding,
} from './registry';

import {
    isGroup,
} from '@ripl/core';

import type {
    Element,
    Scene,
} from '@ripl/core';

import {
    typeIsArray,
    typeIsBoolean,
    typeIsFunction,
    typeIsNumber,
    typeIsObject,
    typeIsString,
} from '@ripl/utilities';

const HEX_COLOR_PATTERN = /^#(?:[0-9a-f]{3}|[0-9a-f]{6}|[0-9a-f]{8})$/i;

const COLOR_FUNCTION_PREFIXES = [
    'rgb(',
    'rgba(',
    'hsl(',
    'hsla(',
];

const OPAQUE_PREVIEW_LENGTH = 60;

function stringIsColor(value: string): boolean {
    const normalized = value.trim().toLowerCase();

    return HEX_COLOR_PATTERN.test(normalized)
        || COLOR_FUNCTION_PREFIXES.some(prefix => normalized.startsWith(prefix));
}

function getOpaquePreview(value: unknown): string {
    if (typeIsFunction(value)) {
        return `function ${value.name || 'anonymous'}()`;
    }

    if (typeIsObject(value)) {
        const name = value.constructor?.name;

        if (name && name !== 'Object') {
            return name;
        }
    }

    const preview = String(value);

    return preview.length > OPAQUE_PREVIEW_LENGTH
        ? `${preview.slice(0, OPAQUE_PREVIEW_LENGTH)}…`
        : preview;
}

/**
 * Serializes a single element state value into its wire representation, tagging it with a
 * {@link SerializedProperty.valueType} the devtools uses to render and (where editable) edit it.
 * Non-transferable values (functions, gradients, objects) become non-editable `opaque`
 * properties carrying only a short preview string.
 *
 * @param key - The state key on the element.
 * @param value - The raw state value.
 * @returns The serialized property.
 */
export function serializeProperty(key: string, value: unknown): SerializedProperty {
    if (typeIsNumber(value) && Number.isFinite(value)) {
        return {
            key,
            valueType: 'number',
            editable: true,
            value,
        };
    }

    if (typeIsString(value)) {
        return {
            key,
            valueType: stringIsColor(value) ? 'color' : 'string',
            editable: true,
            value,
        };
    }

    if (typeIsBoolean(value)) {
        return {
            key,
            valueType: 'boolean',
            editable: true,
            value,
        };
    }

    if (typeIsArray(value) && value.every(item => typeIsNumber(item) && Number.isFinite(item))) {
        return {
            key,
            valueType: 'number-array',
            editable: true,
            value: value as number[],
        };
    }

    return {
        key,
        valueType: 'opaque',
        editable: false,
        preview: getOpaquePreview(value),
    };
}

/**
 * Serializes an element's own set state values (from {@link Element.$state}) into wire
 * properties, skipping keys explicitly set to `undefined`.
 *
 * @param element - The element whose state to serialize.
 * @returns The serialized properties.
 */
export function serializeElementProperties(element: Element): SerializedProperty[] {
    return Object.entries(element.$state)
        .filter(([, value]) => value !== undefined)
        .map(([key, value]) => serializeProperty(key, value));
}

/**
 * Serializes an element into a flat tree node linked to its parent by id.
 *
 * @param element - The element to serialize.
 * @param parentId - The id of the element's parent node, or `null` for a root.
 * @returns The serialized node.
 */
export function serializeElement(element: Element, parentId: string | null): SerializedNode {
    return {
        parentId,
        id: element.id,
        elementType: element.type,
        classes: Array.from(element.classList),
        isGroup: isGroup(element),
        properties: serializeElementProperties(element),
    };
}

/**
 * Serializes a scene into a flat list of nodes in document order, linked by
 * {@link SerializedNode.parentId}. The scene itself is the root node (`elementType: 'scene'`,
 * `parentId: null`).
 *
 * @param scene - The scene to serialize.
 * @returns The flat serialized tree.
 */
export function serializeTree(scene: Scene): SerializedNode[] {
    const nodes: SerializedNode[] = [
        {
            id: scene.id,
            parentId: null,
            elementType: 'scene',
            classes: Array.from(scene.classList),
            isGroup: true,
            properties: serializeElementProperties(scene),
        },
    ];

    const walk = (children: Element[], parentId: string) => {
        children.forEach(child => {
            nodes.push(serializeElement(child, parentId));

            if (isGroup(child)) {
                walk(child.children, child.id);
            }
        });
    };

    walk(scene.children, scene.id);

    return nodes;
}

/**
 * Builds the {@link ContextInfo} summary for a binding from its context, scene, and renderer
 * presence, including the renderer's current debug flags when a renderer is bound.
 *
 * @param binding - The binding to summarize.
 * @returns The context summary.
 */
export function serializeContextInfo(binding: DevtoolsBinding): ContextInfo {
    return {
        contextId: binding.id,
        label: binding.label,
        contextType: binding.context.type,
        width: binding.context.width,
        height: binding.context.height,
        hasScene: !!binding.scene,
        hasRenderer: !!binding.renderer,
        ...binding.renderer ? {
            rendererDebug: binding.renderer.debug,
        } : {},
    };
}

/**
 * Splits a flat node list into ordered chunks of at most `TREE_CHUNK_SIZE` nodes for
 * transmission as `tree:chunk` messages.
 *
 * @param nodes - The flat node list to chunk.
 * @returns The ordered chunks; empty input yields no chunks.
 */
export function chunkNodes(nodes: SerializedNode[]): SerializedNode[][] {
    const chunks: SerializedNode[][] = [];

    for (let index = 0; index < nodes.length; index += TREE_CHUNK_SIZE) {
        chunks.push(nodes.slice(index, index + TREE_CHUNK_SIZE));
    }

    return chunks;
}
