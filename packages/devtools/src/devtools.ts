import {
    clearHighlight,
    showHighlight,
} from './highlight';

import {
    dispatchMessage,
} from './protocol';

import type {
    ElementPropertyUpdate,
    ExtensionMessage,
    MessageHandlers,
    RendererDebugInfo,
} from './protocol';

import {
    findElement,
    getBindingByContext,
    getBindings,
    registerBinding,
    unregisterBinding,
} from './registry';

import {
    createPropsCoalescer,
    createSnapshotScheduler,
} from './scheduler';

import type {
    PropsCoalescer,
    SnapshotScheduler,
} from './scheduler';

import {
    chunkNodes,
    serializeContextInfo,
    serializeElementProperties,
    serializeTree,
} from './serialize';

import {
    onExtensionMessage,
    sendBridgeMessage,
} from './transport';

import type {
    Context,
    Element,
    Renderer,
    Scene,
} from '@ripl/core';

import {
    stringUniqueId,
} from '@ripl/utilities';

import type {
    Disposable,
} from '@ripl/utilities';

/**
 * Whether the devtools panel is currently connected. Shared across bindings — the panel is
 * page-wide, not per-binding. Reset to unknown (false) when the last binding is disposed,
 * since without a live binding there is no listener left to observe panel state; the
 * extension re-handshakes in response to the next `bridge:hello`.
 */
let panelConnected = false;

/** The id of the binding that last showed the highlight overlay, or `undefined` when hidden. */
let highlightOwnerId: string | undefined;

let pageLifecycleAttached = false;

function handlePageHide(): void {
    sendBridgeMessage({
        kind: 'bridge:bye',
    });
}

function handlePageShow(event: PageTransitionEvent): void {
    // `pageshow` also fires on the initial load, where bindings have already
    // announced themselves — only re-announce after a bfcache restore.
    if (!event.persisted) {
        return;
    }

    sendBridgeMessage({
        kind: 'bridge:hello',
    });

    getBindings().forEach(binding => sendBridgeMessage({
        kind: 'context:added',
        context: serializeContextInfo(binding),
    }));
}

function attachPageLifecycle(): void {
    if (pageLifecycleAttached || typeof window === 'undefined') {
        return;
    }

    window.addEventListener('pagehide', handlePageHide);
    window.addEventListener('pageshow', handlePageShow);
    pageLifecycleAttached = true;
}

function detachPageLifecycle(): void {
    if (!pageLifecycleAttached) {
        return;
    }

    window.removeEventListener('pagehide', handlePageHide);
    window.removeEventListener('pageshow', handlePageShow);
    pageLifecycleAttached = false;
}

function elementHasWritableAccessor(element: Element, key: string): boolean {
    let prototype = Object.getPrototypeOf(element) as object | null;

    while (prototype) {
        const descriptor = Object.getOwnPropertyDescriptor(prototype, key);

        if (descriptor) {
            return !!descriptor.set;
        }

        prototype = Object.getPrototypeOf(prototype) as object | null;
    }

    return false;
}

/** Options for creating a devtools binding. */
export interface DevtoolsOptions {
    /** Human-readable label shown for this binding in the devtools UI. Defaults to the context's type. */
    label?: string;
}

/**
 * The page-side devtools binding connecting a {@link Context} (and optionally a {@link Scene}
 * and {@link Renderer}) to the Ripl devtools browser extension over `window.postMessage`.
 *
 * A binding is cheap while the devtools panel is closed — it only announces its presence and
 * relays context metadata. Tree serialization and property streaming listeners are attached
 * when the panel connects and detached when it disconnects.
 */
export class Devtools {

    /** Stable unique id of this binding, used as the `contextId` in protocol messages. */
    public readonly id: string;
    /** Human-readable label identifying this binding in the devtools UI. */
    public readonly label: string;
    /** The bound rendering context. */
    public readonly context: Context;
    /** The bound scene, when provided. */
    public readonly scene?: Scene;
    /** The bound renderer, when provided. */
    public readonly renderer?: Renderer;

    private _disposed = false;
    private _disposables: Disposable[] = [];
    private _panelDisposables: Disposable[] = [];
    private _snapshotId = 0;
    private _scheduler?: SnapshotScheduler;
    private _coalescer?: PropsCoalescer;

