import {
    computed,
    reactive,
    ref,
} from 'vue';

import type {
    ComputedRef,
    Ref,
} from 'vue';

import {
    dispatchMessage,
} from '@ripl/devtools';

import type {
    BridgeMessage,
    ContextInfo,
    ElementEventInfo,
    ElementPropertyUpdate,
    ExtensionMessage,
    MessageHandlers,
    RendererDebugInfo,
    SerializedBoundingBox,
    SerializedNode,
    SerializedProperty,
} from '@ripl/devtools';

/** A committed tree snapshot for a single context, indexed for fast lookup and child traversal. */
export interface ContextTree {
    /** All nodes in the snapshot, keyed by element id. */
    nodes: Map<string, SerializedNode>;
    /** Child ids per parent id (`null` keys the snapshot roots), in document order. */
    childrenByParent: Map<string | null, string[]>;
    /** The snapshot's root node ids, in document order. */
    rootIds: string[];
}

/** The detailed inspection payload for the currently selected element. */
export interface ElementDetail {
    properties: SerializedProperty[];
    events: ElementEventInfo[];
    boundingBox: SerializedBoundingBox;
}

/** Identifies the element currently selected in the tree. */
export interface TreeSelection {
    contextId: string;
    elementId: string;
}

/** Sends an extension message towards the inspected page (injected so the store stays chrome-free). */
export type SendExtensionMessage = (message: ExtensionMessage) => void;

interface PendingChunk {
    seq: number;
    nodes: SerializedNode[];
}

interface PendingSnapshot {
    snapshotId: number;
    nodeCount: number;
    chunks: PendingChunk[];
}

/** The devtools panel store: protocol state assembly, selection, and outbound actions. */
export interface DevtoolsStore {
    /** Whether the panel port to the background service worker is currently open. */
    connected: Ref<boolean>;
    /** Live contexts announced by the page, keyed by context id (reactive). */
    contexts: Map<string, ContextInfo>;
    /** Bumped whenever any committed tree mutates; computed trees should depend on it. */
    treeRevision: Ref<number>;
    /** The currently selected element, if any. */
    selection: Ref<TreeSelection | null>;
    /** The latest inspection detail for the selected element. */
    selectedDetail: Ref<ElementDetail | null>;
    /** Whether any contexts are currently known. */
    hasContexts: ComputedRef<boolean>;
    /** Returns the committed tree for a context, if one has been received. */
    getTree(contextId: string): ContextTree | undefined;
    /** Feeds a bridge message into the store. */
    handleMessage(message: BridgeMessage): void;
    /** Updates the panel connection state. */
    setConnected(connected: boolean): void;
    /** Selects an element and requests its inspection detail. */
    selectElement(contextId: string, elementId: string): void;
    /** Clears the current selection and detail. */
    clearSelection(): void;
    /** Re-requests inspection detail for the current selection (polling). */
    inspectSelected(): void;
    /** Writes a property value to the currently selected element. */
    setSelectedProperty(key: string, value: number | string | boolean | number[]): void;
    /** Shows the page highlight overlay over an element. */
    highlightElement(contextId: string, elementId: string): void;
    /** Hides the page highlight overlay. */
    clearHighlight(): void;
    /** Applies the full set of renderer debug flags for a context. */
    setRendererDebug(contextId: string, debug: RendererDebugInfo): void;
    /** Requests a fresh tree snapshot for a context. */
    requestTree(contextId: string): void;
}

/** Builds an indexed {@link ContextTree} from a flat list of serialized nodes in document order. */
export function buildContextTree(nodes: SerializedNode[]): ContextTree {
    const nodeMap = new Map<string, SerializedNode>();
    const childrenByParent = new Map<string | null, string[]>();

    nodes.forEach(node => {
        nodeMap.set(node.id, node);

        const siblings = childrenByParent.get(node.parentId);

        if (siblings) {
            siblings.push(node.id);
        } else {
            childrenByParent.set(node.parentId, [node.id]);
        }
    });

    return {
        nodes: nodeMap,
        childrenByParent,
        rootIds: childrenByParent.get(null) ?? [],
    };
}

