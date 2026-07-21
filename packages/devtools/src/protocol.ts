import {
    MESSAGE_SOURCE_BRIDGE,
    MESSAGE_SOURCE_EXTENSION,
    PROTOCOL_VERSION,
} from './constants';

import {
    typeIsNumber,
    typeIsObject,
    typeIsString,
} from '@ripl/utilities';

/** The wire type of a serialized element property value, determining how the devtools renders and edits it. */
export type SerializedValueType = 'number' | 'string' | 'boolean' | 'number-array' | 'color' | 'opaque';

/** A single serialized element property. */
export interface SerializedProperty {
    /** The property key on the element (e.g. `fill`, `x`, `lineWidth`). */
    key: string;
    /** The wire type of the property value. See {@link SerializedValueType}. */
    valueType: SerializedValueType;
    /** Whether the devtools may write this property back to the element. */
    editable: boolean;
    /** The JSON-serializable property value. Omitted for `opaque` values. */
    value?: number | string | boolean | number[];
    /** A short human-readable preview for `opaque` values (gradients, functions, objects). */
    preview?: string;
}

/** A serialized element or group node within a tree snapshot. Trees are transmitted flat, linked by {@link SerializedNode.parentId}. */
export interface SerializedNode {
    /** The element's unique id. */
    id: string;
    /** The id of the parent node, or `null` for a snapshot root. */
    parentId: string | null;
    /** The element type name (e.g. `circle`, `rect`, `group`, `scene`). */
    elementType: string;
    /** The element's class list. */
    classes: string[];
    /** Whether the node is a group (may parent other nodes). */
    isGroup: boolean;
    /** The element's own set properties. */
    properties: SerializedProperty[];
}

/** The renderer debug overlay flags exchanged between the devtools and the page. */
export interface RendererDebugInfo {
    /** Whether the frames-per-second overlay is enabled. */
    fps: boolean;
    /** Whether the element count overlay is enabled. */
    elementCount: boolean;
    /** Whether element bounding boxes are drawn. */
    boundingBoxes: boolean;
}

/** Summary information about a devtools-bound context, shown in the extension's popup and panel. */
export interface ContextInfo {
    /** Stable id of the devtools binding that owns the context. */
    contextId: string;
    /** Human-readable label for the context. */
    label: string;
    /** The context type (e.g. `canvas`, `svg`, `webgpu`). */
    contextType: string;
    /** The context width in CSS pixels. */
    width: number;
    /** The context height in CSS pixels. */
    height: number;
    /** Whether a scene is bound alongside the context. */
    hasScene: boolean;
    /** Whether a renderer is bound alongside the context. */
    hasRenderer: boolean;
    /** The renderer's current debug overlay flags, when a renderer is bound. */
    rendererDebug?: RendererDebugInfo;
}

/** Listener presence for a single element event type. */
export interface ElementEventInfo {
    /** The event type (e.g. `click`, `updated`). */
    type: string;
    /** Whether at least one listener is attached for the event type. */
    hasListeners: boolean;
}

/** An element's world-space bounding box, in CSS pixels relative to the context origin. */
export interface SerializedBoundingBox {
    /** The left edge of the box. */
    left: number;
    /** The top edge of the box. */
    top: number;
    /** The width of the box. */
    width: number;
    /** The height of the box. */
    height: number;
}

/** A batch of coalesced property updates for a single element. */
export interface ElementPropertyUpdate {
    /** The id of the updated element. */
    elementId: string;
    /** The element properties that changed. */
    properties: SerializedProperty[];
}