    constructor(context: Context, scene?: Scene, renderer?: Renderer, options?: DevtoolsOptions) {
        this.id = stringUniqueId();
        this.label = options?.label || context.type;
        this.context = context;
        this.scene = scene;
        this.renderer = renderer;

        if (scene) {
            this._scheduler = createSnapshotScheduler(() => this._produceSnapshot(scene));
            this._coalescer = createPropsCoalescer(elementIds => this._flushProps(elementIds));
        }

        registerBinding(this);
        attachPageLifecycle();

        this._disposables.push(
            onExtensionMessage(message => this._handleMessage(message)),
            context.on('resize', () => this._sendContextUpdated()),
            context.once('destroyed', () => this.dispose())
        );

        if (scene) {
            this._disposables.push(scene.once('destroyed', () => this.dispose(), {
                self: true,
            }));
        }

        if (renderer) {
            this._disposables.push(renderer.once('destroyed', () => this.dispose()));
        }

        sendBridgeMessage({
            kind: 'bridge:hello',
        });

        this._sendContextAdded();

        if (panelConnected) {
            this._connectPanel();
        }
    }

    private _sendContextAdded(): void {
        sendBridgeMessage({
            kind: 'context:added',
            context: serializeContextInfo(this),
        });
    }

    private _sendContextUpdated(): void {
        sendBridgeMessage({
            kind: 'context:updated',
            context: serializeContextInfo(this),
        });
    }

    private _produceSnapshot(scene: Scene): (() => void)[] {
        const nodes = serializeTree(scene);
        const snapshotId = ++this._snapshotId;

        sendBridgeMessage({
            snapshotId,
            kind: 'tree:snapshot-begin',
            contextId: this.id,
            nodeCount: nodes.length,
        });

        const steps: (() => void)[] = chunkNodes(nodes).map((chunk, seq) => () => sendBridgeMessage({
            snapshotId,
            seq,
            kind: 'tree:chunk',
            contextId: this.id,
            nodes: chunk,
        }));

        steps.push(() => sendBridgeMessage({
            snapshotId,
            kind: 'tree:snapshot-end',
            contextId: this.id,
        }));

        return steps;
    }

    private _flushProps(elementIds: string[]): void {
        const updates = elementIds.reduce<ElementPropertyUpdate[]>((output, elementId) => {
            const element = findElement(this, elementId);

            if (element) {
                output.push({
                    elementId,
                    properties: serializeElementProperties(element),
                });
            }

            return output;
        }, []);

        if (updates.length) {
            sendBridgeMessage({
                updates,
                kind: 'tree:props',
                contextId: this.id,
            });
        }
    }

    private _connectPanel(): void {
        if (this.scene && !this._panelDisposables.length) {
            this._panelDisposables.push(
                this.scene.on('graph', () => this._scheduler?.markDirty()),
                this.scene.on('updated', event => {
                    const target = event.target as unknown as Element;

                    if (target?.id) {
                        this._coalescer?.push(target.id);
                    }
                })
            );
        }

        this._scheduler?.markDirty();
    }

    private _disconnectPanel(): void {
        this._panelDisposables.forEach(disposable => disposable.dispose());
        this._panelDisposables = [];
        this._scheduler?.cancel();
        this._coalescer?.clear();
    }

    private _inspectElement(elementId: string): void {
        const element = findElement(this, elementId);

        if (!element) {
            return;
        }

        const box = element.getBoundingBox();

        sendBridgeMessage({
            elementId,
            kind: 'element:detail',
            contextId: this.id,
            properties: serializeElementProperties(element),
            events: element.$events.map(type => ({
                type: String(type),
                hasListeners: element.has(type),
            })),
            boundingBox: {
                left: box.left,
                top: box.top,
                width: box.width,
                height: box.height,
            },
        });
    }

    private _setElementProperty(elementId: string, key: string, value: unknown): void {
        const element = findElement(this, elementId);

        if (!element) {
            return;
        }

        const isStateKey = Object.prototype.hasOwnProperty.call(element.$state, key);

        if (!isStateKey && !elementHasWritableAccessor(element, key)) {
            return;
        }

        (element as unknown as Record<string, unknown>)[key] = value;
    }

