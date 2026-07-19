import {
    computed,
    ref,
} from 'vue';

import type {
    ComputedRef,
    Ref,
} from 'vue';

import {
    formatPropertyValue,
} from '../../shared/format';

import type {
    ContextTree,
    DevtoolsStore,
} from './use-devtools-store';

import type {
    SerializedNode,
} from '@ripl/devtools';

/** The kind of a rendered tree row: a paired open tag, a paired close tag, or a single-row element. */
export type TreeRowKind = 'open' | 'close' | 'self';

/** A single visible row in the flattened element tree. */
export interface TreeRow {
    /** Stable row key for list rendering. */
    key: string;
    /** Whether the row renders an open tag, a close tag, or a whole element. */
    kind: TreeRowKind;
    /** The id of the context the row belongs to. */
    contextId: string;
    /** The serialized node the row renders. */
    node: SerializedNode;
    /** The row's tree depth (0 = context root). */
    depth: number;
    /** Whether the node has children in the committed tree. */
    hasChildren: boolean;
    /** Whether the node is currently expanded. */
    expanded: boolean;
}

/** A pseudo-XML attribute rendered inside a tag row. */
export interface TagAttribute {
    key: string;
    value: string;
}

/** Tree state and interaction handles returned by {@link useTree}. */
export interface UseTree {
    /** The flattened visible rows across all contexts. */
    rows: ComputedRef<TreeRow[]>;
    /** Ids of currently expanded group nodes. */
    expandedIds: Ref<Set<string>>;
    /** Returns whether a node is expanded. */
    isExpanded(nodeId: string): boolean;
    /** Expands a node. */
    expandNode(nodeId: string): void;
    /** Collapses a node. */
    collapseNode(nodeId: string): void;
    /** Toggles a node's expanded state. */
    toggleNode(nodeId: string): void;
}

/** Derives the pseudo-XML attribute list for a node: id, class (when present), then its set properties. */
export function getNodeAttributes(node: SerializedNode): TagAttribute[] {
    const attributes: TagAttribute[] = [
        {
            key: 'id',
            value: node.id,
        },
    ];

    if (node.classes.length > 0) {
        attributes.push({
            key: 'class',
            value: node.classes.join(' '),
        });
    }

    node.properties.forEach(property => attributes.push({
        key: property.key,
        value: formatPropertyValue(property),
    }));

    return attributes;
}

/** Formats a node as a single pseudo-XML tag string (used for tooltips and tests). */
export function formatNodeTag(node: SerializedNode, selfClosing: boolean = true): string {
    const attributes = getNodeAttributes(node)
        .map(attribute => `${attribute.key}="${attribute.value}"`)
        .join(' ');

    const body = attributes
        ? `${node.elementType} ${attributes}`
        : node.elementType;

    return selfClosing ? `<${body}/>` : `<${body}>`;
}

/**
 * Flattens a committed context tree into the visible row list. Collapsed groups
 * contribute a single `self` row; expanded groups contribute an `open` row,
 * their visible descendants, and a `close` row.
 */
export function flattenTree(contextId: string, tree: ContextTree, expandedIds: ReadonlySet<string>): TreeRow[] {
    const rows: TreeRow[] = [];

    const createRow = (kind: TreeRowKind, node: SerializedNode, depth: number, hasChildren: boolean, expanded: boolean): TreeRow => ({
        key: `${contextId}:${node.id}:${kind}`,
        kind,
        contextId,
        node,
        depth,
        hasChildren,
        expanded,
    });

    const visit = (nodeId: string, depth: number): void => {
        const node = tree.nodes.get(nodeId);

        if (!node) {
            return;
        }

        const childIds = tree.childrenByParent.get(nodeId) ?? [];
        const hasChildren = childIds.length > 0;
        const expanded = hasChildren && expandedIds.has(nodeId);

        if (!expanded) {
            rows.push(createRow('self', node, depth, hasChildren, false));
            return;
        }

        rows.push(createRow('open', node, depth, hasChildren, true));
        childIds.forEach(childId => visit(childId, depth + 1));
        rows.push(createRow('close', node, depth, hasChildren, true));
    };

    tree.rootIds.forEach(rootId => visit(rootId, 0));

    return rows;
}

/** Provides the flattened, expansion-aware row list over every context tree in the store. */
export function useTree(store: DevtoolsStore): UseTree {
    const expandedIds = ref(new Set<string>());

    const rows = computed(() => {
        // Re-run whenever any committed tree mutates.
        void store.treeRevision.value;

        const result: TreeRow[] = [];

        store.contexts.forEach((_context, contextId) => {
            const tree = store.getTree(contextId);

            if (tree) {
                result.push(...flattenTree(contextId, tree, expandedIds.value));
            }
        });

        return result;
    });

    function isExpanded(nodeId: string): boolean {
        return expandedIds.value.has(nodeId);
    }

    function expandNode(nodeId: string): void {
        expandedIds.value.add(nodeId);
    }

    function collapseNode(nodeId: string): void {
        expandedIds.value.delete(nodeId);
    }

    function toggleNode(nodeId: string): void {
        if (isExpanded(nodeId)) {
            collapseNode(nodeId);
        } else {
            expandNode(nodeId);
        }
    }

    return {
        rows,
        expandedIds,
        isExpanded,
        expandNode,
        collapseNode,
        toggleNode,
    };
}
