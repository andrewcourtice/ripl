import type {
    Context,
    Element,
    Renderer,
    Scene,
} from '@ripl/core';

/**
 * A devtools binding tying a {@link Context} (and optionally a {@link Scene} and
 * {@link Renderer}) to a stable id used as the `contextId` in protocol messages.
 */
export interface DevtoolsBinding {
    /** Stable unique id of the binding, used as `contextId` in protocol messages. */
    id: string;
    /** Human-readable label identifying the binding in the devtools UI. */
    label: string;
    /** The bound rendering context. */
    context: Context;
    /** The bound scene, when provided. */
    scene?: Scene;
    /** The bound renderer, when provided. */
    renderer?: Renderer;
}

const bindings = new Map<string, DevtoolsBinding>();

/** Registers a binding, making it discoverable by id and by context identity. */
export function registerBinding(binding: DevtoolsBinding): void {
    bindings.set(binding.id, binding);
}

/** Unregisters a previously registered binding. Unknown bindings are ignored. */
export function unregisterBinding(binding: DevtoolsBinding): void {
    bindings.delete(binding.id);
}

/** Returns the binding registered under the given id, or `undefined`. */
export function getBindingById(id: string): DevtoolsBinding | undefined {
    return bindings.get(id);
}

/** Returns the binding bound to the given context (by identity), or `undefined`. */
export function getBindingByContext(context: Context): DevtoolsBinding | undefined {
    return getBindings().find(binding => binding.context === context);
}

/** Returns a snapshot array of every registered binding. */
export function getBindings(): DevtoolsBinding[] {
    return Array.from(bindings.values());
}

/**
 * Finds an element within a binding's scene by its id, checking the scene itself
 * (the tree root) before walking its descendants.
 *
 * @param binding - The binding whose scene to search.
 * @param elementId - The id of the element to find.
 * @returns The matching element, or `undefined` when the binding has no scene or no match exists.
 */
export function findElement(binding: DevtoolsBinding, elementId: string): Element | undefined {
    const scene = binding.scene;

    if (!scene) {
        return;
    }

    if (scene.id === elementId) {
        return scene;
    }

    return scene.getElementById(elementId);
}