    private _highlightElement(elementId: string): void {
        const element = findElement(this, elementId);

        if (!element) {
            return;
        }

        showHighlight(this.context, element);
        highlightOwnerId = this.id;
    }

    private _setRendererDebug(debug: RendererDebugInfo): void {
        if (!this.renderer) {
            return;
        }

        this.renderer.debug = debug;
        this._sendContextUpdated();
    }

    // Wraps a handler so it only runs for messages addressed to this binding's context.
    private _forThisContext<TMessage extends { contextId: string }>(handler: (message: TMessage) => void): (message: TMessage) => void {
        return message => {
            if (message.contextId === this.id) {
                handler(message);
            }
        };
    }

    private _messageHandlers: MessageHandlers<ExtensionMessage> = {
        'panel:connected': () => {
            panelConnected = true;
            this._sendContextAdded();
            this._connectPanel();
        },
        'panel:disconnected': () => {
            panelConnected = false;
            this._disconnectPanel();
            clearHighlight();
            highlightOwnerId = undefined;
        },
        'state:request': () => this._sendContextAdded(),
        'tree:request': this._forThisContext(() => this._scheduler?.markDirty()),
        'element:inspect': this._forThisContext(message => this._inspectElement(message.elementId)),
        'element:set-property': this._forThisContext(message => this._setElementProperty(message.elementId, message.key, message.value)),
        'element:highlight': this._forThisContext(message => this._highlightElement(message.elementId)),
        'element:highlight-clear': () => {
            clearHighlight();
            highlightOwnerId = undefined;
        },
        'renderer:set-debug': this._forThisContext(message => this._setRendererDebug(message.debug)),
    };

    private _handleMessage(message: ExtensionMessage): void {
        dispatchMessage(this._messageHandlers, message);
    }

    /**
     * Disposes this binding: detaches all listeners, cancels pending snapshot and property
     * work, removes the highlight overlay if this binding owns it, unregisters the binding,
     * and announces `context:removed` to the extension. Safe to call repeatedly.
     */
    public dispose(): void {
        if (this._disposed) {
            return;
        }

        this._disposed = true;
        this._disconnectPanel();
        this._disposables.forEach(disposable => disposable.dispose());
        this._disposables = [];
        this._scheduler?.dispose();
        this._coalescer?.dispose();

        if (highlightOwnerId === this.id) {
            clearHighlight();
            highlightOwnerId = undefined;
        }

        unregisterBinding(this);

        sendBridgeMessage({
            kind: 'context:removed',
            contextId: this.id,
        });

        if (!getBindings().length) {
            detachPageLifecycle();
            panelConnected = false;
        }
    }

}

/**
 * Creates a devtools binding for a context (and optionally its scene and renderer), announcing
 * it to the Ripl devtools browser extension. Creating a second binding for an already-bound
 * context logs a warning and returns the existing binding.
 *
 * @example
 * ```typescript
 * import {
 *     createContext,
 *     createRenderer,
 *     createScene,
 * } from '@ripl/web';
 *
 * import {
 *     createDevtools,
 * } from '@ripl/devtools';
 *
 * const context = createContext('.chart');
 * const scene = createScene(context);
 * const renderer = createRenderer(scene);
 *
 * const devtools = createDevtools(context, scene, renderer);
 *
 * // Later, when tearing the chart down:
 * devtools.dispose();
 * ```
 *
 * @param context - The rendering context to bind.
 * @param scene - The scene rendered into the context, enabling tree inspection.
 * @param renderer - The renderer driving the scene, enabling debug overlay control.
 * @param options - Optional binding options (e.g. a display label).
 * @returns The new binding, or the existing one when the context is already bound.
 */
export function createDevtools(context: Context, scene?: Scene, renderer?: Renderer, options?: DevtoolsOptions): Devtools {
    const existing = getBindingByContext(context);

    if (existing) {
        console.warn('[ripl-devtools] A devtools binding already exists for this context; returning the existing binding.');
        return existing as Devtools;
    }

    return new Devtools(context, scene, renderer, options);
}
