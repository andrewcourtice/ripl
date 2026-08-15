/** Fields a synthetic pointer event can carry, beyond the defaults every dispatch gets. */
export interface PointerEventInit {
    /** Clientspace x coordinate of the pointer. */
    clientX?: number;
    /** Clientspace y coordinate of the pointer. */
    clientY?: number;
    /** Identifies the pointer across its gesture. Defaults to `1`. */
    pointerId?: number;
    /** The kind of device. Defaults to `'mouse'`. */
    pointerType?: string;
    /** Whether this is the gesture's first pointer. Defaults to `true`. */
    isPrimary?: boolean;
    /** The button whose state changed. Defaults to `0`. */
    button?: number;
    /** Bitmask of buttons held. Defaults to `0`. */
    buttons?: number;
    /** Whether the alt key was held. */
    altKey?: boolean;
    /** Whether the control key was held. */
    ctrlKey?: boolean;
    /** Whether the meta key was held. */
    metaKey?: boolean;
    /** Whether the shift key was held. */
    shiftKey?: boolean;
}

const DEFAULTS = {
    clientX: 0,
    clientY: 0,
    pointerId: 1,
    pointerType: 'mouse',
    isPrimary: true,
    button: 0,
    buttons: 0,
    altKey: false,
    ctrlKey: false,
    metaKey: false,
    shiftKey: false,
};

/**
 * Builds a synthetic pointer event.
 *
 * jsdom ships no usable `PointerEvent` constructor, so this assigns the fields onto a plain `Event`
 * rather than constructing one — which is also why the properties are writable here and read-only in
 * a browser. Listeners only read them, so the difference does not show.
 *
 * @param type - The event type, e.g. `'pointerdown'`.
 * @param init - Fields to override the defaults with.
 * @returns The event, ready to dispatch.
 */
export function createPointerEvent(type: string, init?: PointerEventInit): Event {
    const event = new Event(type, {
        bubbles: true,
        cancelable: true,
    });

    Object.assign(event, DEFAULTS, init);

    return event;
}

/**
 * Dispatches a synthetic pointer event at `target`.
 *
 * @param target - The element (or window) to dispatch on.
 * @param type - The event type, e.g. `'pointermove'`.
 * @param init - Fields to override the defaults with.
 */
export function dispatchPointerEvent(target: EventTarget, type: string, init?: PointerEventInit): void {
    target.dispatchEvent(createPointerEvent(type, init));
}