function patchProperties(target: SerializedProperty[], updates: SerializedProperty[]): SerializedProperty[] {
    const merged = target.slice();

    updates.forEach(update => {
        const index = merged.findIndex(property => property.key === update.key);

        if (index >= 0) {
            merged[index] = update;
        } else {
            merged.push(update);
        }
    });

    return merged;
}

/** Creates a devtools store bound to the given outbound message sender. */
export function createDevtoolsStore(send: SendExtensionMessage): DevtoolsStore {
    const connected = ref(false);
    const contexts = reactive(new Map<string, ContextInfo>());
    const treeRevision = ref(0);
    const selection = ref<TreeSelection | null>(null);
    const selectedDetail = ref<ElementDetail | null>(null);

    const hasContexts = computed(() => contexts.size > 0);

    const trees = new Map<string, ContextTree>();
    const pendingSnapshots = new Map<string, PendingSnapshot>();
    const committedSnapshotIds = new Map<string, number>();

    function clearSelection(): void {
        selection.value = null;
        selectedDetail.value = null;
    }

    function requestTree(contextId: string): void {
        send({
            kind: 'tree:request',
            contextId,
        });
    }

    function addContext(context: ContextInfo): void {
        contexts.set(context.contextId, context);
        requestTree(context.contextId);
    }

    function removeContext(contextId: string): void {
        contexts.delete(contextId);
        trees.delete(contextId);
        pendingSnapshots.delete(contextId);
        committedSnapshotIds.delete(contextId);
        treeRevision.value += 1;

        if (selection.value?.contextId === contextId) {
            clearSelection();
        }
    }

    function beginSnapshot(contextId: string, snapshotId: number, nodeCount: number): void {
        const pending = pendingSnapshots.get(contextId);
        const committedId = committedSnapshotIds.get(contextId) ?? Number.NEGATIVE_INFINITY;

        // Ignore begins that are older than what is already pending or committed.
        if ((pending && pending.snapshotId >= snapshotId) || committedId >= snapshotId) {
            return;
        }

        pendingSnapshots.set(contextId, {
            snapshotId,
            nodeCount,
            chunks: [],
        });
    }

    function appendChunk(contextId: string, snapshotId: number, seq: number, nodes: SerializedNode[]): void {
        const pending = pendingSnapshots.get(contextId);

        if (!pending || pending.snapshotId !== snapshotId) {
            return;
        }

        pending.chunks.push({
            seq,
            nodes,
        });
    }

    function commitSnapshot(contextId: string, snapshotId: number): void {
        const pending = pendingSnapshots.get(contextId);

        if (!pending || pending.snapshotId !== snapshotId) {
            return;
        }

        pendingSnapshots.delete(contextId);

        const nodes = pending.chunks
            .slice()
            .sort((left, right) => left.seq - right.seq)
            .flatMap(chunk => chunk.nodes);

        const tree = buildContextTree(nodes);

        trees.set(contextId, tree);
        committedSnapshotIds.set(contextId, snapshotId);
        treeRevision.value += 1;

        const currentSelection = selection.value;

        if (currentSelection && currentSelection.contextId === contextId && !tree.nodes.has(currentSelection.elementId)) {
            clearSelection();
        }
    }

    function patchSelectedDetail(contextId: string, updates: ElementPropertyUpdate[]): void {
        const currentSelection = selection.value;
        const detail = selectedDetail.value;

        if (!currentSelection || !detail || currentSelection.contextId !== contextId) {
            return;
        }

        const update = updates.find(item => item.elementId === currentSelection.elementId);

        if (update) {
            selectedDetail.value = {
                ...detail,
                properties: patchProperties(detail.properties, update.properties),
            };
        }
    }

    function applyPropertyUpdates(contextId: string, updates: ElementPropertyUpdate[]): void {
        const tree = trees.get(contextId);

        if (tree) {
            let changed = false;

            updates.forEach(update => {
                const node = tree.nodes.get(update.elementId);

                if (node) {
                    node.properties = patchProperties(node.properties, update.properties);
                    changed = true;
                }
            });

            if (changed) {
                treeRevision.value += 1;
            }
        }

        patchSelectedDetail(contextId, updates);
    }

    function applyElementDetail(contextId: string, elementId: string, detail: ElementDetail): void {
        const currentSelection = selection.value;

        if (currentSelection?.contextId === contextId && currentSelection.elementId === elementId) {
            selectedDetail.value = detail;
        }
    }

    function reset(): void {
        contexts.clear();
        trees.clear();
        pendingSnapshots.clear();
        committedSnapshotIds.clear();
        treeRevision.value += 1;
        clearSelection();
    }

    const messageHandlers: Partial<MessageHandlers<BridgeMessage>> = {
        'context:added': message => addContext(message.context),
        'context:updated': message => contexts.set(message.context.contextId, message.context),
        'context:removed': message => removeContext(message.contextId),
        'tree:snapshot-begin': message => beginSnapshot(message.contextId, message.snapshotId, message.nodeCount),
        'tree:chunk': message => appendChunk(message.contextId, message.snapshotId, message.seq, message.nodes),
        'tree:snapshot-end': message => commitSnapshot(message.contextId, message.snapshotId),
        'tree:props': message => applyPropertyUpdates(message.contextId, message.updates),
        'element:detail': message => applyElementDetail(message.contextId, message.elementId, {
            properties: message.properties,
            events: message.events,
            boundingBox: message.boundingBox,
        }),
        'bridge:bye': () => reset(),
    };

    function handleMessage(message: BridgeMessage): void {
        dispatchMessage(messageHandlers, message);
    }

    function selectElement(contextId: string, elementId: string): void {
        selection.value = {
            contextId,
            elementId,
        };

        selectedDetail.value = null;

        send({
            kind: 'element:inspect',
            contextId,
            elementId,
        });
    }

    function inspectSelected(): void {
        const currentSelection = selection.value;

        if (currentSelection) {
            send({
                kind: 'element:inspect',
                contextId: currentSelection.contextId,
                elementId: currentSelection.elementId,
            });
        }
    }

    function setSelectedProperty(key: string, value: number | string | boolean | number[]): void {
        const currentSelection = selection.value;

        if (currentSelection) {
            send({
                kind: 'element:set-property',
                contextId: currentSelection.contextId,
                elementId: currentSelection.elementId,
                key,
                value,
            });
        }
    }

    return {
        connected,
        contexts,
        treeRevision,
        selection,
        selectedDetail,
        hasContexts,
        getTree: contextId => trees.get(contextId),
        handleMessage,
        setConnected: value => {
            connected.value = value;
        },
        selectElement,
        clearSelection,
        inspectSelected,
        setSelectedProperty,
        highlightElement: (contextId, elementId) => send({
            kind: 'element:highlight',
            contextId,
            elementId,
        }),
        clearHighlight: () => send({
            kind: 'element:highlight-clear',
        }),
        setRendererDebug: (contextId, debug) => send({
            kind: 'renderer:set-debug',
            contextId,
            debug,
        }),
        requestTree,
    };
}

let activeStore: DevtoolsStore | undefined;

/** Creates the panel's singleton store instance. Call once during panel bootstrap. */
export function initialiseDevtoolsStore(send: SendExtensionMessage): DevtoolsStore {
    activeStore = createDevtoolsStore(send);

    return activeStore;
}

/** Returns the panel's singleton store instance. */
export function useDevtoolsStore(): DevtoolsStore {
    if (!activeStore) {
        throw new Error('Devtools store has not been initialised');
    }

    return activeStore;
}
