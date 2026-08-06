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
    ContextInfo,
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
    /** Expands every node that has children, across every context tree. */
    expandAll(): void;
    /** Collapses every expanded node. */
    collapseAll(): void;
    /** The filter narrowing the visible rows. */
    filter: Ref<TreeFilter>;
    /** Every element type present across the committed trees, sorted for display. */
    availableTypes: ComputedRef<string[]>;
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

/**
 * Builds a synthetic root node representing a context that has no scene (and therefore no
 * tree snapshot), so it still appears in the explorer as `<context id="…" type="…" …/>`.
 */
export function createContextRootNode(context: ContextInfo): SerializedNode {
    return {
        id: context.contextId,
        parentId: null,
        elementType: 'context',
        classes: [],
        isGroup: false,
        properties: [
            {
                key: 'type',
                valueType: 'string',
                editable: false,
                value: context.contextType,
            },
            {
                key: 'width',
                valueType: 'number',
                editable: false,
                value: Math.round(context.width),
            },
            {
                key: 'height',
                valueType: 'number',
                editable: false,
                value: Math.round(context.height),
            },
        ],
    };
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

/** A node's filter criteria: a free-text query, an element type, or both. */
export interface TreeFilter {
    /** Free-text matched against the node's type, id, class list and serialized attributes. */
    query: string;
    /** An element type to match exactly, or an empty string for any type. */
    type: string;
}

/** Whether a filter would narrow anything, i.e. whether it has any criteria set. */
export function treeFilterIsActive(filter: TreeFilter): boolean {
    return !!filter.query.trim() || !!filter.type;
}

/**
 * Determines whether a node satisfies a filter. The query is matched case-insensitively against
 * the element type, id, every class and every serialized attribute key and value, so searching
 * for a color or a coordinate finds the elements carrying it.
 *
 * @param node - The node to test.
 * @param filter - The criteria to test against.
 * @returns Whether the node matches.
 */
export function nodeMatchesFilter(node: SerializedNode, filter: TreeFilter): boolean {
    if (filter.type && node.elementType !== filter.type) {
        return false;
    }

    const query = filter.query.trim().toLowerCase();

    if (!query) {
        return true;
    }

    return node.elementType.toLowerCase().includes(query)
        || node.id.toLowerCase().includes(query)
        || node.classes.some(value => value.toLowerCase().includes(query))
        || node.properties.some(property => property.key.toLowerCase().includes(query)
            || formatPropertyValue(property).toLowerCase().includes(query));
}

/**
 * Returns the ids a filtered tree should render: every matching node plus the chain of ancestors
 * that contains it, so a match stays visible in the tree rather than being orphaned.
 *
 * @param tree - The committed tree to search.
 * @param filter - The criteria to match against.
 * @returns The ids to render, or `undefined` when the filter is inactive and everything renders.
 */
export function getFilteredIds(tree: ContextTree, filter: TreeFilter): Set<string> | undefined {
    if (!treeFilterIsActive(filter)) {
        return;
    }

    const visible = new Set<string>();

    tree.nodes.forEach(node => {
        if (!nodeMatchesFilter(node, filter)) {
            return;
        }

        visible.add(node.id);

        let parentId = node.parentId;

        while (parentId && !visible.has(parentId)) {
            visible.add(parentId);
            parentId = tree.nodes.get(parentId)?.parentId ?? null;
        }
    });

    return visible;
}

/**
 * Flattens a committed context tree into the visible row list. Collapsed groups
 * contribute a single `self` row; expanded groups contribute an `open` row,
 * their visible descendants, and a `close` row.
 *
 * When `visibleIds` is given the tree is filtered to those ids, and any node with visible
 * children is treated as expanded regardless of `expandedIds` — so matches are revealed without
 * disturbing the expansion the user had, which is restored the moment the filter clears.
 */
export function flattenTree(contextId: string, tree: ContextTree, expandedIds: ReadonlySet<string>, visibleIds?: ReadonlySet<string>): TreeRow[] {
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

        if (!node || (visibleIds && !visibleIds.has(nodeId))) {
            return;
        }

        const childIds = (tree.childrenByParent.get(nodeId) ?? [])
            .filter(childId => !visibleIds || visibleIds.has(childId));

        const hasChildren = childIds.length > 0;
        const expanded = hasChildren && (!!visibleIds || expandedIds.has(nodeId));

        if (!expanded) {
            rows.push(createRow('self', node, depth, hasChildren, false));
            return;
        }

        rows.push(createRow('open', node, depth, hasChildren, true));
        childIds.forEach(childId => visit(childId, depth + 1));
        rows.push(createRow('close', node, depth, hasChildren, true));
    };

    tree.rootIds
        .filter(rootId => !visibleIds || visibleIds.has(rootId))
        .forEach(rootId => visit(rootId, 0));

    return rows;
}

/**
 * Creates the flattened, expansion-aware row list over every context tree in the store. Prefer
 * {@link useTree}, which shares one instance across the panel so controls outside the tree view
 * (expand all, collapse all) act on the rows the tree view renders.
 *
 * @param store - The devtools store to read committed trees from.
 * @returns The tree state and interaction handles.
 */
export function createTree(store: DevtoolsStore): UseTree {
    const expandedIds = ref(new Set<string>());
    const filter = ref<TreeFilter>({
        query: '',
        type: '',
    });

    const availableTypes = computed(() => {
        void store.treeRevision.value;

        const types = new Set<string>();

        Array.from(store.contexts.keys()).forEach(contextId => {
            store.getTree(contextId)?.nodes.forEach(node => types.add(node.elementType));
        });

        return Array.from(types).sort();
    });

    const rows = computed(() => {
        // Re-run whenever any committed tree mutates.
        void store.treeRevision.value;

        const result: TreeRow[] = [];

        store.contexts.forEach((context, contextId) => {
            const tree = store.getTree(contextId);

            if (tree) {
                result.push(...flattenTree(contextId, tree, expandedIds.value, getFilteredIds(tree, filter.value)));
                return;
            }

            // No scene → no snapshot; surface the context itself as a root.
            const node = createContextRootNode(context);

            if (!nodeMatchesFilter(node, filter.value)) {
                return;
            }

            result.push({
                key: `${contextId}:${node.id}:self`,
                kind: 'self',
                contextId,
                node,
                depth: 0,
                hasChildren: false,
                expanded: false,
            });
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

    function expandAll(): void {
        const expanded = new Set<string>();

        Array.from(store.contexts.keys()).forEach(contextId => {
            store.getTree(contextId)?.childrenByParent.forEach((childIds, parentId) => {
                if (parentId !== null && childIds.length > 0) {
                    expanded.add(parentId);
                }
            });
        });

        expandedIds.value = expanded;
    }

    function collapseAll(): void {
        expandedIds.value = new Set<string>();
    }

    return {
        rows,
        expandedIds,
        isExpanded,
        expandNode,
        collapseNode,
        toggleNode,
        expandAll,
        collapseAll,
        filter,
        availableTypes,
    };
}

let activeTree: UseTree | undefined;

/** Returns the panel's shared tree state, creating it on first use. */
export function useTree(store: DevtoolsStore): UseTree {
    activeTree ??= createTree(store);

    return activeTree;
}