/** Messages sent from the page-side bridge to the devtools extension. */
export type BridgeMessage =
    | {
        /** Announces that the bridge is present on the page. */
        kind: 'bridge:hello';
    }
    | {
        /** Announces a newly created devtools binding. */
        kind: 'context:added';
        /** Summary of the added context. */
        context: ContextInfo;
    }
    | {
        /** Announces a change to a bound context (resize, renderer debug toggled). */
        kind: 'context:updated';
        /** The updated context summary. */
        context: ContextInfo;
    }
    | {
        /** Announces that a binding was disposed or its context destroyed. */
        kind: 'context:removed';
        /** The id of the removed binding. */
        contextId: string;
    }
    | {
        /** Marks the start of a tree snapshot; chunks with the same snapshot id follow. */
        kind: 'tree:snapshot-begin';
        /** The id of the binding the snapshot belongs to. */
        contextId: string;
        /** Monotonic id of this snapshot; later snapshots supersede earlier ones. */
        snapshotId: number;
        /** Total node count of the snapshot. */
        nodeCount: number;
    }
    | {
        /** A chunk of serialized nodes belonging to a snapshot. */
        kind: 'tree:chunk';
        /** The id of the binding the snapshot belongs to. */
        contextId: string;
        /** The snapshot the chunk belongs to. */
        snapshotId: number;
        /** Zero-based chunk sequence number within the snapshot. */
        seq: number;
        /** The serialized nodes in this chunk. */
        nodes: SerializedNode[];
    }
    | {
        /** Marks the end of a tree snapshot. */
        kind: 'tree:snapshot-end';
        /** The id of the binding the snapshot belongs to. */
        contextId: string;
        /** The completed snapshot's id. */
        snapshotId: number;
    }
    | {
        /** Streams coalesced element property changes since the last flush. */
        kind: 'tree:props';
        /** The id of the binding the updates belong to. */
        contextId: string;
        /** The coalesced per-element property updates. */
        updates: ElementPropertyUpdate[];
    }
    | {
        /** Detailed inspection payload for a single element, sent in response to `element:inspect`. */
        kind: 'element:detail';
        /** The id of the binding the element belongs to. */
        contextId: string;
        /** The inspected element's id. */
        elementId: string;
        /** The element's own set properties. */
        properties: SerializedProperty[];
        /** Listener presence per element event type. */
        events: ElementEventInfo[];
        /** The element's world-space bounding box. */
        boundingBox: SerializedBoundingBox;
    }
    | {
        /** Announces that the page is unloading and all bindings are gone. */
        kind: 'bridge:bye';
    };

/** Messages sent from the devtools extension to the page-side bridge. */
export type ExtensionMessage =
    | {
        /** Signals that the devtools panel is open and the bridge should begin streaming. */
        kind: 'panel:connected';
    }
    | {
        /** Signals that the devtools panel closed and the bridge should stop all streaming work. */
        kind: 'panel:disconnected';
    }
    | {
        /** Requests a replay of `context:added` for every live binding (used by the popup and late connects). */
        kind: 'state:request';
    }
    | {
        /** Requests a fresh tree snapshot for a binding. */
        kind: 'tree:request';
        /** The id of the binding to snapshot. */
        contextId: string;
    }
    | {
        /** Requests an `element:detail` payload for an element. */
        kind: 'element:inspect';
        /** The id of the binding the element belongs to. */
        contextId: string;
        /** The id of the element to inspect. */
        elementId: string;
    }
    | {
        /** Writes a property value to an element. */
        kind: 'element:set-property';
        /** The id of the binding the element belongs to. */
        contextId: string;
        /** The id of the element to modify. */
        elementId: string;
        /** The property key to write. */
        key: string;
        /** The new property value. */
        value: number | string | boolean | number[];
    }
    | {
        /** Shows the highlight overlay over an element on the page. */
        kind: 'element:highlight';
        /** The id of the binding the element belongs to. */
        contextId: string;
        /** The id of the element to highlight. */
        elementId: string;
    }
    | {
        /** Hides the highlight overlay. */
        kind: 'element:highlight-clear';
    }
    | {
        /** Applies renderer debug overlay flags. */
        kind: 'renderer:set-debug';
        /** The id of the binding whose renderer to update. */
        contextId: string;
        /** The full set of debug flags to apply. */
        debug: RendererDebugInfo;
    };

