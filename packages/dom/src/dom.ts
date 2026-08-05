import {
    numberSum,
} from '@ripl/utilities';

import type {
    Disposable,
} from '@ripl/utilities';

/** A strongly-typed DOM event handler bound to a specific element and event type. */
export type DOMEventHandler<TElement, TEvent extends keyof DOMElementEventMap<TElement>> = (this: TElement, event: DOMElementEventMap<TElement>[TEvent]) => void;

/** Callback invoked when an observed element is resized. */
export type DOMElementResizeHandler = (event: DOMElementResizeEvent) => void;

/** Resolves the correct event map for a given DOM element type. */
export type DOMElementEventMap<TElement> = TElement extends MediaQueryList ? MediaQueryListEventMap
    : TElement extends HTMLElement ? HTMLElementEventMap
        : TElement extends Window ? WindowEventMap
            : TElement extends Document ? DocumentEventMap
                : Record<string, Event>;

/** Simplified resize event containing the new dimensions of the observed element. */
export interface DOMElementResizeEvent {
    /** New width of the observed element, in pixels. */
    width: number;
    /** New height of the observed element, in pixels. */
    height: number;
}

/** Whether the current environment has a `window` object (i.e. is a browser context). */
export const hasWindow = typeof window !== 'undefined';

/**
 * Attaches a strongly-typed event listener to a DOM element and returns a disposable for cleanup.
 *
 * @param element - The target to listen on.
 * @param event - The event type to listen for.
 * @param handler - The listener to invoke.
 * @param options - Native `addEventListener` options, e.g. `{ capture: true, passive: true }`.
 * @returns A disposable that removes the listener.
 */
export function onDOMEvent<TElement extends EventTarget, TEvent extends string & keyof DOMElementEventMap<TElement>>(element: TElement, event: TEvent, handler: DOMEventHandler<TElement, TEvent>, options?: AddEventListenerOptions): Disposable {
    element.addEventListener(event, handler as EventListener, options);

    return {
        dispose: () => element.removeEventListener(event, handler as EventListener, options),
    };
}

const HORIZONTAL_EDGES = [
    'left',
    'right',
];

const VERTICAL_EDGES = [
    'top',
    'bottom',
];

function getEdgeSize(style: CSSStyleDeclaration, edges: string[]): number {
    return numberSum(edges, edge => {
        // A `none` border still resolves `medium` in some engines; CSS says it contributes nothing.
        const border = style.getPropertyValue(`border-${edge}-style`) === 'none'
            ? 0
            : parseFloat(style.getPropertyValue(`border-${edge}-width`)) || 0;

        return border + (parseFloat(style.getPropertyValue(`padding-${edge}`)) || 0);
    });
}

/** Measures an element's content box, which is what `ResizeObserver` reports and `getBoundingClientRect` does not. */
function getContentBoxSize(element: HTMLElement): DOMElementResizeEvent {
    const {
        width,
        height,
    } = element.getBoundingClientRect();

    const style = window.getComputedStyle(element);

    return {
        width: width - getEdgeSize(style, HORIZONTAL_EDGES),
        height: height - getEdgeSize(style, VERTICAL_EDGES),
    };
}

/**
 * Observes an element for size changes using `ResizeObserver` (with a `window.resize` fallback) and
 * returns a disposable. Degrades to an inert disposable outside a browser, so an SSR or Node
 * consumer of this module gets a no-op rather than a `ReferenceError`.
 */
export function onDOMElementResize(element: HTMLElement, handler: DOMElementResizeHandler): Disposable {
    if (!hasWindow) {
        return {
            dispose: () => undefined,
        };
    }

    let disposer: Disposable;

    if ('ResizeObserver' in window) {
        const observer = new ResizeObserver(entries => {
            const entry = entries.find(({ target }) => target === element);

            if (entry) {
                handler({
                    width: entry.contentRect.width,
                    height: entry.contentRect.height,
                });
            }
        });

        observer.observe(element, {
            box: 'border-box',
        });

        disposer = {
            dispose: () => observer.disconnect(),
        };
    } else {
        disposer = onDOMEvent(window, 'resize', () => handler(getContentBoxSize(element)));
    }

    return disposer;
}