/** Envelope wrapping every message exchanged over `window.postMessage`. */
export interface Envelope<TSource extends string, TMessage> {
    /** The originating side of the message. */
    source: TSource;
    /** The protocol version of the sender. See {@link PROTOCOL_VERSION}. */
    version: number;
    /** The wrapped message. */
    payload: TMessage;
}

/** An envelope carrying a {@link BridgeMessage} from the page to the extension. */
export type BridgeEnvelope = Envelope<typeof MESSAGE_SOURCE_BRIDGE, BridgeMessage>;

/** An envelope carrying an {@link ExtensionMessage} from the extension to the page. */
export type ExtensionEnvelope = Envelope<typeof MESSAGE_SOURCE_EXTENSION, ExtensionMessage>;

function isEnvelopeShape(value: unknown, source: string): value is Envelope<string, { kind: string }> {
    return typeIsObject(value)
        && (value as Envelope<string, unknown>).source === source
        && typeIsNumber((value as Envelope<string, unknown>).version)
        && (value as Envelope<string, unknown>).version === PROTOCOL_VERSION
        && typeIsObject((value as Envelope<string, unknown>).payload)
        && typeIsString(((value as Envelope<string, { kind: unknown }>).payload).kind);
}

/** Wraps a {@link BridgeMessage} in a versioned envelope for posting to the extension. */
export function createBridgeEnvelope(payload: BridgeMessage): BridgeEnvelope {
    return {
        source: MESSAGE_SOURCE_BRIDGE,
        version: PROTOCOL_VERSION,
        payload,
    };
}

/** Wraps an {@link ExtensionMessage} in a versioned envelope for posting to the page. */
export function createExtensionEnvelope(payload: ExtensionMessage): ExtensionEnvelope {
    return {
        source: MESSAGE_SOURCE_EXTENSION,
        version: PROTOCOL_VERSION,
        payload,
    };
}

/** Determines whether a value is a well-formed, version-matched envelope posted by the page-side bridge. */
export function messageIsFromBridge(value: unknown): value is BridgeEnvelope {
    return isEnvelopeShape(value, MESSAGE_SOURCE_BRIDGE);
}

/** Determines whether a value is a well-formed, version-matched envelope posted by the devtools extension. */
export function messageIsFromExtension(value: unknown): value is ExtensionEnvelope {
    return isEnvelopeShape(value, MESSAGE_SOURCE_EXTENSION);
}

/** A discriminated-union message identified by a string `kind` discriminant. */
export interface KindedMessage {
    /** The discriminant identifying the message variant. */
    kind: string;
}

/**
 * A map of handlers for a discriminated-union message, keyed by its `kind`. Each handler
 * receives the message narrowed to its specific variant. Used with {@link dispatchMessage} for
 * keyed-lookup dispatch in place of a `switch`.
 *
 * @typeParam TMessage - The discriminated-union message type, keyed by `kind`.
 */
export type MessageHandlers<TMessage extends KindedMessage> = {
    [TKind in TMessage['kind']]: (message: Extract<TMessage, { kind: TKind }>) => void;
};

/**
 * Dispatches a discriminated-union message to its handler in a keyed handler map. A message whose
 * `kind` has no handler is ignored. Prefer this over a `switch` on `message.kind`.
 *
 * @typeParam TMessage - The discriminated-union message type, keyed by `kind`.
 * @param handlers - A (possibly partial) map of handlers keyed by message `kind`.
 * @param message - The message to dispatch.
 */
export function dispatchMessage<TMessage extends KindedMessage>(handlers: Partial<MessageHandlers<TMessage>>, message: TMessage): void {
    (handlers[message.kind as TMessage['kind']] as ((message: TMessage) => void) | undefined)?.(message);
}